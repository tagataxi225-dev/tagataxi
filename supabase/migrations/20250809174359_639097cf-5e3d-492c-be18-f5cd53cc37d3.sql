-- Mise à jour de la table pricing_rules pour le système de frais d'attente
ALTER TABLE public.pricing_rules 
ADD COLUMN waiting_fee_per_minute numeric DEFAULT 50,
ADD COLUMN free_waiting_time_minutes integer DEFAULT 5,
ADD COLUMN max_waiting_time_minutes integer DEFAULT 15;

-- Mise à jour de la table ride_requests pour le tracking des temps d'attente
ALTER TABLE public.ride_requests
ADD COLUMN driver_arrived_at timestamp with time zone,
ADD COLUMN customer_boarded_at timestamp with time zone,
ADD COLUMN waiting_time_minutes integer DEFAULT 0,
ADD COLUMN waiting_fee_amount numeric DEFAULT 0;

-- Trigger pour calculer automatiquement les frais d'attente
CREATE OR REPLACE FUNCTION public.calculate_waiting_fees()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

-- Créer le trigger
DROP TRIGGER IF EXISTS trigger_calculate_waiting_fees ON public.ride_requests;
CREATE TRIGGER trigger_calculate_waiting_fees
  BEFORE UPDATE ON public.ride_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.calculate_waiting_fees();

-- Ajouter des valeurs par défaut pour les nouvelles colonnes
UPDATE public.pricing_rules 
SET 
  waiting_fee_per_minute = CASE 
    WHEN vehicle_class IN ('premium', 'first_class') THEN 100
    ELSE 50
  END,
  free_waiting_time_minutes = 5,
  max_waiting_time_minutes = 15
WHERE waiting_fee_per_minute IS NULL;