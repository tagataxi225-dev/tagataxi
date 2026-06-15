-- Assurer que service_configurations a tous les types de véhicules taxi
INSERT INTO public.service_configurations (
  service_type, service_category, display_name, description, 
  features, vehicle_requirements, is_active
) VALUES
  -- Moto-taxi
  (
    'taxi_moto', 'taxi', 'Moto-taxi', 
    'Transport rapide et économique par moto',
    '["Rapide", "Économique", "Idéal courtes distances"]'::jsonb,
    '{"vehicle_type": "motorcycle", "min_year": 2015}'::jsonb,
    true
  ),
  -- Éco
  (
    'taxi_eco', 'taxi', 'Éco',
    'Option économique pour vos déplacements',
    '["Économique", "Confortable", "4 passagers"]'::jsonb,
    '{"vehicle_type": "economy", "min_year": 2012}'::jsonb,
    true
  ),
  -- Confort
  (
    'taxi_confort', 'taxi', 'Confort',
    'Confort et qualité pour vos trajets',
    '["Climatisation", "Confortable", "Spacieux"]'::jsonb,
    '{"vehicle_type": "standard", "min_year": 2015}'::jsonb,
    true
  ),
  -- Premium
  (
    'taxi_premium', 'taxi', 'Premium',
    'Luxe et prestige pour une expérience unique',
    '["Véhicule haut de gamme", "Grand confort", "Service premium"]'::jsonb,
    '{"vehicle_type": "premium", "min_year": 2018}'::jsonb,
    true
  )
ON CONFLICT (service_type, service_category) 
DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  features = EXCLUDED.features,
  is_active = true,
  updated_at = now();
