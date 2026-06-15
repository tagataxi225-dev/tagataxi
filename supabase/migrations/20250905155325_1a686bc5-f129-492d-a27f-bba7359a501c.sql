-- CORRECTION CRITIQUE : Sécuriser l'accès aux coordonnées des chauffeurs (version corrigée)
-- Supprimer l'accès public aux coordonnées exactes des chauffeurs

-- 1. Supprimer la politique dangereuse qui expose les coordonnées à tous
DROP POLICY IF EXISTS "Authenticated users view available drivers securely" ON public.driver_locations;
DROP POLICY IF EXISTS "available_drivers_summary_public_read" ON public.driver_locations;

-- 2. Créer une politique stricte - seuls les chauffeurs voient leur propre localisation
CREATE POLICY "drivers_own_location_strict" ON public.driver_locations
FOR ALL TO authenticated
USING (auth.uid() = driver_id)
WITH CHECK (auth.uid() = driver_id);

-- 3. Seuls les admins peuvent voir toutes les localisations
CREATE POLICY "admins_view_all_locations_secure" ON public.driver_locations
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() 
      AND ur.role = 'admin'
      AND ur.is_active = true
  )
);

-- 4. Créer une vue sécurisée pour les statistiques publiques (sans coordonnées)
CREATE OR REPLACE VIEW public.driver_availability_summary AS
SELECT 
  vehicle_class,
  COUNT(*) FILTER (WHERE is_online = true AND is_available = true) as available_count,
  COUNT(*) FILTER (WHERE is_online = true) as online_count,
  -- Pas de coordonnées exactes, juste des statistiques par zone générale
  CASE 
    WHEN latitude BETWEEN -4.4 AND -4.2 AND longitude BETWEEN 15.2 AND 15.4 THEN 'centre'
    WHEN latitude BETWEEN -4.5 AND -4.3 AND longitude BETWEEN 15.1 AND 15.3 THEN 'ouest'
    WHEN latitude BETWEEN -4.3 AND -4.1 AND longitude BETWEEN 15.3 AND 15.5 THEN 'est'
    ELSE 'autre'
  END as zone_generale,
  AVG(CASE WHEN is_online = true THEN 1 ELSE 0 END) as availability_rate
FROM public.driver_locations dl
WHERE EXISTS (
  SELECT 1 FROM public.driver_profiles dp
  WHERE dp.user_id = dl.driver_id 
    AND dp.verification_status = 'verified' 
    AND dp.is_active = true
)
GROUP BY vehicle_class, zone_generale;

-- 5. Remplacer la fonction find_nearby_drivers_secure pour être plus sécurisée
CREATE OR REPLACE FUNCTION public.find_nearby_drivers_secure(
  user_lat numeric, 
  user_lng numeric, 
  max_distance_km numeric DEFAULT 5, 
  vehicle_class_filter text DEFAULT NULL::text
)
RETURNS TABLE(
  driver_id uuid, 
  distance_km numeric, 
  estimated_arrival_minutes integer, 
  vehicle_class text, 
  rating_average numeric, 
  is_available boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  drivers_count integer;
  user_role text;
BEGIN
  -- Vérifier l'authentification
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Access denied: Authentication required';
  END IF;

  -- Vérifier que l'utilisateur a le droit de chercher des chauffeurs
  SELECT role INTO user_role FROM user_roles WHERE user_id = auth.uid() AND is_active = true LIMIT 1;
  
  IF user_role NOT IN ('client', 'admin') THEN
    RAISE EXCEPTION 'Access denied: Insufficient permissions to search drivers';
  END IF;

  -- Vérifier le rate limiting
  IF NOT check_location_search_rate_limit() THEN
    RAISE EXCEPTION 'Rate limit exceeded: Too many location searches';
  END IF;

  -- Compter les chauffeurs trouvés pour l'audit
  SELECT COUNT(*) INTO drivers_count
  FROM driver_locations dl
  WHERE dl.is_online = true 
    AND dl.is_available = true
    AND COALESCE(dl.is_verified, false) = true
    AND calculate_distance_km(user_lat, user_lng, dl.latitude, dl.longitude) <= max_distance_km;

  -- Logger l'accès
  PERFORM log_location_access(
    'proximity_search',
    max_distance_km,
    user_lat,
    user_lng,
    drivers_count
  );

  -- Retourner les résultats sans coordonnées exactes
  RETURN QUERY
  SELECT 
    dl.driver_id,
    ROUND(calculate_distance_km(user_lat, user_lng, dl.latitude, dl.longitude), 1) as distance_km,
    ROUND(calculate_distance_km(user_lat, user_lng, dl.latitude, dl.longitude) * 2)::integer as estimated_arrival_minutes,
    dl.vehicle_class,
    COALESCE(dp.rating_average, 0) as rating_average,
    dl.is_available
  FROM driver_locations dl
  LEFT JOIN driver_profiles dp ON dl.driver_id = dp.user_id
  WHERE 
    dl.is_online = true 
    AND dl.is_available = true
    AND COALESCE(dl.is_verified, false) = true
    AND (vehicle_class_filter IS NULL OR dl.vehicle_class = vehicle_class_filter)
    AND calculate_distance_km(user_lat, user_lng, dl.latitude, dl.longitude) <= max_distance_km
    AND EXISTS (
      SELECT 1 FROM driver_profiles 
      WHERE user_id = dl.driver_id 
        AND verification_status = 'verified' 
        AND is_active = true
    )
  ORDER BY distance_km ASC
  LIMIT 10;
END;
$$;

-- 6. Fonction pour admins seulement - accès aux coordonnées exactes avec audit strict
CREATE OR REPLACE FUNCTION public.get_driver_exact_location_admin(p_driver_id uuid)
RETURNS TABLE(
  latitude numeric,
  longitude numeric,
  last_ping timestamp with time zone,
  is_online boolean,
  is_available boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Vérifier que seuls les admins peuvent accéder aux coordonnées exactes
  IF NOT EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid() 
      AND ur.role = 'admin'
      AND ur.is_active = true
  ) THEN
    RAISE EXCEPTION 'Access denied: Only admins can access exact driver locations';
  END IF;

  -- Logger l'accès pour audit de sécurité avec des détails complets
  PERFORM log_driver_location_access(p_driver_id, 'exact_coordinates_admin', 'Admin accessing exact driver location for operational purposes');

  RETURN QUERY
  SELECT 
    dl.latitude,
    dl.longitude,
    dl.last_ping,
    dl.is_online,
    dl.is_available
  FROM driver_locations dl
  WHERE dl.driver_id = p_driver_id;
END;
$$;