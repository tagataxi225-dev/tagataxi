-- Supprimer l'ancienne fonction et recréer avec le bon type de retour
DROP FUNCTION IF EXISTS public.calculate_delivery_price(text, numeric, text);

-- Créer une fonction RPC pour calculer les prix de livraison dynamiquement
CREATE OR REPLACE FUNCTION public.calculate_delivery_price(
  p_service_type text,
  p_distance_km numeric,
  p_city text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  config_record RECORD;
  calculated_price numeric;
BEGIN
  -- Récupérer la configuration de pricing pour le service et la ville
  SELECT * INTO config_record
  FROM public.delivery_pricing_config
  WHERE service_type = p_service_type
    AND city = p_city
    AND is_active = true
  ORDER BY created_at DESC
  LIMIT 1;
  
  -- Si aucune config trouvée, utiliser des prix par défaut
  IF NOT FOUND THEN
    CASE p_service_type
      WHEN 'flash' THEN
        calculated_price := 5000 + (p_distance_km * 500);
      WHEN 'flex' THEN
        calculated_price := 3000 + (p_distance_km * 300);
      WHEN 'maxicharge' THEN
        calculated_price := 8000 + (p_distance_km * 800);
      ELSE
        calculated_price := 5000;
    END CASE;
  ELSE
    -- Calculer le prix avec la configuration trouvée
    calculated_price := config_record.base_price + (p_distance_km * config_record.price_per_km);
    
    -- Appliquer le surge multiplier si défini
    IF config_record.surge_multiplier IS NOT NULL THEN
      calculated_price := calculated_price * config_record.surge_multiplier;
    END IF;
    
    -- Appliquer les limites min/max
    IF config_record.minimum_fare IS NOT NULL AND calculated_price < config_record.minimum_fare THEN
      calculated_price := config_record.minimum_fare;
    END IF;
    
    IF config_record.maximum_fare IS NOT NULL AND calculated_price > config_record.maximum_fare THEN
      calculated_price := config_record.maximum_fare;
    END IF;
  END IF;
  
  RETURN jsonb_build_object(
    'calculated_price', ROUND(calculated_price),
    'service_type', p_service_type,
    'distance_km', p_distance_km,
    'city', p_city,
    'base_price', COALESCE(config_record.base_price, 0),
    'price_per_km', COALESCE(config_record.price_per_km, 0)
  );
END;
$$;