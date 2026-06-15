-- Corriger les problèmes de sécurité détectés
-- Fixer les search_path pour les fonctions manquantes

-- 1. Corriger la fonction update_delivery_order_pricing
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
$$ LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path TO 'public';