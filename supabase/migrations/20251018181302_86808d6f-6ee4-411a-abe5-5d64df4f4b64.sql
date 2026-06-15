-- Migration : Supprimer le numéro de test bloquant les inscriptions
-- Le numéro +243000000000 existe déjà dans clients et bloque toutes les nouvelles inscriptions

-- Supprimer les utilisateurs avec le numéro de test
DELETE FROM public.clients 
WHERE phone_number = '+243000000000';

-- Supprimer aussi des autres tables si présent
DELETE FROM public.chauffeurs 
WHERE phone_number = '+243000000000';

DELETE FROM public.restaurant_profiles 
WHERE phone_number = '+243000000000';

DELETE FROM public.partenaires 
WHERE phone_number = '+243000000000';

DELETE FROM public.admins 
WHERE phone_number = '+243000000000';