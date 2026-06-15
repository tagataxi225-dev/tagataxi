-- Insérer la base de données complète pour Kinshasa (RDC)
INSERT INTO public.places_database (name, name_fr, name_local, place_type, category, country_code, city, commune, latitude, longitude, is_popular, search_keywords) VALUES

-- Aéroports
('N''djili International Airport', 'Aéroport International N''djili', 'Ndolo', 'airport', 'transport', 'CD', 'Kinshasa', 'N''djili', -4.3857, 15.4446, true, ARRAY['aeroport', 'airport', 'vol', 'avion']),
('Ndolo Airport', 'Aéroport de Ndolo', 'Ndolo', 'airport', 'transport', 'CD', 'Kinshasa', 'Barumbu', -4.3275, 15.3270, false, ARRAY['aeroport', 'ndolo', 'domestique']),

-- Communes de Kinshasa (24 communes)
('Gombe', 'Gombe', 'Gombe', 'administrative', 'commune', 'CD', 'Kinshasa', 'Gombe', -4.3276, 15.3154, true, ARRAY['centre', 'business', 'affaires']),
('Kalamu', 'Kalamu', 'Kalamu', 'administrative', 'commune', 'CD', 'Kinshasa', 'Kalamu', -4.3500, 15.3000, true, ARRAY['marche']),
('Kasa-Vubu', 'Kasa-Vubu', 'Kasavubu', 'administrative', 'commune', 'CD', 'Kinshasa', 'Kasa-Vubu', -4.3333, 15.3000, true, ARRAY['dendale']),
('Kinshasa', 'Kinshasa (Commune)', 'Kinshasa', 'administrative', 'commune', 'CD', 'Kinshasa', 'Kinshasa', -4.3083, 15.3167, true, ARRAY['centre', 'port']),
('Barumbu', 'Barumbu', 'Barumbu', 'administrative', 'commune', 'CD', 'Kinshasa', 'Barumbu', -4.3167, 15.3167, true, ARRAY['ndolo']),
('Lingwala', 'Lingwala', 'Lingwala', 'administrative', 'commune', 'CD', 'Kinshasa', 'Lingwala', -4.3167, 15.2833, true, ARRAY['centre']),
('Kintambo', 'Kintambo', 'Kintambo', 'administrative', 'commune', 'CD', 'Kinshasa', 'Kintambo', -4.3298, 15.2889, true, ARRAY['magasin', 'shopping']),
('Bandalungwa', 'Bandalungwa', 'Bandalungwa', 'administrative', 'commune', 'CD', 'Kinshasa', 'Bandalungwa', -4.3333, 15.2833, true, ARRAY['residentiel']),
('Ngaliema', 'Ngaliema', 'Ngaliema', 'administrative', 'commune', 'CD', 'Kinshasa', 'Ngaliema', -4.3506, 15.2721, true, ARRAY['diplomatique', 'ambassade']),
('Lemba', 'Lemba', 'Lemba', 'administrative', 'commune', 'CD', 'Kinshasa', 'Lemba', -4.3891, 15.2614, true, ARRAY['terminus', 'transport']),
('Limete', 'Limete', 'Limete', 'administrative', 'commune', 'CD', 'Kinshasa', 'Limete', -4.3667, 15.3167, true, ARRAY['industriel', 'marche']),
('Matongé', 'Matongé', 'Matete', 'administrative', 'commune', 'CD', 'Kinshasa', 'Matongé', -4.3891, 15.2877, true, ARRAY['matete']),
('Ngaba', 'Ngaba', 'Ngaba', 'administrative', 'commune', 'CD', 'Kinshasa', 'Ngaba', -4.3667, 15.2500, true, ARRAY['residentiel']),
('Makala', 'Makala', 'Makala', 'administrative', 'commune', 'CD', 'Kinshasa', 'Makala', -4.4000, 15.2333, true, ARRAY['residentiel']),
('Selembao', 'Selembao', 'Selembao', 'administrative', 'commune', 'CD', 'Kinshasa', 'Selembao', -4.3833, 15.2500, true, ARRAY['residentiel']),
('Kisenso', 'Kisenso', 'Kisenso', 'administrative', 'commune', 'CD', 'Kinshasa', 'Kisenso', -4.4167, 15.2167, true, ARRAY['residentiel']),
('Bumbu', 'Bumbu', 'Bumbu', 'administrative', 'commune', 'CD', 'Kinshasa', 'Bumbu', -4.4167, 15.2500, true, ARRAY['residentiel']),
('Mont Ngafula', 'Mont Ngafula', 'Mont Ngafula', 'administrative', 'commune', 'CD', 'Kinshasa', 'Mont Ngafula', -4.4333, 15.2833, true, ARRAY['residentiel', 'mont']),
('Masina', 'Masina', 'Masina', 'administrative', 'commune', 'CD', 'Kinshasa', 'Masina', -4.3833, 15.3667, true, ARRAY['residentiel']),
('N''djili', 'N''djili', 'Ndjili', 'administrative', 'commune', 'CD', 'Kinshasa', 'N''djili', -4.3833, 15.4333, true, ARRAY['aeroport']),
('Kimbanseke', 'Kimbanseke', 'Kimbanseke', 'administrative', 'commune', 'CD', 'Kinshasa', 'Kimbanseke', -4.4167, 15.3833, true, ARRAY['residentiel']),
('Nsele', 'Nsele', 'Nsele', 'administrative', 'commune', 'CD', 'Kinshasa', 'Nsele', -4.3667, 15.4833, true, ARRAY['rural', 'fleuve']),
('Maluku', 'Maluku', 'Maluku', 'administrative', 'commune', 'CD', 'Kinshasa', 'Maluku', -4.2833, 15.5833, false, ARRAY['rural']),

