-- =========================================
-- SYSTÈME DE POINTS KWENDA
-- =========================================

-- 1. Ajouter colonne ecosystem_credits dans user_wallets
ALTER TABLE public.user_wallets 
ADD COLUMN IF NOT EXISTS ecosystem_credits NUMERIC(10,2) DEFAULT 0 NOT NULL;

COMMENT ON COLUMN public.user_wallets.ecosystem_credits IS 
'Crédits convertis depuis points Kwenda, utilisables uniquement dans l''écosystème (non retirables)';

-- 2. Créer table historique des conversions
CREATE TABLE IF NOT EXISTS public.points_conversion_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  points_converted INTEGER NOT NULL CHECK (points_converted > 0),
  credits_received NUMERIC(10,2) NOT NULL CHECK (credits_received > 0),
  conversion_rate NUMERIC(5,2) NOT NULL DEFAULT 10.00,
  bonus_percentage NUMERIC(5,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_points_conversion_user 
ON public.points_conversion_history(user_id, created_at DESC);

COMMENT ON TABLE public.points_conversion_history IS 
'Historique des conversions de points Kwenda en crédits écosystème';

-- 3. Fonction RPC pour convertir points en ecosystem_credits
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
  SELECT kwenda_points, ecosystem_credits INTO v_wallet
  FROM user_wallets 
  WHERE user_id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Portefeuille non trouvé';
  END IF;

  IF v_wallet.kwenda_points < p_points THEN
    RAISE EXCEPTION 'Points insuffisants: vous avez % points, % requis', 
      v_wallet.kwenda_points, p_points;
  END IF;

  -- Seuil minimum de conversion
  IF p_points < 50 THEN
    RAISE EXCEPTION 'Minimum 50 points requis pour la conversion';
  END IF;

  -- Déduire les points et ajouter les crédits écosystème
  UPDATE user_wallets
  SET 
    kwenda_points = kwenda_points - p_points,
    ecosystem_credits = ecosystem_credits + p_credits,
    updated_at = NOW()
  WHERE user_id = p_user_id;

  -- Logger la conversion
  INSERT INTO points_conversion_history (
    user_id, 
    points_converted, 
    credits_received, 
    conversion_rate, 
    bonus_percentage
  ) VALUES (
    p_user_id, 
    p_points, 
    p_credits, 
    10.00, -- 1 point = 10 CDF
    p_bonus_rate * 100
  );

  -- Logger dans activity_logs
  INSERT INTO activity_logs (
    user_id, 
    activity_type, 
    description, 
    amount, 
    currency, 
    metadata
  ) VALUES (
    p_user_id, 
    'points_conversion',
    format('Conversion de %s points en %s CDF écosystème', p_points, ROUND(p_credits)),
    p_credits,
    'CDF',
    jsonb_build_object(
      'points_converted', p_points,
      'bonus_rate', p_bonus_rate,
      'credits_before', v_wallet.ecosystem_credits,
      'credits_after', v_wallet.ecosystem_credits + p_credits
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'points_converted', p_points,
    'credits_received', p_credits,
    'bonus_applied', p_bonus_rate > 0,
    'new_points_balance', v_wallet.kwenda_points - p_points,
    'new_ecosystem_balance', v_wallet.ecosystem_credits + p_credits
  );
END;
$$;

-- 4. Mettre à jour la fonction convert_points_to_credits pour utiliser ecosystem_credits
CREATE OR REPLACE FUNCTION public.convert_points_to_credits(
  p_user_id UUID,
  p_points INTEGER,
  p_credits NUMERIC
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Rediriger vers la nouvelle fonction avec bonus 0
  PERFORM convert_kwenda_points_to_ecosystem(p_user_id, p_points, p_credits, 0);
END;
$$;

-- 5. RLS Policies pour points_conversion_history
ALTER TABLE public.points_conversion_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own conversion history"
ON public.points_conversion_history
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins view all conversion history"
ON public.points_conversion_history
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin' 
    AND is_active = true
  )
);