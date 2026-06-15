-- Migration simplifiée pour activer les règles de tarification transport existantes

-- Activer toutes les règles de transport pour Kinshasa
UPDATE pricing_rules
SET is_active = true
WHERE city = 'Kinshasa' 
  AND service_type = 'transport'
  AND vehicle_class IN ('moto', 'eco', 'standard', 'premium');

-- Activer les règles pour Lubumbashi
UPDATE pricing_rules
SET is_active = true
WHERE city = 'Lubumbashi'
  AND service_type = 'transport'
  AND vehicle_class IN ('moto', 'eco', 'standard', 'premium');

-- Activer les règles pour Kolwezi
UPDATE pricing_rules
SET is_active = true
WHERE city = 'Kolwezi'
  AND service_type = 'transport'
  AND vehicle_class IN ('moto', 'eco', 'standard', 'premium');

-- Activer les règles pour Abidjan
UPDATE pricing_rules
SET is_active = true
WHERE city = 'Abidjan'
  AND service_type = 'transport'
  AND vehicle_class IN ('moto', 'eco', 'standard', 'premium');