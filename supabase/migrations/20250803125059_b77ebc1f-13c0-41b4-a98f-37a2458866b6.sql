-- Créer des données de test fonctionnelles

-- Générer des profils de test
WITH test_users AS (
  INSERT INTO profiles (user_id, display_name, phone_number, user_type) VALUES
  (gen_random_uuid(), 'Jean Mukendi', '+243970123456', 'client'),
  (gen_random_uuid(), 'Marie Tshimbala', '+243970234567', 'client'),
  (gen_random_uuid(), 'Patrick Ngoma', '+243970345678', 'chauffeur'),
  (gen_random_uuid(), 'Grace Kabamba', '+243970456789', 'chauffeur'),
  (gen_random_uuid(), 'Joseph Mulamba', '+243970567890', 'chauffeur')
  RETURNING user_id, display_name, user_type
),
drivers AS (
  SELECT user_id FROM test_users WHERE user_type = 'chauffeur'
),
clients AS (
  SELECT user_id FROM test_users WHERE user_type = 'client'
)

-- Insérer les profils de chauffeurs
INSERT INTO driver_profiles (
  user_id, license_number, vehicle_make, vehicle_model, vehicle_year, 
  vehicle_plate, vehicle_color, vehicle_class, insurance_number, 
  license_expiry, insurance_expiry, verification_status, is_active,
  rating_average, rating_count, total_rides
) 
SELECT 
  d.user_id,
  'KIN' || lpad((ROW_NUMBER() OVER())::text, 6, '0'),
  CASE ROW_NUMBER() OVER() 
    WHEN 1 THEN 'Toyota'
    WHEN 2 THEN 'Hyundai' 
    ELSE 'Kia'
  END,
  CASE ROW_NUMBER() OVER()
    WHEN 1 THEN 'Corolla'
    WHEN 2 THEN 'Accent'
    ELSE 'Picanto'
  END,
  2019 + (ROW_NUMBER() OVER()),
  'CD-' || lpad((1000 + ROW_NUMBER() OVER())::text, 4, '0') || '-KIN',
  CASE ROW_NUMBER() OVER()
    WHEN 1 THEN 'Blanc'
    WHEN 2 THEN 'Gris'
    ELSE 'Rouge'
  END,
  CASE ROW_NUMBER() OVER()
    WHEN 3 THEN 'economy'
    ELSE 'standard'
  END,
  'INS' || lpad((789000 + ROW_NUMBER() OVER())::text, 6, '0'),
  '2026-12-31',
  '2025-12-31',
  'verified',
  true,
  4.5 + (ROW_NUMBER() OVER() * 0.2),
  50 + (ROW_NUMBER() OVER() * 50),
  100 + (ROW_NUMBER() OVER() * 30)
FROM drivers d;