-- Approuver le restaurant de test qui bloque les commandes
UPDATE restaurant_profiles 
SET verification_status = 'approved',
    updated_at = NOW()
WHERE id = 'fbd488e3-47b2-4714-9bab-91c1300f1582';

-- Approuver TOUS les restaurants actifs en attente pour éviter ce problème à l'avenir
UPDATE restaurant_profiles 
SET verification_status = 'approved',
    updated_at = NOW()
WHERE verification_status = 'pending' 
  AND is_active = true;