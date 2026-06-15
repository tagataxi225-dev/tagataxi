-- PHASE 1 SÉCURITÉ: SUPPRESSION EN CASCADE ET RECONSTRUCTION COMPLÈTE
-- Résoudre le problème de dépendances de la fonction get_user_roles

-- Supprimer la fonction avec toutes ses dépendances
DROP FUNCTION IF EXISTS public.get_user_roles(UUID) CASCADE;

-- Supprimer aussi la fonction has_permission qui pourrait causer des problèmes
DROP FUNCTION IF EXISTS public.has_permission(UUID, permission) CASCADE;

-- Nettoyer toutes les politiques restantes
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT schemaname, tablename, policyname 
              FROM pg_policies 
              WHERE schemaname = 'public')
    LOOP
        BEGIN
            EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON ' || r.schemaname || '.' || r.tablename;
        EXCEPTION WHEN OTHERS THEN
            -- Continuer même si erreur
            NULL;
        END;
    END LOOP;
END $$;

-- Créer les fonctions de base sécurisées
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admins 
    WHERE user_id = auth.uid() AND is_active = true
  );
END;
$$;

-- Réactiver RLS sur toutes les tables sensibles
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;  
ALTER TABLE public.chauffeurs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partenaires ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_places ENABLE ROW LEVEL SECURITY;

-- CRÉER POLITIQUES SÉCURISÉES MINIMALES MAIS EFFICACES

-- Admins : accès restreint
CREATE POLICY "admin_self_access" ON public.admins
FOR ALL USING (auth.uid() = user_id);

-- Clients : protection données personnelles
CREATE POLICY "client_self_access" ON public.clients
FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "admin_view_all_clients" ON public.clients
FOR SELECT USING (is_current_user_admin());

-- Chauffeurs : protection données sensibles
CREATE POLICY "driver_self_access" ON public.chauffeurs
FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "admin_view_all_drivers" ON public.chauffeurs
FOR SELECT USING (is_current_user_admin());

CREATE POLICY "public_view_verified_drivers" ON public.chauffeurs
FOR SELECT USING (verification_status = 'verified' AND is_active = true);

-- Partenaires : protection données business
CREATE POLICY "partner_self_access" ON public.partenaires
FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "admin_view_all_partners" ON public.partenaires
FOR SELECT USING (is_current_user_admin());

-- Profiles : contrôle vie privée
CREATE POLICY "profile_self_access" ON public.profiles
FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "public_view_public_profiles" ON public.profiles
FOR SELECT USING (is_public = true);

-- Payment methods : sécurité financière maximale
CREATE POLICY "payment_self_access" ON public.payment_methods
FOR ALL USING (auth.uid() = user_id);

-- User places : protection localisation
CREATE POLICY "places_self_access" ON public.user_places
FOR ALL USING (auth.uid() = user_id);

-- Nouvelle fonction get_user_roles compatible
CREATE OR REPLACE FUNCTION public.get_user_roles(_user_id UUID)
RETURNS TABLE(
  role text, 
  admin_role text, 
  permissions text[]
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Admin en priorité
  IF EXISTS (SELECT 1 FROM public.admins WHERE user_id = _user_id AND is_active = true) THEN
    RETURN QUERY 
    SELECT 
      'admin'::text,
      a.admin_level,
      COALESCE(a.permissions, ARRAY[]::text[])
    FROM public.admins a
    WHERE a.user_id = _user_id AND a.is_active = true
    LIMIT 1;
    RETURN;
  END IF;
  
  -- Chauffeur
  IF EXISTS (SELECT 1 FROM public.chauffeurs WHERE user_id = _user_id AND is_active = true) THEN
    RETURN QUERY SELECT 'driver'::text, NULL::text, ARRAY['transport_read', 'transport_write']::text[];
    RETURN;
  END IF;
  
  -- Partenaire
  IF EXISTS (SELECT 1 FROM public.partenaires WHERE user_id = _user_id AND is_active = true) THEN
    RETURN QUERY SELECT 'partner'::text, NULL::text, ARRAY['partners_read', 'partners_write']::text[];
    RETURN;
  END IF;
  
  -- Client par défaut
  RETURN QUERY SELECT 'client'::text, NULL::text, ARRAY['transport_read', 'marketplace_read']::text[];
END;
$$;