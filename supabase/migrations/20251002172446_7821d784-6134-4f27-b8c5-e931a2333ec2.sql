-- ========================================
-- PHASE 2: MIGRATION SYSTÈME D'ABONNEMENTS CHAUFFEURS (CORRIGÉ)
-- ========================================

-- 1. Modifier subscription_plans pour supporter les essais gratuits
ALTER TABLE public.subscription_plans
ADD COLUMN IF NOT EXISTS is_trial BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS trial_duration_days INTEGER DEFAULT 30,
ADD COLUMN IF NOT EXISTS rides_included INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS price_per_extra_ride NUMERIC(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS service_type TEXT DEFAULT 'transport' CHECK (service_type IN ('transport', 'delivery', 'both'));

COMMENT ON COLUMN public.subscription_plans.is_trial IS 'Indique si c''est un plan d''essai gratuit';
COMMENT ON COLUMN public.subscription_plans.trial_duration_days IS 'Durée de l''essai en jours';
COMMENT ON COLUMN public.subscription_plans.rides_included IS 'Nombre de courses incluses dans l''abonnement';
COMMENT ON COLUMN public.subscription_plans.price_per_extra_ride IS 'Prix par course supplémentaire après épuisement';

-- 2. Modifier driver_subscriptions pour gérer les courses
ALTER TABLE public.driver_subscriptions
ADD COLUMN IF NOT EXISTS rides_used INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS rides_remaining INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_trial BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS trial_granted_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS trial_granted_at TIMESTAMP WITH TIME ZONE;

COMMENT ON COLUMN public.driver_subscriptions.rides_used IS 'Nombre de courses utilisées';
COMMENT ON COLUMN public.driver_subscriptions.rides_remaining IS 'Nombre de courses restantes';
COMMENT ON COLUMN public.driver_subscriptions.is_trial IS 'Indique si c''est un abonnement d''essai';
COMMENT ON COLUMN public.driver_subscriptions.trial_granted_by IS 'Admin qui a accordé l''essai';

-- 3. Créer table subscription_ride_logs pour tracer l'utilisation
CREATE TABLE IF NOT EXISTS public.subscription_ride_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES public.driver_subscriptions(id) ON DELETE CASCADE,
  driver_id UUID NOT NULL,
  booking_id UUID,
  booking_type TEXT CHECK (booking_type IN ('transport', 'delivery')),
  rides_before INTEGER NOT NULL,
  rides_after INTEGER NOT NULL,
  extra_charge NUMERIC(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_subscription_ride_logs_subscription ON public.subscription_ride_logs(subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscription_ride_logs_driver ON public.subscription_ride_logs(driver_id);

-- RLS pour subscription_ride_logs
ALTER TABLE public.subscription_ride_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Drivers view own ride logs"
ON public.subscription_ride_logs FOR SELECT
USING (auth.uid() = driver_id);

CREATE POLICY "Admins view all ride logs"
ON public.subscription_ride_logs FOR ALL
USING (is_current_user_admin());

-- 4. Fonction pour décrémenter les courses d'un abonnement
CREATE OR REPLACE FUNCTION public.decrement_subscription_rides(
  p_driver_id UUID,
  p_booking_id UUID,
  p_booking_type TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_subscription RECORD;
  v_extra_charge NUMERIC := 0;
  v_rides_before INTEGER;
  v_rides_after INTEGER;
BEGIN
  -- Récupérer l'abonnement actif du chauffeur
  SELECT * INTO v_subscription
  FROM public.driver_subscriptions
  WHERE driver_id = p_driver_id
    AND status = 'active'
    AND start_date <= now()
    AND end_date > now()
  ORDER BY created_at DESC
  LIMIT 1;

  -- Si pas d'abonnement actif, retourner erreur
  IF v_subscription IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'No active subscription found'
    );
  END IF;

  v_rides_before := v_subscription.rides_remaining;

  -- Si plus de courses disponibles, calculer le coût supplémentaire
  IF v_subscription.rides_remaining <= 0 THEN
    -- Récupérer le prix par course supplémentaire
    SELECT price_per_extra_ride INTO v_extra_charge
    FROM public.subscription_plans
    WHERE id = v_subscription.plan_id;

    v_extra_charge := COALESCE(v_extra_charge, 0);
    v_rides_after := 0;
  ELSE
    -- Décrémenter les courses restantes
    v_rides_after := v_subscription.rides_remaining - 1;
  END IF;

  -- Mettre à jour l'abonnement
  UPDATE public.driver_subscriptions
  SET 
    rides_used = rides_used + 1,
    rides_remaining = v_rides_after,
    updated_at = now()
  WHERE id = v_subscription.id;

  -- Logger l'utilisation
  INSERT INTO public.subscription_ride_logs (
    subscription_id, driver_id, booking_id, booking_type,
    rides_before, rides_after, extra_charge
  ) VALUES (
    v_subscription.id, p_driver_id, p_booking_id, p_booking_type,
    v_rides_before, v_rides_after, v_extra_charge
  );

  RETURN jsonb_build_object(
    'success', true,
    'subscription_id', v_subscription.id,
    'rides_remaining', v_rides_after,
    'extra_charge', v_extra_charge,
    'is_trial', v_subscription.is_trial
  );
END;
$$;

-- 5. Trigger pour décrémenter automatiquement après une course
CREATE OR REPLACE FUNCTION public.after_transport_completed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSONB;
BEGIN
  -- Uniquement si la course est complétée
  IF NEW.status = 'completed' AND OLD.status != 'completed' AND NEW.driver_id IS NOT NULL THEN
    -- Décrémenter l'abonnement du chauffeur
    SELECT public.decrement_subscription_rides(
      NEW.driver_id,
      NEW.id,
      'transport'
    ) INTO v_result;

    -- Si frais supplémentaires, on pourrait les ajouter à la facture
    IF (v_result->>'extra_charge')::NUMERIC > 0 THEN
      RAISE NOTICE 'Extra charge applied: %', v_result->>'extra_charge';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Créer le trigger sur transport_bookings
DROP TRIGGER IF EXISTS trigger_after_transport_completed ON public.transport_bookings;
CREATE TRIGGER trigger_after_transport_completed
  AFTER UPDATE ON public.transport_bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.after_transport_completed();

-- Même chose pour delivery_orders
CREATE OR REPLACE FUNCTION public.after_delivery_completed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSONB;
BEGIN
  IF NEW.status = 'delivered' AND OLD.status != 'delivered' AND NEW.driver_id IS NOT NULL THEN
    SELECT public.decrement_subscription_rides(
      NEW.driver_id,
      NEW.id,
      'delivery'
    ) INTO v_result;

    IF (v_result->>'extra_charge')::NUMERIC > 0 THEN
      RAISE NOTICE 'Extra delivery charge: %', v_result->>'extra_charge';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_after_delivery_completed ON public.delivery_orders;
CREATE TRIGGER trigger_after_delivery_completed
  AFTER UPDATE ON public.delivery_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.after_delivery_completed();

-- 6. Créer plan d'essai gratuit par défaut (1 mois, 20 courses)
INSERT INTO public.subscription_plans (
  name, description, duration_type, price, currency,
  is_trial, trial_duration_days, rides_included,
  service_type, is_active
) VALUES (
  'Essai Gratuit 1 Mois',
  'Période d''essai gratuite de 30 jours avec 20 courses incluses pour débuter sur Kwenda',
  'monthly', 0, 'CDF',
  true, 30, 20,
  'transport', true
)
ON CONFLICT DO NOTHING;

-- 7. Plans payants standards
INSERT INTO public.subscription_plans (
  name, description, duration_type, price, currency,
  rides_included, price_per_extra_ride,
  service_type, is_active
) VALUES 
(
  'Pack 5 Courses',
  '5 courses valables 30 jours - Idéal pour débuter',
  'monthly', 10000, 'CDF',
  5, 2500,
  'transport', true
),
(
  'Pack 10 Courses',
  '10 courses valables 30 jours - Le plus populaire',
  'monthly', 20000, 'CDF',
  10, 2200,
  'transport', true
),
(
  'Pack 20 Courses',
  '20 courses valables 30 jours - Pour les chauffeurs actifs',
  'monthly', 35000, 'CDF',
  20, 2000,
  'transport', true
),
(
  'Pack 50 Courses',
  '50 courses valables 30 jours - Pour les professionnels',
  'monthly', 80000, 'CDF',
  50, 1800,
  'transport', true
)
ON CONFLICT DO NOTHING;