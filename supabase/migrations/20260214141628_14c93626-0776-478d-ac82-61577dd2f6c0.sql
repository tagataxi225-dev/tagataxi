
-- Fix remaining security issues

-- 1. Fix user_profiles_safe view: set security_invoker
DROP VIEW IF EXISTS public.user_profiles_safe;
CREATE VIEW public.user_profiles_safe 
WITH (security_invoker = true)
AS
SELECT c.user_id,
    c.display_name AS name,
    c.email,
    'client'::text AS role,
    c.is_active
   FROM clients c
UNION ALL
 SELECT p.user_id,
    p.company_name AS name,
    p.email,
    'partner'::text AS role,
    p.is_active
   FROM partenaires p
UNION ALL
 SELECT dp.user_id,
    COALESCE(prof.display_name, 'Driver'::text) AS name,
    ''::text AS email,
    'driver'::text AS role,
    dp.is_active
   FROM (driver_profiles dp
     LEFT JOIN profiles prof ON ((prof.user_id = dp.user_id)));

-- 2. Fix trigger function missing search_path
CREATE OR REPLACE FUNCTION public.update_digital_downloads_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;
