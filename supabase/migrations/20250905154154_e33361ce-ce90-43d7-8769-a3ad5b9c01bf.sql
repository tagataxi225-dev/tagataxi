-- Phase 1: Fix Critical RLS Policy Gaps
-- Remove public access and secure sensitive user data tables

-- 1. Secure clients table - users can only access their own data
DROP POLICY IF EXISTS "admins_view_clients" ON public.clients;
DROP POLICY IF EXISTS "clients_own_data_only" ON public.clients;

CREATE POLICY "clients_own_data_strict" ON public.clients
FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "admins_view_clients_secure" ON public.clients
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() 
      AND ur.role = 'admin'
      AND ur.is_active = true
  )
);

-- 2. Secure chauffeurs table
DROP POLICY IF EXISTS "admins_view_chauffeurs" ON public.chauffeurs;
DROP POLICY IF EXISTS "chauffeurs_own_data_only" ON public.chauffeurs;
DROP POLICY IF EXISTS "public_minimal_verified_drivers" ON public.chauffeurs;

CREATE POLICY "chauffeurs_own_data_strict" ON public.chauffeurs
FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "admins_view_chauffeurs_secure" ON public.chauffeurs
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() 
      AND ur.role = 'admin'
      AND ur.is_active = true
  )
);

-- Public can only see basic info of verified active drivers for booking
CREATE POLICY "public_verified_drivers_basic" ON public.chauffeurs
FOR SELECT TO authenticated
USING (
  verification_status = 'verified' 
  AND is_active = true
);

-- 3. Secure admins table  
DROP POLICY IF EXISTS "admins_own_data_only" ON public.admins;
DROP POLICY IF EXISTS "admins_strict_own_data_only" ON public.admins;
DROP POLICY IF EXISTS "super_admins_view_others" ON public.admins;

CREATE POLICY "admins_own_data_strict" ON public.admins
FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "super_admins_view_others_secure" ON public.admins
FOR SELECT TO authenticated
USING (
  auth.uid() = user_id OR
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() 
      AND ur.role = 'admin'
      AND ur.admin_role = 'super_admin'
      AND ur.is_active = true
  )
);

-- 4. Secure partenaires table
CREATE POLICY "partenaires_own_data_strict" ON public.partenaires
FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "admins_view_partenaires_secure" ON public.partenaires
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() 
      AND ur.role = 'admin'
      AND ur.is_active = true
  )
);

-- 5. Fix user_roles table security
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_roles_own_access" ON public.user_roles;
CREATE POLICY "user_roles_own_access" ON public.user_roles
FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "admins_manage_user_roles" ON public.user_roles
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() 
      AND ur.role = 'admin'
      AND ur.is_active = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() 
      AND ur.role = 'admin'
      AND ur.is_active = true
  )
);

-- 6. Create secure role validation functions
CREATE OR REPLACE FUNCTION public.get_user_roles(p_user_id uuid)
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
  -- Only allow users to get their own roles or admins to get any roles
  IF p_user_id != auth.uid() AND NOT EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() 
      AND ur.role = 'admin'
      AND ur.is_active = true
  ) THEN
    RAISE EXCEPTION 'Access denied: Cannot access other user roles';
  END IF;

  RETURN QUERY
  SELECT 
    ur.role::text,
    ur.admin_role::text,
    COALESCE(
      CASE ur.role::text
        WHEN 'admin' THEN ARRAY['system_admin', 'user_management', 'content_moderation']
        WHEN 'driver' THEN ARRAY['transport_manage', 'delivery_manage']
        WHEN 'partner' THEN ARRAY['fleet_management', 'driver_management']
        WHEN 'client' THEN ARRAY['transport_read', 'marketplace_read']
        ELSE ARRAY['basic_access']
      END,
      ARRAY['basic_access']
    ) as permissions
  FROM public.user_roles ur
  WHERE ur.user_id = p_user_id 
    AND ur.is_active = true
  ORDER BY 
    CASE ur.role::text
      WHEN 'admin' THEN 1
      WHEN 'partner' THEN 2  
      WHEN 'driver' THEN 3
      WHEN 'client' THEN 4
      ELSE 5
    END;
END;
$$;

-- 7. Create function to safely check permissions
CREATE OR REPLACE FUNCTION public.has_permission(p_user_id uuid, p_permission text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_permissions text[];
BEGIN
  -- Get user permissions
  SELECT ARRAY_AGG(perm) INTO user_permissions
  FROM (
    SELECT unnest(permissions) as perm
    FROM public.get_user_roles(p_user_id)
  ) perms;
  
  RETURN p_permission = ANY(COALESCE(user_permissions, ARRAY[]::text[]));
END;
$$;

-- 8. Add data access audit logging function
CREATE OR REPLACE FUNCTION public.log_sensitive_data_access(
  p_table_name text,
  p_operation text,
  p_accessed_user_id uuid DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.sensitive_data_access_audit (
    user_id, table_name, operation, accessed_user_data, metadata
  ) VALUES (
    auth.uid(), p_table_name, p_operation, p_accessed_user_id, p_metadata
  );
END;
$$;

-- 9. Update existing functions to be more secure
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() 
      AND ur.role = 'admin'
      AND ur.is_active = true
  );
END;
$$;