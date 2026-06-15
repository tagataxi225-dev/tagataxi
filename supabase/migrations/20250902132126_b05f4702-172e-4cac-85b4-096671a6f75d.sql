-- Sécuriser la table driver_locations pour éviter le stalking des chauffeurs

-- 1. Supprimer la politique dangereuse qui permet à tout le monde de voir les locations
DROP POLICY IF EXISTS "Users can view online drivers for matching" ON public.driver_locations;

-- 2. Créer une nouvelle politique restrictive pour les admins/dispatchers seulement
CREATE POLICY "Admins can view all driver locations" ON public.driver_locations
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.admins 
    WHERE user_id = auth.uid() AND is_active = true
  )
);

-- 3. Créer une fonction sécurisée pour le matching des chauffeurs
-- Cette fonction ne révèle que les informations nécessaires sans exposer les coordonnées exactes
CREATE OR REPLACE FUNCTION public.find_nearby_drivers(
  pickup_lat numeric,
  pickup_lng numeric,
  max_distance_km numeric DEFAULT 5,
  vehicle_class_filter text DEFAULT 'standard'
) RETURNS TABLE (
  driver_id uuid,
  distance_km numeric,
  estimated_arrival_minutes integer,
  vehicle_class text,
  rating_average numeric
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    dl.driver_id,
    calculate_distance_km(pickup_lat, pickup_lng, dl.latitude, dl.longitude) as distance_km,
    ROUND(calculate_distance_km(pickup_lat, pickup_lng, dl.latitude, dl.longitude) * 2)::integer as estimated_arrival_minutes,
    dl.vehicle_class,
    COALESCE(dp.rating_average, 0) as rating_average
  FROM public.driver_locations dl
  LEFT JOIN public.driver_profiles dp ON dl.driver_id = dp.user_id
  WHERE 
    dl.is_online = true 
    AND dl.is_available = true
    AND dl.last_ping > now() - interval '5 minutes'
    AND (vehicle_class_filter IS NULL OR dl.vehicle_class = vehicle_class_filter)
    AND calculate_distance_km(pickup_lat, pickup_lng, dl.latitude, dl.longitude) <= max_distance_km
    AND EXISTS (
      SELECT 1 FROM public.driver_profiles 
      WHERE user_id = dl.driver_id 
        AND verification_status = 'verified' 
        AND is_active = true
    )
  ORDER BY distance_km ASC
  LIMIT 10;
END;
$$;

-- 4. Politique pour permettre aux clients d'utiliser la fonction de matching
-- (Mais pas d'accès direct aux coordonnées)
CREATE POLICY "Authenticated users can use driver matching function" ON public.driver_locations
FOR SELECT 
USING (false); -- Pas d'accès direct, seulement via la fonction

-- 5. Créer une fonction pour obtenir des zones approximatives au lieu de coordonnées exactes
CREATE OR REPLACE FUNCTION public.get_driver_zones(
  zone_radius_km numeric DEFAULT 2
) RETURNS TABLE (
  zone_center_lat numeric,
  zone_center_lng numeric,
  driver_count integer,
  average_wait_time_minutes integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Retourner des zones approximatives avec le nombre de chauffeurs disponibles
  -- sans révéler les positions exactes
  RETURN QUERY
  WITH driver_zones AS (
    SELECT 
      ROUND(dl.latitude::numeric, 2) as zone_lat,
      ROUND(dl.longitude::numeric, 2) as zone_lng,
      COUNT(*) as drivers_in_zone
    FROM public.driver_locations dl
    WHERE 
      dl.is_online = true 
      AND dl.is_available = true
      AND dl.last_ping > now() - interval '5 minutes'
    GROUP BY ROUND(dl.latitude::numeric, 2), ROUND(dl.longitude::numeric, 2)
    HAVING COUNT(*) > 0
  )
  SELECT 
    zone_lat,
    zone_lng,
    drivers_in_zone::integer,
    (2 + (drivers_in_zone * 1))::integer as avg_wait_time
  FROM driver_zones
  ORDER BY drivers_in_zone DESC;
END;
$$;

-- 6. Accorder l'accès aux fonctions sécurisées
GRANT EXECUTE ON FUNCTION public.find_nearby_drivers TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_driver_zones TO authenticated;

-- 7. Ajouter une politique pour que les chauffeurs puissent voir leur propre localisation (inchangé)
-- Cette politique existe déjà : "Drivers can manage their own location"

-- 8. Créer un audit log pour les accès aux données de localisation sensibles
CREATE TABLE IF NOT EXISTS public.driver_location_access_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  accessed_by uuid NOT NULL,
  driver_id uuid NOT NULL,
  access_type text NOT NULL,
  access_reason text,
  ip_address inet,
  user_agent text,
  created_at timestamp with time zone DEFAULT now()
);

-- RLS pour les logs d'audit
ALTER TABLE public.driver_location_access_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can view location access logs" ON public.driver_location_access_logs
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.admins 
    WHERE user_id = auth.uid() AND is_active = true
  )
);

-- 9. Fonction pour logger les accès sensibles
CREATE OR REPLACE FUNCTION public.log_driver_location_access(
  p_driver_id uuid,
  p_access_type text,
  p_access_reason text DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.driver_location_access_logs (
    accessed_by, driver_id, access_type, access_reason
  ) VALUES (
    auth.uid(), p_driver_id, p_access_type, p_access_reason
  );
END;
$$;