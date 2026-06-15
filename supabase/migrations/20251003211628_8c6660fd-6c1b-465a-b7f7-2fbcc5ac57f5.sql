-- Drop existing policies on referrals table
DROP POLICY IF EXISTS "referrals_select" ON public.referrals;
DROP POLICY IF EXISTS "referrals_insert" ON public.referrals;
DROP POLICY IF EXISTS "referrals_update" ON public.referrals;
DROP POLICY IF EXISTS "referrals_delete" ON public.referrals;

-- Create corrected RLS policies for referrals table
-- SELECT: Users can view their own referrals (as referrer or referred)
CREATE POLICY "referrals_select" ON public.referrals
FOR SELECT
USING (
  auth.uid() = referrer_id OR 
  auth.uid() = referred_id
);

-- INSERT: Users can create their own referral codes (referrer_id = auth.uid())
-- This allows creation even when referred_id is NULL
CREATE POLICY "referrals_insert" ON public.referrals
FOR INSERT
WITH CHECK (auth.uid() = referrer_id);

-- UPDATE: Users can update referrals where they are involved
CREATE POLICY "referrals_update" ON public.referrals
FOR UPDATE
USING (
  auth.uid() = referrer_id OR 
  auth.uid() = referred_id
)
WITH CHECK (
  auth.uid() = referrer_id OR 
  auth.uid() = referred_id
);

-- Verify referral_rewards table has proper RLS policies
DROP POLICY IF EXISTS "referral_rewards_select" ON public.referral_rewards;

CREATE POLICY "referral_rewards_select" ON public.referral_rewards
FOR SELECT
USING (
  auth.uid() = referrer_id OR 
  is_current_user_admin()
);