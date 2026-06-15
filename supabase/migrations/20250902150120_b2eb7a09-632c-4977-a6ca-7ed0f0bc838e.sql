-- PHASE 1 SÉCURITÉ: NETTOYAGE COMPLET ET RECONSTRUCTION RLS
-- Supprimer TOUTES les politiques existantes pour reconstruction complète

-- Désactiver temporairement RLS pour le nettoyage
ALTER TABLE public.admins DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients DISABLE ROW LEVEL SECURITY;  
ALTER TABLE public.chauffeurs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.partenaires DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_methods DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_places DISABLE ROW LEVEL SECURITY;

-- Supprimer toutes les politiques existantes
DO $$
DECLARE
    r RECORD;
BEGIN
    -- Supprimer toutes les politiques RLS sur les tables critiques
    FOR r IN (SELECT schemaname, tablename, policyname 
              FROM pg_policies 
              WHERE schemaname = 'public' 
              AND tablename IN ('admins', 'clients', 'chauffeurs', 'partenaires', 'profiles', 'payment_methods', 'user_places'))
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON ' || r.schemaname || '.' || r.tablename;
    END LOOP;
END $$;

-- Créer fonction de vérification sécurisée pour les admins
CREATE OR REPLACE FUNCTION public.check_admin_access(user_id_param UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_admin BOOLEAN := false;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.admins 
    WHERE user_id = user_id_param AND is_active = true
  ) INTO is_admin;
  
  RETURN is_admin;
END;
$$;

-- Créer fonction de vérification pour super admin
CREATE OR REPLACE FUNCTION public.check_super_admin_access(user_id_param UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_super_admin BOOLEAN := false;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.admins 
    WHERE user_id = user_id_param 
      AND admin_level = 'super_admin' 
      AND is_active = true
  ) INTO is_super_admin;
  
  RETURN is_super_admin;
END;
$$;

-- RÉACTIVER RLS et CRÉER NOUVELLES POLITIQUES SÉCURISÉES

-- 1. TABLE ADMINS (CRITIQUE)
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_own_profile" ON public.admins
FOR ALL USING (auth.uid() = user_id AND is_active = true);

CREATE POLICY "super_admin_all_access" ON public.admins
FOR ALL USING (check_super_admin_access(auth.uid()));

-- 2. TABLE CLIENTS (CRITIQUE)
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "client_own_data" ON public.clients
FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "admin_view_clients" ON public.clients
FOR SELECT USING (check_admin_access(auth.uid()));

-- 3. TABLE CHAUFFEURS (CRITIQUE)  
ALTER TABLE public.chauffeurs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "driver_own_data" ON public.chauffeurs
FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "admin_view_drivers" ON public.chauffeurs
FOR SELECT USING (check_admin_access(auth.uid()));

CREATE POLICY "public_verified_drivers" ON public.chauffeurs
FOR SELECT USING (verification_status = 'verified' AND is_active = true);

-- 4. TABLE PARTENAIRES (CRITIQUE)
ALTER TABLE public.partenaires ENABLE ROW LEVEL SECURITY;

CREATE POLICY "partner_own_data" ON public.partenaires
FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "admin_view_partners" ON public.partenaires
FOR SELECT USING (check_admin_access(auth.uid()));

-- 5. TABLE PROFILES (AVERTISSEMENT)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_own_profile" ON public.profiles
FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "public_profile_view" ON public.profiles
FOR SELECT USING (is_public = true AND auth.uid() IS NOT NULL);

-- 6. TABLE PAYMENT_METHODS (CRITIQUE)
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_own_payments" ON public.payment_methods
FOR ALL USING (auth.uid() = user_id);

-- 7. TABLE USER_PLACES (CRITIQUE)
ALTER TABLE public.user_places ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_own_places" ON public.user_places
FOR ALL USING (auth.uid() = user_id);

-- Fonction sécurisée pour récupérer les rôles utilisateur
CREATE OR REPLACE FUNCTION public.get_user_roles(_user_id UUID)
RETURNS TABLE(
  role TEXT, 
  admin_role TEXT, 
  permissions TEXT[]
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Rôle admin
  IF EXISTS (SELECT 1 FROM public.admins WHERE user_id = _user_id AND is_active = true) THEN
    RETURN QUERY
    SELECT 
      'admin'::TEXT,
      a.admin_level,
      a.permissions
    FROM public.admins a
    WHERE a.user_id = _user_id AND a.is_active = true
    LIMIT 1;
    RETURN;
  END IF;
  
  -- Rôle chauffeur
  IF EXISTS (SELECT 1 FROM public.chauffeurs WHERE user_id = _user_id AND is_active = true) THEN
    RETURN QUERY
    SELECT 
      'driver'::TEXT,
      NULL::TEXT,
      ARRAY['transport_read', 'transport_write']::TEXT[];
    RETURN;
  END IF;
  
  -- Rôle partenaire
  IF EXISTS (SELECT 1 FROM public.partenaires WHERE user_id = _user_id AND is_active = true) THEN
    RETURN QUERY
    SELECT 
      'partner'::TEXT,
      NULL::TEXT,
      ARRAY['partners_read', 'partners_write']::TEXT[];
    RETURN;
  END IF;
  
  -- Rôle client par défaut
  RETURN QUERY
  SELECT 
    'client'::TEXT,
    NULL::TEXT,
    ARRAY['transport_read', 'marketplace_read']::TEXT[];
END;
$$;