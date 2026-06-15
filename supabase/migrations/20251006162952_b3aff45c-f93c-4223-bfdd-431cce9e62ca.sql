-- Phase 1: RPC pour récupérer les types de véhicules avec leurs tarifs
CREATE OR REPLACE FUNCTION public.get_vehicle_types_with_pricing(p_city text DEFAULT 'Kinshasa')
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
BEGIN
  -- Vérifier les permissions admin
  IF NOT is_current_user_admin() THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;

  SELECT jsonb_agg(
    jsonb_build_object(
      'service_type', sc.service_type,
      'display_name', sc.display_name,
      'description', sc.description,
      'is_active', sc.is_active,
      'base_price', COALESCE(pr.base_price, 0),
      'price_per_km', COALESCE(pr.price_per_km, 0),
      'minimum_fare', COALESCE(pr.minimum_fare, 0),
      'currency', COALESCE(pr.currency, 'CDF'),
      'city', p_city,
      'vehicle_class', CASE sc.service_type
        WHEN 'taxi_eco' THEN 'eco'
        WHEN 'taxi_confort' THEN 'standard'
        WHEN 'taxi_premium' THEN 'premium'
        WHEN 'taxi_moto' THEN 'moto'
      END,
      'pricing_id', pr.id,
      'config_id', sc.id
    )
    ORDER BY 
      CASE sc.service_type
        WHEN 'taxi_moto' THEN 1
        WHEN 'taxi_eco' THEN 2
        WHEN 'taxi_confort' THEN 3
        WHEN 'taxi_premium' THEN 4
      END
  ) INTO result
  FROM service_configurations sc
  LEFT JOIN pricing_rules pr ON pr.vehicle_class = (
    CASE sc.service_type
      WHEN 'taxi_eco' THEN 'eco'
      WHEN 'taxi_confort' THEN 'standard'
      WHEN 'taxi_premium' THEN 'premium'
      WHEN 'taxi_moto' THEN 'moto'
    END
  ) AND pr.service_type = 'transport'
    AND pr.city = p_city
    AND pr.is_active = true
  WHERE sc.service_category = 'taxi'
    AND sc.service_type IN ('taxi_eco', 'taxi_confort', 'taxi_premium', 'taxi_moto');
  
  RETURN COALESCE(result, '[]'::jsonb);
END;
$$;

-- Phase 2: RPC pour mettre à jour la configuration du type de véhicule
CREATE OR REPLACE FUNCTION public.update_vehicle_type_config(
  p_service_type text,
  p_display_name text,
  p_description text,
  p_is_active boolean
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Vérifier les permissions admin
  IF NOT is_current_user_admin() THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;

  UPDATE service_configurations
  SET 
    display_name = p_display_name,
    description = p_description,
    is_active = p_is_active,
    updated_at = now()
  WHERE service_type = p_service_type
    AND service_category = 'taxi';
    
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Vehicle type configuration not found: %', p_service_type;
  END IF;
END;
$$;

-- Phase 3: RPC pour mettre à jour les tarifs
CREATE OR REPLACE FUNCTION public.update_vehicle_pricing(
  p_pricing_id uuid,
  p_base_price numeric,
  p_price_per_km numeric,
  p_minimum_fare numeric
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Vérifier les permissions admin
  IF NOT is_current_user_admin() THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;

  -- Valider les montants
  IF p_base_price < 0 OR p_price_per_km < 0 OR p_minimum_fare < 0 THEN
    RAISE EXCEPTION 'Pricing values cannot be negative';
  END IF;

  UPDATE pricing_rules
  SET 
    base_price = p_base_price,
    price_per_km = p_price_per_km,
    minimum_fare = p_minimum_fare,
    updated_at = now()
  WHERE id = p_pricing_id;
    
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pricing rule not found: %', p_pricing_id;
  END IF;
END;
$$;