-- Phase 4 & 5: Commission Deprecation + Advanced Subscription Management

-- 1. Ajouter flag deprecated aux tables de commissions
ALTER TABLE commission_settings 
ADD COLUMN IF NOT EXISTS deprecated BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS deprecated_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS deprecation_reason TEXT;

ALTER TABLE commission_configuration
ADD COLUMN IF NOT EXISTS deprecated BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS deprecated_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS deprecation_reason TEXT;

-- 2. Table de log pour la transition commission -> abonnement
CREATE TABLE IF NOT EXISTS commission_to_subscription_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL,
  old_commission_rate NUMERIC,
  new_subscription_plan_id UUID REFERENCES subscription_plans(id),
  transition_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT CHECK (status IN ('pending', 'completed', 'failed')) DEFAULT 'pending',
  migration_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour recherches rapides
CREATE INDEX IF NOT EXISTS idx_commission_log_driver 
ON commission_to_subscription_log(driver_id);

CREATE INDEX IF NOT EXISTS idx_commission_log_status 
ON commission_to_subscription_log(status);

-- 3. Table pour les alertes d'abonnement
CREATE TABLE IF NOT EXISTS subscription_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL,
  subscription_type TEXT NOT NULL CHECK (subscription_type IN ('driver', 'rental')),
  alert_type TEXT NOT NULL CHECK (alert_type IN ('expiring_soon', 'low_rides', 'expired', 'renewal_failed', 'payment_required')),
  severity TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'critical')) DEFAULT 'info',
  message TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  is_sent BOOLEAN DEFAULT false,
  sent_at TIMESTAMP WITH TIME ZONE,
  is_acknowledged BOOLEAN DEFAULT false,
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour les alertes
CREATE INDEX IF NOT EXISTS idx_subscription_alerts_subscription 
ON subscription_alerts(subscription_id, subscription_type);

CREATE INDEX IF NOT EXISTS idx_subscription_alerts_pending 
ON subscription_alerts(is_sent, created_at) 
WHERE NOT is_sent;

-- 4. Table pour l'historique des renouvellements automatiques
CREATE TABLE IF NOT EXISTS subscription_renewal_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL,
  subscription_type TEXT NOT NULL CHECK (subscription_type IN ('driver', 'rental')),
  renewal_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  old_end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  new_end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  payment_method TEXT,
  payment_status TEXT CHECK (payment_status IN ('pending', 'success', 'failed', 'retry')) DEFAULT 'pending',
  payment_reference TEXT,
  amount_charged NUMERIC,
  currency TEXT DEFAULT 'CDF',
  failure_reason TEXT,
  retry_count INTEGER DEFAULT 0,
  next_retry_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour l'historique
CREATE INDEX IF NOT EXISTS idx_renewal_history_subscription 
ON subscription_renewal_history(subscription_id, subscription_type);

CREATE INDEX IF NOT EXISTS idx_renewal_history_failed 
ON subscription_renewal_history(payment_status, next_retry_at) 
WHERE payment_status = 'failed' AND next_retry_at IS NOT NULL;

-- 5. Fonction pour créer des alertes automatiquement
CREATE OR REPLACE FUNCTION create_subscription_alert(
  p_subscription_id UUID,
  p_subscription_type TEXT,
  p_alert_type TEXT,
  p_message TEXT,
  p_severity TEXT DEFAULT 'info',
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  v_alert_id UUID;
BEGIN
  INSERT INTO subscription_alerts (
    subscription_id, subscription_type, alert_type, 
    message, severity, metadata
  ) VALUES (
    p_subscription_id, p_subscription_type, p_alert_type,
    p_message, p_severity, p_metadata
  )
  RETURNING id INTO v_alert_id;
  
  RETURN v_alert_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 6. Trigger pour alertes automatiques sur expiration proche
CREATE OR REPLACE FUNCTION check_subscription_expiration_alerts()
RETURNS TRIGGER AS $$
DECLARE
  v_days_until_expiry INTEGER;
BEGIN
  -- Calculer les jours restants
  v_days_until_expiry := EXTRACT(DAY FROM (NEW.end_date - NOW()));
  
  -- Alerte 7 jours avant expiration
  IF v_days_until_expiry <= 7 AND v_days_until_expiry > 0 AND NEW.status = 'active' THEN
    PERFORM create_subscription_alert(
      NEW.id,
      'driver',
      'expiring_soon',
      format('Votre abonnement expire dans %s jours', v_days_until_expiry),
      'warning',
      jsonb_build_object('days_remaining', v_days_until_expiry)
    );
  END IF;
  
  -- Alerte courses faibles (< 20% restantes)
  IF NEW.rides_remaining IS NOT NULL AND NEW.rides_remaining > 0 THEN
    DECLARE
      v_total_rides INTEGER;
      v_percentage NUMERIC;
    BEGIN
      SELECT rides_included INTO v_total_rides 
      FROM subscription_plans 
      WHERE id = NEW.plan_id;
      
      IF v_total_rides > 0 THEN
        v_percentage := (NEW.rides_remaining::NUMERIC / v_total_rides::NUMERIC) * 100;
        
        IF v_percentage <= 20 AND v_percentage > 0 THEN
          PERFORM create_subscription_alert(
            NEW.id,
            'driver',
            'low_rides',
            format('Il vous reste %s courses sur %s (%s%%)', 
              NEW.rides_remaining, v_total_rides, ROUND(v_percentage)),
            'warning',
            jsonb_build_object(
              'rides_remaining', NEW.rides_remaining,
              'total_rides', v_total_rides,
              'percentage', ROUND(v_percentage, 2)
            )
          );
        END IF;
      END IF;
    END;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_check_subscription_alerts
  AFTER UPDATE ON driver_subscriptions
  FOR EACH ROW
  WHEN (OLD.end_date IS DISTINCT FROM NEW.end_date OR 
        OLD.rides_remaining IS DISTINCT FROM NEW.rides_remaining)
  EXECUTE FUNCTION check_subscription_expiration_alerts();

-- 7. RLS pour les nouvelles tables
ALTER TABLE commission_to_subscription_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_renewal_history ENABLE ROW LEVEL SECURITY;

-- Policies pour commission_log (admin seulement)
CREATE POLICY commission_log_admin_all
  ON commission_to_subscription_log
  FOR ALL
  USING (is_current_user_admin());

-- Policies pour subscription_alerts (chauffeurs voient leurs alertes, admins tout)
CREATE POLICY subscription_alerts_driver_view
  ON subscription_alerts
  FOR SELECT
  USING (
    subscription_type = 'driver' AND 
    subscription_id IN (
      SELECT id FROM driver_subscriptions WHERE driver_id = auth.uid()
    )
  );

CREATE POLICY subscription_alerts_admin_all
  ON subscription_alerts
  FOR ALL
  USING (is_current_user_admin());

-- Policies pour renewal_history (chauffeurs voient leur historique, admins tout)
CREATE POLICY renewal_history_driver_view
  ON subscription_renewal_history
  FOR SELECT
  USING (
    subscription_type = 'driver' AND 
    subscription_id IN (
      SELECT id FROM driver_subscriptions WHERE driver_id = auth.uid()
    )
  );

CREATE POLICY renewal_history_admin_all
  ON subscription_renewal_history
  FOR ALL
  USING (is_current_user_admin());