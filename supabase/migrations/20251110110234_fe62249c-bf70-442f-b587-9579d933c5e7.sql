-- Fonction pour vérifier la disponibilité d'un véhicule sur une période
CREATE OR REPLACE FUNCTION check_vehicle_availability(
  p_vehicle_id UUID,
  p_start_date TIMESTAMPTZ,
  p_end_date TIMESTAMPTZ,
  p_exclude_booking_id UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_conflict_count INTEGER;
BEGIN
  -- Vérifier que le véhicule existe et est actif
  IF NOT EXISTS (
    SELECT 1 FROM rental_vehicles 
    WHERE id = p_vehicle_id 
    AND is_active = true 
    AND is_available = true
    AND moderation_status = 'approved'
  ) THEN
    RETURN FALSE;
  END IF;

  -- Compter les réservations qui se chevauchent
  SELECT COUNT(*) INTO v_conflict_count
  FROM rental_bookings
  WHERE vehicle_id = p_vehicle_id
    AND status IN ('pending', 'confirmed', 'active')
    AND (p_exclude_booking_id IS NULL OR id != p_exclude_booking_id)
    AND (
      -- Chevauchement de dates
      (start_date <= p_end_date AND end_date >= p_start_date)
    );

  -- Disponible si aucun conflit
  RETURN (v_conflict_count = 0);
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION check_vehicle_availability(UUID, TIMESTAMPTZ, TIMESTAMPTZ, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION check_vehicle_availability(UUID, TIMESTAMPTZ, TIMESTAMPTZ, UUID) TO anon;
GRANT EXECUTE ON FUNCTION check_vehicle_availability(UUID, TIMESTAMPTZ, TIMESTAMPTZ, UUID) TO service_role;

COMMENT ON FUNCTION check_vehicle_availability IS 'Vérifie si un véhicule est disponible pour la période demandée';