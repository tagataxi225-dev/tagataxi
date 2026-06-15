-- Phase 1: Tables et vues pour système boutique partenaire location (corrigé)

-- 1.1 Table partner_rental_followers
CREATE TABLE IF NOT EXISTS partner_rental_followers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES partenaires(id) ON DELETE CASCADE,
  follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(partner_id, follower_id)
);

CREATE INDEX IF NOT EXISTS idx_rental_followers_partner ON partner_rental_followers(partner_id);
CREATE INDEX IF NOT EXISTS idx_rental_followers_follower ON partner_rental_followers(follower_id);

-- RLS pour partner_rental_followers
ALTER TABLE partner_rental_followers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view followers"
  ON partner_rental_followers FOR SELECT USING (true);

CREATE POLICY "Users can follow partners"
  ON partner_rental_followers FOR INSERT WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can unfollow"
  ON partner_rental_followers FOR DELETE USING (auth.uid() = follower_id);

-- 1.2 Ajouter rating_context à user_ratings
ALTER TABLE user_ratings ADD COLUMN IF NOT EXISTS rating_context VARCHAR(50);

-- 1.3 Améliorer rental_subscription_plans
ALTER TABLE rental_subscription_plans 
ADD COLUMN IF NOT EXISTS tier VARCHAR(20) DEFAULT 'basic',
ADD COLUMN IF NOT EXISTS max_vehicles INTEGER DEFAULT 5,
ADD COLUMN IF NOT EXISTS featured_in_homepage BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS custom_banner BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS priority_support BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS analytics_access BOOLEAN DEFAULT false;

-- Ajouter des plans par défaut (avec category_id)
DO $$
DECLARE
  v_category_id UUID;
BEGIN
  -- Récupérer une catégorie existante
  SELECT id INTO v_category_id FROM rental_vehicle_categories LIMIT 1;
  
  -- Insérer les plans
  INSERT INTO rental_subscription_plans (category_id, name, description, tier, monthly_price, currency, max_vehicles, featured_in_homepage, features, is_active) VALUES
  (v_category_id, 'Starter', 'Plan de base pour débuter', 'basic', 50000, 'CDF', 3, false, '["3 véhicules max", "Visibilité standard"]', true),
  (v_category_id, 'Pro', 'Plan professionnel pour agences', 'silver', 150000, 'CDF', 10, true, '["10 véhicules max", "Mise en avant rotation", "Badge Pro"]', true),
  (v_category_id, 'Business', 'Plan business pour grandes flottes', 'gold', 350000, 'CDF', 30, true, '["30 véhicules max", "Mise en avant prioritaire", "Banner personnalisé", "Analytics avancés"]', true),
  (v_category_id, 'Enterprise', 'Plan entreprise illimité', 'platinum', 750000, 'CDF', 100, true, '["Véhicules illimités", "Top homepage permanent", "Support prioritaire", "API access"]', true)
  ON CONFLICT DO NOTHING;
END $$;

-- 1.4 Vue matérialisée pour stats partenaires
DROP MATERIALIZED VIEW IF EXISTS partner_rental_stats;
CREATE MATERIALIZED VIEW partner_rental_stats AS
SELECT 
  p.id as partner_id,
  p.user_id,
  COUNT(DISTINCT rv.id)::int as total_vehicles,
  COUNT(DISTINCT CASE WHEN rv.is_available = true THEN rv.id END)::int as available_vehicles,
  COUNT(DISTINCT rb.id)::int as total_bookings,
  COUNT(DISTINCT CASE WHEN rb.status = 'completed' THEN rb.id END)::int as completed_bookings,
  COALESCE(AVG(CASE WHEN ur.rating_context = 'rental_partner' THEN ur.rating END), 0)::numeric as rating_average,
  COUNT(DISTINCT CASE WHEN ur.rating_context = 'rental_partner' THEN ur.id END)::int as rating_count,
  COUNT(DISTINCT prf.follower_id)::int as followers_count
FROM partenaires p
LEFT JOIN rental_vehicles rv ON rv.partner_id = p.id
LEFT JOIN rental_bookings rb ON rb.vehicle_id = rv.id
LEFT JOIN user_ratings ur ON ur.rated_user_id = p.user_id
LEFT JOIN partner_rental_followers prf ON prf.partner_id = p.id
GROUP BY p.id, p.user_id;

CREATE UNIQUE INDEX IF NOT EXISTS idx_partner_rental_stats_partner ON partner_rental_stats(partner_id);

-- Fonction pour rafraîchir les stats
CREATE OR REPLACE FUNCTION refresh_partner_rental_stats()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY partner_rental_stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ajouter colonnes à partenaires pour la boutique
ALTER TABLE partenaires 
ADD COLUMN IF NOT EXISTS banner_image TEXT,
ADD COLUMN IF NOT EXISTS slogan TEXT,
ADD COLUMN IF NOT EXISTS shop_description TEXT;

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_rental_vehicles_partner_available ON rental_vehicles(partner_id, is_available) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_user_ratings_context ON user_ratings(rating_context, rated_user_id);