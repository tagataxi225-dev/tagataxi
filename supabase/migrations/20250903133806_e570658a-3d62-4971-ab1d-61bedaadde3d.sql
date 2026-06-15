-- Phase 2: Complete RLS Policies for all remaining tables (Fixed)

-- profiles table
CREATE POLICY "profiles_self_access" ON public.profiles
FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "profiles_admin_access" ON public.profiles
FOR ALL USING (is_current_user_admin());

-- user_roles table
CREATE POLICY "user_roles_admin_access" ON public.user_roles
FOR ALL USING (is_current_user_admin());

CREATE POLICY "user_roles_self_view" ON public.user_roles
FOR SELECT USING (auth.uid() = user_id);

-- promotional_ads table
CREATE POLICY "promotional_ads_public_read" ON public.promotional_ads
FOR SELECT USING (is_active = true);

CREATE POLICY "promotional_ads_admin_manage" ON public.promotional_ads
FOR ALL USING (is_current_user_admin());

-- referrals table (fixed column names)
CREATE POLICY "referrals_self_access" ON public.referrals
FOR ALL USING (auth.uid() = referred_id OR auth.uid() = referrer_id);

CREATE POLICY "referrals_admin_access" ON public.referrals
FOR ALL USING (is_current_user_admin());

-- rental_bookings table
CREATE POLICY "rental_bookings_participants" ON public.rental_bookings
FOR ALL USING (auth.uid() = user_id OR 
  EXISTS (SELECT 1 FROM public.rental_vehicles rv WHERE rv.id = vehicle_id AND rv.owner_id = auth.uid()) OR
  is_current_user_admin());

-- rental_categories table
CREATE POLICY "rental_categories_public_read" ON public.rental_categories
FOR SELECT USING (is_active = true);

CREATE POLICY "rental_categories_admin_manage" ON public.rental_categories
FOR ALL USING (is_current_user_admin());

-- rental_city_pricing table
CREATE POLICY "rental_city_pricing_public_read" ON public.rental_city_pricing
FOR SELECT USING (true);

CREATE POLICY "rental_city_pricing_admin_manage" ON public.rental_city_pricing
FOR ALL USING (is_current_user_admin());

-- rental_subscription_payments table
CREATE POLICY "rental_subscription_payments_owner_access" ON public.rental_subscription_payments
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.partner_rental_subscriptions prs 
    WHERE prs.id = subscription_id 
    AND EXISTS (
      SELECT 1 FROM public.rental_vehicles rv 
      WHERE rv.id = prs.vehicle_id AND rv.owner_id = auth.uid()
    )
  ) OR is_current_user_admin()
);

-- support_messages table
CREATE POLICY "support_messages_participants" ON public.support_messages
FOR ALL USING (
  auth.uid() = user_id OR 
  EXISTS (
    SELECT 1 FROM public.enhanced_support_tickets est 
    WHERE est.id = ticket_id 
    AND (est.user_id = auth.uid() OR est.assigned_to = auth.uid())
  ) OR 
  is_current_user_admin()
);

-- unified_conversations table
CREATE POLICY "unified_conversations_participants" ON public.unified_conversations
FOR ALL USING (auth.uid() = participant_1 OR auth.uid() = participant_2 OR is_current_user_admin());

-- user_notifications table
CREATE POLICY "user_notifications_self_access" ON public.user_notifications
FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "user_notifications_admin_access" ON public.user_notifications
FOR SELECT USING (is_current_user_admin());

-- user_wallets table
CREATE POLICY "user_wallets_self_access" ON public.user_wallets
FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "user_wallets_admin_view" ON public.user_wallets
FOR SELECT USING (is_current_user_admin());

-- vehicle_categories table
CREATE POLICY "vehicle_categories_public_read" ON public.vehicle_categories
FOR SELECT USING (is_active = true);

CREATE POLICY "vehicle_categories_admin_manage" ON public.vehicle_categories
FOR ALL USING (is_current_user_admin());

-- vendor_financial_access_logs table
CREATE POLICY "vendor_financial_access_logs_admin_only" ON public.vendor_financial_access_logs
FOR ALL USING (is_current_user_admin());

-- zone_pricing_rules table
CREATE POLICY "zone_pricing_rules_public_read" ON public.zone_pricing_rules
FOR SELECT USING (is_active = true);

CREATE POLICY "zone_pricing_rules_admin_manage" ON public.zone_pricing_rules
FOR ALL USING (is_current_user_admin());

-- profile_access_logs table
CREATE POLICY "profile_access_logs_admin_only" ON public.profile_access_logs
FOR ALL USING (is_current_user_admin());

-- partner_rental_subscriptions table
CREATE POLICY "partner_rental_subscriptions_owner_access" ON public.partner_rental_subscriptions
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.rental_vehicles rv 
    WHERE rv.id = vehicle_id AND rv.owner_id = auth.uid()
  ) OR is_current_user_admin()
);