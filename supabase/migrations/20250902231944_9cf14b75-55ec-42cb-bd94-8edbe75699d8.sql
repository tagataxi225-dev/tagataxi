-- Insert comprehensive geographic data for Kinshasa, Lubumbashi, and Kolwezi
-- Phase 1: Kinshasa data with hierarchical structure

-- Kinshasa City (Hierarchy level 1)
INSERT INTO public.places_database (
  name, name_fr, name_local, place_type, category, country_code, city, 
  latitude, longitude, hierarchy_level, popularity_score, is_popular, 
  search_keywords, aliases, is_active
) VALUES 
-- Main city
('Kinshasa', 'Kinshasa', 'Kinshasa', 'city', 'administrative', 'CD', 'Kinshasa', 
 -4.3217, 15.3069, 1, 100, true, 
 ARRAY['kinshasa', 'capitale', 'capital', 'rdc', 'congo'], 
 ARRAY['Léopoldville', 'Kin'], true),

-- Communes (Hierarchy level 2)
('Commune de Gombe', 'Gombe', 'Gombe', 'commune', 'administrative', 'CD', 'Kinshasa', 
 -4.3167, 15.3167, 2, 95, true, 
 ARRAY['gombe', 'centre-ville', 'centre', 'downtown'], 
 ARRAY['Centre-ville'], true),

('Commune de Kintambo', 'Kintambo', 'Kintambo', 'commune', 'administrative', 'CD', 'Kinshasa', 
 -4.3083, 15.2833, 2, 85, true, 
 ARRAY['kintambo'], ARRAY[], true),

('Commune de Limete', 'Limete', 'Limete', 'commune', 'administrative', 'CD', 'Kinshasa', 
 -4.3667, 15.3000, 2, 90, true, 
 ARRAY['limete'], ARRAY[], true),

('Commune de Kalamu', 'Kalamu', 'Kalamu', 'commune', 'administrative', 'CD', 'Kinshasa', 
 -4.3500, 15.3167, 2, 80, true, 
 ARRAY['kalamu'], ARRAY[], true),

('Commune de Matete', 'Matete', 'Matete', 'commune', 'administrative', 'CD', 'Kinshasa', 
 -4.3833, 15.3333, 2, 85, true, 
 ARRAY['matete'], ARRAY[], true),

-- Transport hubs (Hierarchy level 5)
('Aéroport International de Ndjili', 'Aéroport de Ndjili', 'Ndjili Airport', 'airport', 'transport', 'CD', 'Kinshasa', 
 -4.3857, 15.4446, 5, 100, true, 
 ARRAY['aeroport', 'ndjili', 'airport', 'vol', 'avion'], 
 ARRAY['Ndjili', 'FIH'], true),

('Gare Centrale de Kinshasa', 'Gare Centrale', 'Gare Central', 'train_station', 'transport', 'CD', 'Kinshasa', 
 -4.3167, 15.3167, 5, 85, true, 
 ARRAY['gare', 'train', 'centrale', 'chemin de fer'], 
 ARRAY['Gare Central'], true),

('Port de Kinshasa', 'Port de Kinshasa', 'Kinshasa Port', 'port', 'transport', 'CD', 'Kinshasa', 
 -4.3000, 15.3000, 5, 80, true, 
 ARRAY['port', 'fleuve', 'congo', 'bateau'], 
 ARRAY['Port'], true),

-- Educational institutions
('Université de Kinshasa', 'UNIKIN', 'University of Kinshasa', 'university', 'education', 'CD', 'Kinshasa', 
 -4.4167, 15.2833, 5, 95, true, 
 ARRAY['universite', 'unikin', 'education', 'campus'], 
 ARRAY['UNIKIN', 'Université'], true),

('Université Pédagogique Nationale', 'UPN', 'UPN', 'university', 'education', 'CD', 'Kinshasa', 
 -4.3833, 15.3500, 5, 80, true, 
 ARRAY['upn', 'pedagogique', 'education'], 
 ARRAY['UPN'], true),

-- Healthcare
('Hôpital Général de Kinshasa', 'Hôpital Général', 'General Hospital', 'hospital', 'health', 'CD', 'Kinshasa', 
 -4.3167, 15.3167, 5, 90, true, 
 ARRAY['hopital', 'general', 'sante', 'medical'], 
 ARRAY['Hôpital'], true),

('Cliniques Universitaires de Kinshasa', 'Cliniques Universitaires', 'University Clinics', 'hospital', 'health', 'CD', 'Kinshasa', 
 -4.4167, 15.2833, 5, 85, true, 
 ARRAY['cliniques', 'universitaires', 'medical'], 
 ARRAY['CUK'], true),

-- Sports and entertainment
('Stade des Martyrs', 'Stade des Martyrs', 'Martyrs Stadium', 'stadium', 'sport', 'CD', 'Kinshasa', 
 -4.3000, 15.2833, 5, 95, true, 
 ARRAY['stade', 'martyrs', 'football', 'sport'], 
 ARRAY['Stade'], true),

