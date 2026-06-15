-- Fix: Replace permissive USING(true) UPDATE policy on user_wallets with service_role restriction
-- All wallet balance modifications MUST go through Edge Functions (service_role)

DROP POLICY IF EXISTS "System can update wallets" ON public.user_wallets;

-- Only service_role (Edge Functions) can update wallet balances
CREATE POLICY "Service role can update wallets"
ON public.user_wallets
FOR UPDATE
USING (current_setting('role') = 'service_role')
WITH CHECK (current_setting('role') = 'service_role');

-- Also restrict INSERT to service_role to prevent users creating fake wallets
DROP POLICY IF EXISTS "Users can create their wallet" ON public.user_wallets;

CREATE POLICY "Service role can insert wallets"
ON public.user_wallets
FOR INSERT
WITH CHECK (current_setting('role') = 'service_role');

-- Also restrict DELETE
DROP POLICY IF EXISTS "Users can delete their wallet" ON public.user_wallets;

CREATE POLICY "Service role can delete wallets"
ON public.user_wallets
FOR DELETE
USING (current_setting('role') = 'service_role');

-- Keep user SELECT for viewing own wallet only
DROP POLICY IF EXISTS "Users can view their wallet" ON public.user_wallets;

CREATE POLICY "Users can view own wallet"
ON public.user_wallets
FOR SELECT
USING (auth.uid() = user_id);