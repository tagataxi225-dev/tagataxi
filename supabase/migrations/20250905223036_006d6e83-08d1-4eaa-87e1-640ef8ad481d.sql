-- Créer le compte super admin dans la table admins
INSERT INTO public.admins (
  id,
  user_id,
  email,
  display_name,
  phone_number,
  admin_level,
  permissions,
  department,
  employee_id,
  is_active,
  hire_date,
  created_at,
  updated_at
) VALUES (
  'f15340e1-6c68-4306-b13a-e0c372b1b335',
  'f15340e1-6c68-4306-b13a-e0c372b1b335',
  'support@icon-sarl.com',
  'Super Administrateur',
  '+243000000000',
  'super_admin',
  ARRAY[
    'system_admin',
    'users_read',
    'users_write', 
    'users_delete',
    'drivers_read',
    'drivers_write',
    'drivers_validate',
    'partners_read',
    'partners_write',
    'partners_validate',
    'finance_read',
    'finance_write',
    'finance_admin',
    'transport_read',
    'transport_write',
    'transport_admin',
    'marketplace_read',
    'marketplace_write',
    'marketplace_moderate',
    'support_read',
    'support_write',
    'support_admin',
    'analytics_read',
    'analytics_admin',
    'notifications_read',
    'notifications_write',
    'notifications_admin'
  ],
  'Administration Générale',
  'SUPER_001',
  true,
  CURRENT_DATE,
  now(),
  now()
)
ON CONFLICT (user_id) DO UPDATE SET
  email = EXCLUDED.email,
  display_name = EXCLUDED.display_name,
  admin_level = EXCLUDED.admin_level,
  permissions = EXCLUDED.permissions,
  is_active = EXCLUDED.is_active,
  updated_at = now();

-- Créer le rôle dans la table user_roles
INSERT INTO public.user_roles (
  id,
  user_id,
  role,
  admin_role,
  assigned_by,
  assigned_at,
  is_active,
  expires_at,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'f15340e1-6c68-4306-b13a-e0c372b1b335',
  'admin',
  'super_admin',
  'f15340e1-6c68-4306-b13a-e0c372b1b335',
  now(),
  true,
  NULL,
  now(),
  now()
)
ON CONFLICT (user_id, role) DO UPDATE SET
  admin_role = EXCLUDED.admin_role,
  is_active = EXCLUDED.is_active,
  updated_at = now();