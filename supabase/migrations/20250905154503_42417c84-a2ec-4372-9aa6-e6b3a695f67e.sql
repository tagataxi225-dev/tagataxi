-- Phase 4B: Drop and recreate functions with correct search_path
-- Drop existing functions first to avoid parameter name conflicts
DROP FUNCTION IF EXISTS public.calculate_delivery_price(text, numeric, text);

-- Create calculate_delivery_price function with correct search_path
CREATE OR REPLACE FUNCTION public.calculate_delivery_price(
  service_type_param text,
  distance_km_param numeric,
  city_param text DEFAULT 'Kinshasa'::text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  base_price numeric;
  price_per_km numeric;
  calculated_price numeric;
  config_record RECORD;
BEGIN
  -- Get pricing configuration
  SELECT * INTO config_record
  FROM delivery_pricing_config
  WHERE service_type = service_type_param
    AND city = city_param
    AND is_active = true
  ORDER BY created_at DESC
  LIMIT 1;
  
  IF config_record IS NULL THEN
    -- Default pricing
    CASE service_type_param
      WHEN 'flash' THEN
        base_price := 5000;
        price_per_km := 500;
      WHEN 'flex' THEN
        base_price := 3000;
        price_per_km := 300;
      WHEN 'maxicharge' THEN
        base_price := 8000;
        price_per_km := 800;
      ELSE
        base_price := 4000;
        price_per_km := 400;
    END CASE;
  ELSE
    base_price := config_record.base_price;
    price_per_km := config_record.price_per_km;
  END IF;
  
  calculated_price := base_price + (price_per_km * distance_km_param);
  
  RETURN jsonb_build_object(
    'base_price', base_price,
    'distance_price', price_per_km * distance_km_param,
    'calculated_price', calculated_price,
    'service_type', service_type_param,
    'distance_km', distance_km_param
  );
END;
$$;

-- Add the final audit logging function
CREATE OR REPLACE FUNCTION public.log_sensitive_data_access(
  p_table_name text,
  p_operation text,
  p_accessed_user_id uuid DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO sensitive_data_access_audit (
    user_id, table_name, operation, accessed_user_data, metadata
  ) VALUES (
    auth.uid(), p_table_name, p_operation, p_accessed_user_id, p_metadata
  );
END;
$$;