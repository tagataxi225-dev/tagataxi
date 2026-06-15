-- =====================================================
-- PHASE 5 : ARCHIVAGE DONNÉES COMMISSIONS - KWENDA TAXI
-- Migration vers modèle 100% abonnements terminée
-- =====================================================

-- 1. Créer table d'archivage pour historique commissions
CREATE TABLE IF NOT EXISTS public.commission_history_archive (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_commission_id UUID,
  partner_id UUID,
  commission_amount NUMERIC(10,2),
  commission_type TEXT,
  created_at TIMESTAMPTZ,
  archived_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb
);

COMMENT ON TABLE public.commission_history_archive IS 'Archive historique commissions (système déprécié) - Kwenda Taxi';

-- 2. Archiver les anciennes commissions partenaires
INSERT INTO public.commission_history_archive (
  original_commission_id,
  partner_id,
  commission_amount,
  commission_type,
  created_at,
  metadata
)
SELECT 
  id,
  partner_id,
  commission_amount,
  'partner_ride_commission'::text,
  created_at,
  jsonb_build_object(
    'booking_id', booking_id,
    'driver_id', driver_id,
    'archived_reason', 'Migration Kwenda Taxi vers abonnements'
  )
FROM public.partner_commission_tracking
WHERE created_at < now() - interval '30 days'; -- Archiver uniquement les données > 30 jours

-- 3. Marquer définitivement les tables commissions comme READ-ONLY
COMMENT ON TABLE public.commission_configuration IS '⛔ DÉPRÉCIÉ - Utiliser subscription_plans. Système d''abonnements uniquement.';
COMMENT ON TABLE public.commission_settings IS '⛔ DÉPRÉCIÉ - Utiliser subscription_plans. Système d''abonnements uniquement.';
COMMENT ON TABLE public.partner_commission_tracking IS '⛔ DÉPRÉCIÉ - Utiliser partner_subscription_earnings. Gains sur abonnements chauffeurs (5%).';

-- 4. Log final de migration
INSERT INTO public.data_migration_logs (
  migration_type,
  success,
  migration_data
) VALUES (
  'kwenda_taxi_migration_complete',
  true,
  jsonb_build_object(
    'completion_date', now(),
    'app_name', 'Kwenda Taxi',
    'migration_summary', jsonb_build_object(
      'deprecated_tables', ARRAY['commission_configuration', 'commission_settings', 'partner_commission_tracking'],
      'new_tables', ARRAY['partner_subscription_earnings', 'vendor_subscription_plans'],
      'new_functions', ARRAY['partner-subscription-commission', 'vendor-subscription-manager'],
      'commission_model', 'REMOVED',
      'subscription_model', 'ACTIVE',
      'partner_commission_rate', '5% on driver subscriptions'
    )
  )
);

-- =====================================================
-- MIGRATION KWENDA TAXI TERMINÉE ✅
-- Application renommée: KwendaGo → Kwenda Taxi
-- Modèle économique: 100% Abonnements
-- Commissions partenaires: 5% sur abonnements chauffeurs
-- =====================================================