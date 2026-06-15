-- Fix infinite recursion in admins RLS policy
DROP POLICY IF EXISTS "Super admins can view all admin profiles" ON public.admins;

-- Create security definer function to check admin level safely
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admins 
    WHERE user_id = auth.uid() 
      AND admin_level = 'super_admin' 
      AND is_active = true
  );
END;
$$;

-- Recreate policy using the safe function
CREATE POLICY "Super admins can view all admin profiles" 
ON public.admins FOR SELECT 
USING (public.is_super_admin());

-- Fix search_path issues in existing functions
ALTER FUNCTION public.get_zone_for_coordinates(numeric, numeric) SET search_path = 'public';
ALTER FUNCTION public.geocode_location(text) SET search_path = 'public';
ALTER FUNCTION public.create_team_account_from_request() SET search_path = 'public';