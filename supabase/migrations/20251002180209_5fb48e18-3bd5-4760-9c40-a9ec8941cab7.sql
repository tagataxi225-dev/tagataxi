-- ============================================================
-- PHASE 1 : MIGRATION FINALE - CRÉDITS → ABONNEMENTS COURSES
-- ============================================================

-- 1. Ajuster la contrainte service_type
ALTER TABLE public.subscription_plans 
  DROP CONSTRAINT IF EXISTS subscription_plans_service_type_check;

ALTER TABLE public.subscription_plans
  ADD CONSTRAINT subscription_plans_service_type_check 
  CHECK (service_type IN ('transport', 'delivery', 'both', 'all'));

-- 2. Créer le plan de migration
INSERT INTO public.subscription_plans (
  name, description, duration_type, price, currency, 
  rides_included, is_trial, service_type, is_active
)
VALUES (
  'Migration Crédits → Abonnement',
  'Abonnement gratuit de migration pour convertir les crédits existants en courses',
  'monthly', 0, 'CDF', 10, false, 'all', true
)
ON CONFLICT DO NOTHING;

-- 3. Migrer le chauffeur avec crédits (inclure payment_method = 'migration')
INSERT INTO public.driver_subscriptions (
  driver_id, plan_id, status, start_date, end_date,
  rides_used, rides_remaining, is_trial, payment_method
)
SELECT 
  dc.driver_id,
  (SELECT id FROM public.subscription_plans WHERE name = 'Migration Crédits → Abonnement' LIMIT 1),
  'active',
  NOW(),
  NOW() + INTERVAL '30 days',
  0,
  10,
  false,
  'migration'
FROM public.driver_credits dc
WHERE dc.balance > 0
ON CONFLICT DO NOTHING;

-- 4. Logger la migration
INSERT INTO public.activity_logs (user_id, activity_type, description, metadata)
SELECT 
  dc.driver_id,
  'subscription_migration',
  'Migration automatique : Crédits convertis en abonnement gratuit de 10 courses',
  jsonb_build_object('old_balance_cdf', dc.balance, 'new_rides_count', 10)
FROM public.driver_credits dc
WHERE dc.balance > 0;

-- 5. Indexes de performance
CREATE INDEX IF NOT EXISTS idx_subscription_plans_service_type 
  ON public.subscription_plans(service_type);
CREATE INDEX IF NOT EXISTS idx_subscription_plans_is_trial 
  ON public.subscription_plans(is_trial);
CREATE INDEX IF NOT EXISTS idx_subscription_plans_active 
  ON public.subscription_plans(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_driver_subscriptions_rides_remaining 
  ON public.driver_subscriptions(rides_remaining);
CREATE INDEX IF NOT EXISTS idx_driver_subscriptions_status_driver 
  ON public.driver_subscriptions(driver_id, status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_driver_subscriptions_expiry 
  ON public.driver_subscriptions(end_date) WHERE status = 'active';

-- 6. Logger avant suppression
INSERT INTO public.data_migration_logs (migration_type, success, migration_data)
VALUES (
  'credit_system_removal', true,
  jsonb_build_object(
    'action', 'Suppression définitive du système de crédits',
    'tables_dropped', ARRAY['credit_transactions', 'driver_credits'],
    'drivers_migrated', (SELECT COUNT(*) FROM public.driver_credits WHERE balance > 0)
  )
);

-- 7. Supprimer les tables de crédits
DROP TRIGGER IF EXISTS on_credit_transaction_insert ON public.credit_transactions;
DROP TABLE IF EXISTS public.credit_transactions CASCADE;
DROP TABLE IF EXISTS public.driver_credits CASCADE;

-- 8. Logger la fin
INSERT INTO public.activity_logs (user_id, activity_type, description, metadata)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  'system_migration',
  'Phase 1 complétée : Migration du système de crédits vers abonnements par courses',
  jsonb_build_object('phase', 1, 'status', 'completed', 'tables_dropped', ARRAY['credit_transactions', 'driver_credits'])
);