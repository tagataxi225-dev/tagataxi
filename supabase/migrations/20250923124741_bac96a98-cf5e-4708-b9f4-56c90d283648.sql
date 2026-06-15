-- Create database functions for push notification system

-- Function to deactivate old tokens
CREATE OR REPLACE FUNCTION public.deactivate_old_tokens(p_user_id uuid, p_platform text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.push_notification_tokens
  SET is_active = false, updated_at = now()
  WHERE user_id = p_user_id AND platform = p_platform AND is_active = true;
END;
$$;

-- Function to upsert push token
CREATE OR REPLACE FUNCTION public.upsert_push_token(p_user_id uuid, p_token text, p_platform text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.push_notification_tokens (user_id, token, platform, is_active)
  VALUES (p_user_id, p_token, p_platform, true)
  ON CONFLICT (user_id, token, platform)
  DO UPDATE SET is_active = true, updated_at = now(), last_used = now();
END;
$$;

-- Function to log notification events
CREATE OR REPLACE FUNCTION public.log_notification_event(p_user_id uuid, p_event_type text, p_notification_data jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.push_notification_analytics (user_id, event_type, notification_data)
  VALUES (p_user_id, p_event_type, p_notification_data);
END;
$$;

-- Function to disable user notifications
CREATE OR REPLACE FUNCTION public.disable_user_notifications(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.push_notification_tokens
  SET is_active = false, updated_at = now()
  WHERE user_id = p_user_id;
END;
$$;