-- Marchés importants
('Marché Central', 'Marché Central', 'Zando ya katikati', 'market', 'commerce', 'CD', 'Kinshasa', 'Gombe', -4.3217, 15.3069, true, ARRAY['marche', 'market', 'commerce', 'shopping']),
('Marché de la Liberté', 'Marché de la Liberté', 'Zando ya liberte', 'market', 'commerce', 'CD', 'Kinshasa', 'Kalamu', -4.3450, 15.2980, true, ARRAY['marche', 'liberte', 'kalamu']),
('Marché Matongé', 'Marché Matongé', 'Zando ya Matete', 'market', 'commerce', 'CD', 'Kinshasa', 'Matongé', -4.3900, 15.2850, true, ARRAY['marche', 'matete', 'matongé']),
('Marché de Limete', 'Marché de Limete', 'Zando ya Limete', 'market', 'commerce', 'CD', 'Kinshasa', 'Limete', -4.3700, 15.3200, true, ARRAY['marche', 'limete']),

-- Universités
('Université de Kinshasa', 'Université de Kinshasa', 'Université ya Kinshasa', 'university', 'education', 'CD', 'Kinshasa', 'Lemba', -4.4339, 15.3505, true, ARRAY['universite', 'unikin', 'education', 'ecole']),
('Université Libre de Kinshasa', 'Université Libre de Kinshasa', 'ULK', 'university', 'education', 'CD', 'Kinshasa', 'Gombe', -4.3200, 15.3100, true, ARRAY['ulk', 'universite', 'libre']),
('Institut Supérieur de Commerce', 'Institut Supérieur de Commerce', 'ISC', 'university', 'education', 'CD', 'Kinshasa', 'Gombe', -4.3250, 15.3080, false, ARRAY['isc', 'commerce', 'institut']),

-- Hôpitaux
('Hôpital Général de Kinshasa', 'Hôpital Général de Kinshasa', 'Lopitalo monene', 'hospital', 'health', 'CD', 'Kinshasa', 'Gombe', -4.3150, 15.3050, true, ARRAY['hopital', 'hospital', 'sante', 'medical']),
('Cliniques Universitaires de Kinshasa', 'Cliniques Universitaires de Kinshasa', 'CUK', 'hospital', 'health', 'CD', 'Kinshasa', 'Lemba', -4.4350, 15.3550, true, ARRAY['cuk', 'clinique', 'universitaire']),
('Hôpital du Cinquantenaire', 'Hôpital du Cinquantenaire', 'Lopitalo ya 50', 'hospital', 'health', 'CD', 'Kinshasa', 'Lingwala', -4.3100, 15.2900, true, ARRAY['cinquantenaire', '50', 'hopital']),

