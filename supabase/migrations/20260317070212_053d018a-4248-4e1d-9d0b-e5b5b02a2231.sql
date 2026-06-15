
-- Fix get_user_roles: read real permissions from role_permissions table
CREATE OR REPLACE FUNCTION public.get_user_roles(p_user_id UUID)
RETURNS TABLE(role TEXT, admin_role TEXT, permissions TEXT[])
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  has_roles BOOLEAN;
BEGIN
  -- Check user exists
  SELECT EXISTS(SELECT 1 FROM auth.users WHERE id = p_user_id) INTO has_roles;
  IF NOT has_roles THEN
    RAISE EXCEPTION 'User % not found', p_user_id;
  END IF;

  -- Return roles with real permissions from role_permissions
  RETURN QUERY
  SELECT 
    ur.role::TEXT,
    ur.admin_role::TEXT,
    COALESCE(
      ARRAY_AGG(DISTINCT rp.permission::TEXT) FILTER (WHERE rp.permission IS NOT NULL),
      ARRAY[]::TEXT[]
    ) as permissions
  FROM user_roles ur
  LEFT JOIN role_permissions rp 
    ON rp.role::TEXT = ur.role::TEXT
    AND (
      (rp.admin_role IS NOT NULL AND ur.admin_role IS NOT NULL AND rp.admin_role::TEXT = ur.admin_role::TEXT)
      OR (rp.admin_role IS NULL AND ur.admin_role IS NULL)
    )
    AND rp.is_active = true
  WHERE ur.user_id = p_user_id
    AND ur.is_active = true
  GROUP BY ur.role, ur.admin_role;

  -- If no roles found, create default client role
  IF NOT FOUND THEN
    INSERT INTO user_roles (user_id, role, is_active)
    VALUES (p_user_id, 'client', true)
    ON CONFLICT (user_id, role) DO NOTHING;
    
    RETURN QUERY
    SELECT 
      'client'::TEXT as role,
      NULL::TEXT as admin_role,
      COALESCE(
        ARRAY_AGG(DISTINCT rp2.permission::TEXT) FILTER (WHERE rp2.permission IS NOT NULL),
        ARRAY[]::TEXT[]
      ) as permissions
    FROM role_permissions rp2
    WHERE rp2.role::TEXT = 'client' AND rp2.admin_role IS NULL AND rp2.is_active = true;
  END IF;
END;
$$;

-- Fix has_permission: use role_permissions join instead of hardcoded/admins table
CREATE OR REPLACE FUNCTION public.has_permission(p_user_id UUID, p_permission TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Super admin has all permissions
  IF EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = p_user_id AND role = 'admin' AND admin_role = 'super_admin' AND is_active = true
  ) THEN
    RETURN true;
  END IF;

  -- Check permission via role_permissions table
  RETURN EXISTS (
    SELECT 1
    FROM user_roles ur
    JOIN role_permissions rp 
      ON rp.role::TEXT = ur.role::TEXT
      AND (
        (rp.admin_role IS NOT NULL AND ur.admin_role IS NOT NULL AND rp.admin_role::TEXT = ur.admin_role::TEXT)
        OR (rp.admin_role IS NULL AND ur.admin_role IS NULL)
      )
      AND rp.is_active = true
    WHERE ur.user_id = p_user_id
      AND ur.is_active = true
      AND rp.permission::TEXT = p_permission
  );
END;
$$;
