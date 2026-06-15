-- CORRECTION SÉCURITÉ CRITIQUE - Phase 2 Finale
-- Corriger les dernières vulnérabilités détectées

-- 1. Ajouter search_path aux fonctions manquantes
CREATE OR REPLACE FUNCTION public.get_user_roles(p_user_id uuid)
RETURNS TABLE(role text, admin_role text, permissions text[])
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF p_user_id != auth.uid() AND NOT EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() 
      AND ur.role = 'admin'
      AND ur.is_active = true
  ) THEN
    RAISE EXCEPTION 'Access denied: Cannot access other user roles';
  END IF;

  RETURN QUERY
  SELECT 
    ur.role::text,
    ur.admin_role::text,
    COALESCE(
      CASE ur.role::text
        WHEN 'admin' THEN ARRAY['system_admin', 'user_management', 'content_moderation']
        WHEN 'driver' THEN ARRAY['transport_manage', 'delivery_manage']
        WHEN 'partner' THEN ARRAY['fleet_management', 'driver_management']
        WHEN 'client' THEN ARRAY['transport_read', 'marketplace_read']
        ELSE ARRAY['basic_access']
      END,
      ARRAY['basic_access']
    ) as permissions
  FROM public.user_roles ur
  WHERE ur.user_id = p_user_id 
    AND ur.is_active = true
  ORDER BY 
    CASE ur.role::text
      WHEN 'admin' THEN 1
      WHEN 'partner' THEN 2  
      WHEN 'driver' THEN 3
      WHEN 'client' THEN 4
      ELSE 5
    END;
END;
$$;

