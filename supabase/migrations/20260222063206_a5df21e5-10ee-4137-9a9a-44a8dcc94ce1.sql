
-- Fix: Convert points to bonus_balance instead of deprecated ecosystem_credits
CREATE OR REPLACE FUNCTION public.convert_kwenda_points_to_ecosystem(
  p_user_id UUID,
  p_points INTEGER,
  p_credits NUMERIC,
  p_bonus_rate NUMERIC DEFAULT 0
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_wallet RECORD;
BEGIN
  -- Vérifier le solde de points
  SELECT kwenda_points, bonus_balance INTO v_wallet
  FROM user_wallets 
  WHERE user_id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Portefeuille non trouvé';
  END IF;

  IF v_wallet.kwenda_points < p_points THEN
    RAISE EXCEPTION 'Points insuffisants: vous avez % points, % requis', 
      v_wallet.kwenda_points, p_points;
  END IF;

  IF p_points < 50 THEN
    RAISE EXCEPTION 'Minimum 50 points requis pour la conversion';
  END IF;

  -- Déduire les points et ajouter au BONUS_BALANCE (pas ecosystem_credits)
  UPDATE user_wallets
  SET 
    kwenda_points = kwenda_points - p_points,
    bonus_balance = bonus_balance + p_credits,
    updated_at = NOW()
  WHERE user_id = p_user_id;

  -- Logger la conversion
  INSERT INTO points_conversion_history (
    user_id, points_converted, credits_received, conversion_rate, bonus_percentage
  ) VALUES (
    p_user_id, p_points, p_credits, 10.00, p_bonus_rate * 100
  );

  -- Logger dans activity_logs
  INSERT INTO activity_logs (
    user_id, activity_type, description, amount, currency, metadata
  ) VALUES (
    p_user_id, 
    'points_conversion',
    format('Conversion de %s points en %s CDF Solde Bonus', p_points, ROUND(p_credits)),
    p_credits,
    'CDF',
    jsonb_build_object(
      'points_converted', p_points,
      'bonus_rate', p_bonus_rate,
      'bonus_before', v_wallet.bonus_balance,
      'bonus_after', v_wallet.bonus_balance + p_credits
    )
  );

  -- Logger dans wallet_transactions
  INSERT INTO wallet_transactions (
    user_id, transaction_type, amount, currency, description, status, reference_type
  ) VALUES (
    p_user_id,
    'bonus_credit',
    p_credits,
    'CDF',
    format('Conversion de %s points Kwenda en Solde Bonus', p_points),
    'completed',
    'points_conversion'
  );

  RETURN jsonb_build_object(
    'success', true,
    'points_converted', p_points,
    'credits_received', p_credits,
    'bonus_applied', p_bonus_rate > 0,
    'new_points_balance', v_wallet.kwenda_points - p_points,
    'new_bonus_balance', v_wallet.bonus_balance + p_credits
  );
END;
$$;
