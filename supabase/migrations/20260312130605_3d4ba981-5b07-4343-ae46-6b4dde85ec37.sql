
-- Fix: user_roles admin manage policy — use is_current_user_admin() instead of has_role()
-- The previous migration dropped user_roles_own_secure and created user_roles_own_read,
-- but user_roles_admin_manage failed. Let's create it properly.

DROP POLICY IF EXISTS "user_roles_admin_manage" ON public.user_roles;

CREATE POLICY "user_roles_admin_manage" ON public.user_roles
  FOR ALL
  TO authenticated
  USING (is_current_user_admin())
  WITH CHECK (is_current_user_admin());
