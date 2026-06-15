-- PHASE 1 SÉCURITÉ: CORRECTION FINALE DES VULNÉRABILITÉS RLS
-- Supprimer la fonction existante conflictuelle et reconstruire proprement

-- Supprimer la fonction conflictuelle
DROP FUNCTION IF EXISTS public.get_user_roles(UUID);

-- Nettoyer complètement les politiques problématiques
DO $$
DECLARE
    r RECORD;
BEGIN
    -- Supprimer toutes les politiques sur les tables sensibles
    FOR r IN (SELECT schemaname, tablename, policyname 
              FROM pg_policies 
              WHERE schemaname = 'public' 
              AND tablename IN ('admins', 'clients', 'chauffeurs', 'partenaires', 'profiles', 'payment_methods', 'user_places'))
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON ' || r.schemaname || '.' || r.tablename;
    END LOOP;
END $$;

-- Fonctions utilitaires sécurisées
CREATE OR REPLACE FUNCTION public.current_user_is_admin()
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

CREATE OR REPLACE FUNCTION public.current_user_is_super_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admins 
    WHERE user_id = auth.uid() 
      AND admin_level = 'super_admin' 
      AND is_active = true
  );
END;
$$;

-- POLITIQUES SÉCURISÉES FINALES

-- TABLE ADMINS - accès ultra-restreint
CREATE POLICY "admins_own_access" ON public.admins
FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "super_admins_full_access" ON public.admins
FOR ALL USING (current_user_is_super_admin());

-- TABLE CLIENTS - protection données personnelles
CREATE POLICY "clients_own_access" ON public.clients
FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "admins_read_clients" ON public.clients
FOR SELECT USING (current_user_is_admin());

-- TABLE CHAUFFEURS - protection données sensibles
CREATE POLICY "drivers_own_access" ON public.chauffeurs
FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "admins_read_drivers" ON public.chauffeurs
FOR SELECT USING (current_user_is_admin());

CREATE POLICY "public_verified_drivers_only" ON public.chauffeurs
FOR SELECT USING (verification_status = 'verified' AND is_active = true);

-- TABLE PARTENAIRES - protection données business
CREATE POLICY "partners_own_access" ON public.partenaires
FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "admins_read_partners" ON public.partenaires
FOR SELECT USING (current_user_is_admin());

-- TABLE PROFILES - contrôle vie privée
CREATE POLICY "profiles_own_access" ON public.profiles
FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "public_profiles_limited" ON public.profiles
FOR SELECT USING (is_public = true);

-- TABLE PAYMENT_METHODS - sécurité financière maximale
CREATE POLICY "payments_own_access_only" ON public.payment_methods
FOR ALL USING (auth.uid() = user_id);

-- TABLE USER_PLACES - protection localisation
CREATE POLICY "places_own_access_only" ON public.user_places
FOR ALL USING (auth.uid() = user_id);

-- Fonction corrigée pour les rôles utilisateur compatible avec useUserRoles
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
DECLARE
  user_admin RECORD;
  user_driver RECORD;
  user_partner RECORD;
  user_client RECORD;
BEGIN
  -- Vérifier admin en premier (priorité)
  SELECT * INTO user_admin FROM public.admins 
  WHERE user_id = _user_id AND is_active = true 
  LIMIT 1;
  
  IF FOUND THEN
    RETURN QUERY SELECT 
      'admin'::text,
      user_admin.admin_level,
      COALESCE(user_admin.permissions, ARRAY[]::text[]);
    RETURN;
  END IF;
  
  -- Vérifier chauffeur
  SELECT * INTO user_driver FROM public.chauffeurs 
  WHERE user_id = _user_id AND is_active = true 
  LIMIT 1;
  
  IF FOUND THEN
    RETURN QUERY SELECT 
      'driver'::text,
      NULL::text,
      ARRAY['transport_read', 'transport_write']::text[];
    RETURN;
  END IF;
  
  -- Vérifier partenaire
  SELECT * INTO user_partner FROM public.partenaires 
  WHERE user_id = _user_id AND is_active = true 
  LIMIT 1;
  
  IF FOUND THEN
    RETURN QUERY SELECT 
      'partner'::text,
      NULL::text,
      ARRAY['partners_read', 'partners_write']::text[];
    RETURN;
  END IF;
  
  -- Client par défaut
  SELECT * INTO user_client FROM public.clients 
  WHERE user_id = _user_id AND is_active = true 
  LIMIT 1;
  
  -- Toujours retourner client, même si pas trouvé en base
  RETURN QUERY SELECT 
    'client'::text,
    NULL::text,
    ARRAY['transport_read', 'marketplace_read']::text[];
END;
$$;