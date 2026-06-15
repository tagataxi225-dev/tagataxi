-- ============================================
-- 🚗 SEED: Chauffeurs de Test (V4 - Sans City)
-- Phase 2: Créer chauffeurs de test avec last_ping récent
-- ============================================

-- Mettre à jour le chauffeur existant avec last_ping récent
UPDATE driver_locations
SET 
  last_ping = NOW(),
  is_online = true,
  is_available = true,
  updated_at = NOW()
WHERE driver_id = '6bd56fde-d3e1-4df9-a79c-670397581890';

-- Insérer 3 nouveaux chauffeurs de test à Abidjan
DO $$
DECLARE
  driver1_id UUID := gen_random_uuid();
  driver2_id UUID := gen_random_uuid();
  driver3_id UUID := gen_random_uuid();
BEGIN
  -- Créer les utilisateurs auth d'abord
  INSERT INTO auth.users (
    id, email, encrypted_password, email_confirmed_at, 
    created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
    aud, role
  ) VALUES 
    (driver1_id, 'kouassi@test.com', crypt('TestPass123!', gen_salt('bf')), NOW(), NOW(), NOW(), 
     '{"provider":"email","providers":["email"]}', '{"display_name":"Kouassi Jean"}', 'authenticated', 'authenticated'),
    (driver2_id, 'yao@test.com', crypt('TestPass123!', gen_salt('bf')), NOW(), NOW(), NOW(), 
     '{"provider":"email","providers":["email"]}', '{"display_name":"Yao Martin"}', 'authenticated', 'authenticated'),
    (driver3_id, 'bamba@test.com', crypt('TestPass123!', gen_salt('bf')), NOW(), NOW(), NOW(), 
     '{"provider":"email","providers":["email"]}', '{"display_name":"Bamba Sekou"}', 'authenticated', 'authenticated')
  ON CONFLICT (id) DO NOTHING;

  -- Chauffeur 1 : Flex (proche de Yopougon)
  INSERT INTO chauffeurs (
    id, user_id, display_name, phone_number, email, 
    vehicle_type, vehicle_model, vehicle_make, vehicle_plate,
    rating_average, total_rides, is_active, service_type
  ) VALUES (
    driver1_id, driver1_id, 'Kouassi Jean', '+2250709876543', 'kouassi@test.com',
    'flex', 'Toyota Corolla', 'Toyota', 'AB-1234-CI',
    4.8, 150, true, 'delivery'
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO driver_locations (
    driver_id, latitude, longitude, heading, speed,
    is_online, is_available, last_ping, accuracy
  ) VALUES (
    driver1_id, 5.3500, -4.0850, 90, 0,
    true, true, NOW(), 10
  )
  ON CONFLICT (driver_id) DO UPDATE SET
    last_ping = NOW(),
    is_online = true,
    is_available = true;

  -- Chauffeur 2 : MaxiCharge (à Bingerville)
  INSERT INTO chauffeurs (
    id, user_id, display_name, phone_number, email,
    vehicle_type, vehicle_model, vehicle_make, vehicle_plate,
    rating_average, total_rides, is_active, service_type
  ) VALUES (
    driver2_id, driver2_id, 'Yao Martin', '+2250701234567', 'yao@test.com',
    'maxicharge', 'Isuzu D-Max', 'Isuzu', 'CI-5678-AB',
    4.9, 200, true, 'delivery'
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO driver_locations (
    driver_id, latitude, longitude, heading, speed,
    is_online, is_available, last_ping, accuracy
  ) VALUES (
    driver2_id, 5.3580, -3.8800, 180, 0,
    true, true, NOW(), 10
  )
  ON CONFLICT (driver_id) DO UPDATE SET
    last_ping = NOW(),
    is_online = true,
    is_available = true;

  -- Chauffeur 3 : Flash (mobile)
  INSERT INTO chauffeurs (
    id, user_id, display_name, phone_number, email,
    vehicle_type, vehicle_model, vehicle_make, vehicle_plate,
    rating_average, total_rides, is_active, service_type
  ) VALUES (
    driver3_id, driver3_id, 'Bamba Sekou', '+2250707654321', 'bamba@test.com',
    'flash', 'Yamaha XTZ', 'Yamaha', 'M-9012-CI',
    4.7, 300, true, 'delivery'
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO driver_locations (
    driver_id, latitude, longitude, heading, speed,
    is_online, is_available, last_ping, accuracy
  ) VALUES (
    driver3_id, 5.3478, -4.0802, 270, 5,
    true, true, NOW(), 15
  )
  ON CONFLICT (driver_id) DO UPDATE SET
    last_ping = NOW(),
    is_online = true,
    is_available = true;

  RAISE NOTICE '✅ 3 chauffeurs de test créés avec last_ping récent';
END $$;