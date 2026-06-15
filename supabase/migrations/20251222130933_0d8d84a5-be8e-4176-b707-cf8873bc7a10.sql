-- =========================================
-- PHASE 1: Catégories de camions + Plans d'abonnement (CORRIGÉ V2)
-- =========================================

-- 1.1 Ajouter les nouvelles catégories de camions
INSERT INTO rental_vehicle_categories (name, description, icon_name, base_price, sort_order, is_active)
SELECT 'Camion Léger', 'Camions 3.5T à 7.5T pour livraisons urbaines', 'Truck', 400000, 8, true
WHERE NOT EXISTS (SELECT 1 FROM rental_vehicle_categories WHERE name = 'Camion Léger');

INSERT INTO rental_vehicle_categories (name, description, icon_name, base_price, sort_order, is_active)
SELECT 'Camion Moyen', 'Camions 7.5T à 16T pour transport régional', 'Truck', 700000, 9, true
WHERE NOT EXISTS (SELECT 1 FROM rental_vehicle_categories WHERE name = 'Camion Moyen');

INSERT INTO rental_vehicle_categories (name, description, icon_name, base_price, sort_order, is_active)
SELECT 'Camion Lourd', 'Camions 16T+ pour transport longue distance', 'Truck', 1200000, 10, true
WHERE NOT EXISTS (SELECT 1 FROM rental_vehicle_categories WHERE name = 'Camion Lourd');

INSERT INTO rental_vehicle_categories (name, description, icon_name, base_price, sort_order, is_active)
SELECT 'Semi-Remorque', 'Semi-remorques pour transport de marchandises lourdes', 'Truck', 1800000, 11, true
WHERE NOT EXISTS (SELECT 1 FROM rental_vehicle_categories WHERE name = 'Semi-Remorque');

INSERT INTO rental_vehicle_categories (name, description, icon_name, base_price, sort_order, is_active)
SELECT 'Camion Spécial', 'Camions frigorifiques, citernes, bennes', 'Truck', 2500000, 12, true
WHERE NOT EXISTS (SELECT 1 FROM rental_vehicle_categories WHERE name = 'Camion Spécial');

-- 1.2 Ajouter colonnes à rental_vehicles pour les camions
ALTER TABLE rental_vehicles 
  ADD COLUMN IF NOT EXISTS tonnage_min DECIMAL(6,2),
  ADD COLUMN IF NOT EXISTS tonnage_max DECIMAL(6,2),
  ADD COLUMN IF NOT EXISTS truck_type TEXT,
  ADD COLUMN IF NOT EXISTS loading_capacity_m3 DECIMAL(6,2),
  ADD COLUMN IF NOT EXISTS has_refrigeration BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS has_hydraulic_lift BOOLEAN DEFAULT false;

-- 1.3 Ajouter colonne vehicle_id à partner_rental_subscriptions
ALTER TABLE partner_rental_subscriptions 
  ADD COLUMN IF NOT EXISTS vehicle_id UUID REFERENCES rental_vehicles(id) ON DELETE CASCADE;

-- 1.4 Créer index pour performance
CREATE INDEX IF NOT EXISTS idx_rental_vehicles_tonnage ON rental_vehicles(tonnage_min, tonnage_max) WHERE tonnage_min IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_rental_vehicles_truck_type ON rental_vehicles(truck_type) WHERE truck_type IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_partner_rental_subs_vehicle ON partner_rental_subscriptions(vehicle_id) WHERE vehicle_id IS NOT NULL;

-- 1.5 Plans d'abonnement pour les nouvelles catégories de camions (avec bons noms de colonnes)
-- Camion Léger
INSERT INTO rental_subscription_plans (name, description, vehicle_category, tier_name, monthly_price, currency,
  max_vehicles, max_photos, priority_support, featured_listing, analytics_access, is_active, visibility_boost, priority_level, badge_type)
SELECT 'Camion Léger Basic', 'Plan Basic pour camions légers', 'Camion Léger', 'BASIC', 60000, 'CDF',
  3, 10, false, false, false, true, 1, 1, 'Nouveau Partenaire'
WHERE NOT EXISTS (SELECT 1 FROM rental_subscription_plans WHERE vehicle_category = 'Camion Léger' AND tier_name = 'BASIC');

INSERT INTO rental_subscription_plans (name, description, vehicle_category, tier_name, monthly_price, currency,
  max_vehicles, max_photos, priority_support, featured_listing, analytics_access, is_active, visibility_boost, priority_level, badge_type)
