-- =====================================================
-- CRITICAL SECURITY FIXES - RLS RECURSION RESOLUTION
-- =====================================================

-- 1. Create secure helper functions to prevent RLS recursion
-- =====================================================

CREATE OR REPLACE FUNCTION public.is_current_user_admin_secure()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  -- Direct check without RLS to prevent recursion
  SELECT EXISTS (
    SELECT 1 FROM public.admins 
    WHERE user_id = auth.uid() 
      AND is_active = true
  );
$$;

CREATE OR REPLACE FUNCTION public.check_user_role_secure(p_user_id uuid, p_role text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  -- Direct check without RLS to prevent recursion
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = p_user_id 
      AND role::text = p_role
      AND is_active = true
  );
$$;

-- 2. Drop all problematic policies on key tables
-- =====================================================

-- Admins table policies
DROP POLICY IF EXISTS "admins_own_data_modify_only" ON public.admins;
DROP POLICY IF EXISTS "super_admins_only_view_with_audit" ON public.admins;
DROP POLICY IF EXISTS "admins_own_data_access_secure" ON public.admins;
DROP POLICY IF EXISTS "super_admins_view_others_secure" ON public.admins;

-- User_roles table policies  
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all user roles" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_self_access_secure" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_admin_access_secure" ON public.user_roles;

-- Clients table policies
DROP POLICY IF EXISTS "admins_view_clients_with_audit" ON public.clients;
DROP POLICY IF EXISTS "clients_admin_access_secure" ON public.clients;

-- Chauffeurs table policies
DROP POLICY IF EXISTS "admins_view_chauffeurs_with_audit" ON public.chauffeurs;
DROP POLICY IF EXISTS "chauffeurs_admin_access_secure" ON public.chauffeurs;

-- Partenaires table policies (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'partenaires') THEN
    EXECUTE 'DROP POLICY IF EXISTS "admins_view_partenaires_with_audit" ON public.partenaires';
    EXECUTE 'DROP POLICY IF EXISTS "partenaires_admin_access_secure" ON public.partenaires';
  END IF;
END
$$;

-- 3. Create new secure policies
-- =====================================================

-- Admins table - secure policies
CREATE POLICY "admins_own_data_secure" 
ON public.admins 
FOR ALL 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "admins_cross_access_secure" 
ON public.admins 
FOR SELECT 
TO authenticated
USING (
  (auth.uid() = user_id) OR 
  public.check_user_role_secure(auth.uid(), 'admin')
);

-- User_roles table - secure policies
CREATE POLICY "user_roles_own_secure"
ON public.user_roles
FOR ALL
TO authenticated  
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_roles_admin_view_secure"
ON public.user_roles
FOR SELECT
TO authenticated
USING (
  (auth.uid() = user_id) OR 
  public.is_current_user_admin_secure()
);

-- Clients table - secure policies  
CREATE POLICY "clients_own_data_secure" 
ON public.clients 
FOR ALL 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "clients_admin_view_secure" 
ON public.clients 
FOR SELECT 
TO authenticated
USING (
  (auth.uid() = user_id) OR 
  public.is_current_user_admin_secure()
);

-- Chauffeurs table - secure policies
CREATE POLICY "chauffeurs_own_data_secure" 
ON public.chauffeurs 
FOR ALL 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "chauffeurs_admin_view_secure" 
ON public.chauffeurs 
FOR SELECT 
TO authenticated
USING (
  (auth.uid() = user_id) OR 
  public.is_current_user_admin_secure()
);

-- Partenaires table - secure policies (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'partenaires') THEN
    EXECUTE 'CREATE POLICY "partenaires_own_data_secure" 
    ON public.partenaires 
    FOR ALL 
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id)';
    
    EXECUTE 'CREATE POLICY "partenaires_admin_view_secure" 
    ON public.partenaires 
    FOR SELECT 
    TO authenticated
    USING (
      (auth.uid() = user_id) OR 
      public.is_current_user_admin_secure()
    )';
  END IF;
END
$$;

-- 4. Update main function to use secure version
-- =====================================================

CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT public.is_current_user_admin_secure();
$$;

-- 5. Log the security fix
-- =====================================================

INSERT INTO public.security_audit_logs (
  user_id, action_type, resource_type, success, metadata
) VALUES (
  COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid),
  'security_fix',
  'rls_recursion', 
  true,
  jsonb_build_object(
    'fix_type', 'rls_recursion_resolution',
    'tables_fixed', ARRAY['admins', 'user_roles', 'clients', 'chauffeurs', 'partenaires'],
    'secure_functions_created', ARRAY['is_current_user_admin_secure', 'check_user_role_secure'],
    'timestamp', now()
  )
);