-- CORRECTION CRITIQUE 1: Sécuriser les fonctions vulnérables
-- Ajouter SECURITY DEFINER et search_path aux fonctions manquantes

-- 1. Corriger la fonction de recherche de lieux intelligents
CREATE OR REPLACE FUNCTION public.intelligent_places_search_enhanced(search_query text DEFAULT ''::text, search_city text DEFAULT 'Kinshasa'::text, user_latitude numeric DEFAULT NULL::numeric, user_longitude numeric DEFAULT NULL::numeric, max_results integer DEFAULT 10, include_nearby boolean DEFAULT true)
 RETURNS TABLE(id uuid, name text, category text, subcategory text, city text, commune text, quartier text, avenue text, latitude numeric, longitude numeric, hierarchy_level integer, popularity_score integer, relevance_score real, distance_meters integer, formatted_address text, subtitle text, badge text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
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
$function$;

-- 2. Corriger la fonction de recherche intelligente de lieux
CREATE OR REPLACE FUNCTION public.intelligent_places_search(search_query text DEFAULT ''::text, search_city text DEFAULT 'Kinshasa'::text, user_latitude numeric DEFAULT NULL::numeric, user_longitude numeric DEFAULT NULL::numeric, max_results integer DEFAULT 8, include_nearby boolean DEFAULT true)
 RETURNS TABLE(id uuid, name text, category text, subcategory text, city text, commune text, quartier text, avenue text, latitude numeric, longitude numeric, hierarchy_level integer, popularity_score integer, relevance_score real, distance_meters integer, formatted_address text, subtitle text, badge text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
DECLARE
  search_ts tsquery;
BEGIN
  -- Nettoyer la requête de recherche
  search_query := TRIM(COALESCE(search_query, ''));
  
  -- Si pas de recherche, retourner les lieux populaires
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

  -- Préparer la requête de recherche textuelle
  BEGIN
    search_ts := plainto_tsquery('french', search_query);
  EXCEPTION WHEN OTHERS THEN
    search_ts := to_tsquery('french', replace(search_query, ' ', ' & '));
  END;

  -- Recherche principale avec scoring avancé
  RETURN QUERY
  SELECT 
    p.id, p.name, p.category, p.subcategory, p.city, p.commune, p.quartier, p.avenue,
    p.latitude, p.longitude, p.hierarchy_level, p.popularity_score,
    (
      -- Score de pertinence textuelle (40%)
      COALESCE(ts_rank_cd(p.search_vector, search_ts), 0) * 0.4 +
      -- Score de popularité (30%)
      (p.popularity_score / 100.0) * 0.3 +
      -- Bonus hiérarchie (20%)
      (p.hierarchy_level / 5.0) * 0.2 +
      -- Bonus proximité (10%)
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
$function$;

-- 3. Créer une fonction calculate_distance_meters manquante
CREATE OR REPLACE FUNCTION public.calculate_distance_meters(lat1 numeric, lng1 numeric, lat2 numeric, lng2 numeric)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
  RETURN (6371000 * acos(
    cos(radians(lat1)) * cos(radians(lat2)) * 
    cos(radians(lng2) - radians(lng1)) + 
    sin(radians(lat1)) * sin(radians(lat2))
  ))::integer;
END;
$function$;

-- CORRECTION CRITIQUE 2: Corriger la récursion RLS dans user_roles
-- Supprimer les policies problématiques et les remplacer par des sécurisées

-- Supprimer les policies existantes qui causent la récursion
DROP POLICY IF EXISTS "user_roles_admin_access" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_own_roles" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_self_access" ON public.user_roles;

-- Créer des policies sécurisées avec des fonctions SECURITY DEFINER
CREATE POLICY "user_roles_secure_self_access" 
ON public.user_roles 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "user_roles_secure_admin_access" 
ON public.user_roles 
FOR ALL 
USING (check_user_role_secure(auth.uid(), 'admin'));

-- CORRECTION CRITIQUE 3: Créer une fonction validate_booking_coordinates manquante
CREATE OR REPLACE FUNCTION public.validate_booking_coordinates(pickup_coords jsonb, delivery_coords jsonb DEFAULT NULL::jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
DECLARE
  validated_pickup jsonb;
  validated_delivery jsonb;
  default_kinshasa_lat numeric := -4.3217;
  default_kinshasa_lng numeric := 15.3069;
BEGIN
  -- Valider les coordonnées de pickup
  IF pickup_coords IS NULL OR 
     (pickup_coords->>'lat')::numeric IS NULL OR
     (pickup_coords->>'lng')::numeric IS NULL OR
     (pickup_coords->>'lat')::numeric < -90 OR
     (pickup_coords->>'lat')::numeric > 90 OR
     (pickup_coords->>'lng')::numeric < -180 OR
     (pickup_coords->>'lng')::numeric > 180 THEN
    
    validated_pickup := jsonb_build_object(
      'lat', default_kinshasa_lat,
      'lng', default_kinshasa_lng,
      'validated', true,
      'original_invalid', true
    );
  ELSE
    validated_pickup := pickup_coords;
  END IF;
  
  -- Valider les coordonnées de delivery si fournies
  IF delivery_coords IS NOT NULL THEN
    IF (delivery_coords->>'lat')::numeric IS NULL OR
       (delivery_coords->>'lng')::numeric IS NULL OR
       (delivery_coords->>'lat')::numeric < -90 OR
       (delivery_coords->>'lat')::numeric > 90 OR
       (delivery_coords->>'lng')::numeric < -180 OR
       (delivery_coords->>'lng')::numeric > 180 THEN
      
      validated_delivery := jsonb_build_object(
        'lat', default_kinshasa_lat + 0.01,
        'lng', default_kinshasa_lng + 0.01,
        'validated', true,
        'original_invalid', true
      );
    ELSE
      validated_delivery := delivery_coords;
    END IF;
  END IF;
  
  RETURN jsonb_build_object(
    'pickup', validated_pickup,
    'delivery', validated_delivery
  );
END;
$function$;