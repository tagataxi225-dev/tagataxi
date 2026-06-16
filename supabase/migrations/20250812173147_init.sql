-- Mise à jour de la table rental_vehicles pour activer automatiquement les véhicules approuvés
CREATE OR REPLACE FUNCTION public.activate_approved_vehicles()
RETURNS TRIGGER AS $$
BEGIN
  -- Si le véhicule est approuvé, l'activer automatiquement
  IF NEW.moderation_status = 'approved' AND OLD.moderation_status != 'approved' THEN
    NEW.is_active = true;
  END IF;
  
  -- Si le véhicule est rejeté, le désactiver
  IF NEW.moderation_status = 'rejected' AND OLD.moderation_status != 'rejected' THEN
    NEW.is_active = false;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer les triggers pour rental_vehicles
DROP TRIGGER IF EXISTS trigger_activate_rental_vehicles ON public.rental_vehicles;
CREATE TRIGGER trigger_activate_rental_vehicles
  BEFORE UPDATE ON public.rental_vehicles
  FOR EACH ROW
  EXECUTE FUNCTION public.activate_approved_vehicles();

-- Créer les triggers pour partner_taxi_vehicles
DROP TRIGGER IF EXISTS trigger_activate_taxi_vehicles ON public.partner_taxi_vehicles;
CREATE TRIGGER trigger_activate_taxi_vehicles
  BEFORE UPDATE ON public.partner_taxi_vehicles
  FOR EACH ROW
  EXECUTE FUNCTION public.activate_approved_vehicles();

-- Activer immédiatement tous les véhicules déjà approuvés
UPDATE public.rental_vehicles 
SET is_active = true 
WHERE moderation_status = 'approved' AND is_active = false;

UPDATE public.partner_taxi_vehicles 
SET is_active = true 
WHERE moderation_status = 'approved' AND is_active = false;