-- Commercial centers
('Marché Central', 'Marché Central', 'Central Market', 'market', 'commercial', 'CD', 'Kinshasa', 
 -4.3167, 15.3167, 5, 90, true, 
 ARRAY['marche', 'central', 'commerce', 'shopping'], 
 ARRAY['Marché'], true),

('City Market', 'City Market', 'City Market', 'shopping_center', 'commercial', 'CD', 'Kinshasa', 
 -4.3167, 15.3167, 5, 85, true, 
 ARRAY['city', 'market', 'shopping', 'centre commercial'], 
 ARRAY['City'], true);

-- Phase 2: Lubumbashi data
INSERT INTO public.places_database (
  name, name_fr, name_local, place_type, category, country_code, city, 
  latitude, longitude, hierarchy_level, popularity_score, is_popular, 
  search_keywords, aliases, is_active
) VALUES 
-- Main city
('Lubumbashi', 'Lubumbashi', 'Lubumbashi', 'city', 'administrative', 'CD', 'Lubumbashi', 
 -11.6792, 27.4716, 1, 100, true, 
 ARRAY['lubumbashi', 'ville', 'katanga', 'cuivre'], 
 ARRAY['Élisabethville'], true),

-- Key locations
('Aéroport International Luano', 'Aéroport Luano', 'Luano Airport', 'airport', 'transport', 'CD', 'Lubumbashi', 
 -11.5913, 27.5309, 5, 100, true, 
 ARRAY['aeroport', 'luano', 'airport', 'vol'], 
 ARRAY['Luano', 'FBM'], true),

('Université de Lubumbashi', 'UNILU', 'University of Lubumbashi', 'university', 'education', 'CD', 'Lubumbashi', 
 -11.6560, 27.4672, 5, 95, true, 
 ARRAY['universite', 'unilu', 'education'], 
 ARRAY['UNILU'], true),

('Stade TP Mazembe', 'Stade Mazembe', 'Mazembe Stadium', 'stadium', 'sport', 'CD', 'Lubumbashi', 
 -11.6800, 27.4800, 5, 90, true, 
 ARRAY['stade', 'mazembe', 'football', 'tp'], 
 ARRAY['TP Mazembe'], true),

('Centre-ville de Lubumbashi', 'Centre-ville', 'Downtown', 'district', 'commercial', 'CD', 'Lubumbashi', 
 -11.6792, 27.4716, 3, 85, true, 
 ARRAY['centre-ville', 'downtown', 'centre'], 
 ARRAY['Centre'], true),

('Hôpital Sendwe', 'Hôpital Sendwe', 'Sendwe Hospital', 'hospital', 'health', 'CD', 'Lubumbashi', 
 -11.6792, 27.4716, 5, 80, true, 
 ARRAY['hopital', 'sendwe', 'sante'], 
 ARRAY['Sendwe'], true);

-- Phase 3: Kolwezi data
INSERT INTO public.places_database (
  name, name_fr, name_local, place_type, category, country_code, city, 
  latitude, longitude, hierarchy_level, popularity_score, is_popular, 
  search_keywords, aliases, is_active
) VALUES 
-- Main city
('Kolwezi', 'Kolwezi', 'Kolwezi', 'city', 'administrative', 'CD', 'Kolwezi', 
 -10.7147, 25.4665, 1, 100, true, 
 ARRAY['kolwezi', 'ville', 'mining', 'cobalt'], 
 ARRAY['Kolwezi'], true),

-- Key locations
('Aéroport de Kolwezi', 'Aéroport Kolwezi', 'Kolwezi Airport', 'airport', 'transport', 'CD', 'Kolwezi', 
 -10.7689, 25.5056, 5, 95, true, 
 ARRAY['aeroport', 'kolwezi', 'airport'], 
 ARRAY['Airport'], true),

('Mines de Musonoi', 'Musonoi', 'Musonoi Mines', 'mine', 'industry', 'CD', 'Kolwezi', 
 -10.6500, 25.5000, 5, 80, true, 
 ARRAY['mine', 'musonoi', 'cobalt', 'industry'], 
 ARRAY['Musonoi'], true),

('Centre minier COMIDE', 'COMIDE', 'COMIDE Mining Center', 'industrial_complex', 'industry', 'CD', 'Kolwezi', 
 -10.7000, 25.4500, 5, 75, true, 
 ARRAY['comide', 'mining', 'center', 'industry'], 
 ARRAY['COMIDE'], true),

('Marché de Kolwezi', 'Marché Central', 'Central Market', 'market', 'commercial', 'CD', 'Kolwezi', 
 -10.7147, 25.4665, 5, 70, true, 
 ARRAY['marche', 'central', 'commerce'], 
 ARRAY['Marché'], true);

-- Update search vectors for all inserted data
UPDATE public.places_database 
SET search_vector = to_tsvector('french', 
  COALESCE(name, '') || ' ' ||
  COALESCE(name_fr, '') || ' ' ||
  COALESCE(name_local, '') || ' ' ||
  COALESCE(array_to_string(search_keywords, ' '), '') || ' ' ||
  COALESCE(array_to_string(aliases, ' '), '') || ' ' ||
  COALESCE(commune, '') || ' ' ||
  COALESCE(category, '')
)
WHERE search_vector IS NULL;