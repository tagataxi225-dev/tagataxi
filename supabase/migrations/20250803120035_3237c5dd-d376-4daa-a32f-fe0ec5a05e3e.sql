-- Phase 1 finale: Ajouter des données de test avec les bonnes valeurs

-- Supprimer les données existantes si elles existent
DELETE FROM driver_locations WHERE driver_id IN ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444');
DELETE FROM driver_profiles WHERE user_id IN ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444');
DELETE FROM marketplace_products WHERE seller_id IN ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444');
DELETE FROM profiles WHERE user_id IN ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444');

-- Insérer les profils utilisateur avec les bonnes valeurs de user_type
INSERT INTO profiles (user_id, display_name, phone_number, user_type) VALUES 
('11111111-1111-1111-1111-111111111111', 'Jean Kabongo', '+243812345678', 'driver'),
('22222222-2222-2222-2222-222222222222', 'Marie Tshilombo', '+243823456789', 'driver'),
('33333333-3333-3333-3333-333333333333', 'Paul Mukendi', '+243834567890', 'driver'),
('44444444-4444-4444-4444-444444444444', 'Grace Nkomo', '+243845678901', 'driver');

-- Créer les profils chauffeurs
INSERT INTO driver_profiles (
  user_id,
  license_number,
  vehicle_make,
  vehicle_model,
  vehicle_year,
  vehicle_plate,
  vehicle_color,
  vehicle_class,
  insurance_number,
  license_expiry,
  insurance_expiry,
  verification_status,
  is_active,
  rating_average,
  rating_count,
  total_rides
) VALUES 
('11111111-1111-1111-1111-111111111111', 'DL001KIN', 'Toyota', 'Corolla', 2020, 'CD001ABC', 'Blanc', 'standard', 'INS001', '2025-12-31', '2025-06-30', 'verified', true, 4.8, 150, 450),
('22222222-2222-2222-2222-222222222222', 'DL002KIN', 'Hyundai', 'Accent', 2019, 'CD002DEF', 'Bleu', 'standard', 'INS002', '2025-11-15', '2025-05-20', 'verified', true, 4.9, 200, 680),
('33333333-3333-3333-3333-333333333333', 'DL003KIN', 'Nissan', 'Sunny', 2021, 'CD003GHI', 'Rouge', 'standard', 'INS003', '2026-01-10', '2025-08-15', 'verified', true, 4.7, 95, 320),
('44444444-4444-4444-4444-444444444444', 'DL004KIN', 'Kia', 'Picanto', 2018, 'CD004JKL', 'Noir', 'economy', 'INS004', '2025-09-30', '2025-04-25', 'verified', true, 4.6, 80, 250);

-- Ajouter les positions GPS des chauffeurs dans Kinshasa
INSERT INTO driver_locations (
  driver_id,
  latitude,
  longitude,
  is_online,
  is_available,
  vehicle_class,
  last_ping
) VALUES 
('11111111-1111-1111-1111-111111111111', -4.3297, 15.3072, true, true, 'standard', now()),
('22222222-2222-2222-2222-222222222222', -4.3867, 15.2867, true, true, 'standard', now()),
('33333333-3333-3333-3333-333333333333', -4.4144, 15.2567, true, true, 'standard', now()),
('44444444-4444-4444-4444-444444444444', -4.3567, 15.2372, true, true, 'economy', now());

-- Ajouter des produits marketplace
INSERT INTO marketplace_products (
  seller_id,
  title,
  description,
  price,
  category,
  subcategory,
  condition,
  location,
  coordinates,
  images,
  status,
  featured
) VALUES 
('11111111-1111-1111-1111-111111111111', 'Samsung Galaxy A54', 'Téléphone Samsung Galaxy A54 en excellent état, peu utilisé. Écran intact, batterie performante.', 45000, 'Électronique', 'Téléphones', 'like_new', 'Gombe, Kinshasa', '{"lat": -4.3297, "lng": 15.3072}', '["https://images.unsplash.com/photo-1511707171634-5f897ff02aa9"]', 'active', true),
('22222222-2222-2222-2222-222222222222', 'MacBook Pro 13"', 'MacBook Pro 13 pouces, processeur M1, 8GB RAM, 256GB SSD. Parfait pour travail et études.', 120000, 'Électronique', 'Ordinateurs', 'good', 'Kalamu, Kinshasa', '{"lat": -4.3867, "lng": 15.2867}', '["https://images.unsplash.com/photo-1517336714731-489689fd1ca4"]', 'active', true),
('33333333-3333-3333-3333-333333333333', 'Costume homme', 'Costume homme élégant, taille L, parfait pour occasions spéciales. Couleur noir classique.', 8500, 'Mode', 'Vêtements homme', 'good', 'Lemba, Kinshasa', '{"lat": -4.4144, "lng": 15.2567}', '["https://images.unsplash.com/photo-1594938298603-c8148c4dae35"]', 'active', false),
('44444444-4444-4444-4444-444444444444', 'Réfrigérateur LG', 'Réfrigérateur LG 350L, économe en énergie, excellent état de fonctionnement.', 85000, 'Maison', 'Électroménager', 'good', 'Ngaliema, Kinshasa', '{"lat": -4.3567, "lng": 15.2372}', '["https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5"]', 'active', false),
('11111111-1111-1111-1111-111111111111', 'Canapé 3 places', 'Canapé confortable 3 places en tissu, couleur beige. Idéal pour salon moderne.', 25000, 'Maison', 'Meubles', 'good', 'Gombe, Kinshasa', '{"lat": -4.3297, "lng": 15.3072}', '["https://images.unsplash.com/photo-1586023492125-27b2c045efd7"]', 'active', false),
('22222222-2222-2222-2222-222222222222', 'Vélo VTT', 'Vélo VTT 26 pouces, marque Trek, peu utilisé. Parfait pour balades et sport.', 15000, 'Sport', 'Vélos', 'good', 'Kalamu, Kinshasa', '{"lat": -4.3867, "lng": 15.2867}', '["https://images.unsplash.com/photo-1544191696-15693072b5b5"]', 'active', false);