-- Enrichir la base de données avec plus de lieux pour améliorer la recherche (version corrigée)
-- Ajouter des lieux populaires supplémentaires en évitant les doublons

-- Lieux supplémentaires pour Kinshasa (éviter les doublons)
INSERT INTO public.intelligent_places (
  name, category, subcategory, city, commune, quartier, avenue,
  latitude, longitude, hierarchy_level, popularity_score, is_verified, 
  is_active, name_alternatives
) VALUES 
-- Quartiers résidentiels populaires
('Révolution', 'Quartier', 'Résidentiel', 'Kinshasa', 'Kalamu', 'Révolution', NULL, -4.3456, 15.2789, 3, 85, true, true, ARRAY['Revolution', 'Quartier Révolution']),
('Yolo', 'Quartier', 'Résidentiel', 'Kinshasa', 'Kalamu', 'Yolo', NULL, -4.3512, 15.2845, 3, 80, true, true, ARRAY['Yolo Nord', 'Yolo Sud']),
('Victoire', 'Quartier', 'Résidentiel', 'Kinshasa', 'Kalamu', 'Victoire', NULL, -4.3234, 15.2756, 3, 78, true, true, ARRAY['Quartier Victoire']),
('Salongo', 'Quartier', 'Résidentiel', 'Kinshasa', 'Kalamu', 'Salongo', NULL, -4.3567, 15.2923, 3, 72, true, true, ARRAY['Salongo 1', 'Salongo 2']),

-- Centres commerciaux et marchés
('Marché Central de Kinshasa', 'Commerce', 'Marché', 'Kinshasa', 'Gombe', 'Centre-ville', 'Avenue Tombalbaye', -4.3217, 15.3069, 4, 90, true, true, ARRAY['Grand Marché', 'Marché de Kinshasa']),
('City Market Kinshasa', 'Commerce', 'Centre Commercial', 'Kinshasa', 'Gombe', 'Centre-ville', 'Boulevard du 30 Juin', -4.3189, 15.3045, 4, 88, true, true, ARRAY['Shopping Center']),
('Marché de la Liberté', 'Commerce', 'Marché', 'Kinshasa', 'Kalamu', 'Matonge', NULL, -4.3401, 15.2918, 4, 85, true, true, ARRAY['Marché Liberté']),
('Kin Plaza', 'Commerce', 'Centre Commercial', 'Kinshasa', 'Gombe', 'Centre-ville', 'Avenue Tombalbaye', -4.3198, 15.3078, 4, 92, true, true, ARRAY['Plaza Kinshasa']),

-- Établissements de santé
('Hôpital Général de Kinshasa', 'Santé', 'Hôpital', 'Kinshasa', 'Gombe', 'Centre-ville', 'Avenue de l''Hôpital', -4.3156, 15.3123, 5, 95, true, true, ARRAY['HGK', 'Hôpital Général']),
('Clinique Ngaliema', 'Santé', 'Clinique', 'Kinshasa', 'Mont-Ngafula', 'Ngaliema', NULL, -4.3789, 15.2456, 4, 88, true, true, ARRAY['Ngaliema Medical']),
('Centre de Santé Lemba', 'Santé', 'Centre de Santé', 'Kinshasa', 'Lemba', 'Lemba Centre', NULL, -4.4012, 15.2134, 3, 75, true, true, ARRAY['CS Lemba']),

-- Universités et écoles
('Université de Kinshasa (UNIKIN)', 'Éducation', 'Université', 'Kinshasa', 'Lemba', 'Campus', NULL, -4.4234, 15.2987, 5, 98, true, true, ARRAY['UNIKIN', 'Campus Universitaire']),
('Université Protestante du Congo', 'Éducation', 'Université', 'Kinshasa', 'Ngaliema', 'UPC', NULL, -4.3567, 15.2123, 4, 85, true, true, ARRAY['UPC']),
('Institut Supérieur de Commerce', 'Éducation', 'Institut', 'Kinshasa', 'Gombe', 'Centre-ville', NULL, -4.3189, 15.3098, 4, 80, true, true, ARRAY['ISC Kinshasa']),

