-- ============================================
-- CORRECTION : Gestion intelligente des doublons et contraintes
-- ============================================

-- ÉTAPE 1 : Supprimer UNIQUEMENT les anciennes entrées en minuscules INACTIVES
DELETE FROM pricing_rules 
WHERE city IN ('kinshasa', 'lubumbashi', 'kolwezi')
AND service_type = 'transport'
AND is_active = false;

-- ÉTAPE 2 : Mettre à jour les entrées en minuscules ACTIVES (si elles existent)
UPDATE pricing_rules
SET city = INITCAP(city)
WHERE city IN ('kinshasa', 'lubumbashi', 'kolwezi', 'abidjan')
AND service_type = 'transport';

-- ÉTAPE 3 : Activer toutes les règles transport pour Lubumbashi
UPDATE pricing_rules 
SET is_active = true
WHERE city = 'Lubumbashi'
AND service_type = 'transport';

-- ÉTAPE 4 : Activer toutes les règles transport pour Kolwezi
UPDATE pricing_rules 
SET is_active = true
WHERE city = 'Kolwezi'
AND service_type = 'transport';

-- ÉTAPE 5 : Créer les règles manquantes pour Kolwezi (moto n'existe pas)
INSERT INTO pricing_rules (
  service_type, vehicle_class, city, 
  base_price, price_per_km, price_per_minute,
  minimum_fare, surge_multiplier, 
  waiting_fee_per_minute, free_waiting_time_minutes,
  max_waiting_time_minutes, currency, is_active
)
SELECT 
  service_type, vehicle_class, 'Kolwezi' as city,
  base_price * 1.1, price_per_km * 1.1, price_per_minute * 1.1,
  minimum_fare * 1.1, surge_multiplier,
  waiting_fee_per_minute * 1.1, free_waiting_time_minutes,
  max_waiting_time_minutes, currency, true as is_active
FROM pricing_rules
WHERE city = 'Kinshasa'
AND service_type = 'transport'
AND vehicle_class = 'moto'
AND is_active = true
ON CONFLICT DO NOTHING;

-- ÉTAPE 6 : Créer toutes les règles pour Abidjan (XOF)
INSERT INTO pricing_rules (
  service_type, vehicle_class, city, 
  base_price, price_per_km, price_per_minute,
  minimum_fare, surge_multiplier, 
  waiting_fee_per_minute, free_waiting_time_minutes,
  max_waiting_time_minutes, currency, is_active
)
SELECT 
  service_type, vehicle_class, 'Abidjan' as city,
  base_price, price_per_km, price_per_minute,
  minimum_fare, surge_multiplier,
  waiting_fee_per_minute, free_waiting_time_minutes,
  max_waiting_time_minutes, 'XOF' as currency, true as is_active
FROM pricing_rules
WHERE city = 'Kinshasa'
AND service_type = 'transport'
AND vehicle_class IN ('eco', 'standard', 'premium', 'moto')
AND is_active = true
ON CONFLICT DO NOTHING;

-- ============================================
-- FONCTIONS RPC POUR AUTOMATISATION FUTURE
-- ============================================

-- Fonction pour activer automatiquement tous les services transport
CREATE OR REPLACE FUNCTION activate_transport_services_all_cities()
RETURNS TABLE (
  city text,
  services_activated integer
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  city_record RECORD;
  activated_count integer;
BEGIN
  FOR city_record IN 
    SELECT DISTINCT unnest(ARRAY['Kinshasa', 'Lubumbashi', 'Kolwezi', 'Abidjan']) as city_name
  LOOP
    UPDATE pricing_rules
    SET is_active = true
    WHERE pricing_rules.city = city_record.city_name
    AND service_type = 'transport';
    
    GET DIAGNOSTICS activated_count = ROW_COUNT;
    
    city := city_record.city_name;
    services_activated := activated_count;
    RETURN NEXT;
  END LOOP;
  
  RETURN;
END;
$$;

-- Fonction pour obtenir le multiplicateur de prix par ville
CREATE OR REPLACE FUNCTION get_city_price_multiplier(city_name text)
RETURNS numeric
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  RETURN CASE city_name
    WHEN 'Lubumbashi' THEN 1.2
    WHEN 'Kolwezi' THEN 1.1
    WHEN 'Abidjan' THEN 1.0
    ELSE 1.0
  END;
END;
$$;