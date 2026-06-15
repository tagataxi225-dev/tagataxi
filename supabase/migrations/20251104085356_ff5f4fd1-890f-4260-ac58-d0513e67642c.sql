-- 🔧 PHASE 1: Correction critique de la RPC find_nearby_drivers
-- Ajout des paramètres manquants et vérification des crédits

-- Supprimer l'ancienne version
DROP FUNCTION IF EXISTS find_nearby_drivers(numeric,numeric,text,numeric);

-- Recréer avec TOUS les paramètres nécessaires
CREATE OR REPLACE FUNCTION find_nearby_drivers(
  pickup_lat numeric,
  pickup_lng numeric,
  service_type_param text DEFAULT 'taxi',
  radius_km numeric DEFAULT 15,
  vehicle_class_filter text DEFAULT NULL,
  user_city_param text DEFAULT NULL
)
RETURNS TABLE (
  driver_id uuid,
  distance_km numeric,
  is_available boolean,
  vehicle_class text,
  rating_average numeric,
  total_rides integer,
  rides_remaining integer
)
SECURITY INVOKER
SET search_path = public, pg_temp
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
    'Recherche chauffeurs proximité avec filtres',
    jsonb_build_object(
      'pickup_lat', pickup_lat,
      'pickup_lng', pickup_lng, 
      'service_type', service_type_param,
      'radius_km', radius_km,
      'vehicle_class', vehicle_class_filter,
      'user_city', user_city_param
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
    COALESCE(c.rating_average, 0) as rating_average,
    COALESCE(c.total_rides, 0) as total_rides,
    COALESCE(ds.rides_remaining, 0) as rides_remaining
  FROM driver_locations dl
  JOIN chauffeurs c ON c.user_id = dl.driver_id
  LEFT JOIN driver_subscriptions ds ON ds.driver_id = dl.driver_id AND ds.status = 'active'
  WHERE 
    dl.is_online = true 
    AND dl.is_available = true
    AND c.is_active = true
    AND c.verification_status = 'verified'
    -- ✅ Vérification crédits CRITIQUE
    AND (
      service_type_param = 'delivery' 
      OR COALESCE(ds.rides_remaining, 0) > 0
    )
    -- ✅ Filtrage par classe de véhicule
    AND (vehicle_class_filter IS NULL OR dl.vehicle_class = vehicle_class_filter)
    -- ✅ Filtrage par ville (service_areas)
    AND (user_city_param IS NULL OR c.service_areas @> ARRAY[user_city_param])
    -- Filtrage par distance
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

-- Ajouter des index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_chauffeurs_service_areas ON chauffeurs USING GIN(service_areas);
CREATE INDEX IF NOT EXISTS idx_driver_subscriptions_status_driver ON driver_subscriptions(driver_id, status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_driver_locations_availability ON driver_locations(is_online, is_available) WHERE is_online = true AND is_available = true;