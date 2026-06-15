-- Nettoyer les doublons dans pricing_rules en gardant le plus récent
DELETE FROM pricing_rules
WHERE id IN (
  SELECT id FROM (
    SELECT id,
           ROW_NUMBER() OVER (
             PARTITION BY service_type, vehicle_class, city 
             ORDER BY created_at DESC
           ) as rn
    FROM pricing_rules
  ) t
  WHERE t.rn > 1
);

-- Ajouter une contrainte d'unicité sur pricing_rules
ALTER TABLE pricing_rules 
ADD CONSTRAINT pricing_rules_unique_service_vehicle_city 
UNIQUE (service_type, vehicle_class, city);

-- Synchroniser service_pricing → pricing_rules pour les types de véhicules taxi
INSERT INTO pricing_rules (
  service_type, 
  vehicle_class, 
  city, 
  base_price, 
  price_per_km, 
  minimum_fare, 
  currency, 
  is_active,
  price_per_minute,
  surge_multiplier
)
SELECT 
  'transport' as service_type,
  CASE 
    WHEN sp.service_type = 'taxi_moto' THEN 'moto'
    WHEN sp.service_type = 'taxi_eco' THEN 'eco'
    WHEN sp.service_type = 'taxi_confort' THEN 'standard'
    WHEN sp.service_type = 'taxi_premium' THEN 'premium'
    ELSE 'standard'
  END as vehicle_class,
  sp.city,
  sp.base_price,
  sp.price_per_km,
  sp.minimum_fare,
  sp.currency,
  sp.is_active,
  50.00 as price_per_minute,
  1.0 as surge_multiplier
FROM service_pricing sp
WHERE sp.service_category = 'taxi'
  AND sp.is_active = true
ON CONFLICT (service_type, vehicle_class, city) 
DO UPDATE SET
  base_price = EXCLUDED.base_price,
  price_per_km = EXCLUDED.price_per_km,
  minimum_fare = EXCLUDED.minimum_fare,
  currency = EXCLUDED.currency,
  is_active = EXCLUDED.is_active,
  updated_at = now();

-- Créer un index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_pricing_rules_transport_lookup 
ON pricing_rules(service_type, vehicle_class, city) 
WHERE service_type = 'transport' AND is_active = true;