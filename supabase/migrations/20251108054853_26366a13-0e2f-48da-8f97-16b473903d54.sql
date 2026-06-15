-- Migration pour diversifier les catégories de produits existants
-- Correction de la catégorisation basée sur les noms de produits

-- Grillades (poulet, braisé, mishkaki, bbq, brochettes)
UPDATE food_products 
SET category = 'grillades' 
WHERE category = 'plats' 
  AND (
    LOWER(name) LIKE '%poulet%' 
    OR LOWER(name) LIKE '%braisé%' 
    OR LOWER(name) LIKE '%mishkaki%'
    OR LOWER(name) LIKE '%bbq%'
    OR LOWER(name) LIKE '%brochette%'
    OR LOWER(name) LIKE '%grill%'
  );

-- Pizza & Pâtes
UPDATE food_products 
SET category = 'pizza_pates' 
WHERE category = 'plats' 
  AND (
    LOWER(name) LIKE '%pizza%' 
    OR LOWER(name) LIKE '%pâte%'
    OR LOWER(name) LIKE '%pasta%'
    OR LOWER(name) LIKE '%spaghetti%'
    OR LOWER(name) LIKE '%lasagne%'
  );

-- Poissons
UPDATE food_products 
SET category = 'poissons' 
WHERE category = 'plats' 
  AND (
    LOWER(name) LIKE '%poisson%' 
    OR LOWER(name) LIKE '%capitaine%'
    OR LOWER(name) LIKE '%tilapia%'
    OR LOWER(name) LIKE '%sardine%'
    OR LOWER(name) LIKE '%crevette%'
    OR LOWER(name) LIKE '%fruits de mer%'
  );

-- Desserts
UPDATE food_products 
SET category = 'desserts' 
WHERE category = 'plats' 
  AND (
    LOWER(name) LIKE '%dessert%' 
    OR LOWER(name) LIKE '%gâteau%'
    OR LOWER(name) LIKE '%glace%'
    OR LOWER(name) LIKE '%crème%'
    OR LOWER(name) LIKE '%tarte%'
    OR LOWER(name) LIKE '%pâtisserie%'
  );

-- Boissons
UPDATE food_products 
SET category = 'boissons' 
WHERE category = 'plats' 
  AND (
    LOWER(name) LIKE '%boisson%' 
    OR LOWER(name) LIKE '%jus%'
    OR LOWER(name) LIKE '%coca%'
    OR LOWER(name) LIKE '%primus%'
    OR LOWER(name) LIKE '%bière%'
    OR LOWER(name) LIKE '%café%'
    OR LOWER(name) LIKE '%thé%'
  );

-- Fast-food
UPDATE food_products 
SET category = 'fast_food' 
WHERE category = 'plats' 
  AND (
    LOWER(name) LIKE '%burger%' 
    OR LOWER(name) LIKE '%frite%'
    OR LOWER(name) LIKE '%sandwich%'
    OR LOWER(name) LIKE '%hot dog%'
    OR LOWER(name) LIKE '%wrap%'
  );

-- Entrées
UPDATE food_products 
SET category = 'entrees' 
WHERE category = 'plats' 
  AND (
    LOWER(name) LIKE '%salade%' 
    OR LOWER(name) LIKE '%soupe%'
    OR LOWER(name) LIKE '%entrée%'
  );

-- Insérer des produits de test pour chaque catégorie
-- Récupérer un restaurant existant pour chaque ville
DO $$
DECLARE
  kinshasa_restaurant_id UUID;
  lubumbashi_restaurant_id UUID;
  kolwezi_restaurant_id UUID;
  abidjan_restaurant_id UUID;
