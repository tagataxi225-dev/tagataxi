-- Fix Security Definer View issue
-- Remove the problematic view that uses SECURITY DEFINER implicitly
DROP VIEW IF EXISTS public.available_drivers_summary;

-- Recreate the view without SECURITY DEFINER and with proper RLS
CREATE VIEW public.available_drivers_summary 
WITH (security_invoker = true) AS
SELECT 
    count(*) AS total_available_drivers,
    COALESCE(dl.vehicle_class, 'standard'::text) AS vehicle_class,
    'Kinshasa'::text AS city,
    round(avg(COALESCE(dp.rating_average, (0)::numeric)), 1) AS avg_rating
FROM driver_locations dl
LEFT JOIN driver_profiles dp ON (dl.driver_id = dp.user_id)
WHERE 
    dl.is_online = true 
    AND dl.is_available = true 
    AND COALESCE(dl.is_verified, false) = true 
    AND COALESCE(dp.verification_status, 'pending'::text) = 'verified'::text 
    AND COALESCE(dp.is_active, false) = true
GROUP BY COALESCE(dl.vehicle_class, 'standard'::text);

-- Enable RLS on the underlying tables to ensure security
-- (These should already be enabled, but this ensures consistency)
ALTER TABLE public.driver_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_profiles ENABLE ROW LEVEL SECURITY;

-- Add a policy for the view to ensure proper access control
CREATE POLICY "available_drivers_summary_public_read" 
ON public.driver_locations 
FOR SELECT 
USING (
    is_online = true 
    AND is_available = true 
    AND COALESCE(is_verified, false) = true
);

-- The view now respects the caller's permissions and RLS policies
-- rather than running with elevated privileges