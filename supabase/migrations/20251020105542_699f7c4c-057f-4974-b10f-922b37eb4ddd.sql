-- ============================================================
-- MIGRATION TARIFS KWENDA TAXI 2025
-- Mise à jour complète des prix TRANSPORT et LIVRAISON
-- ============================================================

-- 1️⃣ TRANSPORT VTC - Mise à jour pour Kinshasa
UPDATE pricing_rules SET
  base_price = 1500,
  price_per_km = 500,
  minimum_fare = 1500,
  updated_at = now()
WHERE service_type = 'transport' 
  AND vehicle_class = 'moto' 
  AND city = 'Kinshasa'
  AND is_active = true;

UPDATE pricing_rules SET
  base_price = 2500,
  price_per_km = 1500,
  minimum_fare = 2500,
  updated_at = now()
WHERE service_type = 'transport' 
  AND vehicle_class = 'eco' 
  AND city = 'Kinshasa'
  AND is_active = true;

UPDATE pricing_rules SET
  base_price = 3200,
  price_per_km = 1800,
  minimum_fare = 3200,
  updated_at = now()
WHERE service_type = 'transport' 
  AND vehicle_class = 'standard' 
  AND city = 'Kinshasa'
  AND is_active = true;

UPDATE pricing_rules SET
  base_price = 4300,
  price_per_km = 2300,
  minimum_fare = 4300,
  updated_at = now()
WHERE service_type = 'transport' 
  AND vehicle_class = 'premium' 
  AND city = 'Kinshasa'
  AND is_active = true;

-- 2️⃣ LIVRAISON - Mise à jour pour Kinshasa
UPDATE pricing_rules SET
  base_price = 7000,
  price_per_km = 500,
  minimum_fare = 7000,
  updated_at = now()
WHERE service_type = 'delivery' 
  AND vehicle_class = 'flash' 
  AND city = 'Kinshasa'
  AND is_active = true;

UPDATE pricing_rules SET
  base_price = 55000,
  price_per_km = 2500,
  minimum_fare = 55000,
  updated_at = now()
WHERE service_type = 'delivery' 
  AND vehicle_class = 'flex' 
  AND city = 'Kinshasa'
  AND is_active = true;

UPDATE pricing_rules SET
  base_price = 100000,
  price_per_km = 5000,
  minimum_fare = 100000,
  updated_at = now()
WHERE service_type = 'delivery' 
  AND vehicle_class = 'maxicharge' 
  AND city = 'Kinshasa'
  AND is_active = true;

-- 3️⃣ LUBUMBASHI (+20% sur tarifs Kinshasa)
UPDATE pricing_rules SET
  base_price = ROUND(base_price_kinshasa * 1.2),
  price_per_km = ROUND(price_per_km_kinshasa * 1.2),
  minimum_fare = ROUND(minimum_fare_kinshasa * 1.2),
  updated_at = now()
FROM (
  SELECT 
    vehicle_class,
    service_type,
    base_price as base_price_kinshasa,
    price_per_km as price_per_km_kinshasa,
    minimum_fare as minimum_fare_kinshasa
  FROM pricing_rules
  WHERE city = 'Kinshasa' AND is_active = true
) kinshasa_prices
WHERE pricing_rules.city = 'Lubumbashi' 
  AND pricing_rules.is_active = true
  AND pricing_rules.vehicle_class = kinshasa_prices.vehicle_class
  AND pricing_rules.service_type = kinshasa_prices.service_type;

-- 4️⃣ KOLWEZI (+10% sur tarifs Kinshasa)
UPDATE pricing_rules SET
  base_price = ROUND(base_price_kinshasa * 1.1),
  price_per_km = ROUND(price_per_km_kinshasa * 1.1),
  minimum_fare = ROUND(minimum_fare_kinshasa * 1.1),
  updated_at = now()
FROM (
  SELECT 
    vehicle_class,
    service_type,
    base_price as base_price_kinshasa,
    price_per_km as price_per_km_kinshasa,
    minimum_fare as minimum_fare_kinshasa
  FROM pricing_rules
  WHERE city = 'Kinshasa' AND is_active = true
) kinshasa_prices
WHERE pricing_rules.city = 'Kolwezi' 
  AND pricing_rules.is_active = true
  AND pricing_rules.vehicle_class = kinshasa_prices.vehicle_class
  AND pricing_rules.service_type = kinshasa_prices.service_type;

-- 5️⃣ VÉRIFICATION - Afficher les nouveaux tarifs
SELECT 
  city,
  service_type,
  vehicle_class,
  base_price,
  price_per_km,
  minimum_fare,
  currency,
  is_active,
  updated_at
FROM pricing_rules
WHERE city IN ('Kinshasa', 'Lubumbashi', 'Kolwezi')
  AND is_active = true
ORDER BY city, service_type, vehicle_class;