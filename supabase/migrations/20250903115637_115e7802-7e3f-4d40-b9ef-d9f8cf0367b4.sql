-- Enrichissement massif des données avec contraintes corrigées
-- Suppression des contraintes existantes si elles existent pour éviter les conflits
DROP INDEX IF EXISTS idx_intelligent_places_unique_location;

-- Ajouter une contrainte unique pour éviter les doublons
ALTER TABLE public.intelligent_places 
ADD CONSTRAINT unique_place_per_city_commune 
UNIQUE (name, city, commune);

-- Enrichissement massif des données de localisation pour Lubumbashi, Kolwezi et Kinshasa
INSERT INTO public.intelligent_places (name, category, subcategory, city, commune, quartier, avenue, latitude, longitude, hierarchy_level, popularity_score, is_verified, is_active, name_alternatives) VALUES

-- LUBUMBASHI - Quartiers principaux avec coordonnées précises
('Annexe', 'quartier', 'résidentiel', 'Lubumbashi', 'Annexe', 'Annexe', NULL, -11.6594, 27.4794, 4, 95, true, true, ARRAY['Quartier Annexe']),
('Kampemba', 'quartier', 'résidentiel', 'Lubumbashi', 'Kampemba', 'Kampemba', NULL, -11.6800, 27.4700, 4, 90, true, true, ARRAY['Quartier Kampemba']),
('Katuba', 'quartier', 'résidentiel', 'Lubumbashi', 'Katuba', 'Katuba', NULL, -11.6450, 27.4850, 4, 88, true, true, ARRAY['Quartier Katuba']),
('Kenya', 'quartier', 'résidentiel', 'Lubumbashi', 'Kenya', 'Kenya', NULL, -11.6700, 27.4600, 4, 85, true, true, ARRAY['Quartier Kenya']),
('Ruashi', 'quartier', 'résidentiel', 'Lubumbashi', 'Ruashi', 'Ruashi', NULL, -11.6350, 27.5100, 4, 82, true, true, ARRAY['Quartier Ruashi']),

-- LUBUMBASHI - Points d'intérêt majeurs
('Aéroport International Luano', 'transport', 'aéroport', 'Lubumbashi', 'Luano', NULL, NULL, -11.5913, 27.5309, 5, 100, true, true, ARRAY['Aéroport Luano', 'Airport Luano']),
('Université de Lubumbashi (UNILU)', 'éducation', 'université', 'Lubumbashi', 'Annexe', NULL, 'Avenue Kasavubu', -11.6566, 27.4794, 5, 95, true, true, ARRAY['UNILU', 'Université Lubumbashi']),
('Stade TP Mazembe', 'sport', 'stade', 'Lubumbashi', 'Kamalondo', NULL, 'Avenue Lumumba', -11.6600, 27.4750, 5, 92, true, true, ARRAY['Stade Mazembe', 'TP Mazembe Stadium']),
('Marché Central de Lubumbashi', 'commerce', 'marché', 'Lubumbashi', 'Lubumbashi', 'Centre-ville', 'Avenue Lumumba', -11.6594, 27.4794, 5, 90, true, true, ARRAY['Grand Marché', 'Marché Lubumbashi']),
('Hôpital Sendwe', 'santé', 'hôpital', 'Lubumbashi', 'Lubumbashi', 'Centre-ville', 'Avenue Sendwe', -11.6550, 27.4800, 5, 88, true, true, ARRAY['Hôpital Jason Sendwe']),

-- LUBUMBASHI - Centres commerciaux et entreprises
('Shoprite Lubumbashi', 'commerce', 'supermarché', 'Lubumbashi', 'Annexe', 'Annexe', 'Avenue Kasavubu', -11.6580, 27.4810, 4, 85, true, true, ARRAY['Shoprite', 'Supermarché Shoprite']),
('Rawbank Lubumbashi', 'finance', 'banque', 'Lubumbashi', 'Lubumbashi', 'Centre-ville', 'Avenue Lumumba', -11.6590, 27.4790, 4, 80, true, true, ARRAY['RAW Bank']),
('Hotel Karavia', 'hospitalité', 'hôtel', 'Lubumbashi', 'Annexe', 'Annexe', 'Avenue Kasavubu', -11.6575, 27.4805, 4, 78, true, true, ARRAY['Karavia Hotel']),
('Gecamines Building', 'administration', 'entreprise', 'Lubumbashi', 'Lubumbashi', 'Centre-ville', 'Avenue Lumumba', -11.6600, 27.4780, 4, 75, true, true, ARRAY['Gécamines', 'Gecamines']),

