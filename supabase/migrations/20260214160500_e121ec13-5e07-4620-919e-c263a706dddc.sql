
INSERT INTO public.service_zones (name, zone_type, city, country_code, base_price_multiplier, surge_multiplier, description, is_active, status, coordinates) VALUES

-- LUBUMBASHI (7 zones)
('Aéroport Luano', 'airport', 'Lubumbashi', 'CD', 1.7, 1.5,
 'Aéroport international de Luano - forte demande, courses majorées', true, 'active',
 '[{"lat": -11.59, "lng": 27.52}, {"lat": -11.59, "lng": 27.55}, {"lat": -11.61, "lng": 27.55}, {"lat": -11.61, "lng": 27.52}]'::jsonb),

('Centre-ville Lubumbashi', 'premium', 'Lubumbashi', 'CD', 1.3, 1.2,
 'Quartier commercial principal, hôtels et administrations', true, 'active',
 '[{"lat": -11.66, "lng": 27.47}, {"lat": -11.66, "lng": 27.50}, {"lat": -11.69, "lng": 27.50}, {"lat": -11.69, "lng": 27.47}]'::jsonb),

('Kenya', 'commercial', 'Lubumbashi', 'CD', 1.1, 1.0,
 'Zone commerciale populaire, marchés et commerces', true, 'active',
 '[{"lat": -11.67, "lng": 27.50}, {"lat": -11.67, "lng": 27.53}, {"lat": -11.70, "lng": 27.53}, {"lat": -11.70, "lng": 27.50}]'::jsonb),

('Kamalondo', 'standard', 'Lubumbashi', 'CD', 1.0, 1.0,
 'Quartier résidentiel central, tarification standard', true, 'active',
 '[{"lat": -11.68, "lng": 27.46}, {"lat": -11.68, "lng": 27.48}, {"lat": -11.70, "lng": 27.48}, {"lat": -11.70, "lng": 27.46}]'::jsonb),

('Kampemba', 'medium_density', 'Lubumbashi', 'CD', 1.0, 1.0,
 'Zone résidentielle à densité moyenne', true, 'active',
 '[{"lat": -11.65, "lng": 27.44}, {"lat": -11.65, "lng": 27.47}, {"lat": -11.68, "lng": 27.47}, {"lat": -11.68, "lng": 27.44}]'::jsonb),

('Rwashi', 'industrial', 'Lubumbashi', 'CD', 0.9, 1.0,
 'Zone minière et industrielle, tarif réduit hors heures de pointe', true, 'active',
 '[{"lat": -11.64, "lng": 27.50}, {"lat": -11.64, "lng": 27.54}, {"lat": -11.67, "lng": 27.54}, {"lat": -11.67, "lng": 27.50}]'::jsonb),

('Golf Katuba', 'high_density', 'Lubumbashi', 'CD', 1.1, 1.0,
 'Zone dense avec marchés populaires et forte activité', true, 'active',
 '[{"lat": -11.70, "lng": 27.44}, {"lat": -11.70, "lng": 27.48}, {"lat": -11.73, "lng": 27.48}, {"lat": -11.73, "lng": 27.44}]'::jsonb),

-- KOLWEZI (5 zones)
('Centre Kolwezi', 'premium', 'Kolwezi', 'CD', 1.2, 1.1,
 'Centre administratif et commercial de Kolwezi', true, 'active',
 '[{"lat": -10.70, "lng": 25.45}, {"lat": -10.70, "lng": 25.49}, {"lat": -10.73, "lng": 25.49}, {"lat": -10.73, "lng": 25.45}]'::jsonb),

('Dilala', 'standard', 'Kolwezi', 'CD', 1.0, 1.0,
 'Quartier résidentiel principal de Kolwezi', true, 'active',
 '[{"lat": -10.72, "lng": 25.42}, {"lat": -10.72, "lng": 25.46}, {"lat": -10.75, "lng": 25.46}, {"lat": -10.75, "lng": 25.42}]'::jsonb),

('Manika', 'standard', 'Kolwezi', 'CD', 1.0, 1.0,
 'Zone résidentielle calme', true, 'active',
 '[{"lat": -10.68, "lng": 25.46}, {"lat": -10.68, "lng": 25.50}, {"lat": -10.71, "lng": 25.50}, {"lat": -10.71, "lng": 25.46}]'::jsonb),

('Zone Minière Kamoto', 'industrial', 'Kolwezi', 'CD', 1.3, 1.4,
 'Mines KCC/Glencore - forte demande aux heures de relève des équipes', true, 'active',
 '[{"lat": -10.73, "lng": 25.48}, {"lat": -10.73, "lng": 25.53}, {"lat": -10.77, "lng": 25.53}, {"lat": -10.77, "lng": 25.48}]'::jsonb),

('Marché Central Kolwezi', 'commercial', 'Kolwezi', 'CD', 1.1, 1.0,
 'Activité commerciale dense, marché principal', true, 'active',
 '[{"lat": -10.71, "lng": 25.46}, {"lat": -10.71, "lng": 25.48}, {"lat": -10.73, "lng": 25.48}, {"lat": -10.73, "lng": 25.46}]'::jsonb);
