-- ============================================================
-- 🚨 PHASE 1 : CORRECTION DONNÉES CHAUFFEURS (Version Corrigée)
-- ============================================================

-- 1️⃣ Corriger les vehicle_type existants pour chauffeurs standard
UPDATE public.chauffeurs
SET vehicle_type = 'taxi_eco',
    updated_at = NOW()
WHERE vehicle_class = 'standard' 
  AND (vehicle_type IS NULL OR vehicle_type = '');

-- 2️⃣ Re-normaliser vehicle_class basé sur vehicle_type dans driver_locations
UPDATE public.driver_locations dl
SET vehicle_class = CASE
  -- Motos
  WHEN c.vehicle_type IN ('taxi_moto', 'moto_taxi', 'moto') THEN 'moto'
  -- Trucks/Camions
  WHEN c.vehicle_type IN ('truck', 'camion', 'maxicharge') THEN 'truck'
  -- Standard par défaut
  ELSE 'standard'
END,
updated_at = NOW()
FROM public.chauffeurs c
WHERE dl.driver_id = c.user_id;

-- 3️⃣ Transformer le chauffeur existant "hadou kone" en chauffeur MOTO de test
UPDATE public.chauffeurs
SET 
  vehicle_type = 'taxi_moto',
  vehicle_class = 'moto',
  vehicle_make = 'Yamaha',
  vehicle_model = 'DT125',
  vehicle_plate = 'KIN-M-TEST',
  is_active = true,
  verification_status = 'verified',
  service_type = 'delivery',
  updated_at = NOW()
WHERE email = 'hadoukone93@gmail.com';

-- 4️⃣ Mettre à jour sa position GPS (Gombe, Kinshasa) et l'activer
UPDATE public.driver_locations
SET 
  latitude = -4.3217,
  longitude = 15.3069,
  vehicle_class = 'moto',
  is_online = true,
  is_available = true,
  last_ping = NOW(),
  updated_at = NOW()
WHERE driver_id = (
  SELECT user_id FROM public.chauffeurs WHERE email = 'hadoukone93@gmail.com'
);

-- Si le driver_location n'existe pas, le créer
INSERT INTO public.driver_locations (
  driver_id, latitude, longitude, vehicle_class,
  is_online, is_available, last_ping, updated_at
)
SELECT 
  user_id,
  -4.3217,  -- Gombe
  15.3069,
  'moto',
  true,
  true,
  NOW(),
  NOW()
FROM public.chauffeurs
WHERE email = 'hadoukone93@gmail.com'
  AND NOT EXISTS (
    SELECT 1 FROM public.driver_locations dl
    WHERE dl.driver_id = chauffeurs.user_id
  );

-- 5️⃣ Créer 2 autres profils de test pour STANDARD et TRUCK
-- en utilisant les autres chauffeurs existants s'il y en a

-- Chercher un chauffeur pour STANDARD
DO $$
DECLARE
  v_standard_driver_id UUID;
BEGIN
  -- Trouver un chauffeur existant qui n'est pas hadou kone
  SELECT user_id INTO v_standard_driver_id
  FROM public.chauffeurs
  WHERE email != 'hadoukone93@gmail.com'
    AND vehicle_class = 'standard'
  LIMIT 1;
  
  IF v_standard_driver_id IS NOT NULL THEN
    -- Mettre à jour pour STANDARD test
    UPDATE public.chauffeurs
    SET 
      vehicle_type = 'taxi_eco',
      vehicle_class = 'standard',
      vehicle_make = 'Toyota',
      vehicle_model = 'Corolla',
      is_active = true,
      verification_status = 'verified',
      service_type = 'delivery',
      updated_at = NOW()
    WHERE user_id = v_standard_driver_id;
    
    -- Mettre à jour position (Ngaliema)
    INSERT INTO public.driver_locations (
      driver_id, latitude, longitude, vehicle_class,
      is_online, is_available, last_ping, updated_at
    ) VALUES (
      v_standard_driver_id,
      -4.3500,
      15.2800,
      'standard',
      true,
      true,
      NOW(),
      NOW()
    )
    ON CONFLICT (driver_id) DO UPDATE SET
      latitude = -4.3500,
      longitude = 15.2800,
      vehicle_class = 'standard',
      is_online = true,
      is_available = true,
      last_ping = NOW(),
      updated_at = NOW();
  END IF;
END $$;

-- ✅ Résumé de la migration
-- 1. Corriger vehicle_type des chauffeurs existants
-- 2. Re-normaliser vehicle_class dans driver_locations
-- 3. Transformer hadou kone en chauffeur MOTO de test actif
-- 4. Activer un autre chauffeur existant pour STANDARD
-- 5. Les mettre en ligne avec positions GPS Kinshasa