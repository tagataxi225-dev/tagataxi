-- Créer des chauffeurs de test fonctionnels
INSERT INTO public.chauffeurs (
  user_id, email, phone_number, display_name, 
  is_active, verification_status, vehicle_type, 
  vehicle_model, vehicle_plate, license_number,
  service_areas, rating_average, total_rides
) VALUES 
  ('550e8400-e29b-41d4-a716-446655440001', 'driver1@kwenda.test', '+243901234567', 'Jean Mukendi', 
   true, 'verified', 'moto', 'Honda CG125', 'KIN-001-AB', 'DL123456789',
   ARRAY['Kinshasa'], 4.8, 150),
  ('550e8400-e29b-41d4-a716-446655440002', 'driver2@kwenda.test', '+243901234568', 'Marie Kasongo', 
   true, 'verified', 'eco', 'Toyota Vitz', 'KIN-002-CD', 'DL987654321',
   ARRAY['Kinshasa'], 4.9, 203),
  ('550e8400-e29b-41d4-a716-446655440003', 'driver3@kwenda.test', '+243901234569', 'Paul Mbuyi', 
   true, 'verified', 'premium', 'Toyota Camry', 'KIN-003-EF', 'DL456789123',
   ARRAY['Kinshasa'], 4.7, 89),
  ('550e8400-e29b-41d4-a716-446655440004', 'driver4@kwenda.test', '+243901234570', 'Grace Ngoma', 
   true, 'verified', 'moto', 'Yamaha YBR125', 'KIN-004-GH', 'DL741852963',
   ARRAY['Kinshasa'], 4.6, 67),
  ('550e8400-e29b-41d4-a716-446655440005', 'driver5@kwenda.test', '+243901234571', 'Joseph Kabila', 
   true, 'verified', 'eco', 'Nissan March', 'KIN-005-IJ', 'DL258369147',
   ARRAY['Kinshasa'], 4.8, 134)
ON CONFLICT (user_id) DO UPDATE SET
  is_active = EXCLUDED.is_active,
  verification_status = EXCLUDED.verification_status,
  rating_average = EXCLUDED.rating_average,
  total_rides = EXCLUDED.total_rides;

-- Créer les profils chauffeurs correspondants
INSERT INTO public.driver_profiles (
  user_id, vehicle_make, vehicle_model, vehicle_year, 
  vehicle_class, vehicle_color, vehicle_plate,
  license_number, insurance_number, license_expiry,
  insurance_expiry, verification_status, is_active,
  service_type, delivery_capacity, rating_average, total_rides
) VALUES 
  ('550e8400-e29b-41d4-a716-446655440001', 'Honda', 'CG125', 2022, 
   'moto', 'Rouge', 'KIN-001-AB', 'DL123456789', 'INS001', '2025-12-31',
   '2024-12-31', 'verified', true, 'taxi', 'small', 4.8, 150),
  ('550e8400-e29b-41d4-a716-446655440002', 'Toyota', 'Vitz', 2020, 
   'eco', 'Blanc', 'KIN-002-CD', 'DL987654321', 'INS002', '2025-12-31',
   '2024-12-31', 'verified', true, 'taxi', 'medium', 4.9, 203),
  ('550e8400-e29b-41d4-a716-446655440003', 'Toyota', 'Camry', 2021, 
   'premium', 'Noir', 'KIN-003-EF', 'DL456789123', 'INS003', '2025-12-31',
   '2024-12-31', 'verified', true, 'taxi', 'large', 4.7, 89),
  ('550e8400-e29b-41d4-a716-446655440004', 'Yamaha', 'YBR125', 2023, 
   'moto', 'Bleu', 'KIN-004-GH', 'DL741852963', 'INS004', '2025-12-31',
   '2024-12-31', 'verified', true, 'delivery', 'small', 4.6, 67),
  ('550e8400-e29b-41d4-a716-446655440005', 'Nissan', 'March', 2019, 
   'eco', 'Gris', 'KIN-005-IJ', 'DL258369147', 'INS005', '2025-12-31',
   '2024-12-31', 'verified', true, 'taxi', 'medium', 4.8, 134)
ON CONFLICT (user_id) DO UPDATE SET
  verification_status = EXCLUDED.verification_status,
  is_active = EXCLUDED.is_active,
  rating_average = EXCLUDED.rating_average,
  total_rides = EXCLUDED.total_rides;

-- Positionner les chauffeurs à des endroits stratégiques de Kinshasa
INSERT INTO public.driver_locations (
  driver_id, latitude, longitude, is_online, is_available,
  vehicle_class, last_ping, accuracy
) VALUES 
  ('550e8400-e29b-41d4-a716-446655440001', -4.3217, 15.3069, true, true, 'moto', now(), 10),
  ('550e8400-e29b-41d4-a716-446655440002', -4.3150, 15.3100, true, true, 'eco', now(), 8),
  ('550e8400-e29b-41d4-a716-446655440003', -4.3300, 15.3200, true, true, 'premium', now(), 5),
  ('550e8400-e29b-41d4-a716-446655440004', -4.3400, 15.2900, true, true, 'moto', now(), 12),
  ('550e8400-e29b-41d4-a716-446655440005', -4.3100, 15.3300, true, true, 'eco', now(), 7)
ON CONFLICT (driver_id) DO UPDATE SET
  latitude = EXCLUDED.latitude,
  longitude = EXCLUDED.longitude,
  is_online = EXCLUDED.is_online,
  is_available = EXCLUDED.is_available,
  last_ping = now(),
  accuracy = EXCLUDED.accuracy;

-- Créer des préférences de service pour les chauffeurs
INSERT INTO public.driver_service_preferences (
  driver_id, service_types, vehicle_classes, preferred_zones,
  max_distance_km, is_active
) VALUES 
  ('550e8400-e29b-41d4-a716-446655440001', ARRAY['taxi', 'delivery'], ARRAY['moto'], ARRAY['Kinshasa'], 25, true),
  ('550e8400-e29b-41d4-a716-446655440002', ARRAY['taxi'], ARRAY['eco'], ARRAY['Kinshasa'], 30, true),
  ('550e8400-e29b-41d4-a716-446655440003', ARRAY['taxi'], ARRAY['premium'], ARRAY['Kinshasa'], 40, true),
  ('550e8400-e29b-41d4-a716-446655440004', ARRAY['delivery'], ARRAY['moto'], ARRAY['Kinshasa'], 20, true),
  ('550e8400-e29b-41d4-a716-446655440005', ARRAY['taxi', 'delivery'], ARRAY['eco'], ARRAY['Kinshasa'], 35, true)
ON CONFLICT (driver_id) DO UPDATE SET
  service_types = EXCLUDED.service_types,
  vehicle_classes = EXCLUDED.vehicle_classes,
  max_distance_km = EXCLUDED.max_distance_km,
  is_active = EXCLUDED.is_active;