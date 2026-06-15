-- 🚨 CORRECTION CRITIQUE: Supprimer TOUTES les versions de find_nearby_drivers puis recréer

-- Supprimer toutes les versions existantes avec CASCADE
DO $$ 
DECLARE
    func_record RECORD;
BEGIN
    FOR func_record IN 
        SELECT 
            p.oid::regprocedure AS func_signature
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' 
        AND p.proname = 'find_nearby_drivers'
    LOOP
        EXECUTE 'DROP FUNCTION ' || func_record.func_signature || ' CASCADE';
        RAISE NOTICE 'Dropped function: %', func_record.func_signature;
    END LOOP;
END $$;

-- Créer avec les paramètres ALIGNÉS avec les edge functions
CREATE OR REPLACE FUNCTION find_nearby_drivers(
  p_lat numeric,
  p_lng numeric,
  p_service_type text DEFAULT 'taxi',
  p_max_distance_km numeric DEFAULT 15,
  p_vehicle_class text DEFAULT NULL,
  p_city text DEFAULT NULL
)
RETURNS TABLE (
  driver_id uuid,
  distance_km numeric,
  is_available boolean,
  vehicle_class text,
  rating_average numeric,
  total_rides integer,
  rides_remaining integer,
  service_type text,
  display_name text,
  phone_number text,
  vehicle_make text,
  vehicle_model text,
  vehicle_plate text,
  vehicle_color text
)
SECURITY INVOKER
SET search_path = public, pg_temp
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    dl.driver_id,
    ROUND(
      (6371 * acos(
        LEAST(1.0, GREATEST(-1.0,
          cos(radians(p_lat)) * 
          cos(radians(dl.latitude)) * 
          cos(radians(dl.longitude) - radians(p_lng)) + 
          sin(radians(p_lat)) * 
          sin(radians(dl.latitude))
        ))
      ))::numeric, 2
    ) as distance_km,
    dl.is_available,
    dl.vehicle_class,
    COALESCE(c.rating_average, 4.5) as rating_average,
    COALESCE(c.total_rides, 0) as total_rides,
    COALESCE(ds.rides_remaining, 999) as rides_remaining,
    COALESCE(c.service_type, 'taxi') as service_type,
    COALESCE(c.display_name, 'Chauffeur') as display_name,
    COALESCE(c.phone_number, '') as phone_number,
    COALESCE(c.vehicle_make, 'Toyota') as vehicle_make,
    COALESCE(c.vehicle_model, 'Corolla') as vehicle_model,
    COALESCE(c.vehicle_plate, 'ABC-123') as vehicle_plate,
    COALESCE(c.vehicle_color, 'Blanc') as vehicle_color
  FROM driver_locations dl
  JOIN chauffeurs c ON c.user_id = dl.driver_id
  LEFT JOIN driver_subscriptions ds ON ds.driver_id = dl.driver_id 
    AND ds.status = 'active'
    AND ds.end_date > now()
  WHERE 
    dl.is_online = true 
    AND dl.is_available = true
    AND c.is_active = true
    AND c.verification_status IN ('verified', 'approved')
    AND (
      p_service_type = 'delivery' 
      OR COALESCE(ds.rides_remaining, 0) > 0
    )
    AND (p_vehicle_class IS NULL OR dl.vehicle_class = p_vehicle_class)
    AND (p_city IS NULL OR c.service_areas @> ARRAY[p_city])
    AND (
      6371 * acos(
        LEAST(1.0, GREATEST(-1.0,
          cos(radians(p_lat)) * 
          cos(radians(dl.latitude)) * 
          cos(radians(dl.longitude) - radians(p_lng)) + 
          sin(radians(p_lat)) * 
          sin(radians(dl.latitude))
        ))
      )
    ) <= p_max_distance_km
  ORDER BY distance_km ASC
  LIMIT 20;
END;
$$;

COMMENT ON FUNCTION find_nearby_drivers IS 
'Trouve les chauffeurs disponibles à proximité. Paramètres alignés avec edge functions. Version: 2025-11-22';

GRANT EXECUTE ON FUNCTION find_nearby_drivers TO authenticated;
GRANT EXECUTE ON FUNCTION find_nearby_drivers TO anon;