-- 2. Fonction secure pour les places intelligentes
CREATE OR REPLACE FUNCTION public.intelligent_places_search_enhanced(
  search_query text DEFAULT ''::text, 
  search_city text DEFAULT 'Kinshasa'::text, 
  user_latitude numeric DEFAULT NULL::numeric, 
  user_longitude numeric DEFAULT NULL::numeric, 
  max_results integer DEFAULT 10, 
  include_nearby boolean DEFAULT true
)
RETURNS TABLE(
  id uuid, name text, category text, subcategory text, city text, 
  commune text, quartier text, avenue text, latitude numeric, longitude numeric, 
  hierarchy_level integer, popularity_score integer, relevance_score real, 
  distance_meters integer, formatted_address text, subtitle text, badge text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    search_ts tsquery;
BEGIN
    search_query := TRIM(COALESCE(search_query, ''));
    
    IF search_query = '' THEN
        RETURN QUERY
        SELECT 
            p.id, p.name, p.category, p.subcategory, p.city, p.commune, p.quartier, p.avenue,
            p.latitude, p.longitude, p.hierarchy_level, p.popularity_score,
            (p.popularity_score / 100.0)::REAL as relevance_score,
            CASE 
                WHEN user_latitude IS NOT NULL AND user_longitude IS NOT NULL AND p.latitude IS NOT NULL AND p.longitude IS NOT NULL
                THEN calculate_distance_meters(user_latitude, user_longitude, p.latitude, p.longitude)
                ELSE NULL
            END as distance_meters,
            COALESCE(p.avenue || ', ' || p.quartier || ', ' || p.commune, p.quartier || ', ' || p.commune, p.commune, p.name) as formatted_address,
            COALESCE(p.commune || ', ' || p.city, p.city) as subtitle,
            CASE 
                WHEN p.popularity_score > 80 THEN 'Populaire'
                WHEN p.is_verified THEN 'Vérifié'
                ELSE NULL
            END as badge
        FROM public.intelligent_places p
        WHERE p.is_active = true 
          AND p.city = search_city
          AND p.popularity_score > 30
        ORDER BY p.popularity_score DESC, p.hierarchy_level DESC
        LIMIT max_results;
        RETURN;
    END IF;

    BEGIN
        search_ts := plainto_tsquery('french', search_query);
    EXCEPTION WHEN OTHERS THEN
        search_ts := to_tsquery('french', replace(search_query, ' ', ' & '));
    END;

    RETURN QUERY
    SELECT 
        p.id, p.name, p.category, p.subcategory, p.city, p.commune, p.quartier, p.avenue,
        p.latitude, p.longitude, p.hierarchy_level, p.popularity_score,
        (
            COALESCE(ts_rank_cd(p.search_vector, search_ts), 0) * 0.4 +
            (p.popularity_score / 100.0) * 0.3 +
            (p.hierarchy_level / 5.0) * 0.2 +
            CASE 
                WHEN user_latitude IS NOT NULL AND p.latitude IS NOT NULL THEN
                    GREATEST(0, (1 - (calculate_distance_meters(user_latitude, user_longitude, p.latitude, p.longitude) / 10000))) * 0.1
                ELSE 0.1
            END
        )::REAL as relevance_score,
        CASE 
            WHEN user_latitude IS NOT NULL AND user_longitude IS NOT NULL AND p.latitude IS NOT NULL AND p.longitude IS NOT NULL
            THEN calculate_distance_meters(user_latitude, user_longitude, p.latitude, p.longitude)
            ELSE NULL
        END as distance_meters,
        COALESCE(p.avenue || ', ' || p.quartier || ', ' || p.commune, p.quartier || ', ' || p.commune, p.commune, p.name) as formatted_address,
        COALESCE(p.commune || ', ' || p.city, p.city) as subtitle,
        CASE 
            WHEN p.popularity_score > 80 THEN 'Populaire'
            WHEN p.is_verified THEN 'Vérifié'
            WHEN ts_rank_cd(p.search_vector, search_ts) > 0.5 THEN 'Pertinent'
            ELSE NULL
        END as badge
    FROM public.intelligent_places p
    WHERE p.is_active = true 
      AND p.city = search_city
      AND (
          p.search_vector @@ search_ts
          OR p.name ILIKE '%' || search_query || '%'
          OR p.commune ILIKE '%' || search_query || '%'
          OR p.quartier ILIKE '%' || search_query || '%'
          OR p.avenue ILIKE '%' || search_query || '%'
          OR EXISTS (
              SELECT 1 FROM unnest(p.name_alternatives) AS alt 
              WHERE alt ILIKE '%' || search_query || '%'
          )
      )
    ORDER BY relevance_score DESC, p.popularity_score DESC
    LIMIT max_results;
END;
$$;

-- 3. Fonction pour validation des coordonnées
CREATE OR REPLACE FUNCTION public.validate_booking_coordinates(pickup_coords jsonb, delivery_coords jsonb DEFAULT NULL::jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  validated_pickup JSONB;
  validated_delivery JSONB;
  pickup_lat NUMERIC;
  pickup_lng NUMERIC;
  delivery_lat NUMERIC;
  delivery_lng NUMERIC;
BEGIN
  pickup_lat := (pickup_coords->>'lat')::NUMERIC;
  pickup_lng := (pickup_coords->>'lng')::NUMERIC;
  
  IF pickup_lat IS NULL OR pickup_lng IS NULL OR 
     pickup_lat < -90 OR pickup_lat > 90 OR 
     pickup_lng < -180 OR pickup_lng > 180 THEN
    validated_pickup := jsonb_build_object(
      'lat', -4.3217,
      'lng', 15.3069,
      'address', 'Kinshasa Centre, République Démocratique du Congo',
      'corrected', true
    );
  ELSE
    validated_pickup := pickup_coords || jsonb_build_object('corrected', false);
  END IF;
  
  IF delivery_coords IS NOT NULL THEN
    delivery_lat := (delivery_coords->>'lat')::NUMERIC;
    delivery_lng := (delivery_coords->>'lng')::NUMERIC;
    
    IF delivery_lat IS NULL OR delivery_lng IS NULL OR 
       delivery_lat < -90 OR delivery_lat > 90 OR 
       delivery_lng < -180 OR delivery_lng > 180 THEN
      validated_delivery := jsonb_build_object(
        'lat', -4.3217,
        'lng', 15.3069,
        'address', 'Kinshasa Centre, République Démocratique du Congo',
        'corrected', true
      );
    ELSE
      validated_delivery := delivery_coords || jsonb_build_object('corrected', false);
    END IF;
  END IF;
  
  RETURN jsonb_build_object(
    'pickup', validated_pickup,
    'delivery', validated_delivery
  );
END;
$$;