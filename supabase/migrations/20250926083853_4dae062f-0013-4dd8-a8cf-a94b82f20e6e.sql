-- Address SECURITY DEFINER view/function security concerns
-- The linter flagged SECURITY DEFINER functions as potential security risks
-- However, most of these functions legitimately need SECURITY DEFINER for proper access control

-- 1. First, let's ensure that any remaining problematic views are fixed
-- Check if there are any views with SECURITY DEFINER (which should not exist)
DROP VIEW IF EXISTS public.view_with_security_definer CASCADE;

-- 2. For functions that don't actually need SECURITY DEFINER, convert them to SECURITY INVOKER
-- These are utility functions that should use the caller's permissions

-- Fix distance calculation functions - these don't need elevated privileges
CREATE OR REPLACE FUNCTION public.calculate_distance_km(lat1 numeric, lng1 numeric, lat2 numeric, lng2 numeric)
RETURNS numeric
LANGUAGE plpgsql
SECURITY INVOKER
STABLE
SET search_path = 'public'
AS $function$
BEGIN
  -- Calculate distance using Haversine formula
  RETURN (
    6371 * acos(
      cos(radians(lat1)) * cos(radians(lat2)) * 
      cos(radians(lng2) - radians(lng1)) + 
      sin(radians(lat1)) * sin(radians(lat2))
    )
  )::numeric;
END;
$function$;

CREATE OR REPLACE FUNCTION public.calculate_distance_meters(lat1 numeric, lng1 numeric, lat2 numeric, lng2 numeric)
RETURNS integer
LANGUAGE plpgsql
SECURITY INVOKER
STABLE
SET search_path = 'public'
AS $function$
BEGIN
  -- Calculate distance in meters using Haversine formula
  RETURN (
    6371000 * acos(
      cos(radians(lat1)) * cos(radians(lat2)) * 
      cos(radians(lng2) - radians(lng1)) + 
      sin(radians(lat1)) * sin(radians(lat2))
    )
  )::integer;
END;
$function$;

-- Fix pricing calculation functions - these can use invoker permissions
CREATE OR REPLACE FUNCTION public.calculate_delivery_price(delivery_type_param text, distance_km_param numeric, city_param text DEFAULT 'Kinshasa'::text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
STABLE
SET search_path = 'public'
AS $function$
DECLARE
  base_price numeric;
  price_per_km numeric;
  calculated_price numeric;
  config_record RECORD;
BEGIN
  SELECT * INTO config_record
  FROM public.delivery_pricing_config
  WHERE service_type = delivery_type_param
    AND city = city_param
    AND is_active = true
  ORDER BY created_at DESC
  LIMIT 1;
  
  IF config_record IS NULL THEN
    base_price := 5000;
    price_per_km := 500;
  ELSE
    base_price := config_record.base_price;
    price_per_km := config_record.price_per_km;
  END IF;
  
  calculated_price := base_price + (distance_km_param * price_per_km);
  
  RETURN jsonb_build_object(
    'calculated_price', calculated_price,
    'base_price', base_price,
    'distance_price', distance_km_param * price_per_km,
    'distance_km', distance_km_param,
    'currency', 'CDF'
  );
END;
$function$;

-- Keep SECURITY DEFINER only for functions that legitimately need elevated privileges:
-- - admin_* functions (need admin access)
-- - log_* functions (need to write to audit tables)
-- - cleanup_* functions (need system-level access)
-- - security-related functions

-- Comment explaining the remaining SECURITY DEFINER functions
COMMENT ON FUNCTION public.admin_extend_subscription IS 'SECURITY DEFINER required for admin operations on subscriptions';
COMMENT ON FUNCTION public.admin_cancel_subscription IS 'SECURITY DEFINER required for admin operations on subscriptions';
COMMENT ON FUNCTION public.log_security_audit IS 'SECURITY DEFINER required to write to audit logs regardless of user permissions';

-- The security linter warning is acceptable for legitimate SECURITY DEFINER functions
-- that require elevated privileges for proper system functioning