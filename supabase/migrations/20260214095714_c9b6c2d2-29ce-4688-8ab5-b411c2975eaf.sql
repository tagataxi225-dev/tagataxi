
-- Correction 1: Créer la table driver_fraud_tracking si elle n'existe pas
CREATE TABLE IF NOT EXISTS public.driver_fraud_tracking (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  driver_id UUID NOT NULL,
  fraud_type TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'warning',
  description TEXT,
  is_suspended BOOLEAN NOT NULL DEFAULT false,
  suspended_until TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index pour recherche rapide par chauffeur
CREATE INDEX IF NOT EXISTS idx_driver_fraud_tracking_driver_id ON public.driver_fraud_tracking(driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_fraud_tracking_suspended ON public.driver_fraud_tracking(driver_id, is_suspended) WHERE is_suspended = true;

-- RLS
ALTER TABLE public.driver_fraud_tracking ENABLE ROW LEVEL SECURITY;

-- Admins peuvent tout voir/modifier
CREATE POLICY "Admins can manage fraud tracking"
  ON public.driver_fraud_tracking
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- Chauffeurs peuvent voir leurs propres entrées
CREATE POLICY "Drivers can view own fraud records"
  ON public.driver_fraud_tracking
  FOR SELECT
  USING (driver_id = auth.uid());

-- Service role (edge functions) peut insérer/mettre à jour
CREATE POLICY "Service role full access"
  ON public.driver_fraud_tracking
  FOR ALL
  USING (auth.role() = 'service_role');

-- Correction 4: Marquer les abonnements expirés
UPDATE public.driver_subscriptions
SET status = 'expired', updated_at = now()
WHERE status = 'active' AND end_date < now();
