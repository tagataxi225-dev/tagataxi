-- =============================================
-- SECURITY FIX: Restrict write access on sensitive financial tables
-- wallet_transactions, lottery_tickets, driver_challenges, challenge_rewards
-- Users should only SELECT; all writes must go through Edge Functions (service_role)
-- =============================================

-- 1. WALLET_TRANSACTIONS: Remove FOR ALL policies, keep SELECT only
DROP POLICY IF EXISTS "Users access own wallet transactions" ON public.wallet_transactions;
DROP POLICY IF EXISTS "wallet_transactions_own_only" ON public.wallet_transactions;
DROP POLICY IF EXISTS "wallet_transactions_self_access" ON public.wallet_transactions;

-- User can only READ their own transactions
CREATE POLICY "wallet_tx_user_select"
  ON public.wallet_transactions FOR SELECT
  USING (auth.uid() = user_id);

-- Service role can do everything (edge functions)
CREATE POLICY "wallet_tx_service_role_all"
  ON public.wallet_transactions FOR ALL
  USING (current_setting('role') = 'service_role')
  WITH CHECK (current_setting('role') = 'service_role');

-- 2. LOTTERY_TICKETS: Remove FOR ALL, restrict writes to service_role
DROP POLICY IF EXISTS "lottery_ticket_self_access" ON public.lottery_tickets;

-- Users can only view their own tickets
CREATE POLICY "lottery_user_select"
  ON public.lottery_tickets FOR SELECT
  USING (auth.uid() = user_id);

-- Only service role (edge functions) can create/modify tickets
CREATE POLICY "lottery_service_role_all"
  ON public.lottery_tickets FOR ALL
  USING (current_setting('role') = 'service_role')
  WITH CHECK (current_setting('role') = 'service_role');

-- 3. DRIVER_CHALLENGES: Remove FOR ALL, restrict writes to service_role
DROP POLICY IF EXISTS "Drivers access own challenges" ON public.driver_challenges;

-- Drivers can only view their own challenges
CREATE POLICY "driver_challenges_user_select"
  ON public.driver_challenges FOR SELECT
  USING (auth.uid() = driver_id);

-- Only service role can create/update/complete challenges
CREATE POLICY "driver_challenges_service_role_all"
  ON public.driver_challenges FOR ALL
  USING (current_setting('role') = 'service_role')
  WITH CHECK (current_setting('role') = 'service_role');

-- 4. CHALLENGE_REWARDS: Remove FOR ALL, restrict writes to service_role
DROP POLICY IF EXISTS "challenge_rewards_participants" ON public.challenge_rewards;

-- Drivers can view their own rewards
CREATE POLICY "challenge_rewards_user_select"
  ON public.challenge_rewards FOR SELECT
  USING (auth.uid() = driver_id);

-- Admin can view all rewards
CREATE POLICY "challenge_rewards_admin_select"
  ON public.challenge_rewards FOR SELECT
  USING (is_current_user_admin());

-- Only service role can create rewards
CREATE POLICY "challenge_rewards_service_role_all"
  ON public.challenge_rewards FOR ALL
  USING (current_setting('role') = 'service_role')
  WITH CHECK (current_setting('role') = 'service_role');