BEGIN
  -- Trouver un restaurant par ville
  SELECT id INTO kinshasa_restaurant_id FROM restaurant_profiles WHERE city = 'Kinshasa' AND is_active = true LIMIT 1;
  SELECT id INTO lubumbashi_restaurant_id FROM restaurant_profiles WHERE city = 'Lubumbashi' AND is_active = true LIMIT 1;
  SELECT id INTO kolwezi_restaurant_id FROM restaurant_profiles WHERE city = 'Kolwezi' AND is_active = true LIMIT 1;
  SELECT id INTO abidjan_restaurant_id FROM restaurant_profiles WHERE city = 'Abidjan' AND is_active = true LIMIT 1;

  -- Produits Kinshasa si restaurant existe
  IF kinshasa_restaurant_id IS NOT NULL THEN
    INSERT INTO food_products (restaurant_id, name, description, price, category, is_available, moderation_status, main_image_url)
    VALUES 
      (kinshasa_restaurant_id, 'Poulet braisé', 'Poulet grillé à la braise avec épices locales', 8000, 'grillades', true, 'approved', 'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=400'),
      (kinshasa_restaurant_id, 'Pizza Margherita', 'Pizza classique tomate, mozzarella, basilic', 12000, 'pizza_pates', true, 'approved', 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400'),
      (kinshasa_restaurant_id, 'Capitaine grillé', 'Poisson capitaine grillé avec sauce pimentée', 15000, 'poissons', true, 'approved', 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=400'),
      (kinshasa_restaurant_id, 'Gâteau au chocolat', 'Fondant au chocolat avec glace vanille', 5000, 'desserts', true, 'approved', 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400'),
      (kinshasa_restaurant_id, 'Jus d''ananas frais', 'Jus d''ananas 100% naturel pressé à la commande', 2000, 'boissons', true, 'approved', 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=400'),
      (kinshasa_restaurant_id, 'Burger Deluxe', 'Burger double steak, cheddar, bacon, sauce maison', 9000, 'fast_food', true, 'approved', 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400'),
      (kinshasa_restaurant_id, 'Salade César', 'Salade romaine, poulet grillé, parmesan, croûtons', 6000, 'entrees', true, 'approved', 'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=400');
  END IF;

  -- Produits Lubumbashi si restaurant existe
  IF lubumbashi_restaurant_id IS NOT NULL THEN
    INSERT INTO food_products (restaurant_id, name, description, price, category, is_available, moderation_status, main_image_url)
    VALUES 
      (lubumbashi_restaurant_id, 'Mishkaki au boeuf', 'Brochettes de boeuf mariné, sauce arachide', 10000, 'grillades', true, 'approved', 'https://images.unsplash.com/photo-1529042410759-befb1204b468?w=400'),
      (lubumbashi_restaurant_id, 'Spaghetti Bolognaise', 'Pâtes italiennes sauce bolognaise maison', 8000, 'pizza_pates', true, 'approved', 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400'),
      (lubumbashi_restaurant_id, 'Primus (bière)', 'Bière locale congolaise bien fraîche', 2500, 'boissons', true, 'approved', 'https://images.unsplash.com/photo-1608270586620-248524c67de9?w=400');
  END IF;

  -- Produits Kolwezi si restaurant existe
  IF kolwezi_restaurant_id IS NOT NULL THEN
    INSERT INTO food_products (restaurant_id, name, description, price, category, is_available, moderation_status, main_image_url)
    VALUES 
      (kolwezi_restaurant_id, 'Tilapia fumé', 'Tilapia entier fumé, accompagnement au choix', 12000, 'poissons', true, 'approved', 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=400'),
      (kolwezi_restaurant_id, 'Crème glacée vanille', 'Glace artisanale 3 boules vanille Madagascar', 4000, 'desserts', true, 'approved', 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=400');
  END IF;

  -- Produits Abidjan si restaurant existe
  IF abidjan_restaurant_id IS NOT NULL THEN
    INSERT INTO food_products (restaurant_id, name, description, price, category, is_available, moderation_status, main_image_url)
    VALUES 
      (abidjan_restaurant_id, 'Sandwich poulet', 'Sandwich pain baguette, poulet grillé, crudités', 3500, 'fast_food', true, 'approved', 'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=400'),
      (abidjan_restaurant_id, 'Soupe de poisson', 'Soupe traditionnelle ivoirienne aux fruits de mer', 5000, 'entrees', true, 'approved', 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400');
  END IF;
END $$;