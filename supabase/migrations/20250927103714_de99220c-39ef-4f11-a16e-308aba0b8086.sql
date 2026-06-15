-- Fix the security definer view issue by recreating as a regular view
DROP VIEW IF EXISTS public.admin_directory_safe;

-- Create a regular view (not SECURITY DEFINER) with RLS enforcement
CREATE VIEW public.admin_directory_safe AS
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

-- Create RLS policy for the view if needed
-- Note: Views inherit RLS from their underlying tables

-- Grant appropriate permissions
GRANT SELECT ON public.admin_directory_safe TO authenticated;