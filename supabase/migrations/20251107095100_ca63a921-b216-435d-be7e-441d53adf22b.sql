-- Migration pour aligner find_nearby_drivers_secure avec find_nearby_drivers
-- Supprimer toutes les versions existantes de find_nearby_drivers_secure

DO $$ 
DECLARE
    func_record RECORD;
BEGIN
    -- Boucle sur toutes les versions de find_nearby_drivers_secure
    FOR func_record IN 
        SELECT 
            p.oid::regprocedure AS func_signature
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' 
        AND p.proname = 'find_nearby_drivers_secure'
    LOOP
        EXECUTE 'DROP FUNCTION ' || func_record.func_signature || ' CASCADE';
        RAISE NOTICE 'Dropped function: %', func_record.func_signature;
    END LOOP;
END $$;

-- Créer la nouvelle version alignée avec find_nearby_drivers
CREATE OR REPLACE FUNCTION public.find_nearby_drivers_secure(
  user_lat numeric,
  user_lng numeric,
  max_distance_km numeric DEFAULT 5,
  vehicle_class_filter text DEFAULT NULL,
  service_type_filter text DEFAULT 'delivery'
)
RETURNS TABLE (
  driver_id uuid,
  user_id uuid,
  vehicle_class text,
  service_type text,
  is_available boolean,
  is_online boolean,
  last_ping timestamptz,
  distance_km numeric,
  rating_average numeric,
  rides_remaining integer,
  current_lat numeric,
  current_lng numeric,
  display_name text,
  phone_number text
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Appeler find_nearby_drivers avec les mêmes paramètres
  RETURN QUERY
  SELECT * FROM public.find_nearby_drivers(
    user_lat, 
    user_lng, 
    service_type_filter,
    max_distance_km,
    vehicle_class_filter,
    NULL -- user_city_param (optionnel)
  );
END;
$$;

-- Ajouter un commentaire pour documentation
COMMENT ON FUNCTION public.find_nearby_drivers_secure IS 
'Version sécurisée de find_nearby_drivers avec SECURITY DEFINER. 
Utilisée par les edge functions pour rechercher des chauffeurs disponibles.
Supporte les filtres par vehicle_class et service_type.';

-- Grant nécessaire pour l'utilisation par les edge functions
GRANT EXECUTE ON FUNCTION public.find_nearby_drivers_secure TO authenticated;
GRANT EXECUTE ON FUNCTION public.find_nearby_drivers_secure TO anon;