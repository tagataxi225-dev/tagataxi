-- Table de compensation promo pour chauffeurs/livreurs
CREATE TABLE IF NOT EXISTS public.promo_driver_compensations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promo_usage_id UUID REFERENCES public.promo_code_usage(id) ON DELETE CASCADE,
  driver_id UUID NOT NULL,
  order_id UUID NOT NULL,
  order_type TEXT NOT NULL CHECK (order_type IN ('transport', 'delivery')),
  promo_discount_amount NUMERIC NOT NULL CHECK (promo_discount_amount >= 0),
  compensation_type TEXT NOT NULL DEFAULT 'rides_credit' CHECK (compensation_type IN ('rides_credit', 'bonus_rides', 'subscription_extension')),
  rides_credited NUMERIC NOT NULL DEFAULT 0 CHECK (rides_credited >= 0),
  subscription_days_added INTEGER DEFAULT 0 CHECK (subscription_days_added >= 0),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'credited', 'failed', 'cancelled')),
  credited_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb,
  UNIQUE(promo_usage_id, driver_id)
);

-- Table de courses bonus pour chauffeurs sans abonnement
CREATE TABLE IF NOT EXISTS public.driver_bonus_rides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL,
  rides_available NUMERIC NOT NULL DEFAULT 0 CHECK (rides_available >= 0),
  total_earned NUMERIC NOT NULL DEFAULT 0 CHECK (total_earned >= 0),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(driver_id)
);

-- Table de configuration de ratios de compensation
CREATE TABLE IF NOT EXISTS public.promo_compensation_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed_amount', 'free_delivery')),
  service_type TEXT NOT NULL CHECK (service_type IN ('transport', 'delivery', 'all')),
  min_discount_threshold NUMERIC NOT NULL DEFAULT 3000 CHECK (min_discount_threshold >= 0),
  rides_per_amount NUMERIC NOT NULL DEFAULT 5000 CHECK (rides_per_amount > 0),
  max_rides_per_promo INTEGER DEFAULT 5,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(discount_type, service_type)
);

-- Insérer configurations par défaut
INSERT INTO public.promo_compensation_config (discount_type, service_type, min_discount_threshold, rides_per_amount, max_rides_per_promo)
VALUES 
  ('percentage', 'transport', 3000, 5000, 5),
  ('percentage', 'delivery', 2500, 4000, 5),
  ('fixed_amount', 'transport', 3000, 5000, 5),
  ('fixed_amount', 'delivery', 2500, 4000, 5),
  ('free_delivery', 'delivery', 2000, 3000, 3)
ON CONFLICT (discount_type, service_type) DO NOTHING;

-- Fonction pour calculer la compensation selon le ratio variable
CREATE OR REPLACE FUNCTION public.calculate_promo_driver_compensation(
  p_promo_discount_amount NUMERIC,
  p_discount_type TEXT,
  p_service_type TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_config RECORD;
  v_rides_to_credit NUMERIC;
  v_can_credit BOOLEAN := FALSE;
BEGIN
  -- Récupérer la configuration active
  SELECT * INTO v_config
  FROM public.promo_compensation_config
  WHERE discount_type = p_discount_type
    AND (service_type = p_service_type OR service_type = 'all')
    AND is_active = TRUE
  ORDER BY service_type DESC -- Priorité service spécifique
  LIMIT 1;
  
  -- Si pas de config, retour par défaut
  IF v_config IS NULL THEN
    RETURN jsonb_build_object(
      'rides_to_credit', 0,
      'can_credit', FALSE,
      'reason', 'no_config_found',
      'threshold_not_met', FALSE
    );
  END IF;
  
  -- Vérifier le seuil minimum
  IF p_promo_discount_amount < v_config.min_discount_threshold THEN
    RETURN jsonb_build_object(
      'rides_to_credit', 0,
      'can_credit', FALSE,
      'reason', 'below_threshold',
      'threshold_not_met', TRUE,
      'min_threshold', v_config.min_discount_threshold,
      'accumulated_amount', p_promo_discount_amount
    );
  END IF;
  
  -- Calculer le nombre de courses (arrondi au supérieur)
  v_rides_to_credit := LEAST(
    CEIL(p_promo_discount_amount / v_config.rides_per_amount),
    v_config.max_rides_per_promo
  );
  
  v_can_credit := v_rides_to_credit > 0;
  
  RETURN jsonb_build_object(
    'rides_to_credit', v_rides_to_credit,
    'can_credit', v_can_credit,
    'reason', 'success',
    'threshold_not_met', FALSE,
    'config_used', jsonb_build_object(
      'min_threshold', v_config.min_discount_threshold,
      'rides_per_amount', v_config.rides_per_amount,
      'max_rides', v_config.max_rides_per_promo
    )
  );
END;
$$;

-- Fonction pour créditer les courses bonus (chauffeurs sans abonnement)
CREATE OR REPLACE FUNCTION public.credit_driver_bonus_rides(
  p_driver_id UUID,
  p_rides_amount NUMERIC
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSONB;
BEGIN
  -- Insérer ou mettre à jour le bonus
  INSERT INTO public.driver_bonus_rides (driver_id, rides_available, total_earned)
  VALUES (p_driver_id, p_rides_amount, p_rides_amount)
  ON CONFLICT (driver_id)
  DO UPDATE SET
    rides_available = driver_bonus_rides.rides_available + p_rides_amount,
    total_earned = driver_bonus_rides.total_earned + p_rides_amount,
    updated_at = NOW();
  
  -- Retourner le nouveau solde
  SELECT jsonb_build_object(
    'success', TRUE,
    'rides_available', rides_available,
    'total_earned', total_earned
  ) INTO v_result
  FROM public.driver_bonus_rides
  WHERE driver_id = p_driver_id;
  
  RETURN v_result;
END;
$$;

-- RLS Policies pour promo_driver_compensations
ALTER TABLE public.promo_driver_compensations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Drivers can view their own compensations"
ON public.promo_driver_compensations
FOR SELECT
USING (auth.uid() = driver_id OR is_current_user_admin());

CREATE POLICY "Admins manage all compensations"
ON public.promo_driver_compensations
FOR ALL
USING (is_current_user_admin());

-- RLS Policies pour driver_bonus_rides
ALTER TABLE public.driver_bonus_rides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Drivers can view their own bonus rides"
ON public.driver_bonus_rides
FOR SELECT
USING (auth.uid() = driver_id OR is_current_user_admin());

CREATE POLICY "System can manage bonus rides"
ON public.driver_bonus_rides
FOR ALL
USING (is_current_user_admin());

-- RLS Policies pour promo_compensation_config
ALTER TABLE public.promo_compensation_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read active compensation config"
ON public.promo_compensation_config
FOR SELECT
USING (is_active = TRUE);

CREATE POLICY "Admins manage compensation config"
ON public.promo_compensation_config
FOR ALL
USING (is_current_user_admin());

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_promo_driver_compensations_driver_id ON public.promo_driver_compensations(driver_id);
CREATE INDEX IF NOT EXISTS idx_promo_driver_compensations_status ON public.promo_driver_compensations(status);
CREATE INDEX IF NOT EXISTS idx_promo_driver_compensations_order ON public.promo_driver_compensations(order_id, order_type);
CREATE INDEX IF NOT EXISTS idx_driver_bonus_rides_driver_id ON public.driver_bonus_rides(driver_id);