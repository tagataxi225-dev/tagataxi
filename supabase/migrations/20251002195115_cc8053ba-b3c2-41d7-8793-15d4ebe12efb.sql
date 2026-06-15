-- Migration: Renommer taxi_standard → taxi_confort et ajouter sort_order

-- Ajouter la colonne sort_order si elle n'existe pas
ALTER TABLE service_configurations 
ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- Renommer taxi_standard → taxi_confort dans service_configurations
UPDATE service_configurations 
SET service_type = 'taxi_confort',
    display_name = 'Confort',
    description = 'Service de taxi classique, confortable et abordable',
    sort_order = 3
WHERE service_type = 'taxi_standard' AND service_category = 'taxi';

-- Renommer taxi_standard → taxi_confort dans service_pricing
UPDATE service_pricing 
SET service_type = 'taxi_confort'
WHERE service_type = 'taxi_standard';

-- Mettre à jour les ordres de tri pour les véhicules taxi
UPDATE service_configurations 
SET sort_order = 1
WHERE service_type = 'taxi_moto' AND service_category = 'taxi';

UPDATE service_configurations 
SET sort_order = 2
WHERE service_type = 'taxi_eco' AND service_category = 'taxi';

UPDATE service_configurations 
SET sort_order = 4
WHERE service_type = 'taxi_premium' AND service_category = 'taxi';

-- Créer un index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_service_configurations_sort_order 
ON service_configurations(service_category, sort_order);