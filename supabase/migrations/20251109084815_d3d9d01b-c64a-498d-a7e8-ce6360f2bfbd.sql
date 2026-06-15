-- ============================================================================
-- FONCTION RPC: check_user_exists_by_email
-- ============================================================================

DROP FUNCTION IF EXISTS public.check_user_exists_by_email(TEXT);

CREATE OR REPLACE FUNCTION public.check_user_exists_by_email(p_email TEXT)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM auth.users WHERE email = lower(p_email));
$$;

GRANT EXECUTE ON FUNCTION public.check_user_exists_by_email TO anon, authenticated;