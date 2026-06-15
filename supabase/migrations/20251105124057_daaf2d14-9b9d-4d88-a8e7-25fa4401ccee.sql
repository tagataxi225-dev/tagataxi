-- PHASE 2: Recréer RPC get_vehicle_types_with_pricing avec DROP CASCADE
-- Optimise useVehicleTypes de 2 requêtes à 1 seule

DROP FUNCTION IF EXISTS get_vehicle_types_with_pricing CASCADE;

CREATE OR REPLACE FUNCTION get_vehicle_types_with_pricing(
  p_city TEXT,
  p_distance NUMERIC DEFAULT 0
)
RETURNS TABLE (
  service_type TEXT,
  display_name TEXT,
  base_price NUMERIC,
  price_per_km NUMERIC,
  calculated_price NUMERIC,
  features JSONB,
  is_active BOOLEAN
) 
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sc.service_type,
    sc.display_name,
    COALESCE(pr.base_price, 2500) as base_price,
    COALESCE(pr.price_per_km, 300) as price_per_km,
    ROUND(COALESCE(pr.base_price, 2500) + (p_distance * COALESCE(pr.price_per_km, 300))) as calculated_price,
    sc.features,
    sc.is_active
  FROM service_configurations sc
  LEFT JOIN pricing_rules pr ON (
    pr.vehicle_class = CASE sc.service_type
      WHEN 'taxi_eco' THEN 'eco'
      WHEN 'taxi_confort' THEN 'standard'
      WHEN 'taxi_premium' THEN 'premium'
      WHEN 'taxi_moto' THEN 'moto'
      ELSE 'standard'
    END
    AND pr.city ILIKE p_city
    AND pr.is_active = true
    AND pr.service_type = 'transport'
  )
  WHERE sc.service_category = 'taxi'
    AND sc.is_active = true
  ORDER BY calculated_price ASC;
END;
$$;

COMMENT ON FUNCTION get_vehicle_types_with_pricing IS 'Récupère les types de véhicules avec tarification calculée en 1 requête optimisée - PHASE 2 Optimisation Taxi';