SELECT 'Camion Léger Silver', 'Plan Silver pour camions légers', 'Camion Léger', 'SILVER', 120000, 'CDF',
  10, 20, true, true, false, true, 2, 2, 'Partenaire Pro'
WHERE NOT EXISTS (SELECT 1 FROM rental_subscription_plans WHERE vehicle_category = 'Camion Léger' AND tier_name = 'SILVER');

INSERT INTO rental_subscription_plans (name, description, vehicle_category, tier_name, monthly_price, currency,
  max_vehicles, max_photos, priority_support, featured_listing, analytics_access, is_active, visibility_boost, priority_level, badge_type, video_allowed)
SELECT 'Camion Léger Gold', 'Plan Gold pour camions légers', 'Camion Léger', 'GOLD', 200000, 'CDF',
  30, 999, true, true, true, true, 5, 3, 'Partenaire Gold', true
WHERE NOT EXISTS (SELECT 1 FROM rental_subscription_plans WHERE vehicle_category = 'Camion Léger' AND tier_name = 'GOLD');

INSERT INTO rental_subscription_plans (name, description, vehicle_category, tier_name, monthly_price, currency,
  max_vehicles, max_photos, priority_support, featured_listing, analytics_access, is_active, visibility_boost, priority_level, badge_type, video_allowed, api_access, custom_branding)
SELECT 'Camion Léger Platinum', 'Plan Platinum pour camions légers', 'Camion Léger', 'PLATINUM', 350000, 'CDF',
  -1, 999, true, true, true, true, 10, 4, 'Partenaire Platinum', true, true, true
WHERE NOT EXISTS (SELECT 1 FROM rental_subscription_plans WHERE vehicle_category = 'Camion Léger' AND tier_name = 'PLATINUM');

-- Camion Moyen
INSERT INTO rental_subscription_plans (name, description, vehicle_category, tier_name, monthly_price, currency,
  max_vehicles, max_photos, priority_support, featured_listing, analytics_access, is_active, visibility_boost, priority_level, badge_type)
SELECT 'Camion Moyen Basic', 'Plan Basic pour camions moyens', 'Camion Moyen', 'BASIC', 100000, 'CDF',
  3, 10, false, false, false, true, 1, 1, 'Nouveau Partenaire'
WHERE NOT EXISTS (SELECT 1 FROM rental_subscription_plans WHERE vehicle_category = 'Camion Moyen' AND tier_name = 'BASIC');

INSERT INTO rental_subscription_plans (name, description, vehicle_category, tier_name, monthly_price, currency,
  max_vehicles, max_photos, priority_support, featured_listing, analytics_access, is_active, visibility_boost, priority_level, badge_type)
SELECT 'Camion Moyen Silver', 'Plan Silver pour camions moyens', 'Camion Moyen', 'SILVER', 180000, 'CDF',
  10, 20, true, true, false, true, 2, 2, 'Partenaire Pro'
WHERE NOT EXISTS (SELECT 1 FROM rental_subscription_plans WHERE vehicle_category = 'Camion Moyen' AND tier_name = 'SILVER');

INSERT INTO rental_subscription_plans (name, description, vehicle_category, tier_name, monthly_price, currency,
  max_vehicles, max_photos, priority_support, featured_listing, analytics_access, is_active, visibility_boost, priority_level, badge_type, video_allowed)
SELECT 'Camion Moyen Gold', 'Plan Gold pour camions moyens', 'Camion Moyen', 'GOLD', 300000, 'CDF',
  30, 999, true, true, true, true, 5, 3, 'Partenaire Gold', true
WHERE NOT EXISTS (SELECT 1 FROM rental_subscription_plans WHERE vehicle_category = 'Camion Moyen' AND tier_name = 'GOLD');

INSERT INTO rental_subscription_plans (name, description, vehicle_category, tier_name, monthly_price, currency,
  max_vehicles, max_photos, priority_support, featured_listing, analytics_access, is_active, visibility_boost, priority_level, badge_type, video_allowed, api_access, custom_branding)
SELECT 'Camion Moyen Platinum', 'Plan Platinum pour camions moyens', 'Camion Moyen', 'PLATINUM', 500000, 'CDF',
  -1, 999, true, true, true, true, 10, 4, 'Partenaire Platinum', true, true, true
WHERE NOT EXISTS (SELECT 1 FROM rental_subscription_plans WHERE vehicle_category = 'Camion Moyen' AND tier_name = 'PLATINUM');

-- Camion Lourd
INSERT INTO rental_subscription_plans (name, description, vehicle_category, tier_name, monthly_price, currency,
  max_vehicles, max_photos, priority_support, featured_listing, analytics_access, is_active, visibility_boost, priority_level, badge_type)
