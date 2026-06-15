
-- Fix function search_path for security compliance
-- Add SECURITY DEFINER and SET search_path to all trigger functions

-- 1. Fix update_booking_reports_updated_at
CREATE OR REPLACE FUNCTION public.update_booking_reports_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- 2. Fix update_partner_driver_requests_updated_at
CREATE OR REPLACE FUNCTION public.update_partner_driver_requests_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

-- 3. Fix update_user_saved_places_timestamp
CREATE OR REPLACE FUNCTION public.update_user_saved_places_timestamp()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;
