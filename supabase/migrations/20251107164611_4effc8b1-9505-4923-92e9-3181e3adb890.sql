-- Phase 1: Normaliser les villes et ajouter contrainte CHECK

-- Étape 1: Normaliser les villes existantes (corriger la casse et les espaces)
UPDATE restaurant_profiles 
SET city = TRIM(INITCAP(city))
WHERE city IS NOT NULL;

-- Étape 2: Corriger les variations spécifiques connues
UPDATE restaurant_profiles 
SET city = 'Kinshasa'
WHERE LOWER(TRIM(city)) = 'kinshasa';

UPDATE restaurant_profiles 
SET city = 'Lubumbashi'
WHERE LOWER(TRIM(city)) = 'lubumbashi';

UPDATE restaurant_profiles 
SET city = 'Kolwezi'
WHERE LOWER(TRIM(city)) = 'kolwezi';

UPDATE restaurant_profiles 
SET city = 'Abidjan'
WHERE LOWER(TRIM(city)) = 'abidjan';

-- Étape 3: Forcer une valeur par défaut pour les villes NULL ou invalides
UPDATE restaurant_profiles 
SET city = 'Kinshasa'
WHERE city IS NULL 
   OR city NOT IN ('Kinshasa', 'Lubumbashi', 'Kolwezi', 'Abidjan');

-- Étape 4: Ajouter la contrainte CHECK pour garantir uniquement les 4 villes
ALTER TABLE restaurant_profiles 
DROP CONSTRAINT IF EXISTS valid_city_check;

ALTER TABLE restaurant_profiles 
ADD CONSTRAINT valid_city_check 
CHECK (city IN ('Kinshasa', 'Lubumbashi', 'Kolwezi', 'Abidjan'));