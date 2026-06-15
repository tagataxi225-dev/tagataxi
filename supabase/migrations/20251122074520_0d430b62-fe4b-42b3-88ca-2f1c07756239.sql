-- ============================================
-- PHASE 3: AMÉLIORATION SYSTÈME ABONNEMENTS LOCATION (FIX)
-- ============================================

-- 1. Rendre category_id nullable (ancien système)
ALTER TABLE rental_subscription_plans 
ALTER COLUMN category_id DROP NOT NULL;

-- 2. Ajouter colonnes manquantes à rental_subscription_plans
ALTER TABLE rental_subscription_plans 
ADD COLUMN IF NOT EXISTS vehicle_category TEXT,
ADD COLUMN IF NOT EXISTS tier_name TEXT,
ADD COLUMN IF NOT EXISTS max_vehicles INTEGER DEFAULT 3,
ADD COLUMN IF NOT EXISTS max_photos INTEGER DEFAULT 10,
ADD COLUMN IF NOT EXISTS video_allowed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS support_response_time TEXT DEFAULT '24-48h',
ADD COLUMN IF NOT EXISTS support_level TEXT DEFAULT 'standard',
ADD COLUMN IF NOT EXISTS api_access BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS custom_branding BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS visibility_boost INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS featured_listing BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS analytics_level TEXT DEFAULT 'basic',
ADD COLUMN IF NOT EXISTS badge_type TEXT,
ADD COLUMN IF NOT EXISTS priority_level INTEGER DEFAULT 0;

-- 3. Créer table des paiements d'abonnements location
CREATE TABLE IF NOT EXISTS partner_rental_subscription_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID REFERENCES partner_rental_subscriptions(id) ON DELETE CASCADE,
  partner_id UUID NOT NULL,
  plan_id UUID REFERENCES rental_subscription_plans(id),
  amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'CDF',
  payment_method TEXT DEFAULT 'wallet',
  payment_status TEXT DEFAULT 'completed',
  transaction_reference TEXT,
  wallet_transaction_id UUID,
  payment_date TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Ajouter colonne primary_vehicle_category aux partenaires
ALTER TABLE partenaires 
ADD COLUMN IF NOT EXISTS primary_vehicle_category TEXT;

-- 5. Index pour performance
CREATE INDEX IF NOT EXISTS idx_rental_plans_category_tier 
  ON rental_subscription_plans(vehicle_category, tier_name);
  
CREATE INDEX IF NOT EXISTS idx_rental_payments_partner 
  ON partner_rental_subscription_payments(partner_id, payment_date);
  
CREATE INDEX IF NOT EXISTS idx_rental_payments_subscription 
  ON partner_rental_subscription_payments(subscription_id);

-- 6. RLS Policies pour partner_rental_subscription_payments
ALTER TABLE partner_rental_subscription_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Partners can view own payments"
  ON partner_rental_subscription_payments FOR SELECT
  USING (partner_id IN (
    SELECT id FROM partenaires WHERE user_id = auth.uid()
  ));

CREATE POLICY "Service role full access on payments"
  ON partner_rental_subscription_payments FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- 7. Améliorer RLS sur partner_rental_subscriptions
DROP POLICY IF EXISTS "Partners can view own subscriptions" ON partner_rental_subscriptions;
DROP POLICY IF EXISTS "Service role full access" ON partner_rental_subscriptions;

ALTER TABLE partner_rental_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Partners can view own rental subscriptions"
  ON partner_rental_subscriptions FOR SELECT
  USING (partner_id IN (
    SELECT id FROM partenaires WHERE user_id = auth.uid()
  ));

CREATE POLICY "Service role full access on rental subscriptions"
  ON partner_rental_subscriptions FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- 8. Fonction trigger pour auto-update updated_at
CREATE OR REPLACE FUNCTION update_rental_payment_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_rental_payment_timestamp ON partner_rental_subscription_payments;
CREATE TRIGGER trigger_update_rental_payment_timestamp
  BEFORE UPDATE ON partner_rental_subscription_payments
  FOR EACH ROW
  EXECUTE FUNCTION update_rental_payment_updated_at();

-- 9. Seed Data: Insérer les 24 plans professionnels (6 catégories × 4 tiers)
-- Supprimer les anciens plans pour repartir à zéro
TRUNCATE rental_subscription_plans CASCADE;

-- CATÉGORIE: TRICYCLE / MOTO (ECO)
INSERT INTO rental_subscription_plans (
  name, description, tier_name, vehicle_category, monthly_price, currency,
  max_vehicles, max_photos, video_allowed, support_level, support_response_time,
  api_access, custom_branding, visibility_boost, featured_listing,
  analytics_level, badge_type, priority_level, is_active, features
) VALUES
('ECO Basic', 'Plan débutant pour tricycles et motos', 'BASIC', 'ECO', 30000, 'CDF',
 3, 10, false, 'standard', '24-48h',
 false, false, 1, false,
 'basic', 'Nouveau Partenaire', 1, true,
 '{"visibilite":"standard","support":"24-48h","stats":"basiques"}'::jsonb),

