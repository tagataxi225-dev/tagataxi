-- Activer le service de location
UPDATE public.service_configurations
SET is_active = true, updated_at = now()
WHERE service_category = 'rental' AND service_type = 'rental';

-- S'assurer que la configuration existe
INSERT INTO public.service_configurations (
  service_type, service_category, display_name, description, 
  features, is_active
) VALUES (
  'rental', 'rental', 'Location de véhicules',
  'Louez un véhicule pour vos déplacements longue durée',
  '["Flexibilité", "Tarifs journaliers", "Véhicules variés"]'::jsonb,
  true
)
ON CONFLICT (service_type, service_category) 
DO UPDATE SET
  is_active = true,
  updated_at = now();