-- ============================================================
-- FIX CRITICAL RLS VULNERABILITIES (corrected)
-- ============================================================

-- 1. RESTAURANT_PROFILES: Safe public view (no email, phone, tax_number, etc.)
CREATE OR REPLACE VIEW public.v_public_restaurants
WITH (security_invoker = off)
AS
SELECT 
  id, restaurant_name, description, logo_url, banner_url, address, city,
  commune, quartier, coordinates, cuisine_types, opening_hours,
  rating_average, rating_count, total_orders, minimum_order_amount,
  average_preparation_time, delivery_zones, is_active, verification_status
FROM public.restaurant_profiles
WHERE verification_status = 'approved' AND is_active = true;

GRANT SELECT ON public.v_public_restaurants TO anon, authenticated;

-- New safe policy replacing the dropped ones
CREATE POLICY "Public read approved restaurants safe"
ON public.restaurant_profiles FOR SELECT TO public
USING (
  (verification_status = 'approved' AND is_active = true)
  OR (auth.uid() = user_id)
  OR is_current_user_admin()
  OR is_admin_food()
);

-- 2. RIDE_REQUESTS: already fixed in prev migration

-- 3. IP_GEOLOCATION_CACHE: already fixed in prev migration

-- 4. USER_LOTTERY_BADGES: already fixed in prev migration

-- 5. FOOD_ORDER_RATINGS: already fixed in prev migration

-- 6. PUSH_NOTIFICATIONS: already fixed in prev migration

-- 7. DRIVER_PROFILES: already fixed in prev migration

-- 8. CHAUFFEURS: Safe public view (no bank, insurance, license data)
CREATE OR REPLACE VIEW public.v_public_drivers
WITH (security_invoker = off)
AS
SELECT id, display_name, vehicle_make, vehicle_model, vehicle_color,
  vehicle_type, vehicle_class, rating_average, rating_count, total_rides,
  city, service_type, profile_photo_url, vehicle_photo_url, is_active, verification_status
FROM public.chauffeurs
WHERE verification_status = 'verified' AND is_active = true;

GRANT SELECT ON public.v_public_drivers TO authenticated;

-- 9. FOLLOWERS: already fixed in prev migration

-- 10. MARKETPLACE_RATINGS: already fixed in prev migration

-- 11. PARTNER_RATINGS: already fixed in prev migration

-- 12. REFERRAL_CODES: already fixed in prev migration