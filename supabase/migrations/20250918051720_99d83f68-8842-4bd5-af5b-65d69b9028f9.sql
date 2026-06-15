-- ============= PHASE 1: ENRICHISSEMENT MASSIF BASE DE DONNÉES =============

-- Créer la fonction intelligent_places_search manquante
CREATE OR REPLACE FUNCTION public.intelligent_places_search_enhanced(
    search_query TEXT DEFAULT '',
    search_city TEXT DEFAULT 'Kinshasa',
    user_latitude NUMERIC DEFAULT NULL,
    user_longitude NUMERIC DEFAULT NULL,
    max_results INTEGER DEFAULT 10,
    include_nearby BOOLEAN DEFAULT true
)
RETURNS TABLE(
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
SET search_path = public
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

-- Enrichir la table intelligent_places avec 500+ lieux populaires
INSERT INTO public.intelligent_places (name, category, subcategory, city, commune, quartier, avenue, latitude, longitude, hierarchy_level, popularity_score, is_verified, is_active, name_alternatives, search_vector)
VALUES
-- KINSHASA - Districts principaux
('Gombe Centre', 'district', 'centre-ville', 'Kinshasa', 'Gombe', 'Centre-ville', 'Boulevard du 30 Juin', -4.30790, 15.31290, 4, 100, true, true, ARRAY['Centre-ville', 'Downtown', 'Gombe Central'], to_tsvector('french', 'Gombe Centre district centre-ville')),
('Kalamu Central', 'district', 'résidentiel', 'Kinshasa', 'Kalamu', 'Centre', 'Avenue Kasavubu', -4.34310, 15.29310, 4, 95, true, true, ARRAY['Kalamu', 'Kasavubu'], to_tsvector('french', 'Kalamu Central district résidentiel')),
('Limete Industriel', 'district', 'industriel', 'Kinshasa', 'Limete', 'Industriel', 'Boulevard Lumumba', -4.38000, 15.29000, 4, 90, true, true, ARRAY['Limete', 'Zone Industrielle'], to_tsvector('french', 'Limete Industriel district')),
('Kintambo Centre', 'district', 'résidentiel', 'Kinshasa', 'Kintambo', 'Centre', 'Avenue Kintambo', -4.32980, 15.28230, 4, 85, true, true, ARRAY['Kintambo'], to_tsvector('french', 'Kintambo Centre district')),
('Lingwala Commercial', 'district', 'commercial', 'Kinshasa', 'Lingwala', 'Commercial', 'Avenue des Cliniques', -4.31000, 15.32000, 4, 88, true, true, ARRAY['Lingwala'], to_tsvector('french', 'Lingwala Commercial district')),

-- KINSHASA - Transports
('Aéroport International de N''djili', 'transport', 'aéroport', 'Kinshasa', 'Nsele', 'N''djili', NULL, -4.38570, 15.44460, 5, 100, true, true, ARRAY['Aéroport Ndjili', 'Airport'], to_tsvector('french', 'Aéroport International Ndjili transport')),
('Gare Centrale Kinshasa', 'transport', 'gare', 'Kinshasa', 'Gombe', 'Centre-ville', 'Avenue des Forces Armées', -4.31500, 15.31800, 5, 90, true, true, ARRAY['Gare Centrale', 'Train Station'], to_tsvector('french', 'Gare Centrale Kinshasa transport')),
('Port de Kinshasa', 'transport', 'port', 'Kinshasa', 'Gombe', 'Port', 'Boulevard du Fleuve', -4.30200, 15.30800, 5, 85, true, true, ARRAY['Port Fluvial'], to_tsvector('french', 'Port Kinshasa transport')),
('Terminal Bus Victoire', 'transport', 'terminal', 'Kinshasa', 'Lingwala', 'Victoire', 'Place Victoire', -4.31200, 15.32200, 4, 80, true, true, ARRAY['Victoire Terminal'], to_tsvector('french', 'Terminal Bus Victoire transport')),

-- KINSHASA - Éducation
('Université de Kinshasa (UNIKIN)', 'Éducation', 'Université', 'Kinshasa', 'Lemba', 'Campus', NULL, -4.42340, 15.29870, 5, 98, true, true, ARRAY['UNIKIN', 'Université Kinshasa'], to_tsvector('french', 'Université Kinshasa UNIKIN éducation')),
('Université Libre de Kinshasa (ULK)', 'Éducation', 'Université', 'Kinshasa', 'Gombe', 'Université', 'Avenue Kasa-Vubu', -4.31800, 15.31500, 5, 85, true, true, ARRAY['ULK'], to_tsvector('french', 'Université Libre Kinshasa ULK')),
('Institut Supérieur de Commerce (ISC)', 'Éducation', 'Institut', 'Kinshasa', 'Gombe', 'ISC', 'Avenue Colonel Lukusa', -4.31000, 15.31000, 4, 75, true, true, ARRAY['ISC Kinshasa'], to_tsvector('french', 'Institut Supérieur Commerce ISC')),

-- KINSHASA - Santé
('Hôpital Général de Kinshasa', 'santé', 'hôpital', 'Kinshasa', 'Gombe', 'Hôpital', 'Avenue de la Paix', -4.31500, 15.31200, 5, 95, true, true, ARRAY['Hôpital Général'], to_tsvector('french', 'Hôpital Général Kinshasa santé')),
('Clinique Ngaliema', 'santé', 'clinique', 'Kinshasa', 'Ngaliema', 'Clinique', 'Avenue Ngaliema', -4.36000, 15.28000, 5, 90, true, true, ARRAY['Ngaliema Clinic'], to_tsvector('french', 'Clinique Ngaliema santé')),
('Centre Médical Monkole', 'santé', 'centre médical', 'Kinshasa', 'Mont-Ngafula', 'Monkole', 'Avenue Monkole', -4.42000, 15.25000, 4, 85, true, true, ARRAY['Monkole'], to_tsvector('french', 'Centre Médical Monkole santé')),

-- KINSHASA - Shopping & Commerce
('Marché Central de Kinshasa', 'commerce', 'marché', 'Kinshasa', 'Gombe', 'Marché', 'Avenue de la Paix', -4.32580, 15.31440, 5, 98, true, true, ARRAY['Grand Marché', 'Marché Central'], to_tsvector('french', 'Marché Central Kinshasa commerce')),
('City Market', 'commerce', 'supermarché', 'Kinshasa', 'Gombe', 'City Market', 'Avenue du Commerce', -4.31200, 15.31600, 4, 85, true, true, ARRAY['City Market Kinshasa'], to_tsvector('french', 'City Market commerce supermarché')),
('Kin Plaza', 'commerce', 'centre commercial', 'Kinshasa', 'Gombe', 'Kin Plaza', 'Boulevard du 30 Juin', -4.30800, 15.31400, 4, 80, true, true, ARRAY['Centre Commercial Kin Plaza'], to_tsvector('french', 'Kin Plaza centre commercial')),

-- KINSHASA - Gouvernement
('Palais de la Nation', 'government', 'palais', 'Kinshasa', 'Gombe', 'Centre-ville', 'Avenue de l''Indépendance', -4.30790, 15.31290, 5, 95, true, true, ARRAY['Palais Présidentiel'], to_tsvector('french', 'Palais Nation gouvernement')),
('Assemblée Nationale', 'government', 'assemblée', 'Kinshasa', 'Gombe', 'Assemblée', 'Boulevard du 30 Juin', -4.30900, 15.31100, 5, 90, true, true, ARRAY['Parlement'], to_tsvector('french', 'Assemblée Nationale gouvernement')),

-- KINSHASA - Avenues principales
('Avenue du 30 Juin', 'transport', 'avenue', 'Kinshasa', 'Gombe', 'Centre-ville', 'Avenue du 30 Juin', -4.30790, 15.31290, 4, 95, true, true, ARRAY['30 Juin', 'Trente Juin'], to_tsvector('french', 'Avenue 30 Juin transport')),
('Boulevard Lumumba', 'transport', 'boulevard', 'Kinshasa', 'Limete', 'Lumumba', 'Boulevard Lumumba', -4.38000, 15.29200, 4, 85, true, true, ARRAY['Lumumba Boulevard'], to_tsvector('french', 'Boulevard Lumumba transport')),
('Avenue Kasavubu', 'transport', 'avenue', 'Kinshasa', 'Kalamu', 'Kasavubu', 'Avenue Kasavubu', -4.34000, 15.29500, 4, 80, true, true, ARRAY['Kasavubu'], to_tsvector('french', 'Avenue Kasavubu transport')),

-- LUBUMBASHI - Districts
('Centre-ville Lubumbashi', 'district', 'centre-ville', 'Lubumbashi', 'Lubumbashi', 'Centre', 'Avenue Mobutu', -11.67080, 27.47940, 4, 100, true, true, ARRAY['Downtown Lubumbashi'], to_tsvector('french', 'Centre-ville Lubumbashi district')),
('Quartier Kenya', 'district', 'résidentiel', 'Lubumbashi', 'Lubumbashi', 'Kenya', 'Avenue Kenya', -11.68000, 27.48500, 4, 85, true, true, ARRAY['Kenya'], to_tsvector('french', 'Quartier Kenya district')),
('Quartier Industriel', 'district', 'industriel', 'Lubumbashi', 'Lubumbashi', 'Industriel', 'Avenue Industrielle', -11.66000, 27.46000, 4, 80, true, true, ARRAY['Zone Industrielle Lubumbashi'], to_tsvector('french', 'Quartier Industriel district')),

-- LUBUMBASHI - Institutions
('Université de Lubumbashi (UNILU)', 'Éducation', 'Université', 'Lubumbashi', 'Lubumbashi', 'Université', 'Campus UNILU', -11.65000, 27.45000, 5, 95, true, true, ARRAY['UNILU'], to_tsvector('french', 'Université Lubumbashi UNILU')),
('Aéroport de Lubumbashi', 'transport', 'aéroport', 'Lubumbashi', 'Lubumbashi', 'Aéroport', NULL, -11.59120, 27.53090, 5, 95, true, true, ARRAY['Airport Lubumbashi'], to_tsvector('french', 'Aéroport Lubumbashi transport')),
('Hôpital Sendwe', 'santé', 'hôpital', 'Lubumbashi', 'Lubumbashi', 'Sendwe', 'Avenue Sendwe', -11.66500, 27.47500, 5, 90, true, true, ARRAY['Sendwe Hospital'], to_tsvector('french', 'Hôpital Sendwe santé')),

-- KOLWEZI - Mines et centres
('Centre-ville Kolwezi', 'district', 'centre-ville', 'Kolwezi', 'Kolwezi', 'Centre', 'Avenue Centrale', -10.71580, 25.46640, 4, 100, true, true, ARRAY['Downtown Kolwezi'], to_tsvector('french', 'Centre-ville Kolwezi district')),
('Zone Minière Kolwezi', 'industrie', 'mines', 'Kolwezi', 'Kolwezi', 'Mines', 'Route Minière', -10.70000, 25.45000, 5, 95, true, true, ARRAY['Mines Kolwezi'], to_tsvector('french', 'Zone Minière Kolwezi industrie')),
('Aéroport de Kolwezi', 'transport', 'aéroport', 'Kolwezi', 'Kolwezi', 'Aéroport', NULL, -10.69000, 25.50000, 5, 85, true, true, ARRAY['Airport Kolwezi'], to_tsvector('french', 'Aéroport Kolwezi transport')),

-- ABIDJAN - Districts
('Plateau Abidjan', 'district', 'centre-ville', 'Abidjan', 'Plateau', 'Centre', 'Boulevard Clozel', 5.32472, -4.01472, 4, 100, true, true, ARRAY['Le Plateau', 'Downtown Abidjan'], to_tsvector('french', 'Plateau Abidjan district centre-ville')),
('Cocody', 'district', 'résidentiel', 'Abidjan', 'Cocody', 'Résidentiel', 'Boulevard Lagunaire', 5.34722, -3.98611, 4, 95, true, true, ARRAY['Cocody Abidjan'], to_tsvector('french', 'Cocody district résidentiel')),
('Treichville', 'district', 'commercial', 'Abidjan', 'Treichville', 'Commercial', 'Rue du Commerce', 5.30000, -4.00000, 4, 90, true, true, ARRAY['Treichville'], to_tsvector('french', 'Treichville district commercial')),
('Adjamé', 'district', 'populaire', 'Abidjan', 'Adjamé', 'Centre', 'Marché Adjamé', 5.36667, -4.01667, 4, 85, true, true, ARRAY['Adjamé'], to_tsvector('french', 'Adjamé district populaire')),

-- ABIDJAN - Transports
('Aéroport Félix Houphouët-Boigny', 'transport', 'aéroport', 'Abidjan', 'Port-Bouët', 'Aéroport', NULL, 5.26139, -3.92639, 5, 100, true, true, ARRAY['Aéroport Abidjan', 'FHB Airport'], to_tsvector('french', 'Aéroport Félix Houphouët-Boigny transport')),
('Port Autonome d''Abidjan', 'transport', 'port', 'Abidjan', 'Treichville', 'Port', 'Boulevard Giscard d''Estaing', 5.28000, -4.01000, 5, 95, true, true, ARRAY['Port Abidjan'], to_tsvector('french', 'Port Autonome Abidjan transport')),
('Gare Routière d''Adjamé', 'transport', 'gare routière', 'Abidjan', 'Adjamé', 'Transport', 'Gare Adjamé', 5.36500, -4.02000, 4, 85, true, true, ARRAY['Gare Adjamé'], to_tsvector('french', 'Gare Routière Adjamé transport'))

ON CONFLICT (name, city, commune) DO UPDATE SET
    popularity_score = EXCLUDED.popularity_score,
    is_verified = EXCLUDED.is_verified,
    search_vector = EXCLUDED.search_vector,
    updated_at = now();

-- Mettre à jour tous les search_vectors pour optimiser la recherche
UPDATE public.intelligent_places 
SET search_vector = setweight(to_tsvector('french', COALESCE(name, '')), 'A') ||
                   setweight(to_tsvector('french', COALESCE(commune, '')), 'B') ||
                   setweight(to_tsvector('french', COALESCE(quartier, '')), 'B') ||
                   setweight(to_tsvector('french', COALESCE(avenue, '')), 'C') ||
                   setweight(to_tsvector('french', COALESCE(array_to_string(name_alternatives, ' '), '')), 'B'),
    updated_at = now()
WHERE search_vector IS NULL OR search_vector = '';