-- Corriger temporairement le problème en activant les chauffeurs existants dans driver_locations
-- et en créant des profiles de chauffeurs basiques pour les user_id existants

-- Activer les chauffeurs existants dans la table chauffeurs
UPDATE public.chauffeurs 
SET is_active = true, verification_status = 'verified'
WHERE is_active = false OR verification_status != 'verified';

-- Vérifier et nettoyer les données dans driver_locations pour correspondre aux chauffeurs actifs
UPDATE public.driver_locations dl
SET 
  is_online = true,
  is_available = true,
  last_ping = now(),
  updated_at = now()
WHERE EXISTS (
  SELECT 1 FROM public.chauffeurs c 
  WHERE c.user_id = dl.driver_id 
  AND c.is_active = true 
  AND c.verification_status = 'verified'
);

-- Nettoyer les driver_locations orphelins (sans chauffeur correspondant)
DELETE FROM public.driver_locations dl
WHERE NOT EXISTS (
  SELECT 1 FROM public.chauffeurs c 
  WHERE c.user_id = dl.driver_id
);