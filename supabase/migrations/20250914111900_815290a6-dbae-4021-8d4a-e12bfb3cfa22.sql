-- Créer la fonction RPC pour calculer les prix de livraison
CREATE OR REPLACE FUNCTION public.calculate_delivery_price(
  service_type_param text,
  distance_km_param numeric,
  city_param text DEFAULT 'Kinshasa'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  config_row delivery_pricing_config%ROWTYPE;
  calculated_price numeric;
  result jsonb;
BEGIN
  -- Récupérer la configuration de tarification active pour le service
  SELECT * INTO config_row
  FROM public.delivery_pricing_config
  WHERE service_type = service_type_param
    AND city = city_param
    AND is_active = true
  ORDER BY created_at DESC
  LIMIT 1;
  
  -- Si aucune config trouvée, utiliser les tarifs par défaut
  IF config_row IS NULL THEN
    CASE service_type_param
      WHEN 'flash' THEN
        config_row.base_price := 5000;
        config_row.price_per_km := 800;
        config_row.minimum_fare := 4000;
      WHEN 'flex' THEN
        config_row.base_price := 3000;
        config_row.price_per_km := 500;
        config_row.minimum_fare := 2500;
      WHEN 'maxicharge' THEN
        config_row.base_price := 8000;
        config_row.price_per_km := 1200;
        config_row.minimum_fare := 7000;
      ELSE
        config_row.base_price := 3000;
        config_row.price_per_km := 500;
        config_row.minimum_fare := 2500;
    END CASE;
    config_row.currency := 'CDF';
    config_row.surge_multiplier := 1.0;
  END IF;
  
  -- Calculer le prix total
  calculated_price := config_row.base_price + (distance_km_param * config_row.price_per_km);
  
  -- Appliquer le multiplicateur de surge si défini
  IF config_row.surge_multiplier IS NOT NULL AND config_row.surge_multiplier > 1 THEN
    calculated_price := calculated_price * config_row.surge_multiplier;
  END IF;
  
  -- Appliquer le tarif minimum
  IF calculated_price < config_row.minimum_fare THEN
    calculated_price := config_row.minimum_fare;
  END IF;
  
  -- Appliquer le tarif maximum si défini
  IF config_row.maximum_fare IS NOT NULL AND calculated_price > config_row.maximum_fare THEN
    calculated_price := config_row.maximum_fare;
  END IF;
  
  -- Arrondir le prix
  calculated_price := ROUND(calculated_price);
  
  -- Construire le résultat JSON
  result := jsonb_build_object(
    'calculated_price', calculated_price,
    'base_price', config_row.base_price,
    'price_per_km', config_row.price_per_km,
    'distance_km', distance_km_param,
    'service_type', service_type_param,
    'city', city_param,
    'currency', COALESCE(config_row.currency, 'CDF'),
    'surge_multiplier', COALESCE(config_row.surge_multiplier, 1.0),
    'minimum_fare', config_row.minimum_fare,
    'maximum_fare', config_row.maximum_fare
  );
  
  RETURN result;
END;
$$;