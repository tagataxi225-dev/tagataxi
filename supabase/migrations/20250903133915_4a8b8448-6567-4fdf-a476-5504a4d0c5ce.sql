-- Phase 2: RLS Policies for confirmed existing tables only

-- profiles table (exists as confirmed)
CREATE POLICY "profiles_self_access" ON public.profiles
FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "profiles_admin_access" ON public.profiles
FOR ALL USING (is_current_user_admin());

-- user_roles table (exists as confirmed)
CREATE POLICY "user_roles_admin_access" ON public.user_roles
FOR ALL USING (is_current_user_admin());

CREATE POLICY "user_roles_self_view" ON public.user_roles
FOR SELECT USING (auth.uid() = user_id);

-- promotional_ads table (exists as confirmed)
CREATE POLICY "promotional_ads_public_read" ON public.promotional_ads
FOR SELECT USING (is_active = true);

CREATE POLICY "promotional_ads_admin_manage" ON public.promotional_ads
FOR ALL USING (is_current_user_admin());

-- partenaires table (exists as confirmed)
CREATE POLICY "partenaires_self_access" ON public.partenaires
FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "partenaires_admin_access" ON public.partenaires
FOR ALL USING (is_current_user_admin());

-- favorites table (exists as confirmed)
CREATE POLICY "favorites_self_access" ON public.favorites
FOR ALL USING (auth.uid() = user_id);

-- escrow_notifications table (exists as confirmed)
CREATE POLICY "escrow_notifications_self_access" ON public.escrow_notifications
FOR ALL USING (auth.uid() = user_id);

-- escrow_payments table (exists as confirmed) 
CREATE POLICY "escrow_payments_participants" ON public.escrow_payments
FOR ALL USING (auth.uid() = buyer_id OR auth.uid() = seller_id OR is_current_user_admin());

-- challenges table (exists as confirmed)
CREATE POLICY "challenges_public_read" ON public.challenges
FOR SELECT USING (is_active = true);

CREATE POLICY "challenges_admin_manage" ON public.challenges
FOR ALL USING (is_current_user_admin());

-- challenge_rewards table (exists as confirmed)
CREATE POLICY "challenge_rewards_participants" ON public.challenge_rewards
FOR ALL USING (auth.uid() = driver_id OR is_current_user_admin());