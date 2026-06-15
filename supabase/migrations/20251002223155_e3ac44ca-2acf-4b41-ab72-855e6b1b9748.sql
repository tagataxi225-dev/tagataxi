-- ========================================
-- PHASE 1: Protection Base de Données
-- ========================================

-- 1. Ajouter colonne assignment_version pour delivery_orders
ALTER TABLE public.delivery_orders 
ADD COLUMN IF NOT EXISTS assignment_version INTEGER NOT NULL DEFAULT 0;

-- 2. Ajouter colonne assignment_version pour transport_bookings
ALTER TABLE public.transport_bookings 
ADD COLUMN IF NOT EXISTS assignment_version INTEGER NOT NULL DEFAULT 0;

-- 3. Créer fonction pour auto-incrémenter assignment_version
CREATE OR REPLACE FUNCTION public.increment_assignment_version()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Incrémenter seulement si driver_id change
  IF (TG_OP = 'UPDATE' AND OLD.driver_id IS DISTINCT FROM NEW.driver_id AND NEW.driver_id IS NOT NULL) THEN
    NEW.assignment_version := OLD.assignment_version + 1;
  END IF;
  RETURN NEW;
END;
$$;

-- 4. Appliquer trigger à delivery_orders
DROP TRIGGER IF EXISTS trigger_increment_delivery_assignment_version ON public.delivery_orders;
CREATE TRIGGER trigger_increment_delivery_assignment_version
  BEFORE UPDATE ON public.delivery_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.increment_assignment_version();

-- 5. Appliquer trigger à transport_bookings
DROP TRIGGER IF EXISTS trigger_increment_transport_assignment_version ON public.transport_bookings;
CREATE TRIGGER trigger_increment_transport_assignment_version
  BEFORE UPDATE ON public.transport_bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.increment_assignment_version();

-- 6. Index unique partiel pour delivery_orders (empêche assignations multiples)
CREATE UNIQUE INDEX IF NOT EXISTS idx_delivery_orders_unique_driver_assignment
  ON public.delivery_orders(id)
  WHERE driver_id IS NOT NULL 
    AND status IN ('driver_assigned', 'picked_up', 'in_transit', 'confirmed');

-- 7. Index unique partiel pour transport_bookings
CREATE UNIQUE INDEX IF NOT EXISTS idx_transport_bookings_unique_driver_assignment
  ON public.transport_bookings(id)
  WHERE driver_id IS NOT NULL 
    AND status IN ('driver_assigned', 'in_progress', 'confirmed', 'picked_up');

-- ========================================
-- PHASE 4: Gestion des Alertes Expirées
-- ========================================

-- 8. Ajouter expires_at aux alertes de livraison
ALTER TABLE public.delivery_driver_alerts 
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '3 minutes');

-- 9. Fonction pour marquer les alertes expirées comme ignored
CREATE OR REPLACE FUNCTION public.mark_expired_delivery_alerts()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE public.delivery_driver_alerts
  SET 
    response_status = 'expired',
    updated_at = NOW()
  WHERE response_status = 'sent'
    AND expires_at < NOW();
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  
  RETURN updated_count;
END;
$$;

-- 10. Créer index sur expires_at pour performance
CREATE INDEX IF NOT EXISTS idx_delivery_alerts_expires_at 
  ON public.delivery_driver_alerts(expires_at)
  WHERE response_status = 'sent';

-- 11. Fonction pour logger les conflits d'assignation
CREATE OR REPLACE FUNCTION public.log_assignment_conflict(
  p_order_type TEXT,
  p_order_id UUID,
  p_driver_id UUID,
  p_conflict_reason TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.activity_logs (
    user_id,
    activity_type,
    description,
    reference_type,
    reference_id,
    metadata
  ) VALUES (
    p_driver_id,
    'assignment_conflict',
    'Tentative d''assignation refusée: ' || p_conflict_reason,
    p_order_type,
    p_order_id,
    jsonb_build_object(
      'conflict_reason', p_conflict_reason,
      'timestamp', NOW(),
      'order_type', p_order_type
    )
  );
END;
$$;

-- 12. Créer vue pour monitoring des conflits (admin uniquement)
CREATE OR REPLACE VIEW public.assignment_conflicts_view AS
SELECT 
  al.created_at,
  al.reference_type AS order_type,
  al.reference_id AS order_id,
  al.user_id AS driver_id,
  al.description,
  al.metadata->>'conflict_reason' AS reason,
  CASE 
    WHEN al.reference_type = 'delivery_order' THEN dord.status
    WHEN al.reference_type = 'transport_booking' THEN tb.status
  END AS current_status,
  CASE 
    WHEN al.reference_type = 'delivery_order' THEN dord.driver_id
    WHEN al.reference_type = 'transport_booking' THEN tb.driver_id
  END AS current_driver_id
FROM public.activity_logs al
LEFT JOIN public.delivery_orders dord ON al.reference_id = dord.id AND al.reference_type = 'delivery_order'
LEFT JOIN public.transport_bookings tb ON al.reference_id = tb.id AND al.reference_type = 'transport_booking'
WHERE al.activity_type = 'assignment_conflict'
ORDER BY al.created_at DESC;

COMMENT ON VIEW public.assignment_conflicts_view IS 'Vue admin pour monitoring des conflits d''assignation';

-- 13. RLS sur la vue de monitoring
ALTER VIEW public.assignment_conflicts_view SET (security_invoker = on);

GRANT SELECT ON public.assignment_conflicts_view TO authenticated;

-- Grant sur les fonctions
GRANT EXECUTE ON FUNCTION public.increment_assignment_version() TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_expired_delivery_alerts() TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_assignment_conflict(TEXT, UUID, UUID, TEXT) TO authenticated;