('ECO Silver', 'Plan professionnel pour tricycles et motos', 'SILVER', 'ECO', 80000, 'CDF',
 10, 20, false, 'prioritaire', '12-24h',
 false, false, 2, true,
 'detailed', 'Partenaire Pro', 2, true,
 '{"visibilite":"rotation_homepage","support":"12-24h","stats":"detaillees","boost":"2x"}'::jsonb),

('ECO Gold', 'Plan business pour tricycles et motos', 'GOLD', 'ECO', 200000, 'CDF',
 30, 999, true, 'vip', '2-6h',
 false, true, 5, true,
 'advanced', 'Partenaire Gold', 3, true,
 '{"visibilite":"featured_permanent","support":"2-6h","stats":"avancees","boost":"5x","banner":"custom"}'::jsonb),

('ECO Platinum', 'Plan entreprise pour tricycles et motos', 'PLATINUM', 'ECO', 500000, 'CDF',
 100, 999, true, '24/7', 'immediate',
 true, true, 10, true,
 'enterprise', 'Partenaire Platinum', 4, true,
 '{"visibilite":"priorite_absolue","support":"24/7_dedie","stats":"enterprise","api":"privee","marketing":"inclus"}'::jsonb),

-- CATÉGORIE: BERLINE STANDARD
('Berline Basic', 'Plan débutant pour berlines', 'BASIC', 'BERLINE', 40000, 'CDF',
 3, 10, false, 'standard', '24-48h',
 false, false, 1, false,
 'basic', 'Nouveau Partenaire', 1, true,
 '{"visibilite":"standard","support":"24-48h","stats":"basiques"}'::jsonb),

('Berline Silver', 'Plan professionnel pour berlines', 'SILVER', 'BERLINE', 100000, 'CDF',
 10, 20, false, 'prioritaire', '12-24h',
 false, false, 2, true,
 'detailed', 'Partenaire Pro', 2, true,
 '{"visibilite":"rotation_homepage","support":"12-24h","stats":"detaillees","boost":"2x"}'::jsonb),

('Berline Gold', 'Plan business pour berlines', 'GOLD', 'BERLINE', 250000, 'CDF',
 30, 999, true, 'vip', '2-6h',
 false, true, 5, true,
 'advanced', 'Partenaire Gold', 3, true,
 '{"visibilite":"featured_permanent","support":"2-6h","stats":"avancees","boost":"5x","banner":"custom"}'::jsonb),

('Berline Platinum', 'Plan entreprise pour berlines', 'PLATINUM', 'BERLINE', 600000, 'CDF',
 100, 999, true, '24/7', 'immediate',
 true, true, 10, true,
 'enterprise', 'Partenaire Platinum', 4, true,
 '{"visibilite":"priorite_absolue","support":"24/7_dedie","stats":"enterprise","api":"privee","marketing":"inclus"}'::jsonb),

-- CATÉGORIE: UTILITAIRES (NOUVEAU)
('Utilitaire Basic', 'Plan débutant pour véhicules utilitaires', 'BASIC', 'UTILITAIRES', 50000, 'CDF',
 3, 10, false, 'standard', '24-48h',
 false, false, 1, false,
 'basic', 'Nouveau Partenaire', 1, true,
 '{"visibilite":"standard","support":"24-48h","stats":"basiques"}'::jsonb),

('Utilitaire Silver', 'Plan professionnel pour véhicules utilitaires', 'SILVER', 'UTILITAIRES', 120000, 'CDF',
 10, 20, false, 'prioritaire', '12-24h',
 false, false, 2, true,
 'detailed', 'Partenaire Pro', 2, true,
 '{"visibilite":"rotation_homepage","support":"12-24h","stats":"detaillees","boost":"2x"}'::jsonb),

('Utilitaire Gold', 'Plan business pour véhicules utilitaires', 'GOLD', 'UTILITAIRES', 300000, 'CDF',
 30, 999, true, 'vip', '2-6h',
 false, true, 5, true,
 'advanced', 'Partenaire Gold', 3, true,
 '{"visibilite":"featured_permanent","support":"2-6h","stats":"avancees","boost":"5x","banner":"custom"}'::jsonb),

('Utilitaire Platinum', 'Plan entreprise pour véhicules utilitaires', 'PLATINUM', 'UTILITAIRES', 700000, 'CDF',
 100, 999, true, '24/7', 'immediate',
 true, true, 10, true,
 'enterprise', 'Partenaire Platinum', 4, true,
 '{"visibilite":"priorite_absolue","support":"24/7_dedie","stats":"enterprise","api":"privee","marketing":"inclus"}'::jsonb),

-- CATÉGORIE: SUV & 4X4 (PREMIUM)
('SUV Basic', 'Plan débutant pour SUV et 4x4', 'BASIC', 'SUV_4X4', 60000, 'CDF',
 3, 10, false, 'standard', '24-48h',
 false, false, 1, false,
 'basic', 'Nouveau Partenaire', 1, true,
 '{"visibilite":"standard","support":"24-48h","stats":"basiques"}'::jsonb),

('SUV Silver', 'Plan professionnel pour SUV et 4x4', 'SILVER', 'SUV_4X4', 150000, 'CDF',
 10, 20, false, 'prioritaire', '12-24h',
 false, false, 2, true,
 'detailed', 'Partenaire Pro', 2, true,
 '{"visibilite":"rotation_homepage","support":"12-24h","stats":"detaillees","boost":"2x"}'::jsonb),

('SUV Gold', 'Plan business pour SUV et 4x4', 'GOLD', 'SUV_4X4', 350000, 'CDF',
 30, 999, true, 'vip', '2-6h',
 false, true, 5, true,
 'advanced', 'Partenaire Gold', 3, true,
 '{"visibilite":"featured_permanent","support":"2-6h","stats":"avancees","boost":"5x","banner":"custom"}'::jsonb),

('SUV Platinum', 'Plan entreprise pour SUV et 4x4', 'PLATINUM', 'SUV_4X4', 800000, 'CDF',
 100, 999, true, '24/7', 'immediate',
 true, true, 10, true,
 'enterprise', 'Partenaire Platinum', 4, true,
 '{"visibilite":"priorite_absolue","support":"24/7_dedie","stats":"enterprise","api":"privee","marketing":"inclus"}'::jsonb),

-- CATÉGORIE: MINIBUS (TRANSPORT GROUPES)
('Minibus Basic', 'Plan débutant pour minibus', 'BASIC', 'MINIBUS', 70000, 'CDF',
 3, 10, false, 'standard', '24-48h',
 false, false, 1, false,
 'basic', 'Nouveau Partenaire', 1, true,
 '{"visibilite":"standard","support":"24-48h","stats":"basiques"}'::jsonb),

('Minibus Silver', 'Plan professionnel pour minibus', 'SILVER', 'MINIBUS', 180000, 'CDF',
 10, 20, false, 'prioritaire', '12-24h',
 false, false, 2, true,
 'detailed', 'Partenaire Pro', 2, true,
 '{"visibilite":"rotation_homepage","support":"12-24h","stats":"detaillees","boost":"2x"}'::jsonb),

('Minibus Gold', 'Plan business pour minibus', 'GOLD', 'MINIBUS', 400000, 'CDF',
 30, 999, true, 'vip', '2-6h',
 false, true, 5, true,
 'advanced', 'Partenaire Gold', 3, true,
 '{"visibilite":"featured_permanent","support":"2-6h","stats":"avancees","boost":"5x","banner":"custom"}'::jsonb),

('Minibus Platinum', 'Plan entreprise pour minibus', 'PLATINUM', 'MINIBUS', 900000, 'CDF',
 100, 999, true, '24/7', 'immediate',
 true, true, 10, true,
 'enterprise', 'Partenaire Platinum', 4, true,
 '{"visibilite":"priorite_absolue","support":"24/7_dedie","stats":"enterprise","api":"privee","marketing":"inclus"}'::jsonb),

-- CATÉGORIE: FIRST CLASS (LUXE)
('First Class Basic', 'Plan débutant pour véhicules de luxe', 'BASIC', 'FIRST_CLASS', 100000, 'CDF',
 3, 10, false, 'standard', '24-48h',
 false, false, 1, false,
 'basic', 'Nouveau Partenaire', 1, true,
 '{"visibilite":"standard","support":"24-48h","stats":"basiques"}'::jsonb),

('First Class Silver', 'Plan professionnel pour véhicules de luxe', 'SILVER', 'FIRST_CLASS', 250000, 'CDF',
 10, 20, false, 'prioritaire', '12-24h',
 false, false, 2, true,
 'detailed', 'Partenaire Pro', 2, true,
 '{"visibilite":"rotation_homepage","support":"12-24h","stats":"detaillees","boost":"2x"}'::jsonb),

('First Class Gold', 'Plan business pour véhicules de luxe', 'GOLD', 'FIRST_CLASS', 500000, 'CDF',
 30, 999, true, 'vip', '2-6h',
 false, true, 5, true,
 'advanced', 'Partenaire Gold', 3, true,
 '{"visibilite":"featured_permanent","support":"2-6h","stats":"avancees","boost":"5x","banner":"custom"}'::jsonb),

('First Class Platinum', 'Plan entreprise pour véhicules de luxe', 'PLATINUM', 'FIRST_CLASS', 1000000, 'CDF',
 100, 999, true, '24/7', 'immediate',
 true, true, 10, true,
 'enterprise', 'Partenaire Platinum', 4, true,
 '{"visibilite":"priorite_absolue","support":"24/7_dedie","stats":"enterprise","api":"privee","marketing":"inclus"}'::jsonb);