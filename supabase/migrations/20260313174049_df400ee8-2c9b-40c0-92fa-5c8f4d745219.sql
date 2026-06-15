
-- Seed permissions for admin_food role
INSERT INTO public.role_permissions (role, admin_role, permission, is_active)
VALUES
  ('admin', 'admin_food', 'food_read', true),
  ('admin', 'admin_food', 'food_write', true),
  ('admin', 'admin_food', 'food_moderate', true),
  ('admin', 'admin_food', 'food_admin', true),
  ('admin', 'admin_food', 'analytics_read', true),
  ('admin', 'admin_food', 'users_read', true)
ON CONFLICT DO NOTHING;
