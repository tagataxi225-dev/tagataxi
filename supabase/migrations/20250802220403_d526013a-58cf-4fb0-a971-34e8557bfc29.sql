-- Create Edge Function for secure account deletion
-- This will be handled by the Edge Function, but we need to ensure proper cascade deletion

-- Add trigger to handle profile deletion cascade
CREATE OR REPLACE FUNCTION public.handle_profile_deletion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Log the deletion for audit purposes
  INSERT INTO public.activity_logs (
    user_id,
    activity_type,
    description,
    metadata
  ) VALUES (
    OLD.user_id,
    'account_deletion',
    'User account deleted',
    jsonb_build_object('deleted_at', now(), 'profile_id', OLD.id)
  );
  
  RETURN OLD;
END;
$$;

-- Create trigger for profile deletion logging
DROP TRIGGER IF EXISTS on_profile_deletion ON public.profiles;
CREATE TRIGGER on_profile_deletion
  BEFORE DELETE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_profile_deletion();