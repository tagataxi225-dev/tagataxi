-- SECURITY HARDENING - PHASE 2
-- Fix remaining function security and complete the hardening

-- Fix remaining functions with missing search_path
CREATE OR REPLACE FUNCTION public.update_promotional_ads_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_support_messages_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_profiles_timestamp()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- Update all other critical functions with proper search_path
CREATE OR REPLACE FUNCTION public.bump_unified_conversation_last_message_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  UPDATE public.unified_conversations
  SET last_message_at = now(), updated_at = now()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_client()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
begin
  if (new.raw_user_meta_data->>'role') = 'simple_user_client' then
    insert into public.clients (
      user_id,
      display_name,
      phone_number,
      email
    )
    values (
      new.id,
      new.raw_user_meta_data->>'display_name',
      new.raw_user_meta_data->>'phone_number',
      new.email
    );
  end if;
  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_chauffeur()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
begin
  if (new.raw_user_meta_data->>'role') = 'chauffeur' then
    insert into public.chauffeurs (
      user_id,
      display_name,
      phone_number,
      email,
      license_number,
      license_expiry,
      vehicle_type,
      vehicle_plate,
      vehicle_model,
      vehicle_year,
      vehicle_color,
      insurance_number,
      insurance_expiry,
      bank_account_number,
      emergency_contact_name,
      emergency_contact_phone,
      verification_status,
      is_active
    )
    values (
      new.id,
      new.raw_user_meta_data->>'display_name',
      new.raw_user_meta_data->>'phone_number',
      new.email,
      new.raw_user_meta_data->>'license_number',
      new.raw_user_meta_data->>'license_expiry',
      new.raw_user_meta_data->>'vehicle_type',
      new.raw_user_meta_data->>'vehicle_plate',
      new.raw_user_meta_data->>'vehicle_model',
      (new.raw_user_meta_data->>'vehicle_year')::int,
      new.raw_user_meta_data->>'vehicle_color',
      new.raw_user_meta_data->>'insurance_number',
      new.raw_user_meta_data->>'insurance_expiry',
      new.raw_user_meta_data->>'bank_account_number',
      new.raw_user_meta_data->>'emergency_contact_name',
      new.raw_user_meta_data->>'emergency_contact_phone',
      'pending',
      false
    );
  end if;
  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.activate_approved_vehicles()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  -- Si le véhicule est approuvé, l'activer automatiquement
  IF NEW.moderation_status = 'approved' AND OLD.moderation_status != 'approved' THEN
    NEW.is_active = true;
  END IF;
  
  -- Si le véhicule est rejeté, le désactiver
  IF NEW.moderation_status = 'rejected' AND OLD.moderation_status != 'rejected' THEN
    NEW.is_active = false;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Create a comprehensive security monitoring function
CREATE OR REPLACE FUNCTION public.security_monitor_access()
RETURNS TABLE(
  recent_admin_access BIGINT,
  sensitive_data_access BIGINT,
  failed_auth_attempts BIGINT,
  suspicious_patterns BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*) FROM public.admin_access_logs WHERE created_at > now() - interval '24 hours')::BIGINT,
    (SELECT COUNT(*) FROM public.sensitive_data_access_logs WHERE created_at > now() - interval '24 hours')::BIGINT,
    0::BIGINT, -- Failed auth attempts would need auth.logs integration
    (SELECT COUNT(*) FROM public.sensitive_data_access_logs 
     WHERE created_at > now() - interval '1 hour' 
     GROUP BY accessed_by 
     HAVING COUNT(*) > 100 
     LIMIT 1)::BIGINT; -- High volume access pattern detection
END;
$function$;

-- Create secure vendor earnings access with improved audit
CREATE OR REPLACE FUNCTION public.get_secure_vendor_earnings(vendor_id_param UUID DEFAULT NULL)
RETURNS TABLE(
  id UUID,
  vendor_id UUID,
  amount NUMERIC,
  currency TEXT,
  status TEXT,
  earnings_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  paid_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  -- Use provided vendor_id or default to current user
  vendor_id_param := COALESCE(vendor_id_param, auth.uid());
  
  -- Verify access authorization
  IF vendor_id_param != auth.uid() AND NOT (
    has_permission(auth.uid(), 'finance_read'::permission) OR 
    has_permission(auth.uid(), 'finance_write'::permission) OR 
    has_permission(auth.uid(), 'finance_admin'::permission)
  ) THEN
    RAISE EXCEPTION 'Unauthorized access to vendor earnings data';
  END IF;
  
  -- Log the access
  PERFORM public.log_sensitive_data_access(
    'vendor_earnings',
    NULL,
    'select',
    ARRAY['amount', 'vendor_id', 'status'],
    CASE 
      WHEN vendor_id_param = auth.uid() THEN 'Vendor accessing own earnings'
      ELSE 'Admin accessing vendor earnings'
    END
  );
  
  RETURN QUERY
  SELECT 
    ve.id,
    ve.vendor_id,
    ve.amount,
    ve.currency,
    ve.status,
    ve.earnings_type,
    ve.created_at,
    ve.paid_at
  FROM public.vendor_earnings ve
  WHERE ve.vendor_id = vendor_id_param;
END;
$function$;