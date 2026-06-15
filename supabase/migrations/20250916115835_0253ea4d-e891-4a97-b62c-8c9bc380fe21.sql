-- Amélioration de la table intelligent_places avec plus de lieux populaires
-- Insertion de lieux populaires pour chaque ville pour améliorer la géolocalisation

-- Kinshasa - Lieux populaires et quartiers principaux
INSERT INTO public.intelligent_places (
  name, category, subcategory, city, commune, quartier, avenue,
  latitude, longitude, hierarchy_level, popularity_score, is_verified,
  country_code, name_alternatives, is_active
) VALUES
-- Centres commerciaux et marchés de Kinshasa
('Marché Central', 'commerce', 'marché', 'Kinshasa', 'Gombe', 'Centre-ville', 'Avenue de la Paix', -4.3258, 15.3144, 4, 95, true, 'CD', ARRAY['Grand Marché', 'Marché de Kinshasa'], true),
('City Market', 'commerce', 'centre_commercial', 'Kinshasa', 'Gombe', 'Centre-ville', 'Boulevard du 30 Juin', -4.3166, 15.3056, 4, 90, true, 'CD', ARRAY['Centre Commercial City Market'], true),
('Marché de la Liberté', 'commerce', 'marché', 'Kinshasa', 'Kalamu', 'Matonge', 'Avenue de la Liberté', -4.3408, 15.3189, 4, 85, true, 'CD', ARRAY['Liberté Market'], true),

-- Institutions et bâtiments officiels de Kinshasa
('Palais du Peuple', 'institution', 'gouvernement', 'Kinshasa', 'Lingwala', 'Centre', 'Boulevard du 30 Juin', -4.3217, 15.3069, 5, 98, true, 'CD', ARRAY['Parlement'], true),
('Université de Kinshasa UNIKIN', 'éducation', 'université', 'Kinshasa', 'Lemba', 'Campus', 'Avenue de la Université', -4.4056, 15.2889, 5, 92, true, 'CD', ARRAY['UNIKIN', 'Campus Universitaire'], true),
('Hôpital Général de Kinshasa', 'santé', 'hôpital', 'Kinshasa', 'Gombe', 'Gombe', 'Avenue de la Hôpital', -4.3100, 15.3000, 4, 88, true, 'CD', ARRAY['Hôpital Central'], true),

-- Transport et aéroports de Kinshasa
('Aéroport International de Ndjili', 'transport', 'aéroport', 'Kinshasa', 'Ndjili', 'Aéroport', 'Route de la Aéroport', -4.3856, 15.4444, 5, 100, true, 'CD', ARRAY['Aéroport de Kinshasa', 'Ndjili Airport'], true),
('Gare Centrale', 'transport', 'gare', 'Kinshasa', 'Gombe', 'Centre', 'Avenue des Transports', -4.3200, 15.3100, 4, 80, true, 'CD', ARRAY['Station Centrale'], true),

-- Quartiers résidentiels populaires de Kinshasa
('Matonge', 'résidentiel', 'quartier', 'Kinshasa', 'Kalamu', 'Matonge', 'Avenue Matonge', -4.3408, 15.3189, 3, 85, true, 'CD', ARRAY['Quartier Matonge'], true),
('Lemba', 'résidentiel', 'quartier', 'Kinshasa', 'Lemba', 'Lemba', 'Avenue Lemba', -4.4000, 15.2800, 3, 82, true, 'CD', ARRAY['Commune Lemba'], true),

-- Lubumbashi - Lieux principaux
('Grand Marché de Lubumbashi', 'commerce', 'marché', 'Lubumbashi', 'Lubumbashi', 'Centre-ville', 'Avenue Mobutu', -11.6708, 27.4794, 4, 95, true, 'CD', ARRAY['Marché Central Lubumbashi'], true),
('Université de Lubumbashi UNILU', 'éducation', 'université', 'Lubumbashi', 'Lubumbashi', 'Campus', 'Avenue de la Université', -11.6550, 27.4600, 5, 90, true, 'CD', ARRAY['UNILU', 'Campus Universitaire Lubumbashi'], true),
('Aéroport International de Luano', 'transport', 'aéroport', 'Lubumbashi', 'Annexe', 'Luano', 'Route de la Aéroport', -11.5911, 27.5306, 5, 95, true, 'CD', ARRAY['Aéroport de Lubumbashi'], true),
('Hôpital Sendwe', 'santé', 'hôpital', 'Lubumbashi', 'Lubumbashi', 'Sendwe', 'Avenue Sendwe', -11.6600, 27.4700, 4, 85, true, 'CD', ARRAY['Hôpital Principal'], true),

-- Kolwezi - Centres miniers et commerciaux
('Marché Central de Kolwezi', 'commerce', 'marché', 'Kolwezi', 'Kolwezi', 'Centre', 'Avenue Principale', -10.7158, 25.4664, 4, 90, true, 'CD', ARRAY['Grand Marché Kolwezi'], true),
('Zone Industrielle COMMUS', 'industrie', 'mine', 'Kolwezi', 'Kolwezi', 'Industrielle', 'Route Industrielle', -10.7000, 25.4500, 4, 85, true, 'CD', ARRAY['Complexe Minier'], true),
('Aéroport de Kolwezi', 'transport', 'aéroport', 'Kolwezi', 'Kolwezi', 'Aéroport', 'Route Aéroportuaire', -10.6889, 25.5056, 4, 80, true, 'CD', ARRAY['Kolwezi Airport'], true),

-- Abidjan - Lieux populaires principaux
('Marché de Treichville', 'commerce', 'marché', 'Abidjan', 'Treichville', 'Centre', 'Avenue Treichville', 5.2500, -4.0200, 4, 95, true, 'CI', ARRAY['Grand Marché Treichville'], true),
('Plateau Centre des affaires', 'affaires', 'centre_commercial', 'Abidjan', 'Plateau', 'Plateau', 'Avenue Chardy', 5.3200, -4.0300, 5, 98, true, 'CI', ARRAY['District des Affaires', 'CBD Abidjan'], true),
('Aéroport Félix Houphouët-Boigny', 'transport', 'aéroport', 'Abidjan', 'Port-Bouët', 'Aéroport', 'Route de la Aéroport', 5.2539, -3.9264, 5, 100, true, 'CI', ARRAY['Aéroport Abidjan'], true),
('Université Félix Houphouët-Boigny', 'éducation', 'université', 'Abidjan', 'Cocody', 'Campus', 'Avenue de la Université', 5.3400, -4.0100, 5, 90, true, 'CI', ARRAY['Université Abidjan'], true),
('Marché Adjamé', 'commerce', 'marché', 'Abidjan', 'Adjamé', 'Centre', 'Avenue Adjamé', 5.3600, -4.0200, 4, 92, true, 'CI', ARRAY['Grand Marché Adjamé'], true),
('Centre Commercial Cap Sud', 'commerce', 'centre_commercial', 'Abidjan', 'Abidjan Sud', 'Zone 4C', 'Boulevard Lagunaire', 5.2800, -3.9500, 4, 85, true, 'CI', ARRAY['Cap Sud Mall'], true);