-- ========================================
-- PHASE 3 : NETTOYAGE SYSTÈME DE CRÉDITS OBSOLÈTE
-- ========================================

-- Supprimer la table driver_credits (remplacée par driver_subscriptions)
DROP TABLE IF EXISTS public.driver_credits CASCADE;

-- Supprimer la table credit_transactions associée
DROP TABLE IF EXISTS public.credit_transactions CASCADE;

-- Log de migration
INSERT INTO public.data_migration_logs (
  migration_type,
  migration_data,
  success,
  created_by
) VALUES (
  'cleanup_credit_system',
  jsonb_build_object(
    'reason', 'Système de crédits remplacé par système d''abonnements',
    'tables_dropped', ARRAY['driver_credits', 'credit_transactions'],
    'edge_function_removed', 'credit-management'
  ),
  true,
  auth.uid()
);