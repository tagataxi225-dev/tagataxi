-- Correction de la fonction de validation des coordonnées pour les livraisons
-- Amélioration de la fonction existante pour supporter le nouveau format unifié

CREATE OR REPLACE FUNCTION public.validate_and_fix_delivery_coordinates()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  updated_count INTEGER := 0;
  delivery_record RECORD;
  default_kinshasa JSONB := '{"lat": -4.3217, "lng": 15.3069, "corrected": true}';
BEGIN
  -- Corriger les coordonnées invalides dans delivery_orders
  FOR delivery_record IN 
    SELECT id, pickup_coordinates, delivery_coordinates
    FROM delivery_orders 
    WHERE status IN ('pending', 'confirmed', 'driver_assigned')
      AND (
        pickup_coordinates IS NULL OR
        delivery_coordinates IS NULL OR
        NOT (pickup_coordinates ? 'lat') OR
        NOT (pickup_coordinates ? 'lng') OR
        NOT (delivery_coordinates ? 'lat') OR
        NOT (delivery_coordinates ? 'lng') OR
        (pickup_coordinates->>'lat')::numeric < -90 OR
        (pickup_coordinates->>'lat')::numeric > 90 OR
        (pickup_coordinates->>'lng')::numeric < -180 OR
        (pickup_coordinates->>'lng')::numeric > 180 OR
        (delivery_coordinates->>'lat')::numeric < -90 OR
        (delivery_coordinates->>'lat')::numeric > 90 OR
        (delivery_coordinates->>'lng')::numeric < -180 OR
        (delivery_coordinates->>'lng')::numeric > 180
      )
  LOOP
    UPDATE delivery_orders 
    SET 
      pickup_coordinates = COALESCE(delivery_record.pickup_coordinates, default_kinshasa),
      delivery_coordinates = COALESCE(delivery_record.delivery_coordinates, default_kinshasa),
      updated_at = NOW()
    WHERE id = delivery_record.id;
    
    updated_count := updated_count + 1;
  END LOOP;
  
  RETURN updated_count;
END;
$$;