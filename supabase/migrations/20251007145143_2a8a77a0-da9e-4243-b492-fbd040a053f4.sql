-- ========================================
-- PHASE 1: Nettoyage des données de tarification taxi (version corrigée)
-- ========================================

-- D'abord, désactiver TOUTES les règles de tarification taxi pour Kinshasa
UPDATE pricing_rules 
SET is_active = false,
    updated_at = now()
WHERE service_type = 'transport' 
  AND LOWER(city) = 'kinshasa'
  AND vehicle_class IN ('moto', 'eco', 'standard', 'premium');

-- Ensuite, mettre à jour et activer UNE SEULE règle par vehicle_class
-- Moto-taxi: Base 1500, Per km 500, Minimum 1000
WITH target_rule AS (
  SELECT id 
  FROM pricing_rules
  WHERE service_type = 'transport'
    AND LOWER(city) = 'kinshasa'
    AND vehicle_class = 'moto'
  ORDER BY created_at DESC
  LIMIT 1
)
UPDATE pricing_rules 
SET is_active = true,
    base_price = 1500,
    price_per_km = 500,
    minimum_fare = 1000,
    updated_at = now()
WHERE id IN (SELECT id FROM target_rule);

-- Éco: Base 2500, Per km 1500, Minimum 1500
WITH target_rule AS (
  SELECT id 
  FROM pricing_rules
  WHERE service_type = 'transport'
    AND LOWER(city) = 'kinshasa'
    AND vehicle_class = 'eco'
  ORDER BY created_at DESC
  LIMIT 1
)
UPDATE pricing_rules 
SET is_active = true,
    base_price = 2500,
    price_per_km = 1500,
    minimum_fare = 1500,
    updated_at = now()
WHERE id IN (SELECT id FROM target_rule);

-- Confort (standard): Base 3200, Per km 1800, Minimum 2000
WITH target_rule AS (
  SELECT id 
  FROM pricing_rules
  WHERE service_type = 'transport'
    AND LOWER(city) = 'kinshasa'
    AND vehicle_class = 'standard'
  ORDER BY created_at DESC
  LIMIT 1
)
UPDATE pricing_rules 
SET is_active = true,
    base_price = 3200,
    price_per_km = 1800,
    minimum_fare = 2000,
    updated_at = now()
WHERE id IN (SELECT id FROM target_rule);

-- Premium: Base 5000, Per km 2000, Minimum 3000
WITH target_rule AS (
  SELECT id 
  FROM pricing_rules
  WHERE service_type = 'transport'
    AND LOWER(city) = 'kinshasa'
    AND vehicle_class = 'premium'
  ORDER BY created_at DESC
  LIMIT 1
)
UPDATE pricing_rules 
SET is_active = true,
    base_price = 5000,
    price_per_km = 2000,
    minimum_fare = 3000,
    updated_at = now()
WHERE id IN (SELECT id FROM target_rule);

-- Log de l'opération
INSERT INTO activity_logs (
  user_id, activity_type, description, metadata
) VALUES (
  COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid),
  'vehicle_pricing_cleanup',
  'Nettoyage et configuration des tarifs taxi selon les standards',
  jsonb_build_object(
    'vehicles_updated', 4,
    'city', 'Kinshasa',
    'timestamp', now()
  )
);