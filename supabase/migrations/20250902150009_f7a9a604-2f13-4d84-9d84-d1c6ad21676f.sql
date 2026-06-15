-- PHASE 1: NETTOYAGE ET RECONSTRUCTION COMPLÈTE DES POLITIQUES RLS
-- Corriger toutes les vulnérabilités critiques de sécurité

-- 1. NETTOYER LES POLITIQUES EXISTANTES POUR RECONSTRUCTION
DROP POLICY IF EXISTS "Super admins can view all admin profiles" ON public.admins;
DROP POLICY IF EXISTS "Admins can view their own profile" ON public.admins;
DROP POLICY IF EXISTS "Admins can update their own profile" ON public.admins;
DROP POLICY IF EXISTS "Clients can view their own profile" ON public.clients;
DROP POLICY IF EXISTS "Clients can update their own profile" ON public.clients;
DROP POLICY IF EXISTS "Admins can view all clients" ON public.clients;
DROP POLICY IF EXISTS "Chauffeurs can view their own profile" ON public.chauffeurs;
DROP POLICY IF EXISTS "Chauffeurs can update their own profile" ON public.chauffeurs;
DROP POLICY IF EXISTS "Admins can view all chauffeurs" ON public.chauffeurs;
DROP POLICY IF EXISTS "Clients can view verified active chauffeurs" ON public.chauffeurs;
DROP POLICY IF EXISTS "Partenaires can view their own profile" ON public.partenaires;
DROP POLICY IF EXISTS "Partenaires can update their own profile" ON public.partenaires;
DROP POLICY IF EXISTS "Admins can view all partenaires" ON public.partenaires;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own payment methods" ON public.payment_methods;
DROP POLICY IF EXISTS "Users can manage their own payment methods" ON public.payment_methods;
DROP POLICY IF EXISTS "Users can view their own places" ON public.user_places;
DROP POLICY IF EXISTS "Users can manage their own places" ON public.user_places;
DROP POLICY IF EXISTS "Restricted driver location access" ON public.driver_locations;

-- 2. CRÉER FONCTION SÉCURISÉE POUR VÉRIFICATION ADMIN (évite la récursion)
CREATE OR REPLACE FUNCTION public.is_admin_active(user_id_param UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO admin_count
  FROM public.admins
  WHERE user_id = user_id_param AND is_active = true;
  
  RETURN admin_count > 0;
END;
$$;

-- 3. CRÉER FONCTION SÉCURISÉE POUR VÉRIFICATION SUPER ADMIN
CREATE OR REPLACE FUNCTION public.is_super_admin_active(user_id_param UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  super_admin_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO super_admin_count
  FROM public.admins
  WHERE user_id = user_id_param 
    AND admin_level = 'super_admin' 
    AND is_active = true;
  
  RETURN super_admin_count > 0;
END;
$$;

-- 4. SÉCURISER LA TABLE ADMINS (CRITIQUE)
-- Politiques complètes avec INSERT, UPDATE, DELETE
CREATE POLICY "Admins can manage their own profile" ON public.admins
FOR ALL USING (auth.uid() = user_id AND is_active = true);

CREATE POLICY "Super admins can view all admin profiles" ON public.admins
FOR SELECT USING (is_super_admin_active(auth.uid()));

CREATE POLICY "Super admins can create admin accounts" ON public.admins
FOR INSERT WITH CHECK (is_super_admin_active(auth.uid()));

CREATE POLICY "Super admins can update admin profiles" ON public.admins
FOR UPDATE USING (is_super_admin_active(auth.uid()))
WITH CHECK (is_super_admin_active(auth.uid()));

-- 5. SÉCURISER LA TABLE CLIENTS (CRITIQUE)
CREATE POLICY "Clients can manage their own profile" ON public.clients
FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all clients" ON public.clients
FOR SELECT USING (is_admin_active(auth.uid()));

-- 6. SÉCURISER LA TABLE CHAUFFEURS (CRITIQUE)
CREATE POLICY "Chauffeurs can manage their own profile" ON public.chauffeurs
FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all chauffeurs" ON public.chauffeurs
FOR SELECT USING (is_admin_active(auth.uid()));

CREATE POLICY "Clients can view verified chauffeurs" ON public.chauffeurs
FOR SELECT USING (verification_status = 'verified' AND is_active = true);

-- 7. SÉCURISER LA TABLE PARTENAIRES (CRITIQUE)
CREATE POLICY "Partenaires can manage their own profile" ON public.partenaires
FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all partenaires" ON public.partenaires
FOR SELECT USING (is_admin_active(auth.uid()));

-- 8. SÉCURISER LA TABLE PROFILES (AVERTISSEMENT)
CREATE POLICY "Users can manage their own profile" ON public.profiles
FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Public profiles viewable by authenticated users" ON public.profiles
FOR SELECT USING (is_public = true AND auth.uid() IS NOT NULL);

-- 9. SÉCURISER LA TABLE PAYMENT_METHODS (CRITIQUE)
CREATE POLICY "Users can manage their own payment methods" ON public.payment_methods
FOR ALL USING (auth.uid() = user_id);

-- 10. SÉCURISER LA TABLE USER_PLACES (CRITIQUE - données de localisation)
CREATE POLICY "Users can manage their own places" ON public.user_places
FOR ALL USING (auth.uid() = user_id);

-- 11. CORRIGER LA POLITIQUE DRIVER_LOCATIONS (CRITIQUE - localisation temps réel)
CREATE POLICY "Drivers can manage their own location" ON public.driver_locations
FOR ALL USING (auth.uid() = driver_id);

CREATE POLICY "Admins can view all driver locations" ON public.driver_locations
FOR SELECT USING (is_admin_active(auth.uid()));

-- Politique restrictive pour l'accès système uniquement (matching)
CREATE POLICY "System access for driver matching" ON public.driver_locations
FOR SELECT USING (current_setting('role') = 'service_role');

-- 12. CRÉER FONCTION POUR RÉCUPÉRATION SÉCURISÉE DES RÔLES UTILISATEUR
CREATE OR REPLACE FUNCTION public.get_user_roles(_user_id UUID)
RETURNS TABLE(role TEXT, admin_role TEXT, permissions TEXT[])
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Retourner les rôles basés sur les tables existantes
  RETURN QUERY
  SELECT 
    'admin'::TEXT as role,
    a.admin_level as admin_role,
    a.permissions as permissions
  FROM public.admins a
  WHERE a.user_id = _user_id AND a.is_active = true
  
  UNION ALL
  
  SELECT 
    'client'::TEXT as role,
    NULL::TEXT as admin_role,
    ARRAY['transport_read', 'marketplace_read']::TEXT[] as permissions
  FROM public.clients c
  WHERE c.user_id = _user_id AND c.is_active = true
  
  UNION ALL
  
  SELECT 
    'driver'::TEXT as role,
    NULL::TEXT as admin_role,
    ARRAY['transport_read', 'transport_write']::TEXT[] as permissions
  FROM public.chauffeurs ch
  WHERE ch.user_id = _user_id AND ch.is_active = true
  
  UNION ALL
  
  SELECT 
    'partner'::TEXT as role,
    NULL::TEXT as admin_role,
    ARRAY['partners_read', 'partners_write']::TEXT[] as permissions
  FROM public.partenaires p
  WHERE p.user_id = _user_id AND p.is_active = true;
END;
$$;