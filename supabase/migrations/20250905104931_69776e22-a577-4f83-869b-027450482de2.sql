-- CORRECTION CRITIQUE DE SÉCURITÉ : Phase 3 - Fonction sécurisée finale et corrections de sécurité

-- 1. Créer la fonction sécurisée pour trouver des chauffeurs à proximité
-- Cette fonction ne retourne PAS les coordonnées exactes pour protéger la vie privée
CREATE OR REPLACE FUNCTION public.find_nearby_drivers_secure(
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
    AND COALESCE(dl.is_verified, false) = true
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
    AND COALESCE(dl.is_verified, false) = true
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

-- 2. Créer une politique RLS spécifique pour accès admin complet aux driver_locations
CREATE POLICY "Admins full access to driver locations" 
ON public.driver_locations 
FOR ALL 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.admins 
    WHERE user_id = auth.uid() AND is_active = true
  )
);

-- 3. Ajouter un commentaire de sécurité sur la table driver_locations
COMMENT ON TABLE public.driver_locations IS 
'SÉCURITÉ CRITIQUE: Cette table contient des géolocalisations sensibles. 
Accès restreint aux chauffeurs (leurs propres données), admins et clients authentifiés (via fonction sécurisée seulement).
Utiliser find_nearby_drivers_secure() pour les recherches clients.';

-- 4. Créer des indexes pour optimiser les recherches sécurisées
CREATE INDEX IF NOT EXISTS idx_driver_locations_security_search 
ON public.driver_locations (is_online, is_available, is_verified) 
WHERE is_online = true AND is_available = true AND COALESCE(is_verified, false) = true;

-- 5. Ajouter des contraintes de sécurité supplémentaires
-- Empêcher les coordonnées manifestement incorrectes
ALTER TABLE public.driver_locations 
ADD CONSTRAINT chk_latitude_range CHECK (latitude >= -90 AND latitude <= 90);

ALTER TABLE public.driver_locations 
ADD CONSTRAINT chk_longitude_range CHECK (longitude >= -180 AND longitude <= 180);

-- 6. Fonction pour anonymiser les anciennes données de localisation (pour nettoyage)
CREATE OR REPLACE FUNCTION public.anonymize_old_location_data(days_old integer DEFAULT 30)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count integer;
BEGIN
  -- Seuls les admins peuvent exécuter cette fonction
  IF NOT EXISTS (
    SELECT 1 FROM public.admins 
    WHERE user_id = auth.uid() AND is_active = true
  ) THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;

  -- Supprimer les anciennes positions de localisation pour protéger la vie privée
  DELETE FROM public.driver_locations 
  WHERE updated_at < now() - (days_old || ' days')::interval
    AND is_online = false;
    
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  -- Logger l'opération
  INSERT INTO public.location_access_audit (
    accessed_by, access_type, drivers_found
  ) VALUES (
    auth.uid(), 'data_anonymization', deleted_count
  );
  
  RETURN deleted_count;
END;
$$;