-- LUBUMBASHI - Avenues principales
('Avenue Lumumba Lubumbashi', 'transport', 'avenue', 'Lubumbashi', 'Lubumbashi', 'Centre-ville', 'Avenue Lumumba', -11.6594, 27.4794, 3, 90, true, true, ARRAY['Av. Lumumba', 'Lumumba Avenue']),
('Avenue Kasavubu Lubumbashi', 'transport', 'avenue', 'Lubumbashi', 'Annexe', 'Annexe', 'Avenue Kasavubu', -11.6580, 27.4810, 3, 85, true, true, ARRAY['Av. Kasavubu', 'Kasavubu Avenue']),
('Avenue Sendwe Lubumbashi', 'transport', 'avenue', 'Lubumbashi', 'Lubumbashi', 'Centre-ville', 'Avenue Sendwe', -11.6550, 27.4800, 3, 80, true, true, ARRAY['Av. Sendwe', 'Sendwe Avenue']),

-- KOLWEZI - Quartiers principaux
('Dilala', 'quartier', 'résidentiel', 'Kolwezi', 'Dilala', 'Dilala', NULL, -10.7147, 25.4615, 4, 90, true, true, ARRAY['Quartier Dilala']),
('Manika', 'quartier', 'résidentiel', 'Kolwezi', 'Manika', 'Manika', NULL, -10.7200, 25.4700, 4, 85, true, true, ARRAY['Quartier Manika']),
('Mutoshi', 'quartier', 'industriel', 'Kolwezi', 'Mutoshi', 'Mutoshi', NULL, -10.7000, 25.4500, 4, 82, true, true, ARRAY['Quartier Mutoshi']),

-- KOLWEZI - Points d'intérêt
('Aéroport de Kolwezi', 'transport', 'aéroport', 'Kolwezi', 'Kolwezi', 'Centre-ville', NULL, -10.7689, 25.5056, 5, 95, true, true, ARRAY['Airport Kolwezi']),
('Mine de Mutanda', 'industrie', 'mine', 'Kolwezi', 'Mutoshi', 'Mutoshi', NULL, -10.6900, 25.4400, 5, 88, true, true, ARRAY['Mutanda Mining']),
('Hôpital Général de Kolwezi', 'santé', 'hôpital', 'Kolwezi', 'Kolwezi', 'Centre-ville', NULL, -10.7147, 25.4615, 5, 85, true, true, ARRAY['Hôpital Kolwezi']),
('Marché Central Kolwezi', 'commerce', 'marché', 'Kolwezi', 'Kolwezi', 'Centre-ville', 'Avenue Lumumba', -10.7150, 25.4620, 5, 82, true, true, ARRAY['Grand Marché Kolwezi']),

-- KINSHASA - Enrichissement massif (ajout de lieux supplémentaires)
-- Quartiers manquants
('Binza Pigeon', 'quartier', 'résidentiel', 'Kinshasa', 'Mont-Ngafula', 'Binza', NULL, -4.4200, 15.2800, 4, 78, true, true, ARRAY['Binza Pigeon']),
('Binza Ozone', 'quartier', 'résidentiel', 'Kinshasa', 'Mont-Ngafula', 'Binza', NULL, -4.4150, 15.2850, 4, 75, true, true, ARRAY['Binza Ozone']),
('Kingasani', 'quartier', 'résidentiel', 'Kinshasa', 'Kimbanseke', 'Kingasani', NULL, -4.3500, 15.3500, 4, 72, true, true, ARRAY['Quartier Kingasani']),
('Masina', 'quartier', 'résidentiel', 'Kinshasa', 'Masina', 'Masina', NULL, -4.3800, 15.3600, 4, 70, true, true, ARRAY['Quartier Masina']),

-- Kinshasa - Centres commerciaux
('City Market', 'commerce', 'centre commercial', 'Kinshasa', 'Gombe', 'Centre-ville', 'Boulevard du 30 Juin', -4.3217, 15.3069, 5, 90, true, true, ARRAY['City Market Kinshasa']),
('Kin Plaza', 'commerce', 'centre commercial', 'Kinshasa', 'Gombe', 'Centre-ville', 'Avenue des Aviateurs', -4.3200, 15.3080, 5, 88, true, true, ARRAY['Kin Plaza Arrey']),
('Peloustore', 'commerce', 'supermarché', 'Kinshasa', 'Gombe', 'Centre-ville', 'Avenue Colonel Ebeya', -4.3180, 15.3100, 4, 85, true, true, ARRAY['Peloustore Kinshasa']),

-- Kinshasa - Hôpitaux et santé
('Hôpital Mama Yemo', 'santé', 'hôpital', 'Kinshasa', 'Limete', 'Kingabwa', 'Avenue Lumumba', -4.3400, 15.2900, 5, 92, true, true, ARRAY['Mama Yemo Hospital']),
('Clinique Ngaliema', 'santé', 'clinique', 'Kinshasa', 'Ngaliema', 'Ngaliema', 'Avenue de la Révolution', -4.3500, 15.2700, 5, 88, true, true, ARRAY['Ngaliema Medical Center']),
('Hôpital du Cinquantenaire', 'santé', 'hôpital', 'Kinshasa', 'Lingwala', 'Lingwala', 'Avenue de la Justice', -4.3300, 15.3150, 5, 85, true, true, ARRAY['Cinquantenaire Hospital']),

