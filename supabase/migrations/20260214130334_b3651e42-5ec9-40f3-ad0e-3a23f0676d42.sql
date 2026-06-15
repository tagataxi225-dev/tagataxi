
-- =============================================
-- FIX 1: heatmap_clicks - Remove permissive INSERT policies
-- =============================================

-- Drop the overly permissive INSERT policies
DROP POLICY IF EXISTS "Anyone can insert heatmap clicks" ON public.heatmap_clicks;
DROP POLICY IF EXISTS "Authenticated users can insert heatmap clicks" ON public.heatmap_clicks;

-- The "Users create own clicks" policy already has correct WITH CHECK (auth.uid() = user_id)
-- but let's ensure it's properly set
DROP POLICY IF EXISTS "Users create own clicks" ON public.heatmap_clicks;
CREATE POLICY "Users create own clicks" 
ON public.heatmap_clicks
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- =============================================
-- FIX 2: admins table - Prevent privilege escalation
-- =============================================

-- Drop the dangerous FOR ALL policy that allows INSERT
DROP POLICY IF EXISTS "admins_own_data_only" ON public.admins;

-- Replace with separate, restrictive policies:

-- Admins can VIEW their own record
CREATE POLICY "admins_view_self" ON public.admins
FOR SELECT 
USING (auth.uid() = user_id);

-- Admins can UPDATE their own record (but not role/is_active to prevent privilege escalation)
CREATE POLICY "admins_update_self" ON public.admins
FOR UPDATE 
USING (auth.uid() = user_id AND is_active = true)
WITH CHECK (
  auth.uid() = user_id 
  AND is_active = (SELECT a.is_active FROM public.admins a WHERE a.user_id = auth.uid())
  AND admin_level = (SELECT a.admin_level FROM public.admins a WHERE a.user_id = auth.uid())
);

-- NO INSERT policy for regular users - only super admins via the existing SECURITY DEFINER function
-- The super_admin_full_access policy already covers super admin needs
