-- Drop and recreate function with proper data insertion
DROP FUNCTION IF EXISTS intelligent_places_search(text, text, text, numeric, numeric, integer, integer);

-- Create the corrected function
CREATE OR REPLACE FUNCTION intelligent_places_search(
  search_query TEXT,
  user_country_code TEXT DEFAULT 'CD',
  user_city TEXT DEFAULT 'Kinshasa', 
  user_lat NUMERIC DEFAULT NULL,
  user_lng NUMERIC DEFAULT NULL,
  max_results INTEGER DEFAULT 10,
  min_hierarchy_level INTEGER DEFAULT 1
) RETURNS TABLE(
  id UUID,
  name TEXT,
  name_fr TEXT, 
  name_local TEXT,
  place_type TEXT,
  category TEXT,
  country_code TEXT,
  city TEXT,
  commune TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  is_popular BOOLEAN,
  search_keywords TEXT[],
  hierarchy_level INTEGER,
  popularity_score INTEGER,
  aliases TEXT[],
  distance_km NUMERIC,
  relevance_score NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    p.name_fr,
    p.name_local,
    p.place_type,
    p.category,
    p.country_code,
    p.city,
    p.commune,
    p.latitude,
    p.longitude,
    p.is_popular,
    p.search_keywords,
    p.hierarchy_level,
    p.popularity_score,
    p.aliases,
    -- Calculate distance if user coordinates provided
    CASE 
      WHEN user_lat IS NOT NULL AND user_lng IS NOT NULL THEN
        ROUND((6371 * acos(
          cos(radians(user_lat)) * cos(radians(p.latitude)) * 
          cos(radians(p.longitude) - radians(user_lng)) + 
          sin(radians(user_lat)) * sin(radians(p.latitude))
        ))::numeric, 2)
      ELSE NULL
    END AS distance_km,
    -- Enhanced relevance scoring
    (
      CASE 
        WHEN LOWER(p.name) = LOWER(search_query) THEN 100.0
        WHEN LOWER(p.name_fr) = LOWER(search_query) THEN 95.0
        WHEN LOWER(p.name_local) = LOWER(search_query) THEN 90.0
        WHEN LOWER(p.name) LIKE LOWER('%' || search_query || '%') THEN 80.0
        WHEN LOWER(p.name_fr) LIKE LOWER('%' || search_query || '%') THEN 75.0
        WHEN search_query = ANY(p.search_keywords) THEN 60.0
        WHEN search_query = ANY(p.aliases) THEN 50.0
        ELSE 
          ts_rank_cd(p.search_vector, plainto_tsquery('french', search_query)) * 30.0
      END +
      CASE WHEN p.country_code = user_country_code THEN 25.0 ELSE 0.0 END +
      CASE WHEN p.city = user_city THEN 20.0 ELSE 0.0 END +
      CASE WHEN p.is_popular THEN 15.0 ELSE 0.0 END +
      (p.popularity_score * 0.1)
    )::NUMERIC AS relevance_score
  FROM public.places_database p
  WHERE 
    p.is_active = true
    AND p.hierarchy_level >= min_hierarchy_level
    AND (
      LOWER(p.name) LIKE LOWER('%' || search_query || '%') OR
      LOWER(p.name_fr) LIKE LOWER('%' || search_query || '%') OR
      LOWER(p.name_local) LIKE LOWER('%' || search_query || '%') OR
      search_query = ANY(p.search_keywords) OR
      search_query = ANY(p.aliases) OR
      p.search_vector @@ plainto_tsquery('french', search_query)
    )
  ORDER BY 
    (CASE WHEN p.country_code = user_country_code THEN 0 ELSE 1 END),
    (CASE WHEN p.city = user_city THEN 0 ELSE 1 END),
    relevance_score DESC,
    p.is_popular DESC,
    p.popularity_score DESC,
    distance_km ASC NULLS LAST,
    p.name ASC
  LIMIT max_results;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Insert sample data for testing (no conflict handling needed)
INSERT INTO public.places_database (
  name, name_fr, name_local, place_type, category, country_code, city, commune, 
  latitude, longitude, is_popular, search_keywords, hierarchy_level, popularity_score, aliases
) VALUES 
('Palais de la Nation', 'Palais de la Nation', 'Palais ya Leta', 'landmark', 'government', 'CD', 'Kinshasa', 'Gombe', -4.3165, 15.3176, true, ARRAY['gouvernement', 'politique', 'palais'], 3, 100, ARRAY['presidency', 'state house']),
('Aéroport International de N''djili', 'Aéroport International de N''djili', 'Libanda ya Ndjili', 'airport', 'transport', 'CD', 'Kinshasa', 'Ndjili', -4.3857, 15.4446, true, ARRAY['aeroport', 'vol', 'voyage', 'ndjili'], 3, 100, ARRAY['FIH', 'kinshasa airport']),
('Université de Kinshasa', 'Université de Kinshasa', 'Université ya Kinshasa', 'university', 'education', 'CD', 'Kinshasa', 'Lemba', -4.4339, 15.3505, true, ARRAY['universite', 'education', 'unikin'], 3, 95, ARRAY['UNIKIN', 'campus']),
('Stade des Martyrs', 'Stade des Martyrs', 'Stade ya Martyrs', 'stadium', 'sports', 'CD', 'Kinshasa', 'Kalamu', -4.3454, 15.3254, true, ARRAY['stade', 'football', 'sport'], 3, 85, ARRAY['martyrs stadium']),
('Lubumbashi Centre', 'Centre de Lubumbashi', 'Centre ya Lubumbashi', 'area', 'central', 'CD', 'Lubumbashi', 'Lubumbashi', -11.6792, 27.5098, true, ARRAY['centre', 'ville'], 1, 95, ARRAY['downtown lubumbashi']);

-- Grant permissions
GRANT SELECT ON public.places_database TO authenticated;
GRANT EXECUTE ON FUNCTION intelligent_places_search TO authenticated;