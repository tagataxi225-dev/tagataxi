-- Mise à jour des tables pour le système de correspondance colis-véhicule

-- 1. Ajout du champ delivery_capacity dans la table driver_profiles
ALTER TABLE public.driver_profiles 
ADD COLUMN IF NOT EXISTS delivery_capacity text;

-- 2. Ajout du champ delivery_capacity dans la table chauffeurs  
ALTER TABLE public.chauffeurs 
ADD COLUMN IF NOT EXISTS delivery_capacity text;

-- 3. Ajout du champ package_weight dans la table delivery_orders
ALTER TABLE public.delivery_orders 
ADD COLUMN IF NOT EXISTS package_weight numeric;

-- 4. Ajout de contraintes pour valider les valeurs de delivery_capacity
ALTER TABLE public.driver_profiles 
ADD CONSTRAINT check_delivery_capacity 
CHECK (delivery_capacity IS NULL OR delivery_capacity IN ('flash', 'flex', 'maxicharge'));

ALTER TABLE public.chauffeurs 
ADD CONSTRAINT check_chauffeurs_delivery_capacity 
CHECK (delivery_capacity IS NULL OR delivery_capacity IN ('flash', 'flex', 'maxicharge'));

-- 5. Mise à jour des enregistrements existants basés sur le vehicle_type
UPDATE public.driver_profiles 
SET delivery_capacity = CASE 
  WHEN vehicle_class = 'moto' THEN 'flash'
  WHEN vehicle_class = 'truck' THEN 'maxicharge'
  ELSE 'flex'
END
WHERE delivery_capacity IS NULL;

UPDATE public.chauffeurs 
SET delivery_capacity = CASE 
  WHEN vehicle_type = 'moto' THEN 'flash'
  WHEN vehicle_type = 'camionnette' THEN 'flex'
  WHEN vehicle_type = 'truck' THEN 'maxicharge'
  ELSE 'flex'
END
WHERE delivery_capacity IS NULL;

-- 6. Créer un index pour optimiser les recherches par delivery_capacity
CREATE INDEX IF NOT EXISTS idx_driver_profiles_delivery_capacity 
ON public.driver_profiles(delivery_capacity) 
WHERE delivery_capacity IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_chauffeurs_delivery_capacity 
ON public.chauffeurs(delivery_capacity) 
WHERE delivery_capacity IS NOT NULL;