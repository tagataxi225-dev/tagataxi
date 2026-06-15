-- Fonction RPC pour récupérer les admins avec des permissions spécifiques
CREATE OR REPLACE FUNCTION get_admins_with_permissions(permission_names text[])
RETURNS SETOF uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT ur.user_id
  FROM user_roles ur
  INNER JOIN role_permissions rp ON rp.role = ur.role OR rp.admin_role = ur.admin_role
  WHERE ur.is_active = true
    AND ur.role IN ('admin', 'super_admin')
    AND rp.permission = ANY(permission_names)
    AND rp.is_active = true;
END;
$$;