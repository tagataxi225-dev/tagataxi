-- Phase 2: Core RLS Policies (simplified)

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

-- unified_conversations table
CREATE POLICY "unified_conversations_participants" ON public.unified_conversations
FOR ALL USING (auth.uid() = participant_1 OR auth.uid() = participant_2 OR is_current_user_admin());

-- user_notifications table
CREATE POLICY "user_notifications_self_access" ON public.user_notifications
FOR ALL USING (auth.uid() = user_id);

-- user_wallets table
CREATE POLICY "user_wallets_self_access" ON public.user_wallets
FOR ALL USING (auth.uid() = user_id);

-- vehicle_categories table
CREATE POLICY "vehicle_categories_public_read" ON public.vehicle_categories
FOR SELECT USING (is_active = true);

CREATE POLICY "vehicle_categories_admin_manage" ON public.vehicle_categories
FOR ALL USING (is_current_user_admin());

-- zone_pricing_rules table
CREATE POLICY "zone_pricing_rules_public_read" ON public.zone_pricing_rules
FOR SELECT USING (is_active = true);

CREATE POLICY "zone_pricing_rules_admin_manage" ON public.zone_pricing_rules
FOR ALL USING (is_current_user_admin());

-- profile_access_logs table
CREATE POLICY "profile_access_logs_admin_only" ON public.profile_access_logs
FOR ALL USING (is_current_user_admin());

-- vendor_financial_access_logs table
CREATE POLICY "vendor_financial_access_logs_admin_only" ON public.vendor_financial_access_logs
FOR ALL USING (is_current_user_admin());