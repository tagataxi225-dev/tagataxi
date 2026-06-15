-- Correction de l'erreur d'inscription chauffeur en 2 étapes

-- Étape 1: Corriger les données existantes qui violent la contrainte
UPDATE public.chauffeurs
SET delivery_capacity = NULL
WHERE delivery_capacity IS NOT NULL 
  AND delivery_capacity NOT IN ('small', 'medium', 'large', 'extra_large', 'refrigerated');

-- Étape 2: Supprimer et recréer la contrainte de façon permissive
ALTER TABLE public.chauffeurs 
DROP CONSTRAINT IF EXISTS check_chauffeurs_delivery_capacity;

-- La nouvelle contrainte permet NULL (pour les chauffeurs sans service de livraison)
ALTER TABLE public.chauffeurs
ADD CONSTRAINT check_chauffeurs_delivery_capacity 
CHECK (
  delivery_capacity IS NULL 
  OR delivery_capacity IN ('small', 'medium', 'large', 'extra_large', 'refrigerated')
);

-- Étape 3: Rendre les colonnes optionnelles pour faciliter l'inscription
ALTER TABLE public.chauffeurs
ALTER COLUMN service_type DROP NOT NULL,
ALTER COLUMN delivery_capacity DROP NOT NULL;