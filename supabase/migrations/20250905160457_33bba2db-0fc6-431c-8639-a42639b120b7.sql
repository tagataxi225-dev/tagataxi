-- Ajouter des lieux populaires pour Lubumbashi et Kolwezi dans intelligent_places

-- Lubumbashi
INSERT INTO public.intelligent_places (
  name, category, subcategory, city, commune, quartier, 
  latitude, longitude, hierarchy_level, popularity_score, is_verified, is_active,
  country_code, name_alternatives
) VALUES
('Aéroport International Luano', 'transport', 'aeroport', 'Lubumbashi', 'Annexe', 'Luano', -11.5913, 27.5309, 5, 95, true, true, 'CD', ARRAY['Luano Airport', 'Airport']),
('Centre-ville Lubumbashi', 'center', 'centre-ville', 'Lubumbashi', 'Lubumbashi', 'Centre', -11.6792, 27.4716, 5, 90, true, true, 'CD', ARRAY['Downtown Lubumbashi', 'Centre']),
('Université de Lubumbashi', 'education', 'universite', 'Lubumbashi', 'Lubumbashi', 'Université', -11.6567, 27.4794, 4, 85, true, true, 'CD', ARRAY['UNILU', 'University']),
('Marché Kasumbalesa', 'commerce', 'marche', 'Lubumbashi', 'Kampemba', 'Kasumbalesa', -11.6850, 27.4800, 4, 80, true, true, 'CD', ARRAY['Kasumbalesa Market', 'Market']),
('Hôpital Sendwe', 'sante', 'hopital', 'Lubumbashi', 'Kenya', 'Sendwe', -11.6700, 27.4750, 4, 75, true, true, 'CD', ARRAY['Sendwe Hospital', 'Hospital']),
('Stade TP Mazembe', 'sports', 'stade', 'Lubumbashi', 'Kamalondo', 'Mazembe', -11.6900, 27.4650, 3, 70, true, true, 'CD', ARRAY['Mazembe Stadium', 'Stadium']),
('Gecamines', 'industrie', 'mine', 'Lubumbashi', 'Katuba', 'Gecamines', -11.6600, 27.4900, 3, 65, true, true, 'CD', ARRAY['Mining']),
('Ruashi', 'residentiel', 'commune', 'Lubumbashi', 'Ruashi', 'Centre', -11.6200, 27.3900, 2, 60, true, true, 'CD', ARRAY['Commune']);

-- Kolwezi
INSERT INTO public.intelligent_places (
  name, category, subcategory, city, commune, quartier, 
  latitude, longitude, hierarchy_level, popularity_score, is_verified, is_active,
  country_code, name_alternatives
) VALUES
('Aéroport de Kolwezi', 'transport', 'aeroport', 'Kolwezi', 'Dilala', 'Aeroport', -10.7680, 25.5053, 5, 95, true, true, 'CD', ARRAY['Kolwezi Airport', 'Airport']),
('Centre-ville Kolwezi', 'center', 'centre-ville', 'Kolwezi', 'Kolwezi', 'Centre', -10.7147, 25.4665, 5, 90, true, true, 'CD', ARRAY['Downtown Kolwezi', 'Centre']),
('Hôpital Général Kolwezi', 'sante', 'hopital', 'Kolwezi', 'Kolwezi', 'Hopital', -10.7200, 25.4700, 4, 85, true, true, 'CD', ARRAY['Kolwezi General Hospital', 'Hospital']),
('Marché Central Kolwezi', 'commerce', 'marche', 'Kolwezi', 'Kolwezi', 'Marche', -10.7100, 25.4600, 4, 80, true, true, 'CD', ARRAY['Central Market Kolwezi', 'Market']),
('Mutoshi Mining', 'industrie', 'mine', 'Kolwezi', 'Mutoshi', 'Mine', -10.7500, 25.4200, 3, 75, true, true, 'CD', ARRAY['Mutoshi Mine', 'Mining']),
('Manika', 'residentiel', 'commune', 'Kolwezi', 'Manika', 'Centre', -10.6800, 25.5000, 2, 70, true, true, 'CD', ARRAY['Commune']),
('Stade de Kolwezi', 'sports', 'stade', 'Kolwezi', 'Kolwezi', 'Stade', -10.7180, 25.4620, 3, 65, true, true, 'CD', ARRAY['Kolwezi Stadium', 'Stadium']),
('Dilala', 'residentiel', 'commune', 'Kolwezi', 'Dilala', 'Centre', -10.7300, 25.4800, 2, 60, true, true, 'CD', ARRAY['Commune']);