-- Ajouter la colonne city à transport_bookings pour corriger l'erreur des triggers
ALTER TABLE public.transport_bookings 
ADD COLUMN city TEXT DEFAULT 'Kinshasa';

-- Mettre à jour les enregistrements existants avec une ville par défaut
UPDATE public.transport_bookings 
SET city = 'Kinshasa' 
WHERE city IS NULL;