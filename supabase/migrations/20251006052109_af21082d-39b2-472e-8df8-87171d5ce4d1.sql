-- ============================================
-- CORRECTION SYSTÈME DE RECHERCHE DE CHAUFFEURS LIVRAISON
-- ============================================

-- ============================================
-- ÉTAPE 1 : Supprimer les anciennes fonctions RPC en doublon
-- ============================================

DROP FUNCTION IF EXISTS public.find_nearby_drivers(numeric, numeric, numeric, text);
DROP FUNCTION IF EXISTS public.find_nearby_drivers_secure(numeric, numeric, numeric, text);

-- ============================================
-- ÉTAPE 2 : Créer la fonction RPC principale avec filtre service_type
-- ============================================

CREATE OR REPLACE FUNCTION public.find_nearby_drivers(
  p_lat numeric,
  p_lng numeric,
  p_max_distance_km numeric DEFAULT 5,
  p_vehicle_class text DEFAULT NULL,
  p_service_type text DEFAULT NULL
)
RETURNS TABLE (
  driver_id uuid,
  distance_km numeric,
  estimated_arrival_minutes integer,
  vehicle_class text,
  rating_average numeric,
  is_available boolean,
  service_type text,
  rides_remaining integer
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
        cos(radians(p_lat)) * cos(radians(dl.latitude)) * 
        cos(radians(dl.longitude) - radians(p_lng)) + 
        sin(radians(p_lat)) * sin(radians(dl.latitude))
      ))::numeric, 
      2
    ) AS distance_km,
    CEIL(
      (6371 * acos(
        cos(radians(p_lat)) * cos(radians(dl.latitude)) * 
        cos(radians(dl.longitude) - radians(p_lng)) + 
        sin(radians(p_lat)) * sin(radians(dl.latitude))
      ) / 30 * 60)::numeric
    )::integer AS estimated_arrival_minutes,
    COALESCE(dl.vehicle_class, 'standard') AS vehicle_class,
    COALESCE(c.rating_average, 0) AS rating_average,
    dl.is_available,
    COALESCE(c.service_type, 'taxi') AS service_type,
    COALESCE(ds.rides_remaining, 0) AS rides_remaining
  FROM public.driver_locations dl
  INNER JOIN public.chauffeurs c ON dl.driver_id = c.user_id
  LEFT JOIN public.driver_subscriptions ds ON c.user_id = ds.driver_id 
    AND ds.status = 'active' 
    AND ds.end_date > NOW()
  WHERE dl.is_online = true
    AND dl.is_available = true
    AND dl.last_ping > NOW() - INTERVAL '5 minutes'
    AND c.verification_status = 'verified'
    AND c.is_active = true
    AND (p_vehicle_class IS NULL OR dl.vehicle_class = p_vehicle_class)
    AND (p_service_type IS NULL OR c.service_type = p_service_type OR c.service_type = 'both')
    AND (
      6371 * acos(
        cos(radians(p_lat)) * cos(radians(dl.latitude)) * 
        cos(radians(dl.longitude) - radians(p_lng)) + 
        sin(radians(p_lat)) * sin(radians(dl.latitude))
      )
    ) <= p_max_distance_km
  ORDER BY distance_km ASC, rating_average DESC
  LIMIT 20;
END;
$$;

-- ============================================
-- ÉTAPE 3 : Créer une RPC spécifique pour les livraisons
-- ============================================

CREATE OR REPLACE FUNCTION public.find_nearby_delivery_drivers(
  p_lat numeric,
  p_lng numeric,
  p_max_distance_km numeric DEFAULT 15,
  p_delivery_type text DEFAULT NULL
)
RETURNS TABLE (
  driver_id uuid,
  distance_km numeric,
  estimated_arrival_minutes integer,
  vehicle_class text,
  rating_average numeric,
  is_available boolean,
  service_type text,
  delivery_capacity text
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
        cos(radians(p_lat)) * cos(radians(dl.latitude)) * 
        cos(radians(dl.longitude) - radians(p_lng)) + 
        sin(radians(p_lat)) * sin(radians(dl.latitude))
      ))::numeric, 
      2
    ) AS distance_km,
    CEIL(
      (6371 * acos(
        cos(radians(p_lat)) * cos(radians(dl.latitude)) * 
        cos(radians(dl.longitude) - radians(p_lng)) + 
        sin(radians(p_lat)) * sin(radians(dl.latitude))
      ) / 30 * 60)::numeric
    )::integer AS estimated_arrival_minutes,
    COALESCE(dl.vehicle_class, 'moto') AS vehicle_class,
    COALESCE(c.rating_average, 0) AS rating_average,
    dl.is_available,
    COALESCE(c.service_type, 'delivery') AS service_type,
    COALESCE(c.delivery_capacity, 'small') AS delivery_capacity
  FROM public.driver_locations dl
  INNER JOIN public.chauffeurs c ON dl.driver_id = c.user_id
  WHERE dl.is_online = true
    AND dl.is_available = true
    AND dl.last_ping > NOW() - INTERVAL '5 minutes'
    AND c.verification_status = 'verified'
    AND c.is_active = true
    AND (c.service_type = 'delivery' OR c.service_type = 'both')
    AND (p_delivery_type IS NULL OR c.delivery_capacity = p_delivery_type OR c.delivery_capacity IS NULL)
    AND (
      6371 * acos(
        cos(radians(p_lat)) * cos(radians(dl.latitude)) * 
        cos(radians(dl.longitude) - radians(p_lng)) + 
        sin(radians(p_lat)) * sin(radians(dl.latitude))
      )
    ) <= p_max_distance_km
  ORDER BY distance_km ASC, rating_average DESC
  LIMIT 20;
