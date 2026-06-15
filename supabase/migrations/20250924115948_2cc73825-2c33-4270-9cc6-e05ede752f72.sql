-- Supprimer l'ancienne fonction find_nearby_drivers et la recréer correctement
DROP FUNCTION IF EXISTS public.find_nearby_drivers(numeric,numeric,text,numeric);

-- Créer la fonction find_nearby_drivers corrigée
CREATE OR REPLACE FUNCTION public.find_nearby_drivers(
  pickup_lat numeric,
  pickup_lng numeric,
  service_type_param text DEFAULT 'taxi',
  radius_km numeric DEFAULT 15
)
RETURNS TABLE(
  driver_id uuid,
  latitude numeric,
  longitude numeric,
  distance_km numeric,
  vehicle_class text,
  is_available boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  search_user_id uuid := auth.uid();
  drivers_found_count integer := 0;
BEGIN
  -- Logger la recherche de chauffeurs
  IF search_user_id IS NOT NULL THEN
    PERFORM log_location_access(
      'proximity_search',
      radius_km,
      pickup_lat,
      pickup_lng,
      0 -- sera mis à jour plus tard
    );
  END IF;

  RETURN QUERY
  SELECT 
    dl.driver_id,
    dl.latitude,
    dl.longitude,
    calculate_distance_km(pickup_lat, pickup_lng, dl.latitude, dl.longitude) as distance_km,
    COALESCE(dl.vehicle_class, 'standard') as vehicle_class,
    dl.is_available
  FROM public.driver_locations dl
  INNER JOIN public.chauffeurs c ON dl.driver_id = c.user_id
  WHERE dl.is_online = true 
    AND dl.is_available = true
    AND c.is_active = true
    AND c.verification_status = 'verified'
    AND calculate_distance_km(pickup_lat, pickup_lng, dl.latitude, dl.longitude) <= radius_km
    AND dl.last_ping > now() - interval '10 minutes'
  ORDER BY calculate_distance_km(pickup_lat, pickup_lng, dl.latitude, dl.longitude) ASC
  LIMIT 10;

  -- Compter les résultats pour le logging
  GET DIAGNOSTICS drivers_found_count = ROW_COUNT;
  
  -- Mettre à jour le log avec le nombre trouvé
  IF search_user_id IS NOT NULL THEN
    PERFORM log_location_access(
      'proximity_search_result',
      radius_km,
      pickup_lat,
      pickup_lng,
      drivers_found_count
    );
  END IF;
END;
$$;