-- Kinshasa - Universités et écoles
('Université Protestante au Congo (UPC)', 'éducation', 'université', 'Kinshasa', 'Lemba', 'UPC', 'Avenue UPC', -4.4000, 15.2800, 5, 90, true, true, ARRAY['UPC Kinshasa']),
('Institut Supérieur de Commerce (ISC)', 'éducation', 'institut', 'Kinshasa', 'Gombe', 'Centre-ville', 'Avenue Tombalbaye', -4.3190, 15.3090, 5, 85, true, true, ARRAY['ISC Kinshasa']),
('Lycée Prince de Liège', 'éducation', 'lycée', 'Kinshasa', 'Gombe', 'Centre-ville', 'Avenue des Écoles', -4.3170, 15.3110, 4, 80, true, true, ARRAY['Prince de Liège']),

-- Kinshasa - Lieux de culte
('Cathédrale Notre-Dame du Congo', 'religion', 'cathédrale', 'Kinshasa', 'Gombe', 'Centre-ville', 'Avenue de la Paix', -4.3200, 15.3100, 5, 88, true, true, ARRAY['Cathédrale Kinshasa']),
('Mosquée Centrale de Kinshasa', 'religion', 'mosquée', 'Kinshasa', 'Barumbu', 'Barumbu', 'Avenue Kasa-Vubu', -4.3250, 15.3200, 5, 82, true, true, ARRAY['Grande Mosquée']),

-- Transport et infrastructure
('Gare Centrale de Kinshasa', 'transport', 'gare', 'Kinshasa', 'Kinshasa', 'Centre-ville', 'Avenue du Port', -4.3250, 15.3150, 5, 90, true, true, ARRAY['Gare Kinshasa', 'Central Station']),
('Port de Kinshasa', 'transport', 'port', 'Kinshasa', 'Kinshasa', 'Port', 'Avenue du Port', -4.3300, 15.3100, 5, 85, true, true, ARRAY['Port Kinshasa', 'Beach Ngobila']),

-- Marchés supplémentaires
('Marché de la Liberté', 'commerce', 'marché', 'Kinshasa', 'Kalamu', 'Kalamu', 'Avenue de la Liberté', -4.3400, 15.3300, 4, 80, true, true, ARRAY['Marché Liberté']),
('Marché Gambela', 'commerce', 'marché', 'Kinshasa', 'Kintambo', 'Kintambo', 'Avenue Gambela', -4.3350, 15.2950, 4, 75, true, true, ARRAY['Gambela Market']),
('Marché Texaf', 'commerce', 'marché', 'Kinshasa', 'Kalamu', 'Yolo Sud', 'Avenue Texaf', -4.3450, 15.3350, 4, 72, true, true, ARRAY['Texaf Market']),

-- Hôtels et restaurants
('Hôtel Memling', 'hospitalité', 'hôtel', 'Kinshasa', 'Gombe', 'Centre-ville', 'Avenue des Aviateurs', -4.3180, 15.3120, 5, 88, true, true, ARRAY['Memling Hotel']),
('Hôtel Sultani', 'hospitalité', 'hôtel', 'Kinshasa', 'Gombe', 'Centre-ville', 'Avenue Colonel Lukusa', -4.3190, 15.3110, 4, 82, true, true, ARRAY['Sultani Hotel']),
('Restaurant Chez Ntemba', 'restauration', 'restaurant', 'Kinshasa', 'Gombe', 'Centre-ville', 'Avenue Tombalbaye', -4.3200, 15.3080, 4, 78, true, true, ARRAY['Ntemba Restaurant'])

ON CONFLICT (name, city, commune) DO NOTHING;

-- Optimisation des index pour la recherche temps réel
CREATE INDEX IF NOT EXISTS idx_intelligent_places_city_search 
ON public.intelligent_places (city, name, popularity_score DESC);

CREATE INDEX IF NOT EXISTS idx_intelligent_places_location_search 
ON public.intelligent_places (city, latitude, longitude);

CREATE INDEX IF NOT EXISTS idx_intelligent_places_category_search 
ON public.intelligent_places (city, category, subcategory, popularity_score DESC);

-- Index GIN pour recherche textuelle avancée
CREATE INDEX IF NOT EXISTS idx_intelligent_places_search_vector_gin 
ON public.intelligent_places USING gin(search_vector);

-- Index pour recherche par proximité géographique
CREATE INDEX IF NOT EXISTS idx_intelligent_places_location_btree 
ON public.intelligent_places (latitude, longitude, city);

-- Statistiques pour optimiser les requêtes
ANALYZE public.intelligent_places;