-- Fix: Remove flawed PERMISSIVE policies that allow any authenticated user to grant admin roles
DROP POLICY IF EXISTS "prevent_self_elevation" ON public.user_roles;
DROP POLICY IF EXISTS "prevent_self_role_elevation_secure" ON public.user_roles;
DROP POLICY IF EXISTS "prevent_self_modification" ON public.user_roles;
DROP POLICY IF EXISTS "prevent_self_role_modification_secure" ON public.user_roles;