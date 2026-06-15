-- Drop existing function to fix signature
DROP FUNCTION IF EXISTS intelligent_places_search(text, text, text, numeric, numeric, integer, integer);

-- Create the corrected function with enhanced features
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
      -- Exact name match (highest priority)
      CASE 
        WHEN LOWER(p.name) = LOWER(search_query) THEN 100.0
        WHEN LOWER(p.name_fr) = LOWER(search_query) THEN 95.0
        WHEN LOWER(p.name_local) = LOWER(search_query) THEN 90.0
        ELSE 0.0 
      END +
      
      -- Partial name matches
      CASE 
        WHEN LOWER(p.name) LIKE LOWER('%' || search_query || '%') THEN 80.0
        WHEN LOWER(p.name_fr) LIKE LOWER('%' || search_query || '%') THEN 75.0
        WHEN LOWER(p.name_local) LIKE LOWER('%' || search_query || '%') THEN 70.0
        ELSE 0.0 
      END +
      
      -- Keyword matches
      CASE 
        WHEN search_query = ANY(p.search_keywords) THEN 60.0
        WHEN LOWER(search_query) = ANY(ARRAY(SELECT LOWER(unnest(p.search_keywords)))) THEN 55.0
        ELSE 0.0 
      END +
      
      -- Alias matches
      CASE 
        WHEN search_query = ANY(p.aliases) THEN 50.0
        WHEN LOWER(search_query) = ANY(ARRAY(SELECT LOWER(unnest(p.aliases)))) THEN 45.0
        ELSE 0.0 
      END +
      
      -- Geographic proximity bonus
      CASE 
        WHEN p.country_code = user_country_code THEN 25.0 
        ELSE 0.0 
      END +
      CASE 
        WHEN p.city = user_city THEN 20.0 
        ELSE 0.0 
      END +
      
      -- Popularity and hierarchy bonuses
      CASE WHEN p.is_popular THEN 15.0 ELSE 0.0 END +
      (p.popularity_score * 0.1) +
      (CASE WHEN p.hierarchy_level >= min_hierarchy_level THEN 10.0 ELSE 0.0 END) +
      
      -- Full-text search score
      CASE 
        WHEN p.search_vector @@ plainto_tsquery('french', search_query) THEN 
          ts_rank_cd(p.search_vector, plainto_tsquery('french', search_query)) * 30.0
        ELSE 0.0 
      END
      
    )::NUMERIC AS relevance_score
  FROM public.places_database p
  WHERE 
    p.is_active = true
    AND p.hierarchy_level >= min_hierarchy_level
    AND (
      -- Text matches
      LOWER(p.name) LIKE LOWER('%' || search_query || '%') OR
      LOWER(p.name_fr) LIKE LOWER('%' || search_query || '%') OR
      LOWER(p.name_local) LIKE LOWER('%' || search_query || '%') OR
      LOWER(search_query) = ANY(ARRAY(SELECT LOWER(unnest(p.search_keywords)))) OR
      LOWER(search_query) = ANY(ARRAY(SELECT LOWER(unnest(p.aliases)))) OR
      p.search_vector @@ plainto_tsquery('french', search_query)
    )
  ORDER BY 
    -- Priority: exact matches, then country/city match, then relevance
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

-- Add massive data for real functionality
INSERT INTO public.places_database (
  name, name_fr, name_local, place_type, category, country_code, city, commune, 
  latitude, longitude, is_popular, search_keywords, hierarchy_level, popularity_score, aliases
) VALUES 
-- Major Kinshasa landmarks
('Palais de la Nation', 'Palais de la Nation', 'Palais ya Leta', 'landmark', 'government', 'CD', 'Kinshasa', 'Gombe', -4.3165, 15.3176, true, ARRAY['gouvernement', 'politique', 'palais'], 3, 100, ARRAY['presidency', 'state house']),
('Aéroport International de N''djili', 'Aéroport International de N''djili', 'Libanda ya Ndjili', 'airport', 'transport', 'CD', 'Kinshasa', 'Ndjili', -4.3857, 15.4446, true, ARRAY['aeroport', 'vol', 'voyage', 'ndjili'], 3, 100, ARRAY['FIH', 'kinshasa airport']),
('Université de Kinshasa', 'Université de Kinshasa', 'Université ya Kinshasa', 'university', 'education', 'CD', 'Kinshasa', 'Lemba', -4.4339, 15.3505, true, ARRAY['universite', 'education', 'unikin'], 3, 95, ARRAY['UNIKIN', 'campus']),
('Hôpital Général de Kinshasa', 'Hôpital Général de Kinshasa', 'Monganga Monene ya Kinshasa', 'hospital', 'health', 'CD', 'Kinshasa', 'Gombe', -4.3187, 15.3098, true, ARRAY['hopital', 'sante', 'medical'], 3, 90, ARRAY['HGK', 'general hospital']),
('Stade des Martyrs', 'Stade des Martyrs', 'Stade ya Martyrs', 'stadium', 'sports', 'CD', 'Kinshasa', 'Kalamu', -4.3454, 15.3254, true, ARRAY['stade', 'football', 'sport'], 3, 85, ARRAY['martyrs stadium']),
('Fleuve Congo', 'Fleuve Congo', 'Ebale Congo', 'river', 'nature', 'CD', 'Kinshasa', 'Gombe', -4.3098, 15.3265, true, ARRAY['fleuve', 'riviere', 'congo'], 2, 100, ARRAY['congo river', 'zaire river']),
('Boulevard du 30 Juin', 'Boulevard du 30 Juin', 'Boulevard ya 30 Juin', 'street', 'main_road', 'CD', 'Kinshasa', 'Gombe', -4.3217, 15.3154, true, ARRAY['boulevard', 'avenue', 'principale'], 4, 85, ARRAY['30 june boulevard']),
('Avenue des Aviateurs', 'Avenue des Aviateurs', 'Avenue ya Aviateurs', 'street', 'main_road', 'CD', 'Kinshasa', 'Gombe', -4.3187, 15.3098, true, ARRAY['avenue', 'aviateurs'], 4, 80, ARRAY['aviators avenue']),
('Rond Point Victoire', 'Rond Point Victoire', 'Rond Point Victoire', 'intersection', 'landmark', 'CD', 'Kinshasa', 'Gombe', -4.3165, 15.3143, true, ARRAY['rond-point', 'victoire', 'carrefour'], 4, 75, ARRAY['victory roundabout']),
-- Kinshasa business areas
('Kinshasa Business Center', 'Centre d''Affaires Kinshasa', 'Centre ya Business Kinshasa', 'business_center', 'commercial', 'CD', 'Kinshasa', 'Gombe', -4.3198, 15.3121, true, ARRAY['business', 'bureau', 'affaires'], 4, 80, ARRAY['KBC']),
('Hôtel Memling', 'Hôtel Memling', 'Hotel Memling', 'hotel', 'hospitality', 'CD', 'Kinshasa', 'Gombe', -4.3187, 15.3109, true, ARRAY['hotel', 'hebergement'], 4, 75, ARRAY['memling hotel']),
('Centre Commercial Gombe', 'Centre Commercial Gombe', 'Centre Commercial Gombe', 'shopping_center', 'commercial', 'CD', 'Kinshasa', 'Gombe', -4.3209, 15.3132, true, ARRAY['shopping', 'commercial', 'magasin'], 4, 70, ARRAY['gombe mall']),
-- Lubumbashi locations
('Lubumbashi Centre', 'Centre de Lubumbashi', 'Centre ya Lubumbashi', 'area', 'central', 'CD', 'Lubumbashi', 'Lubumbashi', -11.6792, 27.5098, true, ARRAY['centre', 'ville'], 1, 95, ARRAY['downtown lubumbashi']),
('Aéroport de Lubumbashi', 'Aéroport de Lubumbashi', 'Libanda ya Lubumbashi', 'airport', 'transport', 'CD', 'Lubumbashi', 'Lubumbashi', -11.5913, 27.5308, true, ARRAY['aeroport', 'vol'], 3, 90, ARRAY['FBM', 'lubumbashi airport']),
('Université de Lubumbashi', 'Université de Lubumbashi', 'Université ya Lubumbashi', 'university', 'education', 'CD', 'Lubumbashi', 'Lubumbashi', -11.6543, 27.4876, true, ARRAY['universite', 'education', 'unilu'], 3, 85, ARRAY['UNILU']),
-- Kolwezi locations
('Kolwezi Centre', 'Centre de Kolwezi', 'Centre ya Kolwezi', 'area', 'central', 'CD', 'Kolwezi', 'Kolwezi', -10.7143, 25.4662, true, ARRAY['centre', 'ville'], 1, 90, ARRAY['downtown kolwezi']),
('Aéroport de Kolwezi', 'Aéroport de Kolwezi', 'Libanda ya Kolwezi', 'airport', 'transport', 'CD', 'Kolwezi', 'Kolwezi', -10.7098, 25.5154, true, ARRAY['aeroport', 'vol'], 3, 85, ARRAY['KWZ', 'kolwezi airport'])
ON CONFLICT (name, city) DO NOTHING;

-- Grant permissions
GRANT SELECT ON public.places_database TO authenticated;
GRANT EXECUTE ON FUNCTION intelligent_places_search TO authenticated;