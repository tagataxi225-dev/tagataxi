
-- ============================================================
-- SECURITY HARDENING MIGRATION (CORRECTED)
-- Fixes: Function search_path, RLS policy restrictions
-- ============================================================

-- 1. Fix functions without search_path (SECURITY DEFINER functions)

-- Fix check_vehicle_has_active_subscription
CREATE OR REPLACE FUNCTION public.check_vehicle_has_active_subscription(p_vehicle_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM driver_subscriptions ds
    JOIN driver_profiles dp ON dp.user_id = ds.driver_id
    WHERE dp.id = p_vehicle_id
      AND ds.status = 'active'
      AND ds.end_date > NOW()
  );
END;
$$;

-- Fix increment_offer_count
CREATE OR REPLACE FUNCTION public.increment_offer_count(driver_id_param uuid, amount_to_add integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE driver_referral_codes
  SET offers_count = offers_count + amount_to_add
  WHERE driver_id = driver_id_param;
END;
$$;

-- Fix on_subscription_expiry
CREATE OR REPLACE FUNCTION public.on_subscription_expiry()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'expired' AND OLD.status = 'active' THEN
    INSERT INTO admin_notifications (
      title,
      message,
      type,
      severity,
      data
    ) VALUES (
      'Abonnement expiré',
      'L''abonnement du chauffeur ' || NEW.driver_id || ' a expiré',
      'subscription_expired',
      'info',
      jsonb_build_object('driver_id', NEW.driver_id, 'subscription_id', NEW.id)
    );
  END IF;
  RETURN NEW;
END;
$$;

-- 2. Secure materialized views (restrict anonymous access)
REVOKE ALL ON public.vendor_stats_mv FROM anon;
REVOKE ALL ON public.partner_rental_stats FROM anon;
REVOKE ALL ON public.driver_status_unified FROM anon;
REVOKE ALL ON public.rental_vehicle_review_stats FROM anon;
REVOKE ALL ON public.admin_subscription_revenue_stats FROM anon;
REVOKE ALL ON public.active_driver_orders FROM anon;

GRANT SELECT ON public.vendor_stats_mv TO authenticated;
GRANT SELECT ON public.partner_rental_stats TO authenticated;
GRANT SELECT ON public.driver_status_unified TO authenticated;
GRANT SELECT ON public.rental_vehicle_review_stats TO authenticated;
GRANT SELECT ON public.admin_subscription_revenue_stats TO authenticated;
GRANT SELECT ON public.active_driver_orders TO authenticated;

-- 3. Tighten overly permissive policies on system/sensitive tables

-- admin_notification_queue - Restrict to service role only
DROP POLICY IF EXISTS "System can manage notifications" ON public.admin_notification_queue;
CREATE POLICY "admin_notification_queue_service_role_only" ON public.admin_notification_queue
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- delivery_escrow_payments - Restrict to service role only
DROP POLICY IF EXISTS "Service role can manage delivery escrow" ON public.delivery_escrow_payments;
CREATE POLICY "delivery_escrow_service_role_only" ON public.delivery_escrow_payments
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- driver_cash_collections - Restrict to service role only
DROP POLICY IF EXISTS "Service role can manage cash collections" ON public.driver_cash_collections;
CREATE POLICY "driver_cash_collections_service_role_only" ON public.driver_cash_collections
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- escrow_transactions - Restrict to service role only
DROP POLICY IF EXISTS "service_role_manage_escrow" ON public.escrow_transactions;
CREATE POLICY "escrow_transactions_service_role_only" ON public.escrow_transactions
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- marketplace_digital_downloads - Restrict system operations
DROP POLICY IF EXISTS "System can create downloads" ON public.marketplace_digital_downloads;
DROP POLICY IF EXISTS "System can update downloads" ON public.marketplace_digital_downloads;
CREATE POLICY "marketplace_downloads_service_role_insert" ON public.marketplace_digital_downloads
  FOR INSERT WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "marketplace_downloads_service_role_update" ON public.marketplace_digital_downloads
  FOR UPDATE USING (auth.role() = 'service_role');

-- geolocation_audit_trail - Restrict to service role only
DROP POLICY IF EXISTS "System can insert audit records" ON public.geolocation_audit_trail;
CREATE POLICY "geolocation_audit_service_role_only" ON public.geolocation_audit_trail
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- navigation_events - Restrict to service role only
DROP POLICY IF EXISTS "System creates navigation events" ON public.navigation_events;
CREATE POLICY "navigation_events_service_role_only" ON public.navigation_events
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- food_notifications - Restrict system insert
DROP POLICY IF EXISTS "System can insert notifications" ON public.food_notifications;
CREATE POLICY "food_notifications_service_role_insert" ON public.food_notifications
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- food_orders - Restrict to service role OR owner (customer_id)
DROP POLICY IF EXISTS "service_role_insert_food_orders" ON public.food_orders;
CREATE POLICY "food_orders_insert_policy" ON public.food_orders
  FOR INSERT WITH CHECK (auth.role() = 'service_role' OR auth.uid() = customer_id);

-- marketplace_orders - Restrict to service role OR owner (buyer_id)
DROP POLICY IF EXISTS "service_role_insert_marketplace_orders" ON public.marketplace_orders;
CREATE POLICY "marketplace_orders_insert_policy" ON public.marketplace_orders
  FOR INSERT WITH CHECK (auth.role() = 'service_role' OR auth.uid() = buyer_id);

-- 4. Log security update
INSERT INTO admin_notifications (title, message, type, severity) VALUES (
  'Migration sécurité appliquée',
  'Les fonctions SECURITY DEFINER ont été sécurisées avec search_path. Les policies RLS ont été restreintes.',
  'security_update',
  'info'
);
