-- Phase 2: Admin Subscription Dashboard - Database Enhancements

-- Ajouter service_type aux abonnements chauffeurs
ALTER TABLE driver_subscriptions 
ADD COLUMN IF NOT EXISTS service_type TEXT 
CHECK (service_type IN ('transport', 'delivery', 'both')) 
DEFAULT 'transport';

-- Ajouter rides_remaining pour le tracking en temps réel
ALTER TABLE driver_subscriptions 
ADD COLUMN IF NOT EXISTS rides_remaining INTEGER DEFAULT 0;

-- Mettre à jour rides_remaining depuis rides_included pour les abonnements existants
UPDATE driver_subscriptions ds
SET rides_remaining = COALESCE(sp.rides_included, 0)
FROM subscription_plans sp
WHERE ds.plan_id = sp.id 
  AND ds.rides_remaining = 0
  AND ds.status = 'active';

-- Index pour optimiser les requêtes admin
CREATE INDEX IF NOT EXISTS idx_driver_subscriptions_status_service 
ON driver_subscriptions(status, service_type);

CREATE INDEX IF NOT EXISTS idx_driver_subscriptions_end_date 
ON driver_subscriptions(end_date) 
WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_driver_subscriptions_rides 
ON driver_subscriptions(rides_remaining) 
WHERE status = 'active';

-- Vue agrégée pour les statistiques par service
CREATE OR REPLACE VIEW subscription_stats_by_service AS
SELECT 
  COALESCE(ds.service_type, 'transport') as service_type,
  COUNT(*) FILTER (WHERE ds.status = 'active') as active_count,
  COUNT(*) FILTER (WHERE ds.status = 'expired') as expired_count,
  COUNT(*) FILTER (WHERE ds.status = 'cancelled') as cancelled_count,
  SUM(sp.price) FILTER (WHERE ds.status = 'active') as monthly_revenue,
  COUNT(*) FILTER (WHERE ds.status = 'active' AND ds.end_date <= NOW() + INTERVAL '7 days') as expiring_week,
  COUNT(*) FILTER (WHERE ds.status = 'active' AND ds.end_date <= NOW() + INTERVAL '30 days') as expiring_month,
  ROUND(AVG(ds.rides_remaining) FILTER (WHERE ds.status = 'active'), 2) as avg_rides_remaining,
  SUM(ds.rides_remaining) FILTER (WHERE ds.status = 'active') as total_rides_remaining
FROM driver_subscriptions ds
LEFT JOIN subscription_plans sp ON ds.plan_id = sp.id
GROUP BY COALESCE(ds.service_type, 'transport');

-- Trigger pour mettre à jour rides_remaining automatiquement
CREATE OR REPLACE FUNCTION update_rides_remaining_on_subscription()
RETURNS TRIGGER AS $$
BEGIN
  -- Si nouveau abonnement ou renouvellement, initialiser rides_remaining
  IF (TG_OP = 'INSERT' OR NEW.status = 'active') AND NEW.rides_remaining = 0 THEN
    SELECT COALESCE(rides_included, 0) INTO NEW.rides_remaining
    FROM subscription_plans
    WHERE id = NEW.plan_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_update_rides_remaining
  BEFORE INSERT OR UPDATE ON driver_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_rides_remaining_on_subscription();

-- Fonction pour décrémenter rides_remaining lors d'une course
CREATE OR REPLACE FUNCTION decrement_driver_rides(driver_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_subscription RECORD;
  v_result JSONB;
BEGIN
  -- Trouver l'abonnement actif du chauffeur
  SELECT * INTO v_subscription
  FROM driver_subscriptions
  WHERE driver_id = driver_user_id
    AND status = 'active'
    AND end_date > NOW()
    AND rides_remaining > 0
  ORDER BY end_date ASC
  LIMIT 1;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'no_active_subscription',
      'message', 'Aucun abonnement actif avec des courses restantes'
    );
  END IF;
  
  -- Décrémenter rides_remaining
  UPDATE driver_subscriptions
  SET rides_remaining = rides_remaining - 1,
      updated_at = NOW()
  WHERE id = v_subscription.id;
  
  RETURN jsonb_build_object(
    'success', true,
    'subscription_id', v_subscription.id,
    'rides_remaining', v_subscription.rides_remaining - 1,
    'plan_name', (SELECT name FROM subscription_plans WHERE id = v_subscription.plan_id)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;