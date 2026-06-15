
-- ============================================
-- CRITICAL FIX 1: partenaires — remove public_read_basic_partner_info
-- The v_public_partenaires view already exists for public access
-- ============================================
DROP POLICY IF EXISTS "public_read_basic_partner_info" ON public.partenaires;

-- ============================================
-- CRITICAL FIX 2: restaurant_profiles — restrict open SELECT policies
-- The v_public_restaurants view already exists for public access
-- ============================================
DROP POLICY IF EXISTS "Anyone can view active restaurants" ON public.restaurant_profiles;
DROP POLICY IF EXISTS "Public read approved restaurants" ON public.restaurant_profiles;
DROP POLICY IF EXISTS "Public read approved restaurants safe" ON public.restaurant_profiles;

-- Anon: only approved+active restaurants
CREATE POLICY "public_view_approved_restaurants" ON public.restaurant_profiles
  FOR SELECT TO anon
  USING (verification_status = 'approved' AND is_active = true);

-- Authenticated: own profile, admin, or approved restaurants
CREATE POLICY "authenticated_view_restaurants" ON public.restaurant_profiles
  FOR SELECT TO authenticated
  USING (
    auth.uid() = user_id
    OR is_current_user_admin()
    OR is_admin_food()
    OR (verification_status = 'approved' AND is_active = true)
  );

-- ============================================
-- CRITICAL FIX 3: ride_requests — restrict pending to active drivers
-- ============================================
DROP POLICY IF EXISTS "Drivers can view assigned ride requests" ON public.ride_requests;

CREATE POLICY "drivers_view_assigned_or_pending_rides" ON public.ride_requests
  FOR SELECT TO authenticated
  USING (
    auth.uid() = assigned_driver_id
    OR (
      status = 'pending'
      AND EXISTS (
        SELECT 1 FROM public.chauffeurs
        WHERE chauffeurs.user_id = auth.uid()
          AND chauffeurs.is_active = true
      )
    )
  );

-- ============================================
-- FIX 4: user_lottery_badges — restrict to owner
-- ============================================
DROP POLICY IF EXISTS "Users view all badges" ON public.user_lottery_badges;

CREATE POLICY "users_view_own_badges" ON public.user_lottery_badges
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "admin_view_all_badges" ON public.user_lottery_badges
  FOR SELECT TO authenticated
  USING (is_current_user_admin());

-- ============================================
-- FIX 5: ip_geolocation_cache — remove public read
-- ============================================
DROP POLICY IF EXISTS "IP geolocation cache is publicly readable" ON public.ip_geolocation_cache;

-- ============================================
-- FIX 6: food_order_ratings — remove open public read
-- ============================================
DROP POLICY IF EXISTS "Public read all ratings" ON public.food_order_ratings;

CREATE POLICY "public_view_food_ratings" ON public.food_order_ratings
  FOR SELECT TO anon
  USING (true);

-- ============================================
-- FIX 7: marketplace_ratings — restrict
-- ============================================
DROP POLICY IF EXISTS "Tout le monde peut voir les notes" ON public.marketplace_ratings;

CREATE POLICY "authenticated_view_marketplace_ratings" ON public.marketplace_ratings
  FOR SELECT TO authenticated
  USING (
    auth.uid() = buyer_id
    OR auth.uid() = seller_id
    OR is_current_user_admin()
  );

CREATE POLICY "public_view_marketplace_ratings" ON public.marketplace_ratings
  FOR SELECT TO anon
  USING (true);

-- ============================================
-- FIX 8: partner_ratings — restrict
-- ============================================
DROP POLICY IF EXISTS "Anyone can view partner ratings" ON public.partner_ratings;

CREATE POLICY "authenticated_view_partner_ratings" ON public.partner_ratings
  FOR SELECT TO authenticated
  USING (
    auth.uid() = client_id
    OR auth.uid() = partner_id
    OR is_current_user_admin()
  );

CREATE POLICY "public_view_partner_ratings" ON public.partner_ratings
  FOR SELECT TO anon
  USING (true);

-- ============================================
-- FIX 9: restaurant_followers — restrict
-- ============================================
DROP POLICY IF EXISTS "Anyone can view followers" ON public.restaurant_followers;

CREATE POLICY "view_restaurant_followers" ON public.restaurant_followers
  FOR SELECT TO authenticated
  USING (
    auth.uid() = follower_id
    OR is_current_user_admin()
    OR EXISTS (
      SELECT 1 FROM public.restaurant_profiles
      WHERE restaurant_profiles.id = restaurant_followers.restaurant_id
        AND restaurant_profiles.user_id = auth.uid()
    )
  );

-- ============================================
-- FIX 10: partner_rental_followers — restrict
-- ============================================
DROP POLICY IF EXISTS "Anyone can view followers" ON public.partner_rental_followers;

CREATE POLICY "view_partner_rental_followers" ON public.partner_rental_followers
  FOR SELECT TO authenticated
  USING (
    auth.uid() = follower_id
    OR is_current_user_admin()
    OR EXISTS (
      SELECT 1 FROM public.partenaires
      WHERE partenaires.id = partner_rental_followers.partner_id
        AND partenaires.user_id = auth.uid()
    )
  );

-- ============================================
-- FIX 11: user_ratings — restrict to involved parties
-- ============================================
DROP POLICY IF EXISTS "Users can view ratings" ON public.user_ratings;

CREATE POLICY "users_view_relevant_ratings" ON public.user_ratings
  FOR SELECT TO authenticated
  USING (
    auth.uid() = rater_user_id
    OR auth.uid() = rated_user_id
    OR is_current_user_admin()
  );
