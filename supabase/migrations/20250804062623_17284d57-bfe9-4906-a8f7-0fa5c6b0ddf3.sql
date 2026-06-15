-- Corriger les problèmes de sécurité détectés par le linter

-- Recréer la fonction has_permission avec search_path sécurisé
CREATE OR REPLACE FUNCTION public.has_permission(_user_id UUID, _permission permission)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.role_permissions rp ON (
      rp.role = ur.role 
      AND (rp.admin_role = ur.admin_role OR (rp.admin_role IS NULL AND ur.admin_role IS NULL))
    )
    WHERE ur.user_id = _user_id
      AND ur.is_active = true
      AND rp.permission = _permission
      AND rp.is_active = true
      AND (ur.expires_at IS NULL OR ur.expires_at > now())
  )
$$;

-- Recréer la fonction get_user_roles avec search_path sécurisé
CREATE OR REPLACE FUNCTION public.get_user_roles(_user_id UUID)
RETURNS TABLE(
  role user_role,
  admin_role admin_role,
  permissions permission[]
)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT 
    ur.role,
    ur.admin_role,
    ARRAY_AGG(rp.permission) as permissions
  FROM public.user_roles ur
  LEFT JOIN public.role_permissions rp ON (
    rp.role = ur.role 
    AND (rp.admin_role = ur.admin_role OR (rp.admin_role IS NULL AND ur.admin_role IS NULL))
    AND rp.is_active = true
  )
  WHERE ur.user_id = _user_id
    AND ur.is_active = true
    AND (ur.expires_at IS NULL OR ur.expires_at > now())
  GROUP BY ur.role, ur.admin_role
$$;