-- Lieux de culte importants
('Cathédrale Notre-Dame du Congo', 'Cathédrale Notre-Dame du Congo', 'Cathédrale', 'church', 'religion', 'CD', 'Kinshasa', 'Gombe', -4.3230, 15.3120, true, ARRAY['cathedrale', 'eglise', 'notre-dame']),
('Mosquée Centrale', 'Mosquée Centrale', 'Mosike ya katikati', 'mosque', 'religion', 'CD', 'Kinshasa', 'Gombe', -4.3200, 15.3150, true, ARRAY['mosquee', 'islam']),

-- Transport et gares
('Gare Centrale', 'Gare Centrale', 'Gare ya katikati', 'train_station', 'transport', 'CD', 'Kinshasa', 'Gombe', -4.3180, 15.3080, true, ARRAY['gare', 'train', 'transport', 'chemin']),
('Port de Kinshasa', 'Port de Kinshasa', 'Libongo ya Kinshasa', 'port', 'transport', 'CD', 'Kinshasa', 'Kinshasa', -4.3050, 15.3200, true, ARRAY['port', 'bateau', 'fleuve', 'congo']),
('Terminus Lemba', 'Terminus Lemba', 'Terminus ya Lemba', 'bus_station', 'transport', 'CD', 'Kinshasa', 'Lemba', -4.3950, 15.2650, true, ARRAY['terminus', 'bus', 'lemba']),

-- Centres commerciaux
('City Market', 'City Market', 'City Market', 'shopping_mall', 'commerce', 'CD', 'Kinshasa', 'Gombe', -4.3250, 15.3100, true, ARRAY['city', 'market', 'shopping', 'centre']),
('Kin Mazière', 'Kin Mazière', 'Kin Mazière', 'shopping_mall', 'commerce', 'CD', 'Kinshasa', 'Gombe', -4.3280, 15.3180, true, ARRAY['kin', 'maziere', 'shopping']),

-- Lieux gouvernementaux
('Palais de la Nation', 'Palais de la Nation', 'Ndako ya Ekolo', 'government', 'government', 'CD', 'Kinshasa', 'Gombe', -4.3200, 15.3000, true, ARRAY['palais', 'president', 'gouvernement']),
('Assemblée Nationale', 'Assemblée Nationale', 'Lisanga ya Ekolo', 'government', 'government', 'CD', 'Kinshasa', 'Gombe', -4.3220, 15.2980, true, ARRAY['assemblee', 'parlement', 'nationale']),

-- Sites touristiques
('Parc de la Vallée de la Nsele', 'Parc de la Vallée de la Nsele', 'Parc ya Nsele', 'park', 'tourism', 'CD', 'Kinshasa', 'Nsele', -4.3500, 15.5000, true, ARRAY['parc', 'nsele', 'nature', 'zoo']),
('Musée National', 'Musée National', 'Musée ya Ekolo', 'museum', 'tourism', 'CD', 'Kinshasa', 'Gombe', -4.3190, 15.3060, true, ARRAY['musee', 'culture', 'national']),

-- Boulevards et rues principales
('Boulevard du 30 Juin', 'Boulevard du 30 Juin', 'Boulevard ya 30 Juin', 'road', 'transport', 'CD', 'Kinshasa', 'Gombe', -4.3184, 15.3136, true, ARRAY['boulevard', '30', 'juin', 'avenue']),
('Avenue Kabasele Tshamala', 'Avenue Kabasele Tshamala', 'Avenue Kabasele', 'road', 'transport', 'CD', 'Kinshasa', 'Gombe', -4.3200, 15.3180, true, ARRAY['kabasele', 'avenue', 'tshamala']),
('Place de la Poste', 'Place de la Poste', 'Esika ya Poste', 'landmark', 'government', 'CD', 'Kinshasa', 'Gombe', -4.3232, 15.3097, true, ARRAY['place', 'poste', 'post']),

