-- PHASE 1 : NETTOYAGE BASE DE DONNÉES (FIX CASCADE FK)
-- Description : Suppression véhicules test + orphelins, approbation ICON LAB
-- Fix : Supprimer cascade FK complète : payments → subscriptions → vehicles

-- 1.0a Supprimer les paiements de subscriptions liés aux véhicules à supprimer
DELETE FROM rental_subscription_payments
WHERE subscription_id IN (
  SELECT id FROM partner_rental_subscriptions
  WHERE vehicle_id IN (
    -- Véhicules du partenaire test
    SELECT id FROM rental_vehicles WHERE partner_id = '62897f41-530b-4079-8268-f4bee2bfce15'
    UNION
    -- Véhicules orphelins
    SELECT id FROM rental_vehicles WHERE partner_id IS NULL
  )
);

-- 1.0b Supprimer les subscriptions liées aux véhicules à supprimer
DELETE FROM partner_rental_subscriptions
WHERE vehicle_id IN (
  -- Véhicules du partenaire test
  SELECT id FROM rental_vehicles WHERE partner_id = '62897f41-530b-4079-8268-f4bee2bfce15'
  UNION
  -- Véhicules orphelins
  SELECT id FROM rental_vehicles WHERE partner_id IS NULL
);

-- 1.1 Approuver le véhicule ICON LAB (Dzire)
UPDATE rental_vehicles
SET 
  moderation_status = 'approved',
  is_active = true,
  moderator_id = 'f15340e1-6c68-4306-b13a-e0c372b1b335',
  moderated_at = NOW(),
  updated_at = NOW()
WHERE id = 'aa33966c-245f-42f0-afcd-d4f308372dfa';

-- 1.2 Supprimer les 14 véhicules de test "Kwenda Test Fleet"
DELETE FROM rental_vehicles
WHERE partner_id = '62897f41-530b-4079-8268-f4bee2bfce15';

-- 1.3 Supprimer les véhicules orphelins (sans partner_id)
DELETE FROM rental_vehicles
WHERE partner_id IS NULL;

-- 1.4 Supprimer le partenaire test "Kwenda Test Fleet"
DELETE FROM partenaires
WHERE id = '62897f41-530b-4079-8268-f4bee2bfce15';

-- Vérification : Lister les véhicules restants actifs
SELECT 
  id, 
  name, 
  partner_id,
  moderation_status,
  is_active
FROM rental_vehicles
WHERE is_active = true
ORDER BY created_at DESC;