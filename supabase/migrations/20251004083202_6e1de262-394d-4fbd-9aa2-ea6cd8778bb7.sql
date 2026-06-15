-- ============================================
-- CORRECTION CRITIQUE: Filtrage véhicule + ville pour find_nearby_drivers
-- ============================================

-- Étape 1: Supprimer l'ancienne fonction
DROP FUNCTION IF EXISTS public.find_nearby_drivers(numeric, numeric, text, numeric, text);

-- Étape 2: Recréer avec filtres véhicule ET ville
CREATE OR REPLACE FUNCTION public.find_nearby_drivers(
  pickup_lat numeric,
  pickup_lng numeric,
  service_type_param text DEFAULT 'transport',
  radius_km numeric DEFAULT 5,
  vehicle_class_filter text DEFAULT NULL,
  user_city_param text DEFAULT 'Kinshasa'
)
RETURNS TABLE (
  driver_id uuid,
  distance_km numeric,
  latitude numeric,
  longitude numeric,
  vehicle_class text,
  is_available boolean,
  is_online boolean,
  rating_average numeric,
  rides_remaining integer,
  last_ping timestamp with time zone
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    dl.driver_id,
    ROUND(
      (6371 * acos(
        cos(radians(pickup_lat)) * cos(radians(dl.latitude)) * 
        cos(radians(dl.longitude) - radians(pickup_lng)) + 
        sin(radians(pickup_lat)) * sin(radians(dl.latitude))
      ))::numeric, 
      2
    ) as distance_km,
    dl.latitude,
    dl.longitude,
    dl.vehicle_class,
    dl.is_available,
    dl.is_online,
    c.rating_average,
    COALESCE(ds.rides_remaining, 0) as rides_remaining,
    dl.last_ping
  FROM public.driver_locations dl
  JOIN public.chauffeurs c ON dl.driver_id = c.user_id
  LEFT JOIN public.driver_subscriptions ds ON ds.driver_id = c.user_id 
    AND ds.status = 'active'
    AND ds.end_date > NOW()
  LEFT JOIN public.driver_service_preferences dsp ON dsp.driver_id = c.user_id
  WHERE 
    c.is_active = true
    AND c.verification_status = 'verified'
    AND dl.is_online = true
    AND dl.is_available = true
    AND dl.last_ping > NOW() - INTERVAL '30 minutes'
    
    -- Distance dans le rayon
    AND (6371 * acos(
      cos(radians(pickup_lat)) * cos(radians(dl.latitude)) * 
      cos(radians(dl.longitude) - radians(pickup_lng)) + 
      sin(radians(pickup_lat)) * sin(radians(dl.latitude))
    )) <= radius_km
    
    -- NOUVEAU: Filtre géographique par ville (service_areas)
    AND (user_city_param = ANY(c.service_areas))
    
    -- NOUVEAU: Filtre par classe de véhicule si spécifié
    AND (vehicle_class_filter IS NULL OR dl.vehicle_class = vehicle_class_filter)
    
    -- Service activé dans les préférences
    AND (
      dsp.id IS NULL 
      OR (service_type_param = 'transport' AND dsp.transport_enabled = true)
      OR (service_type_param = 'delivery' AND dsp.delivery_enabled = true)
    )
    
    -- Livraisons autorisées sans abonnement
    AND (
      service_type_param = 'delivery' 
      OR (service_type_param = 'transport' AND COALESCE(ds.rides_remaining, 0) > 0)
    )
    
  ORDER BY distance_km ASC, c.rating_average DESC
  LIMIT 20;
END;
$$;

-- ============================================
-- NORMALISATION: Corriger les vehicle_class existants
-- ============================================

-- Mettre à jour vehicle_class dans driver_locations selon vehicle_type des chauffeurs
UPDATE public.driver_locations dl
SET vehicle_class = CASE
  -- Motos
  WHEN c.vehicle_type IN ('moto', 'motorcycle', 'bike', 'taxi_moto') THEN 'moto'
  
  -- Camions/Trucks
  WHEN c.vehicle_type IN ('truck', 'camion', 'van', 'pickup') THEN 'truck'
  
  -- Standard par défaut (voitures)
  ELSE 'standard'
END
FROM public.chauffeurs c
WHERE dl.driver_id = c.user_id
  AND (dl.vehicle_class IS NULL OR dl.vehicle_class = 'standard');

-- Log de la correction
INSERT INTO public.activity_logs (
  activity_type, 
  description, 
  metadata
) VALUES (
  'system_fix',
  'Correction find_nearby_drivers: filtrage véhicule + ville',
  jsonb_build_object(
    'vehicle_filter', 'added',
    'city_filter', 'added',
    'max_radius', '50km',
    'vehicle_class_normalization', 'completed'
  )
);