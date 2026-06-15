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
  total_rides integer,
  rides_remaining integer,
  wallet_balance numeric,
  is_verified boolean
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.user_id AS driver_id,
    c.display_name,
    dl.latitude::double precision,
    dl.longitude::double precision,
    (6371 * acos(LEAST(1.0, GREATEST(-1.0,
      cos(radians(p_lat)) * cos(radians(dl.latitude::double precision)) *
      cos(radians(dl.longitude::double precision) - radians(p_lng)) +
      sin(radians(p_lat)) * sin(radians(dl.latitude::double precision))
    ))))::double precision AS distance_km,
    COALESCE(dl.vehicle_class, c.vehicle_class, 'standard') AS vehicle_class,
    COALESCE(c.vehicle_make, 'Toyota') AS vehicle_make,
    COALESCE(c.vehicle_model, 'Corolla') AS vehicle_model,
    COALESCE(c.vehicle_plate, 'ABC-123') AS vehicle_plate,
    dl.is_available,
    COALESCE(c.rating_average, 4.5) AS rating_average,
    COALESCE(c.total_rides, 0) AS total_rides,
    COALESCE(ds.rides_remaining, 0) AS rides_remaining,
    COALESCE(w.balance, 0) AS wallet_balance,
    (c.verification_status IN ('verified','approved')) AS is_verified
  FROM driver_locations dl
  JOIN chauffeurs c ON c.user_id = dl.driver_id
  LEFT JOIN driver_subscriptions ds ON ds.driver_id = c.user_id
    AND ds.status = 'active' AND ds.end_date > now()
  LEFT JOIN user_wallets w ON w.user_id = c.user_id
  WHERE
    dl.is_online = true AND dl.is_available = true
    AND c.is_active = true
    AND c.verification_status IN ('verified','approved')
    AND (p_vehicle_class IS NULL OR dl.vehicle_class = p_vehicle_class OR c.vehicle_class = p_vehicle_class)
    AND (p_service_type IS NULL OR c.service_type = p_service_type)
    AND (p_city IS NULL OR c.city = p_city OR c.service_areas @> ARRAY[p_city])
    AND (6371 * acos(LEAST(1.0, GREATEST(-1.0,
      cos(radians(p_lat)) * cos(radians(dl.latitude::double precision)) *
      cos(radians(dl.longitude::double precision) - radians(p_lng)) +
      sin(radians(p_lat)) * sin(radians(dl.latitude::double precision))
    )))) <= p_max_distance_km
  ORDER BY distance_km ASC
  LIMIT 20;
END;
$$;

GRANT EXECUTE ON FUNCTION public.find_nearby_drivers(
  double precision, double precision, double precision, text, text, text
) TO authenticated, anon;