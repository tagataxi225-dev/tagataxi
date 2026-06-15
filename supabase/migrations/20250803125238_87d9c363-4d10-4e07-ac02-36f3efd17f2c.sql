-- Temporairement supprimer la contrainte FK pour créer des données de test
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_user_id_fkey;

-- Nettoyer les données existantes d'abord
DELETE FROM driver_locations;
DELETE FROM driver_profiles;
DELETE FROM marketplace_products;
DELETE FROM user_wallets;
DELETE FROM profiles;

-- Insérer des profils de test
INSERT INTO profiles (user_id, display_name, phone_number, user_type) VALUES
('11111111-1111-1111-1111-111111111111', 'Jean Mukendi', '+243970123456', 'client'),
('22222222-2222-2222-2222-222222222222', 'Marie Tshimbala', '+243970234567', 'client'),
('33333333-3333-3333-3333-333333333333', 'Patrick Ngoma', '+243970345678', 'chauffeur'),
('44444444-4444-4444-4444-444444444444', 'Grace Kabamba', '+243970456789', 'chauffeur'),
('55555555-5555-5555-5555-555555555555', 'Joseph Mulamba', '+243970567890', 'chauffeur');

-- Créer des profils de chauffeurs vérifiés
INSERT INTO driver_profiles (
  user_id, license_number, vehicle_make, vehicle_model, vehicle_year, 
  vehicle_plate, vehicle_color, vehicle_class, insurance_number, 
  license_expiry, insurance_expiry, verification_status, is_active,
  rating_average, rating_count, total_rides
) VALUES
  ('33333333-3333-3333-3333-333333333333', 'KIN123456', 'Toyota', 'Corolla', 2020, 
   'CD-1234-KIN', 'Blanc', 'standard', 'INS789012', '2026-12-31', '2025-12-31', 
   'verified', true, 4.8, 150, 145),
  ('44444444-4444-4444-4444-444444444444', 'KIN234567', 'Hyundai', 'Accent', 2021, 
   'CD-2345-KIN', 'Gris', 'standard', 'INS890123', '2027-06-30', '2025-12-31', 
   'verified', true, 4.6, 89, 85),
  ('55555555-5555-5555-5555-555555555555', 'KIN345678', 'Kia', 'Picanto', 2019, 
   'CD-3456-KIN', 'Rouge', 'economy', 'INS901234', '2026-08-15', '2025-12-31', 
   'verified', true, 4.9, 200, 195);

-- Ajouter des localisations de chauffeurs actifs
INSERT INTO driver_locations (
  driver_id, latitude, longitude, is_online, is_available, 
  vehicle_class, last_ping
) VALUES
  ('33333333-3333-3333-3333-333333333333', -4.4419, 15.2663, true, true, 'standard', now()),
  ('44444444-4444-4444-4444-444444444444', -4.4350, 15.2950, true, true, 'standard', now()),
  ('55555555-5555-5555-5555-555555555555', -4.4500, 15.2800, true, true, 'economy', now());

-- Ajouter des produits dans la marketplace
INSERT INTO marketplace_products (
  seller_id, title, description, price, category, subcategory, 
  images, condition, location, status, featured
) VALUES
  ('11111111-1111-1111-1111-111111111111', 'iPhone 13 Pro Max 256GB', 
   'iPhone 13 Pro Max en excellent état, avec chargeur et écouteurs originaux', 
   850000, 'electronique', 'smartphones', 
   '["https://images.unsplash.com/photo-1632661674596-df8be070a5c8?w=400"]', 
   'excellent', 'Gombe, Kinshasa', 'active', true),
   
  ('22222222-2222-2222-2222-222222222222', 'Robe Africaine Wax', 
   'Belle robe en tissu wax authentique, taille M, parfaite pour occasions spéciales', 
   45000, 'mode', 'femme', 
   '["https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400"]', 
   'neuf', 'Kalamu, Kinshasa', 'active', false),
   
  ('11111111-1111-1111-1111-111111111111', 'Machine à laver Samsung 7kg', 
   'Machine à laver automatique, très peu utilisée, garantie encore valide', 
   320000, 'electromenager', 'gros_electromenager', 
   '["https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400"]', 
   'excellent', 'Lemba, Kinshasa', 'active', false),
   
  ('22222222-2222-2222-2222-222222222222', 'Lot Cosmétiques Bio', 
   'Set complet de cosmétiques bio pour soin du visage, produits naturels', 
   25000, 'beaute', 'soin_visage', 
   '["https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=400"]', 
   'neuf', 'Matete, Kinshasa', 'active', true);

-- Ajouter des portefeuilles pour les utilisateurs
INSERT INTO user_wallets (user_id, balance, currency) VALUES
  ('11111111-1111-1111-1111-111111111111', 50000.00, 'CDF'),
  ('22222222-2222-2222-2222-222222222222', 75000.00, 'CDF'),
  ('33333333-3333-3333-3333-333333333333', 120000.00, 'CDF'),
  ('44444444-4444-4444-4444-444444444444', 85000.00, 'CDF'),
  ('55555555-5555-5555-5555-555555555555', 95000.00, 'CDF');