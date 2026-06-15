-- Phase 1: Drop and recreate conflicting function first
DROP FUNCTION IF EXISTS public.get_user_roles(uuid);

-- Recreate secure role validation function  
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