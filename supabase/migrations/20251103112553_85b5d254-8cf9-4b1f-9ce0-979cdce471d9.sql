-- Insérer les 7 catégories standards de location
INSERT INTO rental_vehicle_categories (id, name, description, icon, is_active, city, priority, sort_order)
VALUES
  (gen_random_uuid(), 'ECO', 'Véhicules abordables pour usage quotidien', 'Car', true, 'Kinshasa', 1, 1),
  (gen_random_uuid(), 'Berline', 'Confort, espace pour famille ou business', 'Car', true, 'Kinshasa', 2, 2),
  (gen_random_uuid(), 'SUV & 4x4', 'Spacieux, robustes, adaptés aux routes difficiles', 'Car', true, 'Kinshasa', 3, 3),
  (gen_random_uuid(), 'First Class', 'Véhicules de luxe avec service premium exclusif', 'Star', true, 'Kinshasa', 4, 4),
  (gen_random_uuid(), 'Minibus', 'Transport de groupes et sorties en famille', 'Users', true, 'Kinshasa', 5, 5),
  (gen_random_uuid(), 'Utilitaires', 'Véhicules utilitaires pour transport de marchandises', 'Truck', true, 'Kinshasa', 6, 6),
  (gen_random_uuid(), 'Tricycle', 'Tricycles pour trajets rapides et petites livraisons', 'Bike', true, 'Kinshasa', 7, 7);

-- Mapper les véhicules existants aux catégories basé sur leur vehicle_type
UPDATE rental_vehicles v
SET category_id = (SELECT id FROM rental_vehicle_categories WHERE name = 'ECO' LIMIT 1)
WHERE (v.vehicle_type ILIKE '%citadine%' OR v.vehicle_type ILIKE '%eco%' OR v.brand ILIKE '%hyundai%' OR v.model ILIKE '%i10%')
  AND v.category_id IS NULL;

UPDATE rental_vehicles v
SET category_id = (SELECT id FROM rental_vehicle_categories WHERE name = 'Berline' LIMIT 1)
WHERE (v.vehicle_type ILIKE '%berline%' OR v.vehicle_type ILIKE '%sedan%')
  AND v.category_id IS NULL;

UPDATE rental_vehicles v
SET category_id = (SELECT id FROM rental_vehicle_categories WHERE name = 'SUV & 4x4' LIMIT 1)
WHERE (v.vehicle_type ILIKE '%suv%' OR v.vehicle_type ILIKE '%4x4%' OR v.model ILIKE '%patrol%' OR v.model ILIKE '%prado%')
  AND v.category_id IS NULL;

UPDATE rental_vehicles v
SET category_id = (SELECT id FROM rental_vehicle_categories WHERE name = 'First Class' LIMIT 1)
WHERE (v.vehicle_type ILIKE '%premium%' OR v.vehicle_type ILIKE '%luxe%' OR v.vehicle_type ILIKE '%first%')
  AND v.category_id IS NULL;

UPDATE rental_vehicles v
SET category_id = (SELECT id FROM rental_vehicle_categories WHERE name = 'Minibus' LIMIT 1)
WHERE (v.vehicle_type ILIKE '%minibus%' OR v.vehicle_type ILIKE '%bus%' OR v.model ILIKE '%hiace%' OR v.model ILIKE '%urvan%')
  AND v.category_id IS NULL;

UPDATE rental_vehicles v
SET category_id = (SELECT id FROM rental_vehicle_categories WHERE name = 'Utilitaires' LIMIT 1)
WHERE (v.vehicle_type ILIKE '%utilitaire%' OR v.vehicle_type ILIKE '%fourgon%' OR v.model ILIKE '%sprinter%' OR v.model ILIKE '%transit%' OR v.model ILIKE '%master%')
  AND v.category_id IS NULL;

UPDATE rental_vehicles v
SET category_id = (SELECT id FROM rental_vehicle_categories WHERE name = 'Tricycle' LIMIT 1)
WHERE (v.vehicle_type ILIKE '%tricycle%' OR v.vehicle_type ILIKE '%tuk%' OR v.brand ILIKE '%bajaj%' OR v.brand ILIKE '%tvs%')
  AND v.category_id IS NULL;

-- Mapper les véhicules restants à la catégorie ECO par défaut
UPDATE rental_vehicles v
SET category_id = (SELECT id FROM rental_vehicle_categories WHERE name = 'ECO' LIMIT 1)
WHERE v.category_id IS NULL AND v.is_active = true;