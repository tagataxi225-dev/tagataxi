-- Supprimer les versions existantes avec leurs signatures exactes
DROP FUNCTION IF EXISTS public.find_nearby_drivers_secure(user_lat numeric, user_lng numeric, max_distance_km numeric, vehicle_class_filter text);
DROP FUNCTION IF EXISTS public.find_nearby_drivers(pickup_lat numeric, pickup_lng numeric, service_type_param text, radius_km numeric, vehicle_class_filter text, user_city_param text);

-- ============================================
-- NOUVELLE FONCTION RPC find_nearby_drivers
-- ============================================

CREATE OR REPLACE FUNCTION public.calculate_distance_km(
  lat1 NUMERIC, lng1 NUMERIC,
  lat2 NUMERIC, lng2 NUMERIC
)
RETURNS NUMERIC
LANGUAGE plpgsql
IMMUTABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  R NUMERIC := 6371;
BEGIN
  RETURN ROUND((R * acos(
    cos(radians(lat1)) * cos(radians(lat2)) * 
    cos(radians(lng2) - radians(lng1)) + 
    sin(radians(lat1)) * sin(radians(lat2))
  ))::NUMERIC, 2);
END;
$$;

CREATE OR REPLACE FUNCTION public.find_nearby_drivers(
  p_latitude NUMERIC,
  p_longitude NUMERIC,
  p_max_distance_km NUMERIC DEFAULT 10,
  p_vehicle_class TEXT DEFAULT NULL,
  p_city TEXT DEFAULT 'Kinshasa',
  p_limit INTEGER DEFAULT 20
)
RETURNS TABLE(
  driver_id UUID,
  driver_name TEXT,
  vehicle_class TEXT,
  vehicle_info JSONB,
  distance_km NUMERIC,
  estimated_arrival_minutes INTEGER,
  rating_average NUMERIC,
  total_rides INTEGER,
  is_available BOOLEAN,
  last_ping TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.user_id AS driver_id,
    c.display_name AS driver_name,
    COALESCE(c.vehicle_class, 'standard') AS vehicle_class,
    jsonb_build_object(
      'vehicle_make', c.vehicle_make,
      'vehicle_model', c.vehicle_model,
      'vehicle_plate', c.vehicle_plate,
      'vehicle_color', c.vehicle_color
    ) AS vehicle_info,
    calculate_distance_km(p_latitude, p_longitude, (dl.latitude)::NUMERIC, (dl.longitude)::NUMERIC) AS distance_km,
    ROUND((calculate_distance_km(p_latitude, p_longitude, (dl.latitude)::NUMERIC, (dl.longitude)::NUMERIC) / 30.0 * 60)::NUMERIC)::INTEGER AS estimated_arrival_minutes,
    COALESCE(c.rating_average, 0) AS rating_average,
    COALESCE(c.total_rides, 0) AS total_rides,
    dl.is_available,
    dl.last_ping
  FROM public.chauffeurs c
  INNER JOIN public.driver_locations dl ON c.user_id = dl.driver_id
  WHERE 
    c.is_active = true
    AND c.verification_status = 'verified'
    AND dl.is_online = true
    AND dl.last_ping > NOW() - INTERVAL '10 minutes'
    AND dl.is_available = true
    AND dl.latitude IS NOT NULL
    AND dl.longitude IS NOT NULL
    AND (p_vehicle_class IS NULL OR c.vehicle_class = p_vehicle_class)
    AND (p_city IS NULL OR p_city = ANY(c.service_areas))
    AND calculate_distance_km(p_latitude, p_longitude, (dl.latitude)::NUMERIC, (dl.longitude)::NUMERIC) <= p_max_distance_km
  ORDER BY distance_km ASC, c.rating_average DESC
  LIMIT p_limit;
END;
$$;

CREATE OR REPLACE FUNCTION public.find_nearby_drivers_secure(
  p_latitude NUMERIC,
  p_longitude NUMERIC,
  p_max_distance_km NUMERIC DEFAULT 10,
  p_vehicle_class TEXT DEFAULT NULL
)
RETURNS TABLE(
  driver_id UUID,
  distance_km NUMERIC,
  estimated_arrival_minutes INTEGER,
  vehicle_class TEXT,
  rating_average NUMERIC,
  is_available BOOLEAN
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT f.driver_id, f.distance_km, f.estimated_arrival_minutes, f.vehicle_class, f.rating_average, f.is_available
  FROM public.find_nearby_drivers(p_latitude, p_longitude, p_max_distance_km, p_vehicle_class, NULL, 20) f;
END;
$$;

CREATE INDEX IF NOT EXISTS idx_driver_locations_coords ON public.driver_locations(latitude, longitude) WHERE is_online = true AND is_available = true;
CREATE INDEX IF NOT EXISTS idx_driver_locations_online ON public.driver_locations(is_online, is_available, last_ping) WHERE is_online = true;
CREATE INDEX IF NOT EXISTS idx_chauffeurs_verified ON public.chauffeurs(is_active, verification_status) WHERE is_active = true AND verification_status = 'verified';