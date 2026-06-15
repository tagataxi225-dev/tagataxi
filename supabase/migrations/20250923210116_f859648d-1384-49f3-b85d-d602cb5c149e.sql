-- Correction: Supprimer et recréer la fonction find_nearby_drivers
DROP FUNCTION IF EXISTS find_nearby_drivers(numeric,numeric,text,numeric);

-- Améliorer la fonction de recherche de chauffeurs avec logs
CREATE OR REPLACE FUNCTION find_nearby_drivers(
  pickup_lat numeric,
  pickup_lng numeric,
  service_type_param text DEFAULT 'taxi',
  radius_km numeric DEFAULT 15
)
RETURNS TABLE (
  driver_id uuid,
  distance_km numeric,
  is_available boolean,
  vehicle_class text,
  rating_average numeric
)
SECURITY INVOKER  
LANGUAGE plpgsql
AS $$
BEGIN
  -- Log de la recherche pour monitoring
  INSERT INTO activity_logs (
    user_id, 
    activity_type, 
    description,
    metadata
  ) VALUES (
    auth.uid(),
    'driver_search',
    'Recherche chauffeurs proximité',
    jsonb_build_object(
      'pickup_lat', pickup_lat,
      'pickup_lng', pickup_lng, 
      'service_type', service_type_param,
      'radius_km', radius_km
    )
  );

  RETURN QUERY
  SELECT 
    dl.driver_id,
    ROUND(
      (6371 * acos(
        cos(radians(pickup_lat)) * 
        cos(radians(dl.latitude)) * 
        cos(radians(dl.longitude) - radians(pickup_lng)) + 
        sin(radians(pickup_lat)) * 
        sin(radians(dl.latitude))
      ))::numeric, 2
    ) as distance_km,
    dl.is_available,
    dl.vehicle_class,
    COALESCE(dp.rating_average, 0) as rating_average
  FROM driver_locations dl
  JOIN driver_profiles dp ON dp.user_id = dl.driver_id
  WHERE 
    dl.is_online = true 
    AND dl.is_available = true
    AND dp.is_active = true
    AND dp.verification_status = 'verified'
    AND (
      6371 * acos(
        cos(radians(pickup_lat)) * 
        cos(radians(dl.latitude)) * 
        cos(radians(dl.longitude) - radians(pickup_lng)) + 
        sin(radians(pickup_lat)) * 
        sin(radians(dl.latitude))
      )
    ) <= radius_km
  ORDER BY distance_km ASC
  LIMIT 10;
END;
$$;