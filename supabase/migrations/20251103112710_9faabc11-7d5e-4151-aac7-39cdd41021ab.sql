-- Nettoyer les catégories en double et conserver celles avec le plus de véhicules
-- Pour chaque nom de catégorie, garder celle avec le plus de véhicules et migrer les autres

-- 1. Trouver les catégories à conserver (celles avec le plus de véhicules pour chaque nom)
WITH category_stats AS (
  SELECT 
    c.id,
    c.name,
    COUNT(v.id) as vehicle_count,
    ROW_NUMBER() OVER (PARTITION BY TRIM(c.name) ORDER BY COUNT(v.id) DESC, c.created_at ASC) as rn
  FROM rental_vehicle_categories c
  LEFT JOIN rental_vehicles v ON v.category_id = c.id
  GROUP BY c.id, c.name, c.created_at
),
categories_to_keep AS (
  SELECT id, name
  FROM category_stats
  WHERE rn = 1
),
categories_to_delete AS (
  SELECT id, name
  FROM category_stats
  WHERE rn > 1
)
-- 2. Migrer les véhicules des catégories dupliquées vers les catégories principales
UPDATE rental_vehicles v
SET category_id = (
  SELECT k.id 
  FROM categories_to_keep k 
  WHERE TRIM(k.name) = TRIM((SELECT name FROM rental_vehicle_categories WHERE id = v.category_id))
)
WHERE v.category_id IN (SELECT id FROM categories_to_delete);

-- 3. Supprimer les catégories en double (celles sans véhicules maintenant)
WITH category_stats AS (
  SELECT 
    c.id,
    c.name,
    COUNT(v.id) as vehicle_count,
    ROW_NUMBER() OVER (PARTITION BY TRIM(c.name) ORDER BY COUNT(v.id) DESC, c.created_at ASC) as rn
  FROM rental_vehicle_categories c
  LEFT JOIN rental_vehicles v ON v.category_id = c.id
  GROUP BY c.id, c.name, c.created_at
)
DELETE FROM rental_vehicle_categories
WHERE id IN (
  SELECT id FROM category_stats WHERE rn > 1
);