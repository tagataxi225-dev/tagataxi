-- Créer des chauffeurs de test pour Kinshasa en utilisant le bon schéma
INSERT INTO public.chauffeurs (
  user_id, email, phone_number, vehicle_make, vehicle_model, 
  vehicle_year, vehicle_plate, vehicle_color, vehicle_type, 
  is_active, verification_status, created_at
) VALUES 
(
  gen_random_uuid(), 'jean.test@kwenda.com', '+243901234567',
  'Toyota', 'Corolla', 2020, 'KIN-001-TT', 'Blanc',
  'taxi', true, 'verified', now()
),
(
  gen_random_uuid(), 'marie.test@kwenda.com', '+243901234568',
  'Nissan', 'Almera', 2019, 'KIN-002-TT', 'Bleu',
  'taxi', true, 'verified', now()
),
(
  gen_random_uuid(), 'paul.test@kwenda.com', '+243901234569',
  'Honda', 'Civic', 2021, 'KIN-003-TT', 'Rouge',
  'taxi', true, 'verified', now()
);

-- Créer des profils de chauffeurs
INSERT INTO public.driver_profiles (
  user_id, phone_number, vehicle_make, vehicle_model, vehicle_plate, 
  vehicle_color, vehicle_type, is_active, verification_status, created_at
) 
SELECT 
  user_id, phone_number, vehicle_make, vehicle_model, vehicle_plate,
  vehicle_color, vehicle_type, is_active, verification_status, created_at
FROM public.chauffeurs
WHERE email LIKE '%test@kwenda.com'
ON CONFLICT (user_id) DO NOTHING;

-- Positionner les chauffeurs en ligne dans Kinshasa
INSERT INTO public.driver_locations (
  driver_id, latitude, longitude, is_online, is_available, 
  vehicle_class, last_ping, created_at, updated_at
) 
SELECT 
  c.user_id,
  CASE 
    WHEN c.email = 'jean.test@kwenda.com' THEN -4.3217
    WHEN c.email = 'marie.test@kwenda.com' THEN -4.3100
    WHEN c.email = 'paul.test@kwenda.com' THEN -4.3350
  END as latitude,
  CASE 
    WHEN c.email = 'jean.test@kwenda.com' THEN 15.3069
    WHEN c.email = 'marie.test@kwenda.com' THEN 15.3200
    WHEN c.email = 'paul.test@kwenda.com' THEN 15.2900
  END as longitude,
  true as is_online,
  true as is_available,
  'standard' as vehicle_class,
  now() as last_ping,
  now() as created_at,
  now() as updated_at
FROM public.chauffeurs c
WHERE c.email LIKE '%test@kwenda.com'
ON CONFLICT (driver_id) DO UPDATE SET
  latitude = EXCLUDED.latitude,
  longitude = EXCLUDED.longitude,
  is_online = true,
  is_available = true,
  last_ping = now(),
  updated_at = now();