-- Quartiers populaires de différentes communes
('Victoire', 'Victoire', 'Victoire', 'neighborhood', 'residential', 'CD', 'Kinshasa', 'Kalamu', -4.3550, 15.2950, false, ARRAY['victoire', 'quartier']),
('Matonge Music', 'Matonge Music', 'Matonge Music', 'neighborhood', 'entertainment', 'CD', 'Kinshasa', 'Kalamu', -4.3480, 15.2920, true, ARRAY['matonge', 'music', 'musique', 'bar']),
('Righini', 'Righini', 'Righini', 'neighborhood', 'residential', 'CD', 'Kinshasa', 'Lemba', -4.3950, 15.2700, false, ARRAY['righini', 'quartier']),
('UPN', 'UPN', 'UPN', 'neighborhood', 'residential', 'CD', 'Kinshasa', 'Gombe', -4.3300, 15.3200, false, ARRAY['upn', 'quartier']),
('Binza Pigeon', 'Binza Pigeon', 'Binza Pigeon', 'neighborhood', 'residential', 'CD', 'Kinshasa', 'Ngaliema', -4.3600, 15.2600, false, ARRAY['binza', 'pigeon']),
('Binza Météo', 'Binza Météo', 'Binza Météo', 'neighborhood', 'residential', 'CD', 'Kinshasa', 'Ngaliema', -4.3550, 15.2650, false, ARRAY['binza', 'meteo']),
('Ma Campagne', 'Ma Campagne', 'Ma Campagne', 'neighborhood', 'residential', 'CD', 'Kinshasa', 'Ngaliema', -4.3650, 15.2550, false, ARRAY['campagne', 'quartier']),
('Joli Parc', 'Joli Parc', 'Joli Parc', 'neighborhood', 'residential', 'CD', 'Kinshasa', 'Ngaliema', -4.3500, 15.2600, false, ARRAY['joli', 'parc']),
('Kingabwa', 'Kingabwa', 'Kingabwa', 'neighborhood', 'residential', 'CD', 'Kinshasa', 'Limete', -4.3750, 15.3250, false, ARRAY['kingabwa']),
('Industriel', 'Industriel', 'Industriel', 'neighborhood', 'industrial', 'CD', 'Kinshasa', 'Limete', -4.3700, 15.3100, false, ARRAY['industriel', 'usine']),
('Sainte Thérèse', 'Sainte Thérèse', 'Sainte Thérèse', 'neighborhood', 'residential', 'CD', 'Kinshasa', 'Masina', -4.3800, 15.3700, false, ARRAY['therese', 'sainte']),
('Petro Congo', 'Petro Congo', 'Petro Congo', 'neighborhood', 'industrial', 'CD', 'Kinshasa', 'Masina', -4.3850, 15.3650, false, ARRAY['petro', 'congo', 'petrole']);

