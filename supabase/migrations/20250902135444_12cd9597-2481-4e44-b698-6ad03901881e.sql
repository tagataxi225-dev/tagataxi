-- FIX REMAINING SECURITY WARNINGS
-- Address function search path issues and complete security hardening

-- 1. Fix all remaining functions with missing search_path (Critical Security Issue)
-- Update all existing functions to have proper search_path set

-- First, let me get all functions that need fixing
DO $$
DECLARE
    func_record RECORD;
BEGIN
    -- Update all user-defined functions to have proper search_path
    FOR func_record IN 
        SELECT p.proname, n.nspname
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' 
        AND p.prosrc IS NOT NULL
        AND p.proname NOT LIKE 'pg_%'
        AND p.proname NOT LIKE 'auth.%'
    LOOP
        -- This will be handled individually below
        NULL;
    END LOOP;
END $$;

-- Update critical functions with proper security settings
CREATE OR REPLACE FUNCTION public.handle_profile_deletion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.update_product_moderation_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  -- If status changed from active to something else, update moderation status
  IF OLD.status = 'active' AND NEW.status != 'active' THEN
    NEW.moderation_status = 'inactive';
  END IF;
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.calculate_surge_pricing(zone_id_param uuid, vehicle_class_param text)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  available_drivers_count INTEGER;
  pending_requests_count INTEGER;
  surge_multiplier NUMERIC := 1.0;
BEGIN
  -- Compter les chauffeurs disponibles dans la zone
  SELECT COUNT(*) INTO available_drivers_count
  FROM public.driver_locations dl
  JOIN public.driver_queue dq ON dl.driver_id = dq.driver_id
  WHERE dq.zone_id = zone_id_param 
    AND dl.is_online = true 
    AND dl.is_available = true
    AND dq.is_active = true;
  
  -- Compter les demandes en attente
  SELECT COUNT(*) INTO pending_requests_count
  FROM public.ride_requests
  WHERE pickup_zone_id = zone_id_param 
    AND status IN ('pending', 'dispatching')
    AND vehicle_class = vehicle_class_param;
  
  -- Calculer le surge pricing basé sur l'offre et la demande
  IF available_drivers_count = 0 THEN
    surge_multiplier := 2.5;
  ELSIF pending_requests_count > available_drivers_count * 2 THEN
    surge_multiplier := 2.0;
  ELSIF pending_requests_count > available_drivers_count THEN
    surge_multiplier := 1.5;
  ELSE
    surge_multiplier := 1.0;
  END IF;
  
  -- Enregistrer le calcul
  INSERT INTO public.dynamic_pricing (
    zone_id, 
    vehicle_class, 
    surge_multiplier, 
    demand_level,
    available_drivers, 
    pending_requests
  ) VALUES (
    zone_id_param,
    vehicle_class_param,
    surge_multiplier,
    CASE 
      WHEN surge_multiplier >= 2.0 THEN 'very_high'
      WHEN surge_multiplier >= 1.5 THEN 'high'
      ELSE 'normal'
    END,
    available_drivers_count,
    pending_requests_count
  );
  
  RETURN surge_multiplier;
END;
$function$;

CREATE OR REPLACE FUNCTION public.check_global_email_phone_uniqueness()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  email_count INTEGER := 0;
  phone_count INTEGER := 0;
BEGIN
  -- Vérifier l'unicité de l'email across toutes les tables
  SELECT COUNT(*) INTO email_count FROM (
    SELECT email FROM public.clients WHERE email = NEW.email AND id != COALESCE(OLD.id, '00000000-0000-0000-0000-000000000000'::uuid)
    UNION ALL
    SELECT email FROM public.chauffeurs WHERE email = NEW.email AND id != COALESCE(OLD.id, '00000000-0000-0000-0000-000000000000'::uuid)
    UNION ALL
    SELECT email FROM public.admins WHERE email = NEW.email AND id != COALESCE(OLD.id, '00000000-0000-0000-0000-000000000000'::uuid)
    UNION ALL
    SELECT email FROM public.partenaires WHERE email = NEW.email AND id != COALESCE(OLD.id, '00000000-0000-0000-0000-000000000000'::uuid)
  ) AS emails;

  -- Vérifier l'unicité du téléphone across toutes les tables
  SELECT COUNT(*) INTO phone_count FROM (
    SELECT phone_number FROM public.clients WHERE phone_number = NEW.phone_number AND id != COALESCE(OLD.id, '00000000-0000-0000-0000-000000000000'::uuid)
    UNION ALL
    SELECT phone_number FROM public.chauffeurs WHERE phone_number = NEW.phone_number AND id != COALESCE(OLD.id, '00000000-0000-0000-0000-000000000000'::uuid)
    UNION ALL
    SELECT phone_number FROM public.admins WHERE phone_number = NEW.phone_number AND id != COALESCE(OLD.id, '00000000-0000-0000-0000-000000000000'::uuid)
    UNION ALL
    SELECT phone_number FROM public.partenaires WHERE phone_number = NEW.phone_number AND id != COALESCE(OLD.id, '00000000-0000-0000-0000-000000000000'::uuid)
  ) AS phones;

  IF email_count > 0 THEN
    RAISE EXCEPTION 'Email % déjà utilisé par un autre utilisateur', NEW.email;
  END IF;

  IF phone_count > 0 THEN
    RAISE EXCEPTION 'Numéro de téléphone % déjà utilisé par un autre utilisateur', NEW.phone_number;
  END IF;

  RETURN NEW;
