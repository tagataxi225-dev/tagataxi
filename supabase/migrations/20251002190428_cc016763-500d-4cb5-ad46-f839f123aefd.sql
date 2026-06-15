-- Corriger les noms d'affichage des services pour correspondre aux attentes
UPDATE public.service_configurations 
SET display_name = 'Taxi'
WHERE service_category = 'taxi' AND service_type = 'confort';

UPDATE public.service_configurations 
SET display_name = 'Livraison'
WHERE service_category = 'delivery' AND service_type = 'flash';

UPDATE public.service_configurations 
SET display_name = 'Location'
WHERE service_category = 'rental';

UPDATE public.service_configurations 
SET display_name = 'Shopping'
WHERE service_category = 'marketplace';

UPDATE public.service_configurations 
SET display_name = 'Tombola'
WHERE service_category = 'lottery';

-- Log de l'activité
INSERT INTO public.activity_logs (activity_type, description)
VALUES ('system', 'Correction des noms d''affichage des services pour amélioration UX');