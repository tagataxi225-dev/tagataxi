-- Fix Security Definer Views with correct columns
DROP VIEW IF EXISTS public.partner_profiles CASCADE;
CREATE VIEW public.partner_profiles 
WITH (security_invoker = true)
AS
SELECT 
  p.id, p.user_id, p.company_name, p.city, p.address,
  p.contact_person_name as contact_email, p.contact_person_phone as contact_phone,
  p.verification_status, p.is_active, p.created_at, p.updated_at,
  p.banner_image as logo_url, p.shop_description as description,
  p.bank_account_number, p.commission_rate
FROM partenaires p;

DROP VIEW IF EXISTS public.driver_service_preferences_legacy CASCADE;
CREATE VIEW public.driver_service_preferences_legacy
WITH (security_invoker = true)
AS
SELECT c.user_id as driver_id, c.service_type, c.service_specialization,
  c.delivery_capacity, c.service_areas, c.vehicle_type, c.vehicle_class
FROM chauffeurs c WHERE c.is_active = true;

-- Add search_path to all public functions
DO $$
DECLARE func_record RECORD;
BEGIN
  FOR func_record IN 
    SELECT p.proname, pg_get_function_identity_arguments(p.oid) as args
    FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.prokind = 'f'
    AND p.proname NOT LIKE 'uuid%' AND p.proname NOT LIKE 'gen_random%'
  LOOP
    BEGIN
      EXECUTE format('ALTER FUNCTION public.%I(%s) SET search_path = public', 
                     func_record.proname, func_record.args);
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
  END LOOP;
END $$;

GRANT SELECT ON public.partner_profiles TO authenticated;
GRANT SELECT ON public.driver_service_preferences_legacy TO authenticated;