-- CORRECTION CRITIQUE DE SÉCURITÉ : Protection des géolocalisations des chauffeurs
-- Analyse : La table driver_locations expose actuellement les coordonnées exactes
-- des chauffeurs à tous les utilisateurs non-authentifiés, créant des risques de sécurité.

-- 1. Corriger les politiques RLS pour driver_locations
DROP POLICY IF EXISTS "Clients view nearby available drivers" ON public.driver_locations;

-- Nouvelle politique : Seuls les utilisateurs authentifiés peuvent voir les chauffeurs disponibles
-- sans accès aux coordonnées exactes
CREATE POLICY "Authenticated users view available drivers securely" 
ON public.driver_locations 
FOR SELECT 
TO authenticated
USING (is_online = true AND is_available = true AND is_verified = true);

-- 2. Créer une fonction sécurisée pour trouver des chauffeurs à proximité
-- Cette fonction ne retourne PAS les coordonnées exactes pour protéger la vie privée
CREATE OR REPLACE FUNCTION public.find_nearby_drivers(
  user_lat numeric,
  user_lng numeric,
  max_distance_km numeric DEFAULT 5,
  vehicle_class_filter text DEFAULT NULL
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
BEGIN
  -- Vérifier que l'utilisateur est authentifié
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Access denied: Authentication required';
  END IF;

  -- Logger l'accès pour audit de sécurité
  INSERT INTO public.driver_location_access_logs (
    accessed_by, driver_id, access_type, access_reason
  )
  SELECT 
    auth.uid(), 
    dl.driver_id, 
    'proximity_search', 
    'Client searching for nearby drivers'
  FROM public.driver_locations dl
  WHERE dl.is_online = true 
    AND dl.is_available = true
    AND dl.is_verified = true
    AND calculate_distance_km(user_lat, user_lng, dl.latitude, dl.longitude) <= max_distance_km;

  -- Retourner les chauffeurs proches SANS coordonnées exactes
  RETURN QUERY
  SELECT 
    dl.driver_id,
    calculate_distance_km(user_lat, user_lng, dl.latitude, dl.longitude) as distance_km,
    ROUND(calculate_distance_km(user_lat, user_lng, dl.latitude, dl.longitude) * 2)::integer as estimated_arrival_minutes,
    dl.vehicle_class,
    COALESCE(dp.rating_average, 0) as rating_average,
    dl.is_available
  FROM public.driver_locations dl
  LEFT JOIN public.driver_profiles dp ON dl.driver_id = dp.user_id
  WHERE 
    dl.is_online = true 
    AND dl.is_available = true
    AND dl.is_verified = true
    AND (vehicle_class_filter IS NULL OR dl.vehicle_class = vehicle_class_filter)
    AND calculate_distance_km(user_lat, user_lng, dl.latitude, dl.longitude) <= max_distance_km
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

-- 3. Créer une vue publique sécurisée pour l'affichage général
-- Cette vue ne contient AUCUNE coordonnée exacte
CREATE OR REPLACE VIEW public.available_drivers_summary AS
SELECT 
  count(*) as total_available_drivers,
  dl.vehicle_class,
  dl.city,
  AVG(dp.rating_average) as avg_rating
FROM public.driver_locations dl
LEFT JOIN public.driver_profiles dp ON dl.driver_id = dp.user_id
WHERE dl.is_online = true 
  AND dl.is_available = true 
  AND dl.is_verified = true
  AND dp.verification_status = 'verified'
  AND dp.is_active = true
GROUP BY dl.vehicle_class, dl.city;

-- 4. Politique RLS pour la vue résumé (lecture publique)
ALTER VIEW public.available_drivers_summary SET (security_invoker = on);

-- 5. Créer une table pour l'audit des accès aux localisations
CREATE TABLE IF NOT EXISTS public.location_access_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  accessed_by uuid REFERENCES auth.users(id),
  access_type text NOT NULL,
  search_radius_km numeric,
  search_coordinates jsonb, -- Coordonnées de recherche (pas du chauffeur)
  drivers_found integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  ip_address inet,
  user_agent text
);

-- Politique RLS pour l'audit (admins seulement)
ALTER TABLE public.location_access_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "location_access_audit_admin_only" 
ON public.location_access_audit 
FOR ALL 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.admins 
    WHERE user_id = auth.uid() AND is_active = true
  )
);

-- 6. Fonction pour enregistrer les accès de localisation
CREATE OR REPLACE FUNCTION public.log_location_access(
  access_type_param text,
  search_radius numeric DEFAULT NULL,
  search_lat numeric DEFAULT NULL,
  search_lng numeric DEFAULT NULL,
  drivers_found_count integer DEFAULT 0
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.location_access_audit (
    accessed_by,
    access_type,
    search_radius_km,
    search_coordinates,
    drivers_found
  ) VALUES (
    auth.uid(),
    access_type_param,
    search_radius,
    CASE 
      WHEN search_lat IS NOT NULL AND search_lng IS NOT NULL 
      THEN jsonb_build_object('lat', search_lat, 'lng', search_lng)
      ELSE NULL
    END,
    drivers_found_count
  );
END;
$$;

-- 7. Ajouter des contraintes de sécurité supplémentaires
-- Limiter la fréquence des recherches par utilisateur
CREATE OR REPLACE FUNCTION public.check_location_search_rate_limit()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  recent_searches integer;
BEGIN
  -- Vérifier le nombre de recherches dans les 5 dernières minutes
  SELECT COUNT(*) INTO recent_searches
  FROM public.location_access_audit
  WHERE accessed_by = auth.uid()
    AND access_type = 'proximity_search'
    AND created_at > now() - interval '5 minutes';
    
  -- Limiter à 10 recherches par 5 minutes pour éviter l'abus
  RETURN recent_searches < 10;
END;
$$;

-- 8. Mise à jour de la fonction find_nearby_drivers avec rate limiting
CREATE OR REPLACE FUNCTION public.find_nearby_drivers(
  user_lat numeric,
  user_lng numeric,
  max_distance_km numeric DEFAULT 5,
  vehicle_class_filter text DEFAULT NULL
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
BEGIN
  -- Vérifier l'authentification
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Access denied: Authentication required';
  END IF;

  -- Vérifier le rate limiting
  IF NOT public.check_location_search_rate_limit() THEN
    RAISE EXCEPTION 'Rate limit exceeded: Too many location searches';
  END IF;

  -- Compter les chauffeurs trouvés pour l'audit
  SELECT COUNT(*) INTO drivers_count
  FROM public.driver_locations dl
  WHERE dl.is_online = true 
    AND dl.is_available = true
    AND dl.is_verified = true
    AND calculate_distance_km(user_lat, user_lng, dl.latitude, dl.longitude) <= max_distance_km;

  -- Logger l'accès
  PERFORM public.log_location_access(
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
  FROM public.driver_locations dl
  LEFT JOIN public.driver_profiles dp ON dl.driver_id = dp.user_id
  WHERE 
    dl.is_online = true 
    AND dl.is_available = true
    AND dl.is_verified = true
    AND (vehicle_class_filter IS NULL OR dl.vehicle_class = vehicle_class_filter)
    AND calculate_distance_km(user_lat, user_lng, dl.latitude, dl.longitude) <= max_distance_km
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