-- Corriger la migration avec les bonnes valeurs pour verification_status

-- D'abord, vérifier et corriger les contraintes
ALTER TABLE public.partenaires DROP CONSTRAINT IF EXISTS partenaires_verification_status_check;

-- Créer des partenaires de test avec le bon statut
INSERT INTO public.partenaires (
  user_id, 
  display_name, 
  phone_number, 
  email, 
  address, 
  business_type, 
  company_name, 
  commission_rate, 
  verification_status, 
  is_active
) VALUES 
  (
    gen_random_uuid(), 
    'Transport Kwenda Premium', 
    '+243900123456', 
    'premium@kwendatransport.cd', 
    'Avenue Kasavubu, Kinshasa', 
    'transport', 
    'Kwenda Premium Transport SARL', 
    15.00, 
    'verified', 
    true
  ),
  (
    gen_random_uuid(), 
    'Location Kinshasa Elite', 
    '+243900654321', 
    'elite@locationkinshasa.cd', 
    'Boulevard du 30 Juin, Kinshasa', 
    'rental', 
    'Kinshasa Elite Location SPRL', 
    12.00, 
    'verified', 
    true
  )
ON CONFLICT (user_id) DO NOTHING;

-- Créer des catégories de véhicules de base si elles n'existent pas
INSERT INTO public.rental_vehicle_categories (name, description, icon, base_price, is_active) VALUES
  ('Économique', 'Véhicules économiques pour tous les budgets', '🚗', 20000, true),
  ('Confort', 'Véhicules confortables pour vos déplacements', '🚙', 30000, true),
  ('Premium', 'Véhicules haut de gamme', '🚘', 40000, true),
  ('SUV/Familial', 'Véhicules spacieux pour familles', '🚐', 35000, true)
ON CONFLICT (name) DO NOTHING;