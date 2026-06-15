-- Ajouter une fonction pour calculer automatiquement le prix de livraison
CREATE OR REPLACE FUNCTION public.calculate_delivery_price(
  p_service_type text,
  p_distance_km numeric,
  p_city text DEFAULT 'Kinshasa'
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  base_pricing RECORD;
  calculated_price numeric;
  surge_multiplier numeric := 1.0;
  result jsonb;
BEGIN
  -- Récupérer la configuration de prix pour le service
  SELECT * INTO base_pricing
  FROM delivery_pricing_config
  WHERE service_type = p_service_type
    AND city = p_city
    AND is_active = true
  ORDER BY created_at DESC
  LIMIT 1;
  
  -- Si pas de configuration trouvée, utiliser les valeurs par défaut
  IF base_pricing IS NULL THEN
    CASE p_service_type
      WHEN 'flash' THEN
        base_pricing.base_price := 5000;
        base_pricing.price_per_km := 500;
        base_pricing.minimum_fare := 3000;
      WHEN 'flex' THEN
        base_pricing.base_price := 3000;
        base_pricing.price_per_km := 300;
        base_pricing.minimum_fare := 2000;
      WHEN 'maxicharge' THEN
        base_pricing.base_price := 8000;
        base_pricing.price_per_km := 800;
        base_pricing.minimum_fare := 5000;
      ELSE
        base_pricing.base_price := 4000;
        base_pricing.price_per_km := 400;
        base_pricing.minimum_fare := 2500;
    END CASE;
    base_pricing.currency := 'CDF';
  END IF;
  
  -- Calculer le prix de base
  calculated_price := base_pricing.base_price + (p_distance_km * base_pricing.price_per_km);
  
  -- Appliquer le tarif minimum
  calculated_price := GREATEST(calculated_price, base_pricing.minimum_fare);
  
  -- Appliquer le surge pricing si configuré
  IF base_pricing.surge_multiplier IS NOT NULL THEN
    surge_multiplier := base_pricing.surge_multiplier;
  END IF;
  
  calculated_price := calculated_price * surge_multiplier;
  
  -- Arrondir au CDF près
  calculated_price := ROUND(calculated_price);
  
  -- Retourner le résultat en JSON
  result := jsonb_build_object(
    'calculated_price', calculated_price,
    'base_price', base_pricing.base_price,
    'distance_price', p_distance_km * base_pricing.price_per_km,
    'surge_multiplier', surge_multiplier,
    'currency', base_pricing.currency,
    'service_type', p_service_type,
    'distance_km', p_distance_km,
    'city', p_city
  );
  
  RETURN result;
END;
$$;

-- Ajouter une contrainte unique pour éviter l'erreur ON CONFLICT
ALTER TABLE delivery_pricing_config 
ADD CONSTRAINT unique_service_city 
UNIQUE (service_type, city);

-- Ajouter des données de configuration par défaut pour Kinshasa
INSERT INTO delivery_pricing_config (service_type, city, base_price, price_per_km, minimum_fare, currency, is_active)
VALUES 
  ('flash', 'Kinshasa', 5000, 500, 3000, 'CDF', true),
  ('flex', 'Kinshasa', 3000, 300, 2000, 'CDF', true),
  ('maxicharge', 'Kinshasa', 8000, 800, 5000, 'CDF', true),
  ('flash', 'Lubumbashi', 6000, 600, 3500, 'CDF', true),
  ('flex', 'Lubumbashi', 3600, 360, 2400, 'CDF', true),
  ('maxicharge', 'Lubumbashi', 9600, 960, 6000, 'CDF', true),
  ('flash', 'Abidjan', 2500, 250, 1500, 'XOF', true),
  ('flex', 'Abidjan', 1500, 150, 1000, 'XOF', true),
  ('maxicharge', 'Abidjan', 4000, 400, 2500, 'XOF', true)
ON CONFLICT (service_type, city) DO UPDATE SET
  base_price = EXCLUDED.base_price,
  price_per_km = EXCLUDED.price_per_km,
  minimum_fare = EXCLUDED.minimum_fare,
  updated_at = now();

-- Trigger pour mise à jour automatique des prix estimés
CREATE OR REPLACE FUNCTION update_delivery_order_pricing()
RETURNS TRIGGER AS $$
DECLARE
  pricing_result jsonb;
  distance_km numeric;
BEGIN
  -- Calculer la distance si les coordonnées sont disponibles
  IF NEW.pickup_coordinates IS NOT NULL AND NEW.delivery_coordinates IS NOT NULL THEN
    SELECT calculate_distance_km(
      (NEW.pickup_coordinates->>'lat')::numeric,
      (NEW.pickup_coordinates->>'lng')::numeric,
      (NEW.delivery_coordinates->>'lat')::numeric,
      (NEW.delivery_coordinates->>'lng')::numeric
    ) INTO distance_km;
    
    -- Calculer le prix automatiquement
    SELECT calculate_delivery_price(
      NEW.delivery_type,
      distance_km,
      'Kinshasa' -- TODO: Récupérer depuis le profil utilisateur
    ) INTO pricing_result;
    
    -- Mettre à jour le prix estimé si pas déjà défini
    IF NEW.estimated_price IS NULL OR NEW.estimated_price = 0 THEN
      NEW.estimated_price := (pricing_result->>'calculated_price')::numeric;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer le trigger
DROP TRIGGER IF EXISTS trigger_update_delivery_pricing ON delivery_orders;
CREATE TRIGGER trigger_update_delivery_pricing
  BEFORE INSERT OR UPDATE ON delivery_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_delivery_order_pricing();