END;
$$;

-- ============================================
-- ÉTAPE 6 : Script de debug pour les admins
-- ============================================

CREATE OR REPLACE FUNCTION public.debug_driver_availability(
  p_lat numeric DEFAULT -4.3217,
  p_lng numeric DEFAULT 15.3069,
  p_service_type text DEFAULT 'delivery'
)
RETURNS TABLE (
  metric text,
  count bigint,
  details jsonb
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  -- Total chauffeurs
  SELECT 
    'total_drivers'::text,
    COUNT(*)::bigint,
    jsonb_build_object('description', 'Nombre total de chauffeurs dans la base')
  FROM public.chauffeurs
  
  UNION ALL
  
  -- Chauffeurs actifs
  SELECT 
    'active_drivers'::text,
    COUNT(*)::bigint,
    jsonb_build_object('description', 'Chauffeurs avec is_active = true')
  FROM public.chauffeurs
  WHERE is_active = true
  
  UNION ALL
  
  -- Chauffeurs vérifiés
  SELECT 
    'verified_drivers'::text,
    COUNT(*)::bigint,
    jsonb_build_object('description', 'Chauffeurs avec verification_status = verified')
  FROM public.chauffeurs
  WHERE verification_status = 'verified'
  
  UNION ALL
  
  -- Chauffeurs avec service_type delivery
  SELECT 
    'delivery_service_drivers'::text,
    COUNT(*)::bigint,
    jsonb_build_object(
      'description', 'Chauffeurs avec service_type delivery ou both',
      'delivery', COUNT(*) FILTER (WHERE service_type = 'delivery'),
      'both', COUNT(*) FILTER (WHERE service_type = 'both')
    )
  FROM public.chauffeurs
  WHERE service_type IN ('delivery', 'both')
  
  UNION ALL
  
  -- Chauffeurs avec localisation
  SELECT 
    'drivers_with_location'::text,
    COUNT(*)::bigint,
    jsonb_build_object('description', 'Chauffeurs ayant une entrée dans driver_locations')
  FROM public.driver_locations
  
  UNION ALL
  
  -- Chauffeurs en ligne
  SELECT 
    'online_drivers'::text,
    COUNT(*)::bigint,
    jsonb_build_object('description', 'Chauffeurs avec is_online = true')
  FROM public.driver_locations
  WHERE is_online = true
  
  UNION ALL
  
  -- Chauffeurs disponibles
  SELECT 
    'available_drivers'::text,
    COUNT(*)::bigint,
    jsonb_build_object('description', 'Chauffeurs en ligne ET disponibles')
  FROM public.driver_locations
  WHERE is_online = true AND is_available = true
  
  UNION ALL
  
  -- Chauffeurs avec ping récent
  SELECT 
    'recent_ping_drivers'::text,
    COUNT(*)::bigint,
    jsonb_build_object(
      'description', 'Chauffeurs avec last_ping < 5 minutes',
      'oldest_ping', MAX(last_ping),
      'newest_ping', MIN(last_ping)
    )
  FROM public.driver_locations
  WHERE last_ping > NOW() - INTERVAL '5 minutes'
  
  UNION ALL
  
  -- Chauffeurs eligibles delivery (tous critères)
  SELECT 
    'eligible_delivery_drivers'::text,
    COUNT(*)::bigint,
    jsonb_build_object(
      'description', 'Chauffeurs remplissant TOUS les critères de livraison',
      'sample_drivers', jsonb_agg(
        jsonb_build_object(
          'driver_id', dl.driver_id,
          'service_type', c.service_type,
          'is_online', dl.is_online,
          'is_available', dl.is_available,
          'last_ping_ago', EXTRACT(EPOCH FROM (NOW() - dl.last_ping))::integer,
          'verification_status', c.verification_status
        )
      )
    )
  FROM public.driver_locations dl
  INNER JOIN public.chauffeurs c ON dl.driver_id = c.user_id
  WHERE dl.is_online = true
    AND dl.is_available = true
    AND dl.last_ping > NOW() - INTERVAL '5 minutes'
    AND c.verification_status = 'verified'
    AND c.is_active = true
    AND (c.service_type = p_service_type OR c.service_type = 'both')
  
  UNION ALL
  
  -- Chauffeurs dans le rayon de recherche
  SELECT 
    'drivers_in_radius'::text,
    COUNT(*)::bigint,
    jsonb_build_object(
      'description', 'Chauffeurs dans un rayon de 15km',
      'search_lat', p_lat,
      'search_lng', p_lng
    )
  FROM public.driver_locations dl
  INNER JOIN public.chauffeurs c ON dl.driver_id = c.user_id
  WHERE (
    6371 * acos(
      cos(radians(p_lat)) * cos(radians(dl.latitude)) * 
      cos(radians(dl.longitude) - radians(p_lng)) + 
      sin(radians(p_lat)) * sin(radians(dl.latitude))
    )
  ) <= 15
  
  ORDER BY metric;
END;
$$;

-- Commentaire pour documentation
COMMENT ON FUNCTION public.find_nearby_delivery_drivers IS 'RPC spécifique pour trouver des livreurs - ne vérifie PAS rides_remaining - rayon 15km';
COMMENT ON FUNCTION public.debug_driver_availability IS 'Fonction de debug pour diagnostiquer pourquoi aucun chauffeur n''est trouvé';