-- Phase 3: Fix user_roles table security and add missing functions
-- Enable RLS on user_roles table
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "user_roles_own_access" ON public.user_roles;

-- Fix the infinite recursion by using a different approach
CREATE POLICY "user_roles_own_access" ON public.user_roles
FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- Only super admins can insert new user roles (avoiding recursion)
CREATE POLICY "super_admins_manage_user_roles" ON public.user_roles
FOR ALL TO authenticated
USING (
  auth.uid() = user_id OR
  EXISTS (
    SELECT 1 FROM public.admins a
    WHERE a.user_id = auth.uid() 
      AND a.is_active = true
      AND 'super_admin' = ANY(a.permissions)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.admins a
    WHERE a.user_id = auth.uid() 
      AND a.is_active = true
      AND 'super_admin' = ANY(a.permissions)
  )
);

-- Create function to safely check permissions without recursion
CREATE OR REPLACE FUNCTION public.has_permission(p_user_id uuid, p_permission text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_permissions text[];
BEGIN
  -- Get permissions directly from admins table to avoid recursion
  IF EXISTS (SELECT 1 FROM public.admins WHERE user_id = p_user_id AND is_active = true) THEN
    SELECT permissions INTO user_permissions FROM public.admins WHERE user_id = p_user_id AND is_active = true;
    RETURN p_permission = ANY(COALESCE(user_permissions, ARRAY[]::text[]));
  END IF;
  
  -- For non-admin users, get basic permissions based on their role
  SELECT ARRAY_AGG(perm) INTO user_permissions
  FROM (
    SELECT unnest(
      CASE ur.role::text
        WHEN 'driver' THEN ARRAY['transport_manage', 'delivery_manage']
        WHEN 'partner' THEN ARRAY['fleet_management', 'driver_management']
        WHEN 'client' THEN ARRAY['transport_read', 'marketplace_read']
        ELSE ARRAY['basic_access']
      END
    ) as perm
    FROM public.user_roles ur
    WHERE ur.user_id = p_user_id AND ur.is_active = true
  ) perms;
  
  RETURN p_permission = ANY(COALESCE(user_permissions, ARRAY[]::text[]));
END;
$$;

-- Add data access audit logging function
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

-- Update existing is_current_user_admin function to be more secure
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admins a
    WHERE a.user_id = auth.uid() 
      AND a.is_active = true
  );
END;
$$;