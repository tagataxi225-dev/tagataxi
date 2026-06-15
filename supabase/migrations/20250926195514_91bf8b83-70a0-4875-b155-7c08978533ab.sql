-- Modifier la contrainte de la colonne city pour supporter toutes les villes
ALTER TABLE public.transport_bookings 
DROP COLUMN IF EXISTS city;

-- Ajouter la colonne city avec contrainte CHECK pour les 4 villes supportées
ALTER TABLE public.transport_bookings 
ADD COLUMN city TEXT DEFAULT 'Kinshasa' 
CHECK (city IN ('Kinshasa', 'Lubumbashi', 'Kolwezi', 'Abidjan'));

-- Mettre à jour les enregistrements existants avec Kinshasa par défaut
UPDATE public.transport_bookings 
SET city = 'Kinshasa' 
WHERE city IS NULL;

-- Créer un index sur la colonne city pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_transport_bookings_city ON public.transport_bookings(city);

-- Ajouter la colonne city aux delivery_orders aussi
ALTER TABLE public.delivery_orders 
ADD COLUMN IF NOT EXISTS city TEXT DEFAULT 'Kinshasa' 
CHECK (city IN ('Kinshasa', 'Lubumbashi', 'Kolwezi', 'Abidjan'));

-- Créer un index sur delivery_orders
CREATE INDEX IF NOT EXISTS idx_delivery_orders_city ON public.delivery_orders(city);

-- Mettre à jour les delivery_orders existantes
UPDATE public.delivery_orders 
SET city = 'Kinshasa' 
WHERE city IS NULL;