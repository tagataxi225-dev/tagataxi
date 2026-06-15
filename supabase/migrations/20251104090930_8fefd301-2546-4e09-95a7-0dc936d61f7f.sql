-- ============================================================================
-- PHASE 2 - FONCTION log_assignment_conflict
-- ============================================================================
-- Fonction pour logger les conflits d assignation (race conditions)

CREATE OR REPLACE FUNCTION log_assignment_conflict(
  p_order_type text,
  p_order_id uuid,
  p_driver_id uuid,
  p_conflict_reason text
)
RETURNS void
SECURITY INVOKER
SET search_path = public, pg_temp
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO activity_logs (
    user_id,
    activity_type,
    description,
    reference_type,
    reference_id,
    metadata
  ) VALUES (
    p_driver_id,
    'assignment_conflict',
    p_conflict_reason,
    p_order_type,
    p_order_id,
    jsonb_build_object(
      'conflict_time', NOW(),
      'driver_id', p_driver_id,
      'order_id', p_order_id,
      'reason', p_conflict_reason
    )
  );
END;
$$;