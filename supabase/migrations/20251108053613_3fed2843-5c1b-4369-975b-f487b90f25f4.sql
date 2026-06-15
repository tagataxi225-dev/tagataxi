-- Mettre à jour la contrainte de catégories pour food_products
-- pour supporter les nouvelles catégories unifiées

-- Étape 1: Supprimer l'ancienne contrainte
ALTER TABLE public.food_products 
DROP CONSTRAINT IF EXISTS valid_category;

-- Étape 2: Migrer TOUTES les anciennes catégories vers les nouvelles (même celles inconnues)
UPDATE public.food_products 
SET category = 'plats' 
WHERE category IN ('Plats', 'plat', 'Plat');

UPDATE public.food_products 
SET category = 'entrees' 
WHERE category IN ('Entrées', 'Entrée', 'entree');

UPDATE public.food_products 
SET category = 'desserts' 
WHERE category IN ('Desserts', 'Dessert', 'dessert');

UPDATE public.food_products 
SET category = 'boissons' 
WHERE category IN ('Boissons', 'Boisson', 'boisson');

UPDATE public.food_products 
SET category = 'entrees' 
WHERE category IN ('Accompagnements', 'Accompagnement');

-- Migrer tout ce qui ne correspond à rien vers 'plats' par défaut
UPDATE public.food_products 
SET category = 'plats' 
WHERE category NOT IN (
  'entrees',
  'plats',
  'grillades', 
  'pizza_pates',
  'poissons',
  'desserts',
  'boissons',
  'fast_food'
);

-- Étape 3: Ajouter la nouvelle contrainte avec toutes les catégories
ALTER TABLE public.food_products 
ADD CONSTRAINT valid_category CHECK (
  category IN (
    'entrees',
    'plats',
    'grillades', 
    'pizza_pates',
    'poissons',
    'desserts',
    'boissons',
    'fast_food'
  )
);

-- Ajouter un commentaire pour la documentation
COMMENT ON COLUMN public.food_products.category IS 'Catégorie du produit alimentaire: entrees, plats, grillades, pizza_pates, poissons, desserts, boissons, fast_food';