SELECT 'Camion Lourd Basic', 'Plan Basic pour camions lourds', 'Camion Lourd', 'BASIC', 150000, 'CDF',
  3, 10, false, false, false, true, 1, 1, 'Nouveau Partenaire'
WHERE NOT EXISTS (SELECT 1 FROM rental_subscription_plans WHERE vehicle_category = 'Camion Lourd' AND tier_name = 'BASIC');

INSERT INTO rental_subscription_plans (name, description, vehicle_category, tier_name, monthly_price, currency,
  max_vehicles, max_photos, priority_support, featured_listing, analytics_access, is_active, visibility_boost, priority_level, badge_type)
SELECT 'Camion Lourd Silver', 'Plan Silver pour camions lourds', 'Camion Lourd', 'SILVER', 280000, 'CDF',
  10, 20, true, true, false, true, 2, 2, 'Partenaire Pro'
WHERE NOT EXISTS (SELECT 1 FROM rental_subscription_plans WHERE vehicle_category = 'Camion Lourd' AND tier_name = 'SILVER');

INSERT INTO rental_subscription_plans (name, description, vehicle_category, tier_name, monthly_price, currency,
  max_vehicles, max_photos, priority_support, featured_listing, analytics_access, is_active, visibility_boost, priority_level, badge_type, video_allowed)
SELECT 'Camion Lourd Gold', 'Plan Gold pour camions lourds', 'Camion Lourd', 'GOLD', 450000, 'CDF',
  30, 999, true, true, true, true, 5, 3, 'Partenaire Gold', true
WHERE NOT EXISTS (SELECT 1 FROM rental_subscription_plans WHERE vehicle_category = 'Camion Lourd' AND tier_name = 'GOLD');

INSERT INTO rental_subscription_plans (name, description, vehicle_category, tier_name, monthly_price, currency,
  max_vehicles, max_photos, priority_support, featured_listing, analytics_access, is_active, visibility_boost, priority_level, badge_type, video_allowed, api_access, custom_branding)
SELECT 'Camion Lourd Platinum', 'Plan Platinum pour camions lourds', 'Camion Lourd', 'PLATINUM', 750000, 'CDF',
  -1, 999, true, true, true, true, 10, 4, 'Partenaire Platinum', true, true, true
WHERE NOT EXISTS (SELECT 1 FROM rental_subscription_plans WHERE vehicle_category = 'Camion Lourd' AND tier_name = 'PLATINUM');

-- Semi-Remorque
INSERT INTO rental_subscription_plans (name, description, vehicle_category, tier_name, monthly_price, currency,
  max_vehicles, max_photos, priority_support, featured_listing, analytics_access, is_active, visibility_boost, priority_level, badge_type)
SELECT 'Semi-Remorque Basic', 'Plan Basic pour semi-remorques', 'Semi-Remorque', 'BASIC', 200000, 'CDF',
  2, 10, false, false, false, true, 1, 1, 'Nouveau Partenaire'
WHERE NOT EXISTS (SELECT 1 FROM rental_subscription_plans WHERE vehicle_category = 'Semi-Remorque' AND tier_name = 'BASIC');

INSERT INTO rental_subscription_plans (name, description, vehicle_category, tier_name, monthly_price, currency,
  max_vehicles, max_photos, priority_support, featured_listing, analytics_access, is_active, visibility_boost, priority_level, badge_type)
SELECT 'Semi-Remorque Silver', 'Plan Silver pour semi-remorques', 'Semi-Remorque', 'SILVER', 380000, 'CDF',
  8, 20, true, true, false, true, 2, 2, 'Partenaire Pro'
WHERE NOT EXISTS (SELECT 1 FROM rental_subscription_plans WHERE vehicle_category = 'Semi-Remorque' AND tier_name = 'SILVER');

INSERT INTO rental_subscription_plans (name, description, vehicle_category, tier_name, monthly_price, currency,
  max_vehicles, max_photos, priority_support, featured_listing, analytics_access, is_active, visibility_boost, priority_level, badge_type, video_allowed)
SELECT 'Semi-Remorque Gold', 'Plan Gold pour semi-remorques', 'Semi-Remorque', 'GOLD', 600000, 'CDF',
  25, 999, true, true, true, true, 5, 3, 'Partenaire Gold', true
WHERE NOT EXISTS (SELECT 1 FROM rental_subscription_plans WHERE vehicle_category = 'Semi-Remorque' AND tier_name = 'GOLD');

