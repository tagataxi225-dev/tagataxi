
-- Fix 1: food_delivery_assignments - restrict FOR ALL USING(true) to service_role
DROP POLICY IF EXISTS "Service role full access" ON public.food_delivery_assignments;
CREATE POLICY "Service role full access" ON public.food_delivery_assignments
  FOR ALL USING (current_setting('role') = 'service_role')
  WITH CHECK (current_setting('role') = 'service_role');

-- Fix 2: scratch_card_pity_tracker - restrict FOR ALL USING(true) to service_role
DROP POLICY IF EXISTS "System manages pity tracker" ON public.scratch_card_pity_tracker;
CREATE POLICY "System manages pity tracker" ON public.scratch_card_pity_tracker
  FOR ALL USING (current_setting('role') = 'service_role')
  WITH CHECK (current_setting('role') = 'service_role');

-- Fix 3: vendor_stats_cache - restrict FOR ALL USING(true) to service_role (keep public read)
DROP POLICY IF EXISTS "System can manage vendor stats" ON public.vendor_stats_cache;
CREATE POLICY "Service role manages vendor stats" ON public.vendor_stats_cache
  FOR ALL USING (current_setting('role') = 'service_role')
  WITH CHECK (current_setting('role') = 'service_role');
