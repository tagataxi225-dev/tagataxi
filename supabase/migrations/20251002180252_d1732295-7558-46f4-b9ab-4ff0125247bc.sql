-- ============================================================
-- PHASE 1 FINALE : OPTIMISATION ABONNEMENTS COURSES
-- ============================================================

-- 1. Ajuster la contrainte service_type pour accepter 'all'
ALTER TABLE public.subscription_plans 
  DROP CONSTRAINT IF EXISTS subscription_plans_service_type_check;

ALTER TABLE public.subscription_plans
  ADD CONSTRAINT subscription_plans_service_type_check 
  CHECK (service_type IN ('transport', 'delivery', 'both', 'all'));

-- 2. Indexes de performance sur subscription_plans
CREATE INDEX IF NOT EXISTS idx_subscription_plans_service_type 
  ON public.subscription_plans(service_type);
  
CREATE INDEX IF NOT EXISTS idx_subscription_plans_is_trial 
  ON public.subscription_plans(is_trial);
  
CREATE INDEX IF NOT EXISTS idx_subscription_plans_active 
  ON public.subscription_plans(is_active) 
  WHERE is_active = true;

-- 3. Indexes de performance sur driver_subscriptions
CREATE INDEX IF NOT EXISTS idx_driver_subscriptions_rides_remaining 
  ON public.driver_subscriptions(rides_remaining);
  
CREATE INDEX IF NOT EXISTS idx_driver_subscriptions_status_driver 
  ON public.driver_subscriptions(driver_id, status) 
  WHERE status = 'active';
  
CREATE INDEX IF NOT EXISTS idx_driver_subscriptions_expiry 
  ON public.driver_subscriptions(end_date) 
  WHERE status = 'active';

-- 4. Logger la migration
INSERT INTO public.activity_logs (
  user_id, 
  activity_type, 
  description, 
  metadata
)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  'system_migration',
  'Phase 1 complétée : Optimisation du système d''abonnements par courses',
  jsonb_build_object(
    'phase', 1,
    'status', 'completed',
    'indexes_created', 6,
    'credit_system', 'already_removed',
    'timestamp', NOW()
  )
);