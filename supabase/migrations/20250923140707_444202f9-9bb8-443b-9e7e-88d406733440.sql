-- D'abord créer des utilisateurs test dans auth.users via l'API
-- Insérer les chauffeurs avec des UUIDs existants ou créer des UUIDs simples
INSERT INTO public.chauffeurs (
  user_id, email, phone_number, display_name, 
  is_active, verification_status, vehicle_type, 
  vehicle_model, vehicle_plate, license_number,
  service_areas, rating_average, total_rides
) VALUES 
  (auth.uid(), 'driver1@kwenda.test', '+243901234567', 'Jean Mukendi', 
   true, 'verified', 'moto', 'Honda CG125', 'KIN-001-AB', 'DL123456789',
   ARRAY['Kinshasa'], 4.8, 150)
ON CONFLICT (user_id) DO UPDATE SET
  is_active = true,
  verification_status = 'verified',
  rating_average = 4.8,
  total_rides = 150;

-- Mettre à jour les chauffeurs existants pour les activer
UPDATE public.chauffeurs 
SET is_active = true, 
    verification_status = 'verified',
    rating_average = CASE 
      WHEN email LIKE '%1%' THEN 4.8
      WHEN email LIKE '%2%' THEN 4.9
      WHEN email LIKE '%3%' THEN 4.7
      ELSE 4.6
    END,
    total_rides = CASE 
      WHEN email LIKE '%1%' THEN 150
      WHEN email LIKE '%2%' THEN 203
      WHEN email LIKE '%3%' THEN 89
      ELSE 67
    END
WHERE user_id IN (
  SELECT driver_id FROM public.driver_locations LIMIT 5
);

-- Créer/mettre à jour les profils correspondants
INSERT INTO public.driver_profiles (
  user_id, vehicle_make, vehicle_model, vehicle_year, 
  vehicle_class, vehicle_color, vehicle_plate,
  license_number, insurance_number, license_expiry,
  insurance_expiry, verification_status, is_active,
  service_type, delivery_capacity, rating_average, total_rides
) 
SELECT 
  dl.driver_id,
  'Toyota', 'Vitz', 2020,
  COALESCE(dl.vehicle_class, 'eco'), 'Blanc', 'KIN-TEST-' || substring(dl.driver_id::text from 1 for 3),
  'DL' || substring(dl.driver_id::text from 1 for 9), 'INS' || substring(dl.driver_id::text from 1 for 3), '2025-12-31',
  '2024-12-31', 'verified', true, 'taxi', 'medium', 4.8, 100
FROM public.driver_locations dl
WHERE dl.driver_id NOT IN (SELECT user_id FROM public.driver_profiles)
LIMIT 5
ON CONFLICT (user_id) DO UPDATE SET
  verification_status = 'verified',
  is_active = true,
  rating_average = 4.8,
  total_rides = 100;

-- Mettre à jour les positions pour qu'elles soient réparties dans Kinshasa
UPDATE public.driver_locations 
SET 
  latitude = CASE 
    WHEN MOD(abs(hashtext(driver_id::text)), 4) = 0 THEN -4.3217
    WHEN MOD(abs(hashtext(driver_id::text)), 4) = 1 THEN -4.3150
    WHEN MOD(abs(hashtext(driver_id::text)), 4) = 2 THEN -4.3300
    ELSE -4.3400
  END,
  longitude = CASE 
    WHEN MOD(abs(hashtext(driver_id::text)), 4) = 0 THEN 15.3069
    WHEN MOD(abs(hashtext(driver_id::text)), 4) = 1 THEN 15.3100
    WHEN MOD(abs(hashtext(driver_id::text)), 4) = 2 THEN 15.3200
    ELSE 15.2900
  END,
  is_online = true,
  is_available = true,
  last_ping = now(),
  accuracy = 8,
  vehicle_class = COALESCE(vehicle_class, 'eco')
WHERE is_online = true;