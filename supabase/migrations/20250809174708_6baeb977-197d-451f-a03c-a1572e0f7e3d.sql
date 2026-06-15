-- Corriger les fonctions avec search_path mutable
CREATE OR REPLACE FUNCTION public.calculate_waiting_fees()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  pricing_rule RECORD;
  waiting_minutes INTEGER := 0;
  billable_minutes INTEGER := 0;
  waiting_fee NUMERIC := 0;
BEGIN
  -- Calcul seulement si on passe de driver_arrived à in_progress
  IF OLD.status = 'driver_arrived' AND NEW.status = 'in_progress' AND NEW.driver_arrived_at IS NOT NULL THEN
    -- Calculer le temps d'attente en minutes
    waiting_minutes := EXTRACT(EPOCH FROM (NEW.customer_boarded_at - NEW.driver_arrived_at)) / 60;
    
    -- Récupérer la règle de tarification
    SELECT * INTO pricing_rule
    FROM public.pricing_rules
    WHERE service_type = 'transport'
      AND vehicle_class = NEW.vehicle_class
      AND is_active = true
    LIMIT 1;
    
    IF pricing_rule IS NOT NULL THEN
      -- Calculer les minutes facturables (après le temps gratuit)
      billable_minutes := GREATEST(0, waiting_minutes - pricing_rule.free_waiting_time_minutes);
      
      -- Calculer les frais d'attente
      waiting_fee := billable_minutes * pricing_rule.waiting_fee_per_minute;
      
      -- Mettre à jour les valeurs
      NEW.waiting_time_minutes := waiting_minutes;
      NEW.waiting_fee_amount := waiting_fee;
      
      -- Mettre à jour le prix final
      NEW.actual_price := COALESCE(NEW.actual_price, NEW.estimated_price) + waiting_fee;
    END IF;
  END IF;
  
  -- Auto-définir driver_arrived_at si le statut devient driver_arrived
  IF NEW.status = 'driver_arrived' AND OLD.status != 'driver_arrived' AND NEW.driver_arrived_at IS NULL THEN
    NEW.driver_arrived_at := now();
  END IF;
  
  -- Auto-définir customer_boarded_at si le statut devient in_progress
  IF NEW.status = 'in_progress' AND OLD.status != 'in_progress' AND NEW.customer_boarded_at IS NULL THEN
    NEW.customer_boarded_at := now();
  END IF;
  
  RETURN NEW;
END;
$$;