INSERT INTO rental_subscription_plans (name, description, vehicle_category, tier_name, monthly_price, currency,
  max_vehicles, max_photos, priority_support, featured_listing, analytics_access, is_active, visibility_boost, priority_level, badge_type, video_allowed, api_access, custom_branding)
SELECT 'Semi-Remorque Platinum', 'Plan Platinum pour semi-remorques', 'Semi-Remorque', 'PLATINUM', 1000000, 'CDF',
  -1, 999, true, true, true, true, 10, 4, 'Partenaire Platinum', true, true, true
WHERE NOT EXISTS (SELECT 1 FROM rental_subscription_plans WHERE vehicle_category = 'Semi-Remorque' AND tier_name = 'PLATINUM');

-- Camion Spécial
INSERT INTO rental_subscription_plans (name, description, vehicle_category, tier_name, monthly_price, currency,
  max_vehicles, max_photos, priority_support, featured_listing, analytics_access, is_active, visibility_boost, priority_level, badge_type)
SELECT 'Camion Spécial Basic', 'Plan Basic pour camions spéciaux', 'Camion Spécial', 'BASIC', 250000, 'CDF',
  2, 10, false, false, false, true, 1, 1, 'Nouveau Partenaire'
WHERE NOT EXISTS (SELECT 1 FROM rental_subscription_plans WHERE vehicle_category = 'Camion Spécial' AND tier_name = 'BASIC');

INSERT INTO rental_subscription_plans (name, description, vehicle_category, tier_name, monthly_price, currency,
  max_vehicles, max_photos, priority_support, featured_listing, analytics_access, is_active, visibility_boost, priority_level, badge_type)
SELECT 'Camion Spécial Silver', 'Plan Silver pour camions spéciaux', 'Camion Spécial', 'SILVER', 450000, 'CDF',
  8, 20, true, true, false, true, 2, 2, 'Partenaire Pro'
WHERE NOT EXISTS (SELECT 1 FROM rental_subscription_plans WHERE vehicle_category = 'Camion Spécial' AND tier_name = 'SILVER');

INSERT INTO rental_subscription_plans (name, description, vehicle_category, tier_name, monthly_price, currency,
  max_vehicles, max_photos, priority_support, featured_listing, analytics_access, is_active, visibility_boost, priority_level, badge_type, video_allowed)
SELECT 'Camion Spécial Gold', 'Plan Gold pour camions spéciaux', 'Camion Spécial', 'GOLD', 800000, 'CDF',
  25, 999, true, true, true, true, 5, 3, 'Partenaire Gold', true
WHERE NOT EXISTS (SELECT 1 FROM rental_subscription_plans WHERE vehicle_category = 'Camion Spécial' AND tier_name = 'GOLD');

INSERT INTO rental_subscription_plans (name, description, vehicle_category, tier_name, monthly_price, currency,
  max_vehicles, max_photos, priority_support, featured_listing, analytics_access, is_active, visibility_boost, priority_level, badge_type, video_allowed, api_access, custom_branding)
SELECT 'Camion Spécial Platinum', 'Plan Platinum pour camions spéciaux', 'Camion Spécial', 'PLATINUM', 1500000, 'CDF',
  -1, 999, true, true, true, true, 10, 4, 'Partenaire Platinum', true, true, true
WHERE NOT EXISTS (SELECT 1 FROM rental_subscription_plans WHERE vehicle_category = 'Camion Spécial' AND tier_name = 'PLATINUM');

-- 1.6 Fonction pour vérifier l'abonnement d'un véhicule
CREATE OR REPLACE FUNCTION check_vehicle_has_active_subscription(p_vehicle_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  has_subscription BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM partner_rental_subscriptions prs
    WHERE prs.vehicle_id = p_vehicle_id
    AND prs.status = 'active'
    AND prs.end_date > NOW()
  ) INTO has_subscription;
  
  RETURN has_subscription;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 1.7 Trigger pour désactiver véhicule quand abonnement expire
CREATE OR REPLACE FUNCTION on_subscription_expiry()
RETURNS TRIGGER AS $$
BEGIN
  IF (NEW.status = 'expired' OR (NEW.end_date < NOW() AND OLD.status = 'active')) THEN
    IF NEW.vehicle_id IS NOT NULL THEN
      UPDATE rental_vehicles 
      SET is_active = false 
      WHERE id = NEW.vehicle_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_subscription_expiry ON partner_rental_subscriptions;
CREATE TRIGGER trigger_subscription_expiry
  AFTER UPDATE ON partner_rental_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION on_subscription_expiry();