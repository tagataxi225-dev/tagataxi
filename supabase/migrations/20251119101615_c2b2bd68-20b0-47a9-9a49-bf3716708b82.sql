-- ============================================
-- PHASE 1 & 2 : Codes Chauffeurs Auto + Commissions Admin (CORRIGÉ)
-- ============================================

-- 1. Ajouter colonne service_type à driver_codes
ALTER TABLE driver_codes 
ADD COLUMN IF NOT EXISTS service_type TEXT CHECK (service_type IN ('taxi', 'delivery', 'both'));

COMMENT ON COLUMN driver_codes.service_type IS 'Type de service du chauffeur (taxi=VTC, delivery=livraison)';

-- Index pour filtrage rapide par service_type
CREATE INDEX IF NOT EXISTS idx_driver_codes_service_type ON driver_codes(service_type);

-- Mettre à jour les codes existants avec le service_type depuis chauffeurs table
UPDATE driver_codes dc
SET service_type = CASE 
  WHEN c.service_type = 'taxi' THEN 'taxi'
  WHEN c.service_type = 'delivery' THEN 'delivery'
  WHEN c.service_type = 'moto_taxi' THEN 'taxi'
  ELSE 'taxi' -- Valeur par défaut pour anciens chauffeurs
END
FROM chauffeurs c
WHERE dc.driver_id = c.user_id 
  AND dc.service_type IS NULL;

-- 2. Créer la table admin_subscription_earnings pour tracking des revenus admin
CREATE TABLE IF NOT EXISTS admin_subscription_earnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID REFERENCES driver_subscriptions(id) ON DELETE CASCADE NOT NULL,
  driver_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  subscription_amount DECIMAL(10,2) NOT NULL,
  admin_commission_rate DECIMAL(5,2) NOT NULL DEFAULT 10.0,
  admin_commission_amount DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'paid' CHECK (status IN ('pending', 'paid', 'cancelled')),
  wallet_transaction_id UUID REFERENCES wallet_transactions(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_admin_sub_earnings_subscription ON admin_subscription_earnings(subscription_id);
CREATE INDEX IF NOT EXISTS idx_admin_sub_earnings_driver ON admin_subscription_earnings(driver_id);
CREATE INDEX IF NOT EXISTS idx_admin_sub_earnings_status ON admin_subscription_earnings(status);
CREATE INDEX IF NOT EXISTS idx_admin_sub_earnings_created ON admin_subscription_earnings(created_at DESC);

-- Trigger pour update automatique de updated_at
CREATE OR REPLACE FUNCTION update_admin_subscription_earnings_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_admin_subscription_earnings_timestamp
BEFORE UPDATE ON admin_subscription_earnings
FOR EACH ROW
EXECUTE FUNCTION update_admin_subscription_earnings_timestamp();

-- RLS pour admin_subscription_earnings (visible seulement par les admins)
ALTER TABLE admin_subscription_earnings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all subscription earnings"
ON admin_subscription_earnings FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM admins
    WHERE admins.user_id = auth.uid()
    AND admins.is_active = true
  )
);

-- 3. Fonction RPC pour générer un code chauffeur unique
CREATE OR REPLACE FUNCTION generate_driver_code()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  LOOP
    -- Générer un code de 6 caractères alphanumériques majuscules
    new_code := UPPER(
      SUBSTRING(MD5(RANDOM()::TEXT || CLOCK_TIMESTAMP()::TEXT) FROM 1 FOR 6)
    );
    
    -- Vérifier si le code existe déjà
    SELECT EXISTS(
      SELECT 1 FROM driver_codes WHERE code = new_code
    ) INTO code_exists;
    
    -- Si le code n'existe pas, le retourner
    IF NOT code_exists THEN
      RETURN new_code;
    END IF;
  END LOOP;
END;
$$;

COMMENT ON FUNCTION generate_driver_code() IS 'Génère un code chauffeur unique de 6 caractères pour le système de parrainage';

-- 4. Vue matérialisée pour statistiques admin rapides
CREATE MATERIALIZED VIEW IF NOT EXISTS admin_subscription_revenue_stats AS
SELECT
  DATE_TRUNC('month', created_at) AS month,
  COUNT(*) AS subscription_count,
  SUM(subscription_amount) AS total_subscription_revenue,
  SUM(admin_commission_amount) AS total_admin_commission,
  AVG(admin_commission_rate) AS avg_commission_rate
FROM admin_subscription_earnings
WHERE status = 'paid'
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY month DESC;

CREATE UNIQUE INDEX IF NOT EXISTS idx_admin_sub_revenue_stats_month ON admin_subscription_revenue_stats(month);

-- Rafraîchir la vue
REFRESH MATERIALIZED VIEW CONCURRENTLY admin_subscription_revenue_stats;