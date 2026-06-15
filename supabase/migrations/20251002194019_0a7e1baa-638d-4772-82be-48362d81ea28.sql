-- Corriger les types de véhicules pour correspondre à l'interface admin
-- Mise à jour des service_type et display_name

-- Moto-taxi
UPDATE service_configurations 
SET 
  service_type = 'taxi_moto', 
  display_name = 'Moto-taxi',
  description = 'Transport rapide par moto'
WHERE service_type = 'moto' AND service_category = 'taxi';

-- Éco
UPDATE service_configurations 
SET 
  service_type = 'taxi_eco', 
  display_name = 'Éco',
  description = 'Économique et pratique'
WHERE service_type = 'eco' AND service_category = 'taxi';

-- Taxi Standard (anciennement confort)
UPDATE service_configurations 
SET 
  service_type = 'taxi_standard', 
  display_name = 'Taxi Standard',
  description = 'Service de taxi classique, confortable et abordable'
WHERE service_type = 'confort' AND service_category = 'taxi';

-- Taxi Premium
UPDATE service_configurations 
SET 
  service_type = 'taxi_premium', 
  display_name = 'Taxi Premium',
  description = 'Service de taxi haut de gamme avec véhicules de luxe'
WHERE service_type = 'premium' AND service_category = 'taxi';

-- Mettre à jour les références dans service_pricing
UPDATE service_pricing 
SET service_type = 'taxi_moto' 
WHERE service_type = 'moto';

UPDATE service_pricing 
SET service_type = 'taxi_eco' 
WHERE service_type = 'eco';

UPDATE service_pricing 
SET service_type = 'taxi_standard' 
WHERE service_type = 'confort';

UPDATE service_pricing 
SET service_type = 'taxi_premium' 
WHERE service_type = 'premium';