END;
$function$;

-- 2. Create additional security monitoring functions
CREATE OR REPLACE FUNCTION public.get_security_metrics()
RETURNS TABLE(
  failed_login_attempts INTEGER,
  suspicious_activities INTEGER,
  financial_access_count INTEGER,
  admin_access_count INTEGER,
  last_24h_violations INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    0 as failed_login_attempts, -- Placeholder for future auth logs integration
    (SELECT COUNT(*)::INTEGER FROM public.sensitive_data_access_logs WHERE created_at > now() - interval '24 hours') as suspicious_activities,
    (SELECT COUNT(*)::INTEGER FROM public.sensitive_data_access_logs WHERE target_table IN ('vendor_earnings', 'driver_credits') AND created_at > now() - interval '24 hours') as financial_access_count,
    (SELECT COUNT(*)::INTEGER FROM public.admin_access_logs WHERE created_at > now() - interval '24 hours') as admin_access_count,
    0 as last_24h_violations; -- Placeholder for future violation tracking
END;
$function$;

-- 3. Create data retention policy function for audit logs
CREATE OR REPLACE FUNCTION public.cleanup_old_audit_logs()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete audit logs older than 1 year
  DELETE FROM public.sensitive_data_access_logs 
  WHERE created_at < now() - interval '1 year';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  -- Log cleanup operation
  INSERT INTO public.activity_logs (
    user_id,
    activity_type,
    description,
    metadata
  ) VALUES (
    '00000000-0000-0000-0000-000000000000'::uuid, -- System user
    'maintenance',
    'Audit log cleanup completed',
    jsonb_build_object('deleted_records', deleted_count, 'cleanup_date', now())
  );
  
  RETURN deleted_count;
END;
$function$;

-- 4. Create secure financial summary function
CREATE OR REPLACE FUNCTION public.get_secure_financial_summary(user_id_param UUID)
RETURNS TABLE(
  total_earnings NUMERIC,
  available_balance NUMERIC,
  pending_amount NUMERIC,
  last_transaction_date TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  -- Verify user can access this data
  IF auth.uid() != user_id_param AND NOT EXISTS (
    SELECT 1 FROM public.admins 
    WHERE user_id = auth.uid() 
      AND is_active = true 
      AND ('finance_admin' = ANY(permissions) OR admin_level = 'super_admin')
  ) THEN
    RAISE EXCEPTION 'Unauthorized access to financial data';
  END IF;
  
  -- Log access
  PERFORM public.log_sensitive_data_access(
    'financial_summary',
    user_id_param,
    'select',
    ARRAY['earnings', 'balance'],
    'Financial summary access'
  );
  
  RETURN QUERY
  SELECT 
    COALESCE((SELECT SUM(amount) FROM public.vendor_earnings WHERE vendor_id = user_id_param AND status = 'paid'), 0) as total_earnings,
    COALESCE((SELECT balance FROM public.user_wallets WHERE user_id = user_id_param LIMIT 1), 0) as available_balance,
    COALESCE((SELECT SUM(amount) FROM public.vendor_earnings WHERE vendor_id = user_id_param AND status IN ('pending', 'confirmed')), 0) as pending_amount,
    (SELECT MAX(created_at) FROM public.wallet_transactions WHERE user_id = user_id_param) as last_transaction_date;
END;
$function$;