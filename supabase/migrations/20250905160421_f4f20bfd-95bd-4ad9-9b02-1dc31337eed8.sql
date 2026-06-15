-- Ajouter des lieux populaires pour Lubumbashi et Kolwezi dans intelligent_places

-- Lubumbashi
INSERT INTO public.intelligent_places (
  name, name_fr, name_local, category, subcategory, city, commune, quartier, 
  latitude, longitude, hierarchy_level, popularity_score, is_verified, is_active,
  country_code, search_keywords, name_alternatives
) VALUES
('Aéroport International Luano', 'Aéroport International Luano', 'Luano Airport', 'transport', 'aeroport', 'Lubumbashi', 'Annexe', 'Luano', -11.5913, 27.5309, 5, 95, true, true, 'CD', ARRAY['aeroport', 'luano', 'vol', 'transport'], ARRAY['Luano', 'Airport']),
('Centre-ville Lubumbashi', 'Centre-ville Lubumbashi', 'Downtown Lubumbashi', 'center', 'centre-ville', 'Lubumbashi', 'Lubumbashi', 'Centre', -11.6792, 27.4716, 5, 90, true, true, 'CD', ARRAY['centre', 'ville', 'downtown'], ARRAY['Centre', 'Downtown']),
('Université de Lubumbashi', 'Université de Lubumbashi', 'UNILU', 'education', 'universite', 'Lubumbashi', 'Lubumbashi', 'Université', -11.6567, 27.4794, 4, 85, true, true, 'CD', ARRAY['universite', 'unilu', 'education', 'etudes'], ARRAY['UNILU', 'University']),
('Marché Kasumbalesa', 'Marché Kasumbalesa', 'Kasumbalesa Market', 'commerce', 'marche', 'Lubumbashi', 'Kampemba', 'Kasumbalesa', -11.6850, 27.4800, 4, 80, true, true, 'CD', ARRAY['marche', 'kasumbalesa', 'commerce'], ARRAY['Market']),
('Hôpital Sendwe', 'Hôpital Sendwe', 'Sendwe Hospital', 'sante', 'hopital', 'Lubumbashi', 'Kenya', 'Sendwe', -11.6700, 27.4750, 4, 75, true, true, 'CD', ARRAY['hopital', 'sendwe', 'sante', 'medical'], ARRAY['Hospital']),
('Stade TP Mazembe', 'Stade TP Mazembe', 'Mazembe Stadium', 'sports', 'stade', 'Lubumbashi', 'Kamalondo', 'Mazembe', -11.6900, 27.4650, 3, 70, true, true, 'CD', ARRAY['stade', 'mazembe', 'foot', 'sport'], ARRAY['Stadium']),
('Gecamines', 'Gecamines', 'Gecamines', 'industrie', 'mine', 'Lubumbashi', 'Katuba', 'Gecamines', -11.6600, 27.4900, 3, 65, true, true, 'CD', ARRAY['gecamines', 'mine', 'industrie'], ARRAY['Mining']),
('Ruashi', 'Ruashi', 'Ruashi', 'residentiel', 'commune', 'Lubumbashi', 'Ruashi', 'Centre', -11.6200, 27.3900, 2, 60, true, true, 'CD', ARRAY['ruashi', 'commune', 'residentiel'], ARRAY['Commune']);

-- Kolwezi
INSERT INTO public.intelligent_places (
  name, name_fr, name_local, category, subcategory, city, commune, quartier, 
  latitude, longitude, hierarchy_level, popularity_score, is_verified, is_active,
  country_code, search_keywords, name_alternatives
) VALUES
('Aéroport de Kolwezi', 'Aéroport de Kolwezi', 'Kolwezi Airport', 'transport', 'aeroport', 'Kolwezi', 'Dilala', 'Aeroport', -10.7680, 25.5053, 5, 95, true, true, 'CD', ARRAY['aeroport', 'kolwezi', 'vol', 'transport'], ARRAY['Airport']),
('Centre-ville Kolwezi', 'Centre-ville Kolwezi', 'Downtown Kolwezi', 'center', 'centre-ville', 'Kolwezi', 'Kolwezi', 'Centre', -10.7147, 25.4665, 5, 90, true, true, 'CD', ARRAY['centre', 'ville', 'downtown'], ARRAY['Centre', 'Downtown']),
('Hôpital Général Kolwezi', 'Hôpital Général Kolwezi', 'Kolwezi General Hospital', 'sante', 'hopital', 'Kolwezi', 'Kolwezi', 'Hopital', -10.7200, 25.4700, 4, 85, true, true, 'CD', ARRAY['hopital', 'general', 'sante', 'medical'], ARRAY['Hospital']),
('Marché Central Kolwezi', 'Marché Central Kolwezi', 'Central Market Kolwezi', 'commerce', 'marche', 'Kolwezi', 'Kolwezi', 'Marche', -10.7100, 25.4600, 4, 80, true, true, 'CD', ARRAY['marche', 'central', 'commerce'], ARRAY['Market']),
('Mutoshi Mining', 'Mutoshi Mining', 'Mutoshi Mine', 'industrie', 'mine', 'Kolwezi', 'Mutoshi', 'Mine', -10.7500, 25.4200, 3, 75, true, true, 'CD', ARRAY['mutoshi', 'mine', 'industrie', 'cuivre'], ARRAY['Mining']),
('Manika', 'Manika', 'Manika', 'residentiel', 'commune', 'Kolwezi', 'Manika', 'Centre', -10.6800, 25.5000, 2, 70, true, true, 'CD', ARRAY['manika', 'commune', 'residentiel'], ARRAY['Commune']),
('Stade de Kolwezi', 'Stade de Kolwezi', 'Kolwezi Stadium', 'sports', 'stade', 'Kolwezi', 'Kolwezi', 'Stade', -10.7180, 25.4620, 3, 65, true, true, 'CD', ARRAY['stade', 'kolwezi', 'foot', 'sport'], ARRAY['Stadium']),
('Dilala', 'Dilala', 'Dilala', 'residentiel', 'commune', 'Kolwezi', 'Dilala', 'Centre', -10.7300, 25.4800, 2, 60, true, true, 'CD', ARRAY['dilala', 'commune', 'residentiel'], ARRAY['Commune']);

-- Mettre à jour les vecteurs de recherche
UPDATE public.intelligent_places 
SET search_vector = setweight(to_tsvector('french', COALESCE(name, '')), 'A') ||
                   setweight(to_tsvector('french', COALESCE(commune, '')), 'B') ||
                   setweight(to_tsvector('french', COALESCE(quartier, '')), 'B') ||
                   setweight(to_tsvector('french', COALESCE(array_to_string(name_alternatives, ' '), '')), 'B')
WHERE city IN ('Lubumbashi', 'Kolwezi');