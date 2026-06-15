-- ============================================
-- CORRECTION DE LA CONTRAINTE DÉFECTUEUSE
-- ============================================

-- Supprimer l'ancienne contrainte qui ne considère pas la ville
DROP INDEX IF EXISTS uq_active_pricing_rule;

-- Créer la BONNE contrainte qui inclut la ville
CREATE UNIQUE INDEX uq_active_pricing_rule_per_city 
ON pricing_rules (service_type, vehicle_class, city) 
WHERE (is_active = true);

-- Maintenant créer les services pour toutes les villes
-- LUBUMBASHI : +20%
INSERT INTO pricing_rules (
  service_type, vehicle_class, city, 
  base_price, price_per_km, price_per_minute,
  minimum_fare, surge_multiplier, 
  waiting_fee_per_minute, free_waiting_time_minutes,
  max_waiting_time_minutes, currency, is_active
)
SELECT 
  'transport', vehicle_class, 'Lubumbashi' as city,
  base_price * 1.2, price_per_km * 1.2, price_per_minute * 1.2,
  minimum_fare * 1.2, surge_multiplier,
  waiting_fee_per_minute * 1.2, free_waiting_time_minutes,
  max_waiting_time_minutes, 'CDF' as currency, true as is_active
FROM pricing_rules
WHERE city = 'Kinshasa'
AND service_type = 'transport'
AND is_active = true
ON CONFLICT (service_type, vehicle_class, city) DO UPDATE
SET is_active = true, 
    base_price = EXCLUDED.base_price,
    price_per_km = EXCLUDED.price_per_km;

-- KOLWEZI : +10%
INSERT INTO pricing_rules (
  service_type, vehicle_class, city, 
  base_price, price_per_km, price_per_minute,
  minimum_fare, surge_multiplier, 
  waiting_fee_per_minute, free_waiting_time_minutes,
  max_waiting_time_minutes, currency, is_active
)
SELECT 
  'transport', vehicle_class, 'Kolwezi' as city,
  base_price * 1.1, price_per_km * 1.1, price_per_minute * 1.1,
  minimum_fare * 1.1, surge_multiplier,
  waiting_fee_per_minute * 1.1, free_waiting_time_minutes,
  max_waiting_time_minutes, 'CDF' as currency, true as is_active
FROM pricing_rules
WHERE city = 'Kinshasa'
AND service_type = 'transport'
AND is_active = true
ON CONFLICT (service_type, vehicle_class, city) DO UPDATE
SET is_active = true,
    base_price = EXCLUDED.base_price,
    price_per_km = EXCLUDED.price_per_km;

-- ABIDJAN : XOF
INSERT INTO pricing_rules (
  service_type, vehicle_class, city, 
  base_price, price_per_km, price_per_minute,
  minimum_fare, surge_multiplier, 
  waiting_fee_per_minute, free_waiting_time_minutes,
  max_waiting_time_minutes, currency, is_active
)
SELECT 
  'transport', vehicle_class, 'Abidjan' as city,
  base_price, price_per_km, price_per_minute,
  minimum_fare, surge_multiplier,
  waiting_fee_per_minute, free_waiting_time_minutes,
  max_waiting_time_minutes, 'XOF' as currency, true as is_active
FROM pricing_rules
WHERE city = 'Kinshasa'
AND service_type = 'transport'
AND is_active = true
ON CONFLICT (service_type, vehicle_class, city) DO UPDATE
SET is_active = true,
    currency = 'XOF';