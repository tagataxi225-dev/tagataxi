-- Ajouter la colonne kwenda_points à user_wallets
ALTER TABLE public.user_wallets 
ADD COLUMN IF NOT EXISTS kwenda_points INTEGER DEFAULT 0;

-- Fonction pour convertir points en crédits
CREATE OR REPLACE FUNCTION convert_points_to_credits(
  p_user_id UUID,
  p_points INTEGER,
  p_credits NUMERIC
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Vérifier que l'utilisateur a assez de points
  IF (SELECT kwenda_points FROM user_wallets WHERE user_id = p_user_id) < p_points THEN
    RAISE EXCEPTION 'Points insuffisants';
  END IF;

  -- Déduire les points et ajouter les crédits
  UPDATE user_wallets
  SET 
    kwenda_points = kwenda_points - p_points,
    balance = balance + p_credits,
    updated_at = NOW()
  WHERE user_id = p_user_id;

  -- Logger la transaction
  INSERT INTO wallet_transactions (
    wallet_id,
    transaction_type,
    amount,
    currency,
    description,
    status
  ) VALUES (
    (SELECT id FROM user_wallets WHERE user_id = p_user_id),
    'points_conversion',
    p_credits,
    'CDF',
    format('Conversion de %s points Kwenda en %s CDF', p_points, p_credits),
    'completed'
  );
END;
$$;

-- Fonction pour déduire des points
CREATE OR REPLACE FUNCTION deduct_kwenda_points(
  p_user_id UUID,
  p_points INTEGER
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE user_wallets
  SET 
    kwenda_points = kwenda_points - p_points,
    updated_at = NOW()
  WHERE user_id = p_user_id;
END;
$$;

-- Fonction pour attribuer des points selon la rareté
CREATE OR REPLACE FUNCTION award_kwenda_points_for_win()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  points_to_award INTEGER;
BEGIN
  -- Points selon rareté
  points_to_award := CASE NEW.rarity
    WHEN 'common' THEN 10
    WHEN 'rare' THEN 50
    WHEN 'epic' THEN 200
    WHEN 'legendary' THEN 1000
    ELSE 10
  END;

  -- Ajouter les points au portefeuille
  UPDATE user_wallets
  SET 
    kwenda_points = kwenda_points + points_to_award,
    updated_at = NOW()
  WHERE user_id = NEW.user_id;

  RETURN NEW;
END;
$$;

-- Trigger pour attribuer automatiquement les points
DROP TRIGGER IF EXISTS trigger_award_points_on_scratch ON public.lottery_wins;
CREATE TRIGGER trigger_award_points_on_scratch
  AFTER UPDATE ON public.lottery_wins
  FOR EACH ROW
  WHEN (NEW.scratch_revealed_at IS NOT NULL AND OLD.scratch_revealed_at IS NULL)
  EXECUTE FUNCTION award_kwenda_points_for_win();