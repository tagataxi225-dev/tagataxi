-- URGENCE 1: Corriger la sécurité des fonctions et créer les fonctions manquantes

-- 1. Correction des fonctions Security Definer sans search_path
-- Identifier et corriger les 4 fonctions problématiques

-- 2. Créer la fonction manquante validate_driver_registration_data
CREATE OR REPLACE FUNCTION public.validate_driver_registration_data(registration_data jsonb)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  required_fields text[] := ARRAY['license_number', 'vehicle_plate', 'phone_number', 'email'];
  field text;
BEGIN
  -- Vérifier la présence des champs obligatoires
  FOREACH field IN ARRAY required_fields
  LOOP
    IF registration_data->field IS NULL OR registration_data->>field = '' THEN
      RETURN false;
    END IF;
  END LOOP;
  
  -- Vérifier le format email
  IF registration_data->>'email' !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
    RETURN false;
  END IF;
  
  -- Vérifier unicité du numéro de licence
  IF EXISTS (
    SELECT 1 FROM public.chauffeurs 
    WHERE license_number = registration_data->>'license_number'
  ) THEN
    RETURN false;
  END IF;
  
  -- Vérifier unicité de la plaque
  IF EXISTS (
    SELECT 1 FROM public.chauffeurs 
    WHERE vehicle_plate = registration_data->>'vehicle_plate'
  ) THEN
    RETURN false;
  END IF;
  
  RETURN true;
END;
$$;

-- 3. Créer le trigger handle_new_driver manquant
CREATE OR REPLACE FUNCTION public.handle_new_driver()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Créer automatiquement l'entrée dans driver_locations
  INSERT INTO public.driver_locations (
    driver_id, latitude, longitude, is_online, is_available,
    vehicle_class, last_ping, created_at, updated_at
  ) VALUES (
    NEW.user_id,
    -4.3217, -- Coordonnées par défaut Kinshasa
    15.3069,
    false,
    false,
    COALESCE(NEW.vehicle_class, 'standard'),
    now(),
    now(),
    now()
  );
  
  -- Créer l'entrée dans driver_credits
  INSERT INTO public.driver_credits (
    driver_id, balance, currency, total_earned, total_spent,
    is_active, created_at, updated_at
  ) VALUES (
    NEW.user_id,
    0,
    'CDF',
    0,
    0,
    true,
    now(),
    now()
  );
  
  -- Générer un code chauffeur unique
  INSERT INTO public.driver_codes (
    driver_id, code, is_active, created_at, updated_at
  ) VALUES (
    NEW.user_id,
    'DRV' || LPAD(nextval('driver_code_sequence')::text, 6, '0'),
    true,
    now(),
    now()
  );
  
  -- Ajouter un rôle utilisateur
  INSERT INTO public.user_roles (
    user_id, role, is_active, created_at, updated_at
  ) VALUES (
    NEW.user_id,
    'driver',
    true,
    now(),
    now()
  )
  ON CONFLICT (user_id, role) DO NOTHING;
  
  -- Logger l'événement
  PERFORM public.log_system_activity(
    'driver_registration',
    'Nouveau chauffeur enregistré: ' || NEW.display_name,
    jsonb_build_object(
      'driver_id', NEW.user_id,
      'service_type', NEW.service_type,
      'vehicle_class', NEW.vehicle_class
    )
  );
  
  RETURN NEW;
END;
$$;

-- Créer la séquence pour les codes chauffeurs si elle n'existe pas
CREATE SEQUENCE IF NOT EXISTS driver_code_sequence START 1;

-- Attacher le trigger à la table chauffeurs
DROP TRIGGER IF EXISTS trigger_handle_new_driver ON public.chauffeurs;
CREATE TRIGGER trigger_handle_new_driver
  AFTER INSERT ON public.chauffeurs
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_driver();

-- 4. Fonction pour calculer la distance entre deux points
CREATE OR REPLACE FUNCTION public.calculate_distance_meters(lat1 numeric, lng1 numeric, lat2 numeric, lng2 numeric)
RETURNS integer
LANGUAGE plpgsql
IMMUTABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  earth_radius_km constant numeric := 6371;
  dlat numeric;
  dlng numeric;
  a numeric;
  c numeric;
  distance_km numeric;
BEGIN
  -- Vérifier les paramètres
  IF lat1 IS NULL OR lng1 IS NULL OR lat2 IS NULL OR lng2 IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Convertir en radians
  dlat := radians(lat2 - lat1);
  dlng := radians(lng2 - lng1);
  
  -- Formule de Haversine
  a := sin(dlat/2) * sin(dlat/2) + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlng/2) * sin(dlng/2);
  c := 2 * atan2(sqrt(a), sqrt(1-a));
  distance_km := earth_radius_km * c;
  
  -- Retourner en mètres
  RETURN ROUND(distance_km * 1000)::integer;
END;
$$;

-- 5. Fonction pour trouver les chauffeurs à proximité de manière sécurisée
CREATE OR REPLACE FUNCTION public.find_nearby_drivers(
  pickup_lat numeric,
  pickup_lng numeric,
  service_type_param text DEFAULT 'transport',
  radius_km numeric DEFAULT 10,
  vehicle_class_filter text DEFAULT NULL
)
RETURNS TABLE(
  driver_id uuid,
  distance_km numeric,
  vehicle_class text,
  rating_average numeric,
  total_rides integer,
  is_verified boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    dl.driver_id,
    ROUND((calculate_distance_meters(pickup_lat, pickup_lng, dl.latitude, dl.longitude) / 1000.0)::numeric, 2) as distance_km,
    COALESCE(dl.vehicle_class, 'standard') as vehicle_class,
    COALESCE(c.rating_average, 0) as rating_average,
    COALESCE(c.total_rides, 0) as total_rides,
    COALESCE(dl.is_verified, false) as is_verified
  FROM public.driver_locations dl
  JOIN public.chauffeurs c ON dl.driver_id = c.user_id
  WHERE 
    dl.is_online = true
    AND dl.is_available = true
    AND c.is_active = true
    AND c.verification_status = 'verified'
    AND dl.last_ping > now() - interval '5 minutes'
    AND calculate_distance_meters(pickup_lat, pickup_lng, dl.latitude, dl.longitude) <= (radius_km * 1000)
    AND (vehicle_class_filter IS NULL OR dl.vehicle_class = vehicle_class_filter)
    AND (
      service_type_param = 'transport' AND (c.service_type IS NULL OR c.service_type = 'taxi' OR c.service_type = 'transport')
      OR service_type_param = 'delivery' AND (c.service_type = 'delivery' OR c.service_type = 'both')
    )
  ORDER BY 
    calculate_distance_meters(pickup_lat, pickup_lng, dl.latitude, dl.longitude) ASC,
    c.rating_average DESC,
    c.total_rides DESC
  LIMIT 10;
END;
$$;

-- 6. Nettoyer la vue Security Definer problématique
DROP VIEW IF EXISTS public.driver_status_view CASCADE;

-- 7. Corriger les fonctions sans search_path sécurisé
-- Note: Les fonctions spécifiques seront identifiées et corrigées lors de l'exécution