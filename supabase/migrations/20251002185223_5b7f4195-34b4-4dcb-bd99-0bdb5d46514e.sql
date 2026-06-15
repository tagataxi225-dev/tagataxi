-- Étendre la contrainte service_category pour accepter rental, marketplace, lottery

-- Supprimer l'ancienne contrainte
ALTER TABLE public.service_configurations 
DROP CONSTRAINT IF EXISTS service_configurations_service_category_check;

-- Ajouter la nouvelle contrainte avec toutes les catégories
ALTER TABLE public.service_configurations
ADD CONSTRAINT service_configurations_service_category_check 
CHECK (service_category IN ('taxi', 'delivery', 'rental', 'marketplace', 'lottery'));

-- Faire la même chose pour service_pricing si nécessaire
ALTER TABLE public.service_pricing
DROP CONSTRAINT IF EXISTS service_pricing_service_category_check;

ALTER TABLE public.service_pricing
ADD CONSTRAINT service_pricing_service_category_check 
CHECK (service_category IN ('taxi', 'delivery', 'rental', 'marketplace', 'lottery'));

-- Ajouter les nouveaux services dans service_configurations
INSERT INTO public.service_configurations (
  service_type, service_category, display_name, description,
  requirements, features, vehicle_requirements, is_active
) VALUES
-- Service Location de Véhicules
(
  'rental',
  'rental',
  'Location de Véhicules',
  'Service de location de véhicules avec ou sans chauffeur',
  '["Documents d''identité valides", "Permis de conduire (si sans chauffeur)", "Dépôt de garantie"]'::jsonb,
  '["Location courte/longue durée", "Véhicules variés", "Avec ou sans chauffeur", "Assurance incluse"]'::jsonb,
  '{"vehicle_types": ["voiture", "van", "suv", "bus"], "documents_required": true}'::jsonb,
  true
),
-- Service Marketplace
(
  'marketplace',
  'marketplace',
  'Marketplace',
  'Plateforme d''e-commerce intégrée avec livraison',
  '["Compte vendeur vérifié", "Documents commerciaux", "Mode de paiement actif"]'::jsonb,
  '["Vente de produits", "Chat intégré", "Livraison incluse", "Paiement sécurisé"]'::jsonb,
  '{}'::jsonb,
  true
),
-- Service Loterie
(
  'lottery',
  'lottery',
  'Loterie KwendaPay',
  'Système de loterie avec tickets gratuits et récompenses',
  '["Wallet KwendaPay actif", "Profil vérifié"]'::jsonb,
  '["Tickets gratuits par action", "Tirages quotidiens", "Récompenses en crédits", "Historique transparent"]'::jsonb,
  '{}'::jsonb,
  true
);

-- Ajouter la tarification de base pour ces services
INSERT INTO public.service_pricing (
  service_type, service_category, city, base_price, price_per_km, 
  minimum_fare, commission_rate, currency, is_active
) VALUES
-- Rental - Commission de 15%
('rental', 'rental', 'Kinshasa', 0, 0, 0, 15.0, 'CDF', true),
('rental', 'rental', 'Lubumbashi', 0, 0, 0, 15.0, 'CDF', true),
('rental', 'rental', 'Kolwezi', 0, 0, 0, 15.0, 'CDF', true),
-- Marketplace - Commission de 10%
('marketplace', 'marketplace', 'Kinshasa', 0, 0, 0, 10.0, 'CDF', true),
('marketplace', 'marketplace', 'Lubumbashi', 0, 0, 0, 10.0, 'CDF', true),
('marketplace', 'marketplace', 'Kolwezi', 0, 0, 0, 10.0, 'CDF', true),
-- Lottery - Pas de commission
('lottery', 'lottery', 'Kinshasa', 0, 0, 0, 0, 'CDF', true),
('lottery', 'lottery', 'Lubumbashi', 0, 0, 0, 0, 'CDF', true),
('lottery', 'lottery', 'Kolwezi', 0, 0, 0, 0, 'CDF', true);

-- Logger l'ajout
INSERT INTO public.activity_logs (
  user_id, activity_type, description, metadata
) VALUES (
  '00000000-0000-0000-0000-000000000000'::uuid,
  'system_update',
  'Extension service_configurations: ajout Rental, Marketplace, Lottery',
  jsonb_build_object(
    'services_added', ARRAY['rental', 'marketplace', 'lottery'],
    'timestamp', now()
  )
);