-- Lieux supplémentaires pour Lubumbashi
('Marché Kenya', 'Commerce', 'Marché', 'Lubumbashi', 'Kenya', 'Kenya Centre', NULL, -11.6598, 27.4789, 4, 85, true, true, ARRAY['Kenya Market']),
('Université de Lubumbashi', 'Éducation', 'Université', 'Lubumbashi', 'Lubumbashi', 'Campus', NULL, -11.6234, 27.4567, 5, 92, true, true, ARRAY['UNILU']),
('Hôpital Sendwe', 'Santé', 'Hôpital', 'Lubumbashi', 'Lubumbashi', 'Centre', NULL, -11.6456, 27.4623, 4, 88, true, true, ARRAY['Sendwe Hospital']),
('Golf Club Lubumbashi', 'Loisirs', 'Golf', 'Lubumbashi', 'Lubumbashi', 'Golf', NULL, -11.6789, 27.4234, 3, 70, true, true, ARRAY['Golf Lushi']),
('Stade TP Mazembe', 'Sport', 'Stade', 'Lubumbashi', 'Kamalondo', 'Kamalondo', NULL, -11.6345, 27.4789, 4, 95, true, true, ARRAY['Stade Mazembe']),
('Shopping Center Lubumbashi', 'Commerce', 'Centre Commercial', 'Lubumbashi', 'Lubumbashi', 'Centre', 'Avenue Mobutu', -11.6512, 27.4656, 4, 82, true, true, ARRAY['Mall Lubumbashi']),
('Marché de la Poste', 'Commerce', 'Marché', 'Lubumbashi', 'Lubumbashi', 'Centre', NULL, -11.6623, 27.4578, 3, 78, true, true, ARRAY['Poste Market']),
('Clinique Bondeko', 'Santé', 'Clinique', 'Lubumbashi', 'Bondeko', 'Bondeko', NULL, -11.6789, 27.4345, 3, 75, true, true, ARRAY['Bondeko Medical']),

-- Lieux supplémentaires pour Kolwezi
('Marché Central Kolwezi', 'Commerce', 'Marché', 'Kolwezi', 'Kolwezi', 'Centre', NULL, -10.7156, 25.4623, 4, 88, true, true, ARRAY['Grand Marché Kolwezi']),
('Hôpital Général de Kolwezi', 'Santé', 'Hôpital', 'Kolwezi', 'Kolwezi', 'Centre', NULL, -10.7234, 25.4567, 4, 85, true, true, ARRAY['HGK Kolwezi']),
('Stade de Kolwezi', 'Sport', 'Stade', 'Kolwezi', 'Kolwezi', 'Sport', NULL, -10.7089, 25.4789, 3, 75, true, true, ARRAY['Stade Municipal']),
('Centre Commercial Kolwezi', 'Commerce', 'Centre Commercial', 'Kolwezi', 'Kolwezi', 'Centre', 'Avenue Lumumba', -10.7178, 25.4634, 3, 80, true, true, ARRAY['Shopping Kolwezi']),
('Église Sainte-Marie', 'Religion', 'Église', 'Kolwezi', 'Kolwezi', 'Centre', NULL, -10.7145, 25.4598, 3, 70, true, true, ARRAY['Cathédrale Kolwezi']),
('École Primaire Kolwezi', 'Éducation', 'École', 'Kolwezi', 'Kolwezi', 'Centre', NULL, -10.7189, 25.4645, 2, 65, true, true, ARRAY['EP Kolwezi']),
('Clinique Saint-Joseph', 'Santé', 'Clinique', 'Kolwezi', 'Kolwezi', 'Nord', NULL, -10.7098, 25.4712, 3, 72, true, true, ARRAY['St Joseph Medical']),
('Parc Municipal Kolwezi', 'Loisirs', 'Parc', 'Kolwezi', 'Kolwezi', 'Centre', NULL, -10.7167, 25.4623, 2, 68, true, true, ARRAY['Parc Central'])

ON CONFLICT (name, city, commune) DO NOTHING;

-- Créer des index pour optimiser les performances
CREATE INDEX IF NOT EXISTS idx_intelligent_places_search_optimized 
ON public.intelligent_places (city, popularity_score DESC, is_verified DESC);

CREATE INDEX IF NOT EXISTS idx_intelligent_places_location_geo 
ON public.intelligent_places (latitude, longitude);

CREATE INDEX IF NOT EXISTS idx_intelligent_places_category_search 
ON public.intelligent_places (category, subcategory, city);

-- Mettre à jour les statistiques pour l'optimiseur de requêtes
ANALYZE public.intelligent_places;