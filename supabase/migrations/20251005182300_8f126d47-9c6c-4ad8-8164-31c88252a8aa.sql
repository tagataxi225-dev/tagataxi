-- Phase 1: Système d'Annulation avec Raisons
-- Ajouter colonnes d'annulation aux tables existantes et créer table d'historique

-- ========================================
-- 1. Ajouter colonnes aux transport_bookings
-- ========================================
ALTER TABLE public.transport_bookings 
ADD COLUMN IF NOT EXISTS cancellation_reason TEXT,
ADD COLUMN IF NOT EXISTS cancelled_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS cancellation_type TEXT CHECK (cancellation_type IN ('client', 'driver', 'admin', 'system'));

COMMENT ON COLUMN public.transport_bookings.cancellation_reason IS 'Raison détaillée de l''annulation fournie par l''utilisateur';
COMMENT ON COLUMN public.transport_bookings.cancelled_by IS 'ID de l''utilisateur qui a annulé la course';
COMMENT ON COLUMN public.transport_bookings.cancellation_type IS 'Type d''annulateur: client, driver, admin, ou system';

-- ========================================
-- 2. Ajouter colonnes aux delivery_orders
-- ========================================
ALTER TABLE public.delivery_orders 
ADD COLUMN IF NOT EXISTS cancellation_reason TEXT,
ADD COLUMN IF NOT EXISTS cancelled_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS cancellation_type TEXT CHECK (cancellation_type IN ('client', 'driver', 'admin', 'system'));

COMMENT ON COLUMN public.delivery_orders.cancellation_reason IS 'Raison détaillée de l''annulation fournie par l''utilisateur';
COMMENT ON COLUMN public.delivery_orders.cancelled_by IS 'ID de l''utilisateur qui a annulé la livraison';
COMMENT ON COLUMN public.delivery_orders.cancellation_type IS 'Type d''annulateur: client, driver, admin, ou system';

-- ========================================
-- 3. Créer table d'historique des annulations
-- ========================================
CREATE TABLE IF NOT EXISTS public.cancellation_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_type TEXT NOT NULL CHECK (reference_type IN ('transport', 'delivery', 'marketplace')),
  reference_id UUID NOT NULL,
  cancelled_by UUID NOT NULL REFERENCES auth.users(id),
  cancellation_type TEXT NOT NULL CHECK (cancellation_type IN ('client', 'driver', 'admin', 'system')),
  reason TEXT NOT NULL,
  status_at_cancellation TEXT NOT NULL,
  financial_impact JSONB DEFAULT '{}'::jsonb,
  admin_reviewed BOOLEAN DEFAULT false,
  admin_notes TEXT,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb
);

COMMENT ON TABLE public.cancellation_history IS 'Historique complet de toutes les annulations pour audit et analyse';
COMMENT ON COLUMN public.cancellation_history.reference_type IS 'Type de service annulé: transport, delivery, ou marketplace';
COMMENT ON COLUMN public.cancellation_history.reference_id IS 'ID de la réservation/commande annulée';
COMMENT ON COLUMN public.cancellation_history.financial_impact IS 'Détails financiers: frais, remboursements, pénalités';
COMMENT ON COLUMN public.cancellation_history.admin_reviewed IS 'Indique si un admin a vérifié cette annulation';

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_cancellation_history_reference ON public.cancellation_history(reference_type, reference_id);
CREATE INDEX IF NOT EXISTS idx_cancellation_history_user ON public.cancellation_history(cancelled_by);
CREATE INDEX IF NOT EXISTS idx_cancellation_history_date ON public.cancellation_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cancellation_history_admin_review ON public.cancellation_history(admin_reviewed) WHERE admin_reviewed = false;

-- ========================================
-- 4. Activer RLS sur cancellation_history
-- ========================================
ALTER TABLE public.cancellation_history ENABLE ROW LEVEL SECURITY;

-- Utilisateurs peuvent voir leurs propres annulations
CREATE POLICY "Users view own cancellations"
  ON public.cancellation_history FOR SELECT
  USING (auth.uid() = cancelled_by);

-- Admins ont accès total
CREATE POLICY "Admins manage all cancellations"
  ON public.cancellation_history FOR ALL
  USING (is_current_user_admin())
  WITH CHECK (is_current_user_admin());

-- ========================================
-- 5. Créer vue pour statistiques admin
-- ========================================
CREATE OR REPLACE VIEW cancellation_stats AS
SELECT 
  reference_type,
  cancellation_type,
  DATE(created_at) as cancellation_date,
  COUNT(*) as total_cancellations,
  COUNT(DISTINCT cancelled_by) as unique_users,
  COUNT(CASE WHEN admin_reviewed THEN 1 END) as reviewed_count,
  COUNT(CASE WHEN NOT admin_reviewed THEN 1 END) as pending_review_count,
  ROUND(AVG(LENGTH(reason)), 0) as avg_reason_length,
  jsonb_agg(DISTINCT reason) FILTER (WHERE reason IS NOT NULL) as top_reasons
FROM public.cancellation_history
GROUP BY reference_type, cancellation_type, DATE(created_at)
ORDER BY cancellation_date DESC;

COMMENT ON VIEW cancellation_stats IS 'Vue analytique des annulations par type et date pour dashboard admin';

-- ========================================
-- 6. Fonction helper pour créer historique
-- ========================================
CREATE OR REPLACE FUNCTION log_cancellation(
  p_reference_type TEXT,
  p_reference_id UUID,
  p_cancelled_by UUID,
  p_cancellation_type TEXT,
  p_reason TEXT,
  p_status_at_cancellation TEXT,
  p_financial_impact JSONB DEFAULT '{}'::jsonb,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_history_id UUID;
BEGIN
  INSERT INTO public.cancellation_history (
    reference_type,
    reference_id,
    cancelled_by,
    cancellation_type,
    reason,
    status_at_cancellation,
    financial_impact,
    metadata
  ) VALUES (
    p_reference_type,
    p_reference_id,
    p_cancelled_by,
    p_cancellation_type,
    p_reason,
    p_status_at_cancellation,
    p_financial_impact,
    p_metadata
  )
  RETURNING id INTO v_history_id;
  
  RETURN v_history_id;
END;
$$;

COMMENT ON FUNCTION log_cancellation IS 'Fonction centralisée pour logger toutes les annulations avec audit complet';