-- Créer la table de base de données géographique africaine étendue
CREATE TABLE public.places_database (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  name_fr TEXT NOT NULL,
  name_local TEXT,
  place_type TEXT NOT NULL DEFAULT 'locality',
  category TEXT NOT NULL DEFAULT 'general',
  country_code TEXT NOT NULL DEFAULT 'CD',
  city TEXT NOT NULL DEFAULT 'Kinshasa',
  commune TEXT,
  district TEXT,
  latitude NUMERIC NOT NULL,
  longitude NUMERIC NOT NULL,
  accuracy INTEGER DEFAULT 50,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_popular BOOLEAN NOT NULL DEFAULT false,
  search_keywords TEXT[],
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index pour les recherches géographiques
CREATE INDEX idx_places_location ON public.places_database USING GIST(
  ll_to_earth(latitude::float8, longitude::float8)
);

-- Index pour les recherches par nom
CREATE INDEX idx_places_search ON public.places_database 
USING GIN(to_tsvector('french', name || ' ' || name_fr || ' ' || COALESCE(name_local, '')));

-- Index pour les pays et villes
CREATE INDEX idx_places_country_city ON public.places_database(country_code, city);

-- Index pour les recherches de mots-clés
CREATE INDEX idx_places_keywords ON public.places_database USING GIN(search_keywords);

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

-- Communes d''Abidjan
('Plateau', 'Plateau', 'Plateau', 'administrative', 'commune', 'CI', 'Abidjan', 'Plateau', 5.3197, -4.0197, true, ARRAY['centre', 'business', 'affaires', 'administratif']),
('Cocody', 'Cocody', 'Cocody', 'administrative', 'commune', 'CI', 'Abidjan', 'Cocody', 5.3436, -3.9857, true, ARRAY['residentiel', 'universite']),
('Yopougon', 'Yopougon', 'Yop City', 'administrative', 'commune', 'CI', 'Abidjan', 'Yopougon', 5.3392, -4.0942, true, ARRAY['yop', 'populaire']),
('Adjamé', 'Adjamé', 'Adjamé', 'administrative', 'commune', 'CI', 'Abidjan', 'Adjamé', 5.3609, -4.0267, true, ARRAY['gare', 'transport', 'marche']),
('Treichville', 'Treichville', 'Treichville', 'administrative', 'commune', 'CI', 'Abidjan', 'Treichville', 5.2984, -4.0164, true, ARRAY['port', 'industriel']),
('Marcory', 'Marcory', 'Marcory', 'administrative', 'commune', 'CI', 'Abidjan', 'Marcory', 5.2885, -3.9895, true, ARRAY['residentiel']),
('Koumassi', 'Koumassi', 'Koumassi', 'administrative', 'commune', 'CI', 'Abidjan', 'Koumassi', 5.2893, -3.9532, true, ARRAY['residentiel']),
('Port-Bouët', 'Port-Bouët', 'Port-Bouët', 'administrative', 'commune', 'CI', 'Abidjan', 'Port-Bouët', 5.2539, -3.9263, true, ARRAY['aeroport', 'plage']),
('Attécoubé', 'Attécoubé', 'Attécoubé', 'administrative', 'commune', 'CI', 'Abidjan', 'Attécoubé', 5.3235, -4.0835, true, ARRAY['residentiel']),
('Abobo', 'Abobo', 'Abobo', 'administrative', 'commune', 'CI', 'Abidjan', 'Abobo', 5.4164, -4.0201, true, ARRAY['populaire', 'residentiel']),

-- Infrastructures importantes
('Pont Félix Houphouët-Boigny', 'Pont Félix Houphouët-Boigny', 'Pont FHB', 'bridge', 'transport', 'CI', 'Abidjan', 'Plateau', 5.3100, -4.0100, true, ARRAY['pont', 'bridge', 'fhb', 'houphouet']),
('Port Autonome d''Abidjan', 'Port Autonome d''Abidjan', 'Port d''Abidjan', 'port', 'transport', 'CI', 'Abidjan', 'Treichville', 5.2900, -4.0200, true, ARRAY['port', 'autonome', 'bateau']),

-- Universités
('Université Félix Houphouët-Boigny', 'Université Félix Houphouët-Boigny', 'Cocody University', 'university', 'education', 'CI', 'Abidjan', 'Cocody', 5.3600, -3.9800, true, ARRAY['universite', 'cocody', 'houphouet']),

-- Marchés
('Marché de Treichville', 'Marché de Treichville', 'Treichville Market', 'market', 'commerce', 'CI', 'Abidjan', 'Treichville', 5.2950, -4.0150, true, ARRAY['marche', 'treichville']),
('Marché d''Adjamé', 'Marché d''Adjamé', 'Adjamé Market', 'market', 'commerce', 'CI', 'Abidjan', 'Adjamé', 5.3650, -4.0250, true, ARRAY['marche', 'adjame']),
('Marché de Cocody', 'Marché de Cocody', 'Cocody Market', 'market', 'commerce', 'CI', 'Abidjan', 'Cocody', 5.3500, -3.9850, true, ARRAY['marche', 'cocody']),

-- Centres commerciaux
('Cap Sud', 'Cap Sud', 'Cap Sud', 'shopping_mall', 'commerce', 'CI', 'Abidjan', 'Treichville', 5.2850, -4.0100, true, ARRAY['cap', 'sud', 'shopping', 'centre']),
('Playce Palmeraie', 'Playce Palmeraie', 'Playce Palmeraie', 'shopping_mall', 'commerce', 'CI', 'Abidjan', 'Cocody', 5.3650, -3.9750, true, ARRAY['playce', 'palmeraie', 'shopping']),

-- Lieux touristiques
('Banco National Park', 'Parc National du Banco', 'Banco Forest', 'park', 'tourism', 'CI', 'Abidjan', 'Attécoubé', 5.3833, -4.0667, true, ARRAY['banco', 'parc', 'foret', 'nature']),
('Lagune Ébrié', 'Lagune Ébrié', 'Lagune Ébrié', 'lagoon', 'tourism', 'CI', 'Abidjan', 'Plateau', 5.3100, -4.0000, true, ARRAY['lagune', 'ebrie', 'eau']),

-- Quartiers populaires
('Zone 4', 'Zone 4', 'Zone 4', 'neighborhood', 'residential', 'CI', 'Abidjan', 'Marcory', 5.2800, -3.9800, false, ARRAY['zone', '4', 'marcory']),
('Riviera', 'Riviera', 'Riviera', 'neighborhood', 'residential', 'CI', 'Abidjan', 'Cocody', 5.3700, -3.9700, true, ARRAY['riviera', 'residentiel']),
('Deux Plateaux', 'Deux Plateaux', 'Deux Plateaux', 'neighborhood', 'residential', 'CI', 'Abidjan', 'Cocody', 5.3800, -3.9600, true, ARRAY['deux', 'plateaux', 'vallon']),
('Angré', 'Angré', 'Angré', 'neighborhood', 'residential', 'CI', 'Abidjan', 'Cocody', 5.4000, -3.9500, true, ARRAY['angre', 'residentiel']),
('Williamsville', 'Williamsville', 'Williamsville', 'neighborhood', 'residential', 'CI', 'Abidjan', 'Adjamé', 5.3800, -4.0400, false, ARRAY['williamsville']),
('Adjamé 220 Logements', 'Adjamé 220 Logements', '220 Logements', 'neighborhood', 'residential', 'CI', 'Abidjan', 'Adjamé', 5.3700, -4.0300, false, ARRAY['220', 'logements', 'adjame']),
('Sicogi', 'Sicogi', 'Sicogi', 'neighborhood', 'residential', 'CI', 'Abidjan', 'Yopougon', 5.3500, -4.1000, false, ARRAY['sicogi']),
('Niangon', 'Niangon', 'Niangon', 'neighborhood', 'residential', 'CI', 'Abidjan', 'Yopougon', 5.3600, -4.1100, false, ARRAY['niangon']),
('Wassakara', 'Wassakara', 'Wassakara', 'neighborhood', 'residential', 'CI', 'Abidjan', 'Yopougon', 5.3400, -4.1200, false, ARRAY['wassakara']);

-- RLS policy pour la lecture publique
ALTER TABLE public.places_database ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read places database" ON public.places_database
  FOR SELECT USING (is_active = true);

-- Trigger pour updated_at
CREATE TRIGGER update_places_database_updated_at
  BEFORE UPDATE ON public.places_database
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();