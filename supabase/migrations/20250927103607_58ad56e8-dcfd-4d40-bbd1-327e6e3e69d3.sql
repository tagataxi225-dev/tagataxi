-- Step 1: Create the super admin check function
CREATE OR REPLACE FUNCTION public.is_current_user_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
      AND role = 'admin'::user_role
      AND admin_role = 'super_admin'::admin_role
      AND is_active = true
  );
$$;

-- Step 2: Create the safe admin directory view with data masking
CREATE OR REPLACE VIEW public.admin_directory_safe AS
SELECT 
  id,
  user_id,
  display_name,
  department,
  admin_level,
  is_active,
  created_at,
  -- Mask email: show first 2 chars + domain
  CASE 
    WHEN auth.uid() = user_id OR public.is_current_user_super_admin() THEN email
    ELSE CONCAT(LEFT(email, 2), '***@', SPLIT_PART(email, '@', 2))
  END as email,
  -- Mask phone: show first 3 and last 2 digits
  CASE 
    WHEN auth.uid() = user_id OR public.is_current_user_super_admin() THEN phone_number
    ELSE CONCAT(LEFT(phone_number, 3), '***', RIGHT(phone_number, 2))
  END as phone_number,
  -- Hide employee ID completely for non-super-admins
  CASE 
    WHEN auth.uid() = user_id OR public.is_current_user_super_admin() THEN employee_id
    ELSE NULL
  END as employee_id
FROM public.admins
WHERE is_active = true;