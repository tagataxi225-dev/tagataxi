-- Enhance places_database for intelligent address search
ALTER TABLE public.places_database ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES public.places_database(id);
ALTER TABLE public.places_database ADD COLUMN IF NOT EXISTS hierarchy_level INTEGER DEFAULT 5;
ALTER TABLE public.places_database ADD COLUMN IF NOT EXISTS popularity_score INTEGER DEFAULT 0;
ALTER TABLE public.places_database ADD COLUMN IF NOT EXISTS aliases TEXT[] DEFAULT '{}';
ALTER TABLE public.places_database ADD COLUMN IF NOT EXISTS search_vector tsvector;
ALTER TABLE public.places_database ADD COLUMN IF NOT EXISTS opening_hours JSONB DEFAULT '{}';
ALTER TABLE public.places_database ADD COLUMN IF NOT EXISTS services TEXT[] DEFAULT '{}';
ALTER TABLE public.places_database ADD COLUMN IF NOT EXISTS address_components JSONB DEFAULT '{}';
ALTER TABLE public.places_database ADD COLUMN IF NOT EXISTS phone_number TEXT;
ALTER TABLE public.places_database ADD COLUMN IF NOT EXISTS website TEXT;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_places_hierarchy ON public.places_database(hierarchy_level, country_code, city);
CREATE INDEX IF NOT EXISTS idx_places_search_vector ON public.places_database USING gin(search_vector);
CREATE INDEX IF NOT EXISTS idx_places_parent ON public.places_database(parent_id);
CREATE INDEX IF NOT EXISTS idx_places_popularity ON public.places_database(popularity_score DESC);
CREATE INDEX IF NOT EXISTS idx_places_aliases ON public.places_database USING gin(aliases);

-- Function to update search vector
CREATE OR REPLACE FUNCTION update_places_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := to_tsvector('french', 
    COALESCE(NEW.name, '') || ' ' ||
    COALESCE(NEW.name_fr, '') || ' ' ||
    COALESCE(NEW.name_local, '') || ' ' ||
    COALESCE(array_to_string(NEW.search_keywords, ' '), '') || ' ' ||
    COALESCE(array_to_string(NEW.aliases, ' '), '') || ' ' ||
    COALESCE(NEW.commune, '') || ' ' ||
    COALESCE(NEW.category, '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update search vector
CREATE TRIGGER update_places_search_vector_trigger
  BEFORE INSERT OR UPDATE ON public.places_database
  FOR EACH ROW EXECUTE FUNCTION update_places_search_vector();

-- Enhanced search function with intelligent ranking
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
  hierarchy_level INTEGER,
  popularity_score INTEGER,
  aliases TEXT[],
  address_components JSONB,
  phone_number TEXT,
  website TEXT,
  relevance_score NUMERIC,
  distance_km NUMERIC
) LANGUAGE plpgsql STABLE AS $$
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
    p.hierarchy_level,
    p.popularity_score,
    p.aliases,
    p.address_components,
    p.phone_number,
    p.website,
    -- Advanced relevance scoring
    (
      -- Exact name match bonus
      CASE 
        WHEN lower(p.name) = lower(search_query) THEN 100.0
        WHEN lower(p.name_fr) = lower(search_query) THEN 95.0
        WHEN lower(p.name_local) = lower(search_query) THEN 90.0
        ELSE 0.0 
      END +
      
      -- Partial name match
      CASE 
        WHEN lower(p.name) LIKE lower(search_query) || '%' THEN 80.0
        WHEN lower(p.name_fr) LIKE lower(search_query) || '%' THEN 75.0
        WHEN lower(p.name_local) LIKE lower(search_query) || '%' THEN 70.0
        WHEN lower(p.name) LIKE '%' || lower(search_query) || '%' THEN 50.0
        WHEN lower(p.name_fr) LIKE '%' || lower(search_query) || '%' THEN 45.0
        WHEN lower(p.name_local) LIKE '%' || lower(search_query) || '%' THEN 40.0
        ELSE 0.0 
      END +
      
      -- Aliases match
      CASE 
        WHEN lower(search_query) = ANY(ARRAY(SELECT lower(unnest(p.aliases)))) THEN 85.0
        WHEN EXISTS(SELECT 1 FROM unnest(p.aliases) alias WHERE lower(alias) LIKE lower(search_query) || '%') THEN 60.0
        ELSE 0.0 
      END +
      
      -- Full-text search score
      CASE 
        WHEN p.search_vector @@ plainto_tsquery('french', search_query) THEN 
          ts_rank(p.search_vector, plainto_tsquery('french', search_query)) * 30.0
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
      
      -- Hierarchy level bonus (lower levels = more specific = higher score)
      CASE 
        WHEN p.hierarchy_level <= 2 THEN 15.0  -- Ville/Commune
        WHEN p.hierarchy_level = 3 THEN 10.0   -- Quartier
        WHEN p.hierarchy_level = 4 THEN 8.0    -- Rue
        ELSE 5.0                               -- POI
      END +
      
      -- Popularity bonus
      (p.popularity_score * 0.1) +
      
      -- Active status bonus
      CASE WHEN p.is_active THEN 5.0 ELSE -50.0 END
      
    )::NUMERIC AS relevance_score,
    
    -- Distance calculation if user location provided
    CASE 
      WHEN user_lat IS NOT NULL AND user_lng IS NOT NULL THEN
        calculate_distance_km(user_lat, user_lng, p.latitude, p.longitude)
      ELSE NULL 
    END::NUMERIC AS distance_km
    
  FROM public.places_database p
  WHERE 
    p.is_active = true
    AND p.hierarchy_level >= min_hierarchy_level
    AND (
      -- Text search conditions
      lower(p.name) LIKE '%' || lower(search_query) || '%'
      OR lower(p.name_fr) LIKE '%' || lower(search_query) || '%'
      OR lower(p.name_local) LIKE '%' || lower(search_query) || '%'
      OR lower(search_query) = ANY(ARRAY(SELECT lower(unnest(p.aliases))))
      OR EXISTS(SELECT 1 FROM unnest(p.aliases) alias WHERE lower(alias) LIKE '%' || lower(search_query) || '%')
      OR p.search_vector @@ plainto_tsquery('french', search_query)
      OR lower(p.commune) LIKE '%' || lower(search_query) || '%'
      OR lower(p.category) LIKE '%' || lower(search_query) || '%'
    )
  ORDER BY 
    -- Prioritize user's country and city
    (CASE WHEN p.country_code = user_country_code THEN 0 ELSE 1 END),
    (CASE WHEN p.city = user_city THEN 0 ELSE 1 END),
    -- Then by relevance score
    relevance_score DESC,
    -- Then by popularity
    p.popularity_score DESC,
    -- Finally by name
    p.name ASC
  LIMIT max_results;
END;
$$;

-- RLS policies for the enhanced places_database
ALTER TABLE public.places_database ENABLE ROW LEVEL SECURITY;

CREATE POLICY "places_public_read" ON public.places_database
  FOR SELECT USING (is_active = true);

CREATE POLICY "places_admin_all" ON public.places_database
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.admins 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );