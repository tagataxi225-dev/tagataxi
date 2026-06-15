-- Insertion de zones de démonstration pour Kinshasa
INSERT INTO public.service_zones (
  name, zone_type, city, coordinates, description, status, base_price_multiplier, created_by, updated_by
) VALUES 
-- Zone 1: Gombe (Centre commercial)
('Gombe', 'high_density', 'Kinshasa', '[
  [15.309, -4.315], [15.325, -4.315], [15.325, -4.330], [15.309, -4.330], [15.309, -4.315]
]'::json, 'Centre commercial et financier de Kinshasa', 'active', 1.2, 
(SELECT id FROM auth.users LIMIT 1), (SELECT id FROM auth.users LIMIT 1)),

-- Zone 2: Lemba (Zone résidentielle)
('Lemba', 'medium_density', 'Kinshasa', '[
  [15.280, -4.340], [15.300, -4.340], [15.300, -4.360], [15.280, -4.360], [15.280, -4.340]
]'::json, 'Zone résidentielle populaire', 'active', 1.0,
(SELECT id FROM auth.users LIMIT 1), (SELECT id FROM auth.users LIMIT 1)),

-- Zone 3: Kinshasa Industrielle (Zone industrielle)
('Kinshasa Industrielle', 'industrial', 'Kinshasa', '[
  [15.200, -4.300], [15.250, -4.300], [15.250, -4.320], [15.200, -4.320], [15.200, -4.300]
]'::json, 'Zone industrielle et portuaire', 'active', 0.9,
(SELECT id FROM auth.users LIMIT 1), (SELECT id FROM auth.users LIMIT 1)),

-- Zone 4: Ngaliema (Zone diplomatique)
('Ngaliema', 'low_density', 'Kinshasa', '[
  [15.250, -4.380], [15.280, -4.380], [15.280, -4.400], [15.250, -4.400], [15.250, -4.380]
]'::json, 'Zone diplomatique et résidentielle haut standing', 'active', 1.3,
(SELECT id FROM auth.users LIMIT 1), (SELECT id FROM auth.users LIMIT 1)),

-- Zone 5: Kintambo (Zone portuaire)
('Kintambo', 'commercial', 'Kinshasa', '[
  [15.270, -4.320], [15.300, -4.320], [15.300, -4.340], [15.270, -4.340], [15.270, -4.320]
]'::json, 'Zone portuaire et commerciale', 'active', 1.1,
(SELECT id FROM auth.users LIMIT 1), (SELECT id FROM auth.users LIMIT 1));

-- Insertion de règles de tarification pour les zones
INSERT INTO public.zone_pricing_rules (
  zone_id, vehicle_class, base_price, price_per_km, price_per_minute, 
  surge_multiplier, minimum_fare, maximum_fare, is_active, created_by
) SELECT 
  sz.id,
  'standard' as vehicle_class,
  CASE 
    WHEN sz.name = 'Gombe' THEN 3000
    WHEN sz.name = 'Ngaliema' THEN 3500
    WHEN sz.name = 'Kintambo' THEN 2800
    WHEN sz.name = 'Lemba' THEN 2500
    ELSE 2000
  END as base_price,
  CASE 
    WHEN sz.name = 'Gombe' THEN 400
    WHEN sz.name = 'Ngaliema' THEN 450
    WHEN sz.name = 'Kintambo' THEN 350
    WHEN sz.name = 'Lemba' THEN 300
    ELSE 250
  END as price_per_km,
  CASE 
    WHEN sz.name = 'Gombe' THEN 80
    WHEN sz.name = 'Ngaliema' THEN 90
    WHEN sz.name = 'Kintambo' THEN 70
    WHEN sz.name = 'Lemba' THEN 60
    ELSE 50
  END as price_per_minute,
  1.0 as surge_multiplier,
  1500 as minimum_fare,
  15000 as maximum_fare,
  true as is_active,
  (SELECT id FROM auth.users LIMIT 1)
FROM public.service_zones sz;