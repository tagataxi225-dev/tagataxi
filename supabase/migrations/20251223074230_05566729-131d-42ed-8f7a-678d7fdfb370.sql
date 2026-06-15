-- Add max_referrals limit to referral_codes table
ALTER TABLE public.referral_codes 
ADD COLUMN IF NOT EXISTS max_referrals INTEGER DEFAULT 20;

-- Update existing records to have the default limit
UPDATE public.referral_codes 
SET max_referrals = 20 
WHERE max_referrals IS NULL;

-- Create or replace the function to apply driver referral code with limit check
CREATE OR REPLACE FUNCTION public.apply_driver_referral_code(
  p_code TEXT,
  p_referred_id UUID
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_referrer_id UUID;
  v_code_id UUID;
  v_max_referrals INTEGER;
  v_current_count INTEGER;
  v_bonus_amount INTEGER := 2000; -- 2000 CDF bonus per referral
  v_validation_threshold INTEGER := 10; -- 10 rides to validate
BEGIN
  -- Find the referral code
  SELECT id, user_id, max_referrals 
  INTO v_code_id, v_referrer_id, v_max_referrals
  FROM public.referral_codes
  WHERE code = UPPER(p_code) AND is_active = true;

  IF v_referrer_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Code de parrainage invalide ou expiré'
    );
  END IF;

  -- Cannot use own code
  IF v_referrer_id = p_referred_id THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Vous ne pouvez pas utiliser votre propre code'
    );
  END IF;

  -- Check if already referred
  IF EXISTS (
    SELECT 1 FROM public.referral_tracking 
    WHERE referred_id = p_referred_id
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Vous avez déjà utilisé un code de parrainage'
    );
  END IF;

  -- Check referrer limit (max 20 referrals)
  SELECT COUNT(*) INTO v_current_count
  FROM public.referral_tracking
  WHERE referrer_id = v_referrer_id AND status IN ('pending', 'completed');

  IF v_current_count >= COALESCE(v_max_referrals, 20) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Ce parrain a atteint sa limite de 20 filleuls maximum'
    );
  END IF;

  -- Create referral tracking
  INSERT INTO public.referral_tracking (
    referrer_id,
    referred_id,
    referral_code_id,
    status,
    referrer_bonus_amount,
    referred_bonus_amount,
    validation_threshold,
    referred_completed_rides
  ) VALUES (
    v_referrer_id,
    p_referred_id,
    v_code_id,
    'pending',
    v_bonus_amount,
    v_bonus_amount,
    v_validation_threshold,
    0
  );

  -- Update usage count
  UPDATE public.referral_codes
  SET usage_count = usage_count + 1
  WHERE id = v_code_id;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Code de parrainage appliqué avec succès',
    'bonus_amount', v_bonus_amount,
    'validation_threshold', v_validation_threshold,
    'remaining_slots', COALESCE(v_max_referrals, 20) - v_current_count - 1
  );
END;
$$;

-- Create function to get referral stats with remaining slots
CREATE OR REPLACE FUNCTION public.get_driver_referral_stats(p_user_id UUID)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_code_record RECORD;
  v_total_referrals INTEGER;
  v_completed_referrals INTEGER;
  v_pending_referrals INTEGER;
  v_total_earned NUMERIC;
  v_max_referrals INTEGER := 20;
  v_remaining_slots INTEGER;
BEGIN
  -- Get referral code info
  SELECT * INTO v_code_record
  FROM public.referral_codes
  WHERE user_id = p_user_id
  LIMIT 1;

  IF v_code_record IS NULL THEN
    RETURN jsonb_build_object(
      'hasCode', false,
      'maxReferrals', v_max_referrals,
      'remainingSlots', v_max_referrals
    );
  END IF;

  -- Count referrals
  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE status = 'completed'),
    COUNT(*) FILTER (WHERE status = 'pending')
  INTO v_total_referrals, v_completed_referrals, v_pending_referrals
  FROM public.referral_tracking
  WHERE referrer_id = p_user_id;

  -- Calculate remaining slots
  v_remaining_slots := COALESCE(v_code_record.max_referrals, v_max_referrals) - v_total_referrals;

  RETURN jsonb_build_object(
    'hasCode', true,
    'code', v_code_record.code,
    'totalReferrals', v_total_referrals,
    'completedReferrals', v_completed_referrals,
    'pendingReferrals', v_pending_referrals,
    'totalEarned', COALESCE(v_code_record.total_earnings, 0),
    'maxReferrals', COALESCE(v_code_record.max_referrals, v_max_referrals),
    'remainingSlots', GREATEST(v_remaining_slots, 0),
    'limitReached', v_remaining_slots <= 0
  );
END;
$$;