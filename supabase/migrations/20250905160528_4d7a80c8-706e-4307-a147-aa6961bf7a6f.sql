-- Ajouter des lieux populaires pour Lubumbashi et Kolwezi dans intelligent_places
-- (Utilisation des colonnes existantes)

-- Lubumbashi
INSERT INTO public.intelligent_places (
  name, category, subcategory, city, commune, quartier, 
  latitude, longitude, hierarchy_level, popularity_score, is_verified, is_active,
  name_alternatives, metadata
) VALUES
('Aéroport International Luano', 'transport', 'aeroport', 'Lubumbashi', 'Annexe', 'Luano', -11.5913, 27.5309, 5, 95, true, true, ARRAY['Luano', 'Airport', 'aeroport luano'], '{"country_code": "CD", "search_keywords": ["aeroport", "luano", "vol", "transport"]}'),
('Centre-ville Lubumbashi', 'center', 'centre-ville', 'Lubumbashi', 'Lubumbashi', 'Centre', -11.6792, 27.4716, 5, 90, true, true, ARRAY['Centre', 'Downtown', 'centre ville'], '{"country_code": "CD", "search_keywords": ["centre", "ville", "downtown"]}'),
('Université de Lubumbashi', 'education', 'universite', 'Lubumbashi', 'Lubumbashi', 'Université', -11.6567, 27.4794, 4, 85, true, true, ARRAY['UNILU', 'University', 'unilu'], '{"country_code": "CD", "search_keywords": ["universite", "unilu", "education", "etudes"]}'),
('Marché Kasumbalesa', 'commerce', 'marche', 'Lubumbashi', 'Kampemba', 'Kasumbalesa', -11.6850, 27.4800, 4, 80, true, true, ARRAY['Market', 'marché kasumbalesa'], '{"country_code": "CD", "search_keywords": ["marche", "kasumbalesa", "commerce"]}'),
('Hôpital Sendwe', 'sante', 'hopital', 'Lubumbashi', 'Kenya', 'Sendwe', -11.6700, 27.4750, 4, 75, true, true, ARRAY['Hospital', 'hopital sendwe'], '{"country_code": "CD", "search_keywords": ["hopital", "sendwe", "sante", "medical"]}'),
('Stade TP Mazembe', 'sports', 'stade', 'Lubumbashi', 'Kamalondo', 'Mazembe', -11.6900, 27.4650, 3, 70, true, true, ARRAY['Stadium', 'mazembe stadium'], '{"country_code": "CD", "search_keywords": ["stade", "mazembe", "foot", "sport"]}'),
('Gecamines', 'industrie', 'mine', 'Lubumbashi', 'Katuba', 'Gecamines', -11.6600, 27.4900, 3, 65, true, true, ARRAY['Mining', 'gecamines mine'], '{"country_code": "CD", "search_keywords": ["gecamines", "mine", "industrie"]}'),
('Ruashi', 'residentiel', 'commune', 'Lubumbashi', 'Ruashi', 'Centre', -11.6200, 27.3900, 2, 60, true, true, ARRAY['Commune'], '{"country_code": "CD", "search_keywords": ["ruashi", "commune", "residentiel"]}');

-- Kolwezi
INSERT INTO public.intelligent_places (
  name, category, subcategory, city, commune, quartier, 
  latitude, longitude, hierarchy_level, popularity_score, is_verified, is_active,
  name_alternatives, metadata
) VALUES
('Aéroport de Kolwezi', 'transport', 'aeroport', 'Kolwezi', 'Dilala', 'Aeroport', -10.7680, 25.5053, 5, 95, true, true, ARRAY['Airport', 'kolwezi airport'], '{"country_code": "CD", "search_keywords": ["aeroport", "kolwezi", "vol", "transport"]}'),
('Centre-ville Kolwezi', 'center', 'centre-ville', 'Kolwezi', 'Kolwezi', 'Centre', -10.7147, 25.4665, 5, 90, true, true, ARRAY['Centre', 'Downtown'], '{"country_code": "CD", "search_keywords": ["centre", "ville", "downtown"]}'),
('Hôpital Général Kolwezi', 'sante', 'hopital', 'Kolwezi', 'Kolwezi', 'Hopital', -10.7200, 25.4700, 4, 85, true, true, ARRAY['Hospital', 'hopital general'], '{"country_code": "CD", "search_keywords": ["hopital", "general", "sante", "medical"]}'),
('Marché Central Kolwezi', 'commerce', 'marche', 'Kolwezi', 'Kolwezi', 'Marche', -10.7100, 25.4600, 4, 80, true, true, ARRAY['Market', 'marché central'], '{"country_code": "CD", "search_keywords": ["marche", "central", "commerce"]}'),
('Mutoshi Mining', 'industrie', 'mine', 'Kolwezi', 'Mutoshi', 'Mine', -10.7500, 25.4200, 3, 75, true, true, ARRAY['Mining', 'mutoshi mine'], '{"country_code": "CD", "search_keywords": ["mutoshi", "mine", "industrie", "cuivre"]}'),
('Manika', 'residentiel', 'commune', 'Kolwezi', 'Manika', 'Centre', -10.6800, 25.5000, 2, 70, true, true, ARRAY['Commune'], '{"country_code": "CD", "search_keywords": ["manika", "commune", "residentiel"]}'),
('Stade de Kolwezi', 'sports', 'stade', 'Kolwezi', 'Kolwezi', 'Stade', -10.7180, 25.4620, 3, 65, true, true, ARRAY['Stadium'], '{"country_code": "CD", "search_keywords": ["stade", "kolwezi", "foot", "sport"]}'),
('Dilala', 'residentiel', 'commune', 'Kolwezi', 'Dilala', 'Centre', -10.7300, 25.4800, 2, 60, true, true, ARRAY['Commune'], '{"country_code": "CD", "search_keywords": ["dilala", "commune", "residentiel"]}');