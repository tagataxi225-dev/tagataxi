-- Supprimer l'ancienne fonction pour la recréer avec la bonne signature
DROP FUNCTION IF EXISTS public.find_nearby_drivers(numeric,numeric,numeric,text);

-- Créer la fonction RPC find_nearby_drivers avec la bonne signature
CREATE OR REPLACE FUNCTION public.find_nearby_drivers(
  pickup_lat numeric,
  pickup_lng numeric,
  max_distance_km numeric DEFAULT 15,
  vehicle_class_filter text DEFAULT NULL
)
RETURNS TABLE(
  driver_id uuid,
  distance_km numeric,
  vehicle_class text,
  rating_average numeric,
  total_rides integer,
  is_verified boolean,
  latitude numeric,
  longitude numeric,
  last_ping timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    dl.driver_id,
    -- Calcul de distance haversine en km
    (6371 * acos(
      cos(radians(pickup_lat)) * 
      cos(radians(dl.latitude)) * 
      cos(radians(dl.longitude) - radians(pickup_lng)) + 
      sin(radians(pickup_lat)) * 
      sin(radians(dl.latitude))
    ))::numeric as distance_km,
    COALESCE(dl.vehicle_class, 'standard') as vehicle_class,
    COALESCE(dp.rating_average, 0) as rating_average,
    COALESCE(dp.total_rides, 0) as total_rides,
    COALESCE(dp.verification_status = 'verified', false) as is_verified,
    dl.latitude,
    dl.longitude,
    dl.last_ping
  FROM driver_locations dl
  JOIN chauffeurs c ON dl.driver_id = c.user_id
  LEFT JOIN driver_profiles dp ON dl.driver_id = dp.user_id
  WHERE 
    -- Chauffeur actif et en ligne
    dl.is_online = true 
    AND dl.is_available = true
    AND c.is_active = true
    AND c.verification_status IN ('verified', 'pending')
    -- Ping récent (moins de 5 minutes)
    AND dl.last_ping > now() - interval '5 minutes'
    -- Filtre par classe de véhicule si spécifié
    AND (vehicle_class_filter IS NULL OR COALESCE(dl.vehicle_class, 'standard') = vehicle_class_filter)
    -- Filtre par distance
    AND (6371 * acos(
      cos(radians(pickup_lat)) * 
      cos(radians(dl.latitude)) * 
      cos(radians(dl.longitude) - radians(pickup_lng)) + 
      sin(radians(pickup_lat)) * 
      sin(radians(dl.latitude))
    )) <= max_distance_km
  ORDER BY distance_km ASC
  LIMIT 20;
END;
$function$;