-- Phase 4: Fix all functions missing search_path to resolve security warnings
-- These functions need to be updated to include SET search_path = public

-- Fix calculate_delivery_price function
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

-- Fix get_current_user_admin_status function  
CREATE OR REPLACE FUNCTION public.get_current_user_admin_status()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admins 
    WHERE user_id = auth.uid() 
      AND is_active = true
  );
END;
$$;

-- Fix get_current_user_role function
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS text
LANGUAGE sql
STABLE 
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role::text FROM user_roles 
  WHERE user_id = auth.uid() 
    AND is_active = true
  ORDER BY 
    CASE role::text
      WHEN 'admin' THEN 1
      WHEN 'partner' THEN 2  
      WHEN 'driver' THEN 3
      WHEN 'client' THEN 4
      ELSE 5
    END
  LIMIT 1;
$$;

-- Fix has_user_role function
CREATE OR REPLACE FUNCTION public.has_user_role(check_role text)
RETURNS boolean
LANGUAGE sql
STABLE 
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
      AND role::text = check_role
      AND is_active = true
  );
$$;