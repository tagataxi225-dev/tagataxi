-- Step 3: Replace the RLS policies more safely
-- Drop the old permissive policies
DROP POLICY IF EXISTS "admins_cross_access_secure" ON public.admins;
DROP POLICY IF EXISTS "admins_own_data_secure" ON public.admins;

-- Create new restrictive policies
-- Policy 1: Admins can only access their own data
CREATE POLICY "admins_own_data_only" 
ON public.admins 
FOR ALL 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy 2: Super admins can access all admin data for management
CREATE POLICY "super_admin_full_access" 
ON public.admins 
FOR ALL 
TO authenticated
USING (public.is_current_user_super_admin())
WITH CHECK (public.is_current_user_super_admin());

-- Step 4: Create audit logging function
CREATE OR REPLACE FUNCTION public.log_admin_access(
  p_target_admin_id uuid,
  p_access_type text,
  p_access_reason text DEFAULT 'Admin data accessed'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.admin_access_logs (
    accessed_by,
    target_admin_id, 
    access_type,
    access_reason
  ) VALUES (
    auth.uid(),
    p_target_admin_id,
    p_access_type,
    p_access_reason
  );
EXCEPTION WHEN OTHERS THEN
  -- Silent failure if logging fails
  NULL;
END;
$$;