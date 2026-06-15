-- Créer la fonction RPC pour la recherche intelligente de lieux
-- Version corrigée sans dépendances extension earthdistance

-- Table pour les données de lieux enrichies (si elle n'existe pas déjà)
CREATE TABLE IF NOT EXISTS public.intelligent_places (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  name_alternatives TEXT[], -- Noms alternatifs (lingala, kikongo)
  category TEXT NOT NULL DEFAULT 'general',
  subcategory TEXT,
  city TEXT NOT NULL DEFAULT 'Kinshasa',
  commune TEXT,
  quartier TEXT,
  avenue TEXT,
  numero TEXT,
  latitude NUMERIC(10,8),
  longitude NUMERIC(11,8),
  hierarchy_level INTEGER DEFAULT 1, -- 1=ville, 2=commune, 3=quartier, 4=avenue, 5=POI
  popularity_score INTEGER DEFAULT 0,
  is_verified BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  search_vector tsvector,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Indexes optimisés pour la recherche rapide
CREATE INDEX IF NOT EXISTS idx_intelligent_places_search ON public.intelligent_places USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_intelligent_places_city_category ON public.intelligent_places(city, category);
CREATE INDEX IF NOT EXISTS idx_intelligent_places_popularity ON public.intelligent_places(popularity_score DESC) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_intelligent_places_location ON public.intelligent_places(latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- Fonction pour calculer la distance en mètres (version simplifiée)
CREATE OR REPLACE FUNCTION calculate_distance_meters(lat1 numeric, lng1 numeric, lat2 numeric, lng2 numeric)
RETURNS INTEGER
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  earth_radius CONSTANT numeric := 6371000; -- Rayon de la Terre en mètres
  dlat numeric;
  dlng numeric;
  a numeric;
  c numeric;
BEGIN
  dlat := radians(lat2 - lat1);
  dlng := radians(lng2 - lng1);
  
  a := sin(dlat/2) * sin(dlat/2) + 
       cos(radians(lat1)) * cos(radians(lat2)) * 
       sin(dlng/2) * sin(dlng/2);
  
  c := 2 * atan2(sqrt(a), sqrt(1-a));
  
  RETURN round(earth_radius * c)::INTEGER;
END;
$$;

-- Fonction pour mettre à jour le vecteur de recherche
CREATE OR REPLACE FUNCTION update_intelligent_places_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := setweight(to_tsvector('french', COALESCE(NEW.name, '')), 'A') ||
                      setweight(to_tsvector('french', COALESCE(NEW.commune, '')), 'B') ||
                      setweight(to_tsvector('french', COALESCE(NEW.quartier, '')), 'B') ||
                      setweight(to_tsvector('french', COALESCE(NEW.avenue, '')), 'C') ||
                      setweight(to_tsvector('french', COALESCE(array_to_string(NEW.name_alternatives, ' '), '')), 'B');
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour maintenir le vecteur de recherche
DROP TRIGGER IF EXISTS intelligent_places_search_vector_trigger ON public.intelligent_places;
CREATE TRIGGER intelligent_places_search_vector_trigger
  BEFORE INSERT OR UPDATE ON public.intelligent_places
  FOR EACH ROW EXECUTE FUNCTION update_intelligent_places_search_vector();

-- Fonction RPC pour la recherche intelligente
CREATE OR REPLACE FUNCTION intelligent_places_search(
  search_query TEXT DEFAULT '',
  search_city TEXT DEFAULT 'Kinshasa',
  user_latitude NUMERIC DEFAULT NULL,
  user_longitude NUMERIC DEFAULT NULL,
  max_results INTEGER DEFAULT 8,
  include_nearby BOOLEAN DEFAULT true
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  category TEXT,
  subcategory TEXT,
  city TEXT,
  commune TEXT,
  quartier TEXT,
  avenue TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  hierarchy_level INTEGER,
  popularity_score INTEGER,
  relevance_score REAL,
  distance_meters INTEGER,
  formatted_address TEXT,
  subtitle TEXT,
  badge TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  search_ts tsquery;
BEGIN
  -- Nettoyer la requête de recherche
  search_query := TRIM(COALESCE(search_query, ''));
  
  -- Si pas de recherche, retourner les lieux populaires
  IF search_query = '' THEN
    RETURN QUERY
    SELECT 
      p.id,
      p.name,
      p.category,
      p.subcategory,
      p.city,
      p.commune,
      p.quartier,
      p.avenue,
      p.latitude,
      p.longitude,
      p.hierarchy_level,
      p.popularity_score,
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
    p.id,
    p.name,
    p.category,
    p.subcategory,
    p.city,
    p.commune,
    p.quartier,
    p.avenue,
    p.latitude,
    p.longitude,
    p.hierarchy_level,
    p.popularity_score,
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
$$;

-- Insérer des données de test massives pour Kinshasa
INSERT INTO public.intelligent_places (name, category, subcategory, city, commune, quartier, avenue, latitude, longitude, hierarchy_level, popularity_score, is_verified, name_alternatives) VALUES
-- Communes principales
('Gombe', 'administrative', 'commune', 'Kinshasa', 'Gombe', NULL, NULL, -4.3079, 15.3129, 2, 95, true, '{"Centre-ville", "Gombé"}'),
('Kalamu', 'administrative', 'commune', 'Kinshasa', 'Kalamu', NULL, NULL, -4.3667, 15.2833, 2, 90, true, '{}'),
('Lingwala', 'administrative', 'commune', 'Kinshasa', 'Lingwala', NULL, NULL, -4.3000, 15.2667, 2, 85, true, '{}'),
('Kinshasa', 'administrative', 'commune', 'Kinshasa', 'Kinshasa', NULL, NULL, -4.2833, 15.2667, 2, 80, true, '{}'),

-- Quartiers populaires de Gombe
('Centre-ville', 'district', 'quartier', 'Kinshasa', 'Gombe', 'Centre-ville', NULL, -4.3079, 15.3129, 3, 98, true, '{"Downtown", "Ville"}'),
('Socimat', 'district', 'quartier', 'Kinshasa', 'Gombe', 'Socimat', NULL, -4.3100, 15.3200, 3, 75, true, '{}'),
('Hôtel des Postes', 'district', 'quartier', 'Kinshasa', 'Gombe', 'Hôtel des Postes', NULL, -4.3050, 15.3150, 3, 70, true, '{}'),

-- Quartiers de Kalamu  
('Victoire', 'district', 'quartier', 'Kinshasa', 'Kalamu', 'Victoire', NULL, -4.3700, 15.2900, 3, 85, true, '{}'),
('Yolo Sud', 'district', 'quartier', 'Kinshasa', 'Kalamu', 'Yolo Sud', NULL, -4.3650, 15.2850, 3, 80, true, '{}'),
('Matonge', 'district', 'quartier', 'Kinshasa', 'Kalamu', 'Matonge', NULL, -4.3600, 15.2800, 3, 90, true, '{"Matonge Market"}'),

-- Avenues principales de Gombe
('Avenue du 30 Juin', 'transport', 'avenue', 'Kinshasa', 'Gombe', 'Centre-ville', 'Avenue du 30 Juin', -4.3079, 15.3129, 4, 95, true, '{"30 Juin", "Av. 30 Juin"}'),
('Boulevard du 30 Juin', 'transport', 'avenue', 'Kinshasa', 'Gombe', 'Centre-ville', 'Boulevard du 30 Juin', -4.3100, 15.3150, 4, 90, true, '{"Bd 30 Juin"}'),
('Avenue Kasaï', 'transport', 'avenue', 'Kinshasa', 'Gombe', 'Centre-ville', 'Avenue Kasaï', -4.3060, 15.3140, 4, 80, true, '{"Kasai", "Av. Kasaï"}'),
('Avenue Équateur', 'transport', 'avenue', 'Kinshasa', 'Gombe', 'Centre-ville', 'Avenue Équateur', -4.3040, 15.3110, 4, 75, true, '{"Equateur", "Av. Équateur"}'),

-- Points d'intérêt majeurs
('Aéroport International de N''djili', 'transport', 'aeroport', 'Kinshasa', 'Nsele', 'N''djili', NULL, -4.3857, 15.4446, 5, 100, true, '{"FIH", "Ndjili Airport", "Aéroport"}'),
('Palais de la Nation', 'government', 'palais', 'Kinshasa', 'Gombe', 'Centre-ville', 'Avenue de l''Indépendance', -4.3079, 15.3129, 5, 95, true, '{"Palais Présidentiel"}'),
('Université de Kinshasa', 'education', 'universite', 'Kinshasa', 'Lemba', 'Campus', NULL, -4.4322, 15.3506, 5, 90, true, '{"UNIKIN", "Université"}'),
('Hôpital Général de Kinshasa', 'health', 'hopital', 'Kinshasa', 'Gombe', 'Centre-ville', NULL, -4.3100, 15.3200, 5, 85, true, '{"Hôpital Général"}'),

-- Centres commerciaux et marchés
('City Market', 'commercial', 'centre_commercial', 'Kinshasa', 'Gombe', 'Centre-ville', 'Avenue du Commerce', -4.3070, 15.3120, 5, 90, true, '{"Marché City"}'),
('Marché Central', 'commercial', 'marche', 'Kinshasa', 'Gombe', 'Centre-ville', NULL, -4.3080, 15.3130, 5, 85, true, '{"Grand Marché"}'),
('Kin Plaza', 'commercial', 'centre_commercial', 'Kinshasa', 'Gombe', 'Centre-ville', 'Avenue du 30 Juin', -4.3075, 15.3125, 5, 88, true, '{}'),

-- Hôtels populaires
('Hôtel Memling', 'hospitality', 'hotel', 'Kinshasa', 'Gombe', 'Centre-ville', 'Avenue du 30 Juin', -4.3077, 15.3127, 5, 85, true, '{"Memling Hotel"}'),
('Grand Hôtel Kinshasa', 'hospitality', 'hotel', 'Kinshasa', 'Gombe', 'Centre-ville', NULL, -4.3082, 15.3132, 5, 80, true, '{}'),

-- Transport et gares
('Gare Centrale', 'transport', 'gare', 'Kinshasa', 'Gombe', 'Centre-ville', NULL, -4.3090, 15.3140, 5, 80, true, '{"Gare", "Station"}'),
('Port de Kinshasa', 'transport', 'port', 'Kinshasa', 'Gombe', 'Port', NULL, -4.3000, 15.3000, 5, 75, true, '{}');

-- Activer RLS sur la table
ALTER TABLE public.intelligent_places ENABLE ROW LEVEL SECURITY;

-- Politique RLS pour lecture publique
CREATE POLICY "intelligent_places_public_read" ON public.intelligent_places
  FOR SELECT USING (is_active = true);

-- Politique RLS pour écriture admin uniquement  
CREATE POLICY "intelligent_places_admin_write" ON public.intelligent_places
  FOR ALL USING (is_current_user_admin());