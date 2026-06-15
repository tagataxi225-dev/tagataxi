-- Grant super_admin and ensure permissions mapping
-- 1) Ensure super_admin has all critical permissions
WITH perms(permission) AS (
  SELECT unnest(ARRAY[
    'users_read'::permission,
    'users_write'::permission,
    'users_delete'::permission,
    'drivers_read'::permission,
    'drivers_write'::permission,
    'drivers_validate'::permission,
    'partners_read'::permission,
    'partners_write'::permission,
    'partners_validate'::permission,
    'finance_read'::permission,
    'finance_write'::permission,
    'finance_admin'::permission,
    'transport_read'::permission,
    'transport_write'::permission,
    'transport_admin'::permission,
    'marketplace_read'::permission,
    'marketplace_write'::permission,
    'marketplace_moderate'::permission,
    'support_read'::permission,
    'support_write'::permission,
    'support_admin'::permission,
    'analytics_read'::permission,
    'analytics_admin'::permission,
    'system_admin'::permission
  ])
)
INSERT INTO public.role_permissions (role, admin_role, permission, is_active)
SELECT 'admin'::user_role, 'super_admin'::admin_role, p.permission, true
FROM perms p
WHERE NOT EXISTS (
  SELECT 1 FROM public.role_permissions rp 
  WHERE rp.role = 'admin'::user_role 
    AND rp.admin_role = 'super_admin'::admin_role 
    AND rp.permission = p.permission
);

-- 2) Assign the super_admin role to the specified user by email
INSERT INTO public.user_roles (user_id, role, admin_role, is_active, assigned_by)
SELECT u.id, 'admin'::user_role, 'super_admin'::admin_role, true, u.id
FROM auth.users u
WHERE u.email = 'support@icon-sarl.com'
  AND NOT EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = u.id 
      AND ur.role = 'admin'::user_role 
      AND ur.admin_role = 'super_admin'::admin_role 
      AND ur.is_active = true
  );