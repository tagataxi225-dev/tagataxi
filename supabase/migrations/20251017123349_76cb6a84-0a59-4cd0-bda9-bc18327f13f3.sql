-- Fix MISSING_RLS: Replace insecure view with secure function
-- Drop the insecure view and create a security definer function instead

DROP VIEW IF EXISTS public.admin_registration_debug CASCADE;

-- Create a secure function that only super admins can call
CREATE OR REPLACE FUNCTION public.get_admin_registration_debug_logs(limit_count integer DEFAULT 20)
RETURNS TABLE (
  id uuid,
  created_at timestamp with time zone,
  activity_type text,
  description text,
  user_id uuid,
  attempted_user_id text,
  auth_uid_at_time text,
  failed_step text,
  error_message text,
  validation_errors text,
  user_exists_in_auth boolean,
  driver_profile_exists boolean,
  driver_role_exists boolean,
  metadata jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only super admins can access debug logs
  IF NOT public.is_current_user_super_admin() THEN
    RAISE EXCEPTION 'Access denied: Super admin privileges required';
  END IF;

  RETURN QUERY
  SELECT 
    al.id,
    al.created_at,
    al.activity_type,
    al.description,
    al.user_id,
    (al.metadata ->> 'p_user_id')::text AS attempted_user_id,
    (al.metadata ->> 'auth_uid')::text AS auth_uid_at_time,
    (al.metadata ->> 'step')::text AS failed_step,
    (al.metadata ->> 'error')::text AS error_message,
    (al.metadata ->> 'errors')::text AS validation_errors,
    EXISTS (SELECT 1 FROM auth.users WHERE users.id = ((al.metadata ->> 'p_user_id')::uuid)) AS user_exists_in_auth,
    EXISTS (SELECT 1 FROM public.chauffeurs WHERE chauffeurs.user_id = ((al.metadata ->> 'p_user_id')::uuid)) AS driver_profile_exists,
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_roles.user_id = ((al.metadata ->> 'p_user_id')::uuid) AND user_roles.role = 'driver'::user_role) AS driver_role_exists,
    al.metadata
  FROM public.activity_logs al
  WHERE al.activity_type = ANY (ARRAY[
    'driver_registration_start',
    'driver_registration_failed',
    'driver_registration_error',
    'driver_registration_warning',
    'driver_registration_success',
    'driver_profile_inserted',
    'driver_role_created'
  ])
  ORDER BY al.created_at DESC
  LIMIT limit_count;
END;
$$;

COMMENT ON FUNCTION public.get_admin_registration_debug_logs IS 'Secure access to admin registration debug logs - super admin only';