-- Drop existing functions before recreating them with correct parameters
DROP FUNCTION IF EXISTS public.validate_booking_coordinates(jsonb, jsonb);
DROP FUNCTION IF EXISTS public.calculate_distance_km(numeric, numeric, numeric, numeric);
DROP FUNCTION IF EXISTS public.calculate_distance_meters(numeric, numeric, numeric, numeric);
DROP FUNCTION IF EXISTS public.get_nearby_active_drivers_enhanced(numeric, numeric, numeric, text, integer);

-- Recreate functions with SET search_path = 'public'
CREATE OR REPLACE FUNCTION public.calculate_distance_km(lat1 numeric, lng1 numeric, lat2 numeric, lng2 numeric)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Calculate distance using Haversine formula
  RETURN (
    6371 * acos(
      cos(radians(lat1)) * cos(radians(lat2)) * 
      cos(radians(lng2) - radians(lng1)) + 
      sin(radians(lat1)) * sin(radians(lat2))
    )
  )::numeric;
END;
$$;

CREATE OR REPLACE FUNCTION public.calculate_distance_meters(lat1 numeric, lng1 numeric, lat2 numeric, lng2 numeric)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Calculate distance in meters using Haversine formula
  RETURN (
    6371000 * acos(
      cos(radians(lat1)) * cos(radians(lat2)) * 
      cos(radians(lng2) - radians(lng1)) + 
      sin(radians(lat1)) * sin(radians(lat2))
    )
  )::integer;
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_booking_coordinates(pickup_coords jsonb, delivery_coords jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  validated_pickup jsonb;
  validated_delivery jsonb;
  kinshasa_center jsonb := '{"lat": -4.3217, "lng": 15.3069}';
BEGIN
  -- Validate pickup coordinates
  IF pickup_coords IS NULL OR 
     (pickup_coords->>'lat')::numeric IS NULL OR 
     (pickup_coords->>'lng')::numeric IS NULL OR
     (pickup_coords->>'lat')::numeric < -90 OR 
     (pickup_coords->>'lat')::numeric > 90 OR
     (pickup_coords->>'lng')::numeric < -180 OR 
     (pickup_coords->>'lng')::numeric > 180 THEN
    validated_pickup := kinshasa_center;
  ELSE
    validated_pickup := pickup_coords;
  END IF;
  
  -- Validate delivery coordinates if provided
  IF delivery_coords IS NOT NULL THEN
    IF (delivery_coords->>'lat')::numeric IS NULL OR 
       (delivery_coords->>'lng')::numeric IS NULL OR
       (delivery_coords->>'lat')::numeric < -90 OR 
       (delivery_coords->>'lat')::numeric > 90 OR
       (delivery_coords->>'lng')::numeric < -180 OR 
       (delivery_coords->>'lng')::numeric > 180 THEN
      validated_delivery := kinshasa_center;
    ELSE
      validated_delivery := delivery_coords;
    END IF;
  ELSE
    validated_delivery := NULL;
  END IF;
  
  RETURN jsonb_build_object(
    'pickup', validated_pickup,
    'delivery', validated_delivery
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_nearby_active_drivers_enhanced(
  search_lat numeric,
  search_lng numeric,
  radius_km numeric DEFAULT 10,
  vehicle_class_filter text DEFAULT NULL,
  max_results integer DEFAULT 20
)
RETURNS TABLE(
  driver_id uuid,
  distance_km numeric,
  vehicle_class text,
  is_verified boolean,
  last_ping timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    dl.driver_id,
    calculate_distance_km(search_lat, search_lng, dl.latitude, dl.longitude) as distance_km,
    dl.vehicle_class,
    dl.is_verified,
    dl.last_ping
  FROM driver_locations dl
  WHERE dl.is_online = true
    AND dl.is_available = true
    AND dl.last_ping > now() - interval '10 minutes'
    AND (vehicle_class_filter IS NULL OR dl.vehicle_class = vehicle_class_filter)
    AND calculate_distance_km(search_lat, search_lng, dl.latitude, dl.longitude) <= radius_km
  ORDER BY distance_km ASC
  LIMIT max_results;
END;
$$;