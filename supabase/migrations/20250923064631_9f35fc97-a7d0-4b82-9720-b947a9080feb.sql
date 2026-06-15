-- Phase 2: Fonctions de dispatch et géolocalisation
-- Fonction pour trouver les chauffeurs à proximité
CREATE OR REPLACE FUNCTION find_nearby_drivers(
  pickup_lat NUMERIC,
  pickup_lng NUMERIC,
  service_type_param TEXT DEFAULT 'taxi',
  radius_km NUMERIC DEFAULT 10
)
RETURNS TABLE(
  driver_id UUID,
  latitude NUMERIC,
  longitude NUMERIC,
  distance_km NUMERIC,
  is_available BOOLEAN,
  vehicle_class TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    dl.driver_id,
    dl.latitude,
    dl.longitude,
    calculate_distance_km(pickup_lat, pickup_lng, dl.latitude, dl.longitude) as distance_km,
    dl.is_available,
    dl.vehicle_class
  FROM driver_locations dl
  JOIN driver_profiles dp ON dl.driver_id = dp.user_id
  WHERE 
    dl.is_online = true 
    AND dl.is_available = true
    AND dl.last_ping > NOW() - INTERVAL '5 minutes'
    AND dp.is_active = true
    AND dp.verification_status = 'verified'
    AND calculate_distance_km(pickup_lat, pickup_lng, dl.latitude, dl.longitude) <= radius_km
  ORDER BY distance_km ASC
  LIMIT 10;
END;
$$;

-- Fonction pour valider et corriger les coordonnées
CREATE OR REPLACE FUNCTION validate_booking_coordinates(
  pickup_coords JSONB,
  delivery_coords JSONB DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  validated_pickup JSONB;
  validated_delivery JSONB;
  pickup_lat NUMERIC;
  pickup_lng NUMERIC;
  delivery_lat NUMERIC;
  delivery_lng NUMERIC;
BEGIN
  -- Extraire et valider les coordonnées de pickup
  pickup_lat := (pickup_coords->>'lat')::NUMERIC;
  pickup_lng := (pickup_coords->>'lng')::NUMERIC;
  
  -- Vérifier que les coordonnées sont dans des plages valides
  IF pickup_lat IS NULL OR pickup_lng IS NULL OR 
     pickup_lat < -90 OR pickup_lat > 90 OR 
     pickup_lng < -180 OR pickup_lng > 180 THEN
    -- Utiliser coordonnées par défaut de Kinshasa
    validated_pickup := jsonb_build_object(
      'lat', -4.3217,
      'lng', 15.3069,
      'address', 'Kinshasa Centre, République Démocratique du Congo',
      'corrected', true
    );
  ELSE
    validated_pickup := pickup_coords || jsonb_build_object('corrected', false);
  END IF;
  
  -- Valider les coordonnées de livraison si fournies
  IF delivery_coords IS NOT NULL THEN
    delivery_lat := (delivery_coords->>'lat')::NUMERIC;
    delivery_lng := (delivery_coords->>'lng')::NUMERIC;
    
    IF delivery_lat IS NULL OR delivery_lng IS NULL OR 
       delivery_lat < -90 OR delivery_lat > 90 OR 
       delivery_lng < -180 OR delivery_lng > 180 THEN
      validated_delivery := jsonb_build_object(
        'lat', -4.3217,
        'lng', 15.3069,
        'address', 'Kinshasa Centre, République Démocratique du Congo',
        'corrected', true
      );
    ELSE
      validated_delivery := delivery_coords || jsonb_build_object('corrected', false);
    END IF;
  END IF;
  
  RETURN jsonb_build_object(
    'pickup', validated_pickup,
    'delivery', validated_delivery
  );
END;
$$;

-- Fonction pour corriger les commandes existantes avec des coordonnées invalides
CREATE OR REPLACE FUNCTION fix_invalid_coordinates()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  updated_count INTEGER := 0;
  booking_record RECORD;
  validated_coords JSONB;
BEGIN
  -- Seuls les admins peuvent exécuter cette fonction
  IF NOT is_current_user_admin() THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;
  
  -- Corriger les réservations de transport avec coordonnées invalides
  FOR booking_record IN 
    SELECT id, pickup_coordinates, delivery_coordinates
    FROM transport_bookings 
    WHERE status IN ('pending', 'confirmed', 'driver_assigned')
      AND (
        (pickup_coordinates->>'lat')::NUMERIC IS NULL OR
        (pickup_coordinates->>'lng')::NUMERIC IS NULL OR
        (pickup_coordinates->>'lat')::NUMERIC < -90 OR
        (pickup_coordinates->>'lat')::NUMERIC > 90 OR
        (pickup_coordinates->>'lng')::NUMERIC < -180 OR
        (pickup_coordinates->>'lng')::NUMERIC > 180
      )
  LOOP
    validated_coords := validate_booking_coordinates(
      booking_record.pickup_coordinates,
      booking_record.delivery_coordinates
    );
    
    UPDATE transport_bookings 
    SET 
      pickup_coordinates = validated_coords->'pickup',
      delivery_coordinates = COALESCE(validated_coords->'delivery', delivery_coordinates),
      updated_at = NOW()
    WHERE id = booking_record.id;
    
    updated_count := updated_count + 1;
  END LOOP;
  
  -- Corriger les commandes de livraison avec coordonnées invalides
  FOR booking_record IN 
    SELECT id, pickup_coordinates, delivery_coordinates
    FROM delivery_orders 
    WHERE status IN ('pending', 'confirmed', 'driver_assigned')
      AND (
        (pickup_coordinates->>'lat')::NUMERIC IS NULL OR
        (pickup_coordinates->>'lng')::NUMERIC IS NULL OR
        (pickup_coordinates->>'lat')::NUMERIC < -90 OR
        (pickup_coordinates->>'lat')::NUMERIC > 90 OR
        (pickup_coordinates->>'lng')::NUMERIC < -180 OR
        (pickup_coordinates->>'lng')::NUMERIC > 180
      )
  LOOP
    validated_coords := validate_booking_coordinates(
      booking_record.pickup_coordinates,
      booking_record.delivery_coordinates
    );
    
    UPDATE delivery_orders 
    SET 
      pickup_coordinates = validated_coords->'pickup',
      delivery_coordinates = COALESCE(validated_coords->'delivery', delivery_coordinates),
      updated_at = NOW()
    WHERE id = booking_record.id;
    
    updated_count := updated_count + 1;
  END LOOP;
  
  RETURN updated_count;
END;
$$;