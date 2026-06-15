
DROP FUNCTION IF EXISTS public.find_nearby_drivers(double precision, double precision, double precision, text, text, text);

CREATE FUNCTION public.find_nearby_drivers(
  p_lat double precision,
  p_lng double precision,
  p_max_distance_km double precision DEFAULT 10,
  p_vehicle_class text DEFAULT NULL,
  p_service_type text DEFAULT NULL,
  p_city text DEFAULT NULL
)
RETURNS TABLE(
  driver_id uuid,
  display_name text,
  latitude double precision,
  longitude double precision,
  distance_km double precision,
  vehicle_class text,
  vehicle_make text,
  vehicle_model text,
  vehicle_plate text,
  is_available boolean,
  rating_average numeric,
  total_rides integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id AS driver_id,
    c.display_name,
    dl.latitude::double precision,
    dl.longitude::double precision,
    (6371 * acos(
      cos(radians(p_lat)) * cos(radians(dl.latitude::double precision)) *
      cos(radians(dl.longitude::double precision) - radians(p_lng)) +
      sin(radians(p_lat)) * sin(radians(dl.latitude::double precision))
    ))::double precision AS distance_km,
    c.vehicle_class,
    c.vehicle_make,
    c.vehicle_model,
    c.vehicle_plate,
    dl.is_available,
    c.rating_average,
    c.total_rides
  FROM driver_locations dl
  JOIN chauffeurs c ON c.id = dl.driver_id
  WHERE dl.is_online = true
    AND dl.updated_at > now() - interval '15 minutes'
    AND c.verification_status IN ('verified', 'approved')
    AND c.is_active = true
    AND (p_vehicle_class IS NULL OR c.vehicle_class = p_vehicle_class)
    AND (p_service_type IS NULL OR c.service_type = p_service_type)
    AND (p_city IS NULL OR c.city = p_city)
    AND (6371 * acos(
      cos(radians(p_lat)) * cos(radians(dl.latitude::double precision)) *
      cos(radians(dl.longitude::double precision) - radians(p_lng)) +
      sin(radians(p_lat)) * sin(radians(dl.latitude::double precision))
    )) <= p_max_distance_km
  ORDER BY distance_km ASC;
END;
$$;