-- Insérer des lieux pour Abidjan (Côte d'Ivoire)
INSERT INTO public.places_database (name, name_fr, name_local, place_type, category, country_code, city, commune, latitude, longitude, is_popular, search_keywords) VALUES

-- Aéroport
('Aéroport Félix Houphouët-Boigny', 'Aéroport Félix Houphouët-Boigny', 'Port Bouët Airport', 'airport', 'transport', 'CI', 'Abidjan', 'Port-Bouët', 5.2539, -3.9263, true, ARRAY['aeroport', 'airport', 'houphouet', 'boigny']),

-- Communes d'Abidjan
('Plateau', 'Plateau', 'Plateau', 'administrative', 'commune', 'CI', 'Abidjan', 'Plateau', 5.3197, -4.0197, true, ARRAY['centre', 'business', 'affaires', 'administratif']),
('Cocody', 'Cocody', 'Cocody', 'administrative', 'commune', 'CI', 'Abidjan', 'Cocody', 5.3436, -3.9857, true, ARRAY['residentiel', 'universite']),
('Yopougon', 'Yopougon', 'Yop City', 'administrative', 'commune', 'CI', 'Abidjan', 'Yopougon', 5.3392, -4.0942, true, ARRAY['yop', 'populaire']),
('Adjamé', 'Adjamé', 'Adjamé', 'administrative', 'commune', 'CI', 'Abidjan', 'Adjamé', 5.3609, -4.0267, true, ARRAY['gare', 'transport', 'marche']),
('Treichville', 'Treichville', 'Treichville', 'administrative', 'commune', 'CI', 'Abidjan', 'Treichville', 5.2984, -4.0164, true, ARRAY['port', 'industriel']),
('Marcory', 'Marcory', 'Marcory', 'administrative', 'commune', 'CI', 'Abidjan', 'Marcory', 5.2885, -3.9895, true, ARRAY['residentiel']),
('Koumassi', 'Koumassi', 'Koumassi', 'administrative', 'commune', 'CI', 'Abidjan', 'Koumassi', 5.2893, -3.9532, true, ARRAY['residentiel']),
('Port-Bouët', 'Port-Bouët', 'Port-Bouët', 'administrative', 'commune', 'CI', 'Abidjan', 'Port-Bouët', 5.2539, -3.9263, true, ARRAY['aeroport', 'plage']),
('Attécoubé', 'Attécoubé', 'Attécoubé', 'administrative', 'commune', 'CI', 'Abidjan', 'Attécoubé', 5.3235, -4.0835, true, ARRAY['residentiel']),
('Abobo', 'Abobo', 'Abobo', 'administrative', 'commune', 'CI', 'Abidjan', 'Abobo', 5.4164, -4.0201, true, ARRAY['populaire', 'residentiel']);

-- Fonction pour rechercher des lieux avec intelligence
CREATE OR REPLACE FUNCTION public.search_places(
  search_query text,
  user_country_code text DEFAULT 'CD',
  user_city text DEFAULT 'Kinshasa',
  max_results integer DEFAULT 10
) RETURNS TABLE (
  id uuid,
  name text,
  name_fr text,
  name_local text,
  place_type text,
  category text,
  country_code text,
  city text,
  commune text,
  latitude numeric,
  longitude numeric,
  is_popular boolean,
  search_keywords text[],
  relevance_score float
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
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
    -- Score de pertinence basé sur plusieurs facteurs
    (
      -- Correspondance exacte du nom (score élevé)
      CASE WHEN lower(p.name) = lower(search_query) THEN 100.0
           WHEN lower(p.name_fr) = lower(search_query) THEN 95.0
           WHEN lower(p.name_local) = lower(search_query) THEN 90.0
           ELSE 0.0 END +
      
      -- Correspondance partielle du nom
      CASE WHEN lower(p.name) LIKE '%' || lower(search_query) || '%' THEN 50.0
           WHEN lower(p.name_fr) LIKE '%' || lower(search_query) || '%' THEN 45.0
           WHEN lower(p.name_local) LIKE '%' || lower(search_query) || '%' THEN 40.0
           ELSE 0.0 END +
      
      -- Correspondance des mots-clés
      CASE WHEN search_query = ANY(p.search_keywords) THEN 80.0
           WHEN lower(search_query) = ANY(ARRAY(SELECT lower(unnest(p.search_keywords)))) THEN 75.0
           ELSE 0.0 END +
      
      -- Bonus pour le pays/ville de l'utilisateur
      CASE WHEN p.country_code = user_country_code THEN 20.0 ELSE 0.0 END +
      CASE WHEN p.city = user_city THEN 15.0 ELSE 0.0 END +
      
      -- Bonus pour les lieux populaires
      CASE WHEN p.is_popular THEN 10.0 ELSE 0.0 END
      
    )::float AS relevance_score
  FROM public.places_database p
  WHERE 
    p.is_active = true
    AND (
      -- Recherche textuelle
      lower(p.name) LIKE '%' || lower(search_query) || '%'
      OR lower(p.name_fr) LIKE '%' || lower(search_query) || '%'
      OR lower(p.name_local) LIKE '%' || lower(search_query) || '%'
      OR lower(search_query) = ANY(ARRAY(SELECT lower(unnest(p.search_keywords))))
      OR to_tsvector('french', p.name || ' ' || p.name_fr || ' ' || COALESCE(p.name_local, '')) @@ plainto_tsquery('french', search_query)
    )
  ORDER BY 
    -- Prioriser par pays/ville utilisateur puis par score de pertinence
    (CASE WHEN p.country_code = user_country_code THEN 0 ELSE 1 END),
    (CASE WHEN p.city = user_city THEN 0 ELSE 1 END),
    relevance_score DESC,
    p.is_popular DESC,
    p.name ASC
  LIMIT max_results;
END;
$$;