-- Script SQL pour créer une transaction de test Orange Money
-- À exécuter dans le SQL Editor de Supabase : 
-- https://supabase.com/dashboard/project/wddlktajnhwhyquwcdgf/sql/new

-- 1. Créer une transaction de test en statut "processing"
INSERT INTO payment_transactions (
  id,
  user_id,
  transaction_id,
  amount,
  currency,
  payment_provider,
  payment_method,
  status,
  metadata,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000', -- User ID de test (à remplacer par un vrai user_id si nécessaire)
  'KWENDA_' || extract(epoch from now())::bigint || '_test', -- Transaction ID unique
  5000, -- Montant : 5000 CDF
  'CDF',
  'orange',
  'orange_money',
  'processing', -- En attente de confirmation
  jsonb_build_object(
    'phone_number', '243999999999',
    'test_transaction', true,
    'created_at', now()
  ),
  now(),
  now()
) RETURNING 
  id as "Transaction UUID",
  transaction_id as "Transaction ID (pour webhook)",
  amount || ' ' || currency as "Montant",
  status as "Statut";

-- 2. Afficher les 5 dernières transactions Orange pour référence
SELECT 
  transaction_id,
  amount,
  currency,
  status,
  created_at,
  metadata->>'phone_number' as phone
FROM payment_transactions
WHERE payment_provider = 'orange'
ORDER BY created_at DESC
LIMIT 5;

-- 3. Instructions pour tester le webhook
-- Une fois la transaction créée, copier le "transaction_id" retourné ci-dessus
-- et l'utiliser dans le script de test :
-- 
-- ./test-orange-webhook.sh KWENDA_xxxxx_test
-- 
-- ou avec curl :
-- 
-- curl -X POST https://wddlktajnhwhyquwcdgf.supabase.co/functions/v1/orange-money-webhook/notifications \
--   -H "Content-Type: application/json" \
--   -d '{
--     "partnerTransactionId": "KWENDA_xxxxx_test",
--     "transactionStatus": "SUCCESS",
--     "transactionId": "OM-TEST-12345",
--     "amount": 5000,
--     "currency": "CDF"
--   }'
