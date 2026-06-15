-- Corriger les fonctions de sécurité et ajouter les zones par défaut

-- Fonction pour calculer la zone d'un point (corrigée)
CREATE OR REPLACE FUNCTION public.get_zone_for_coordinates(lat NUMERIC, lng NUMERIC)
RETURNS UUID 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  zone_record RECORD;
BEGIN
  -- Recherche la zone qui contient le point donné
  FOR zone_record IN 
    SELECT id, coordinates 
    FROM public.service_zones 
    WHERE is_active = true
  LOOP
    -- Ici on ferait normalement une vérification géométrique
    -- Pour l'instant, on retourne la première zone trouvée pour Kinshasa
    IF zone_record.id IS NOT NULL THEN
      RETURN zone_record.id;
    END IF;
  END LOOP;
  
  RETURN NULL;
END;
$$;

-- Fonction pour calculer le surge pricing (corrigée)
CREATE OR REPLACE FUNCTION public.calculate_surge_pricing(zone_id_param UUID, vehicle_class_param TEXT)
RETURNS NUMERIC 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  available_drivers_count INTEGER;
  pending_requests_count INTEGER;
  surge_multiplier NUMERIC := 1.0;
BEGIN
  -- Compter les chauffeurs disponibles dans la zone
  SELECT COUNT(*) INTO available_drivers_count
  FROM public.driver_locations dl
  JOIN public.driver_queue dq ON dl.driver_id = dq.driver_id
  WHERE dq.zone_id = zone_id_param 
    AND dl.is_online = true 
    AND dl.is_available = true
    AND dq.is_active = true;
  
  -- Compter les demandes en attente
  SELECT COUNT(*) INTO pending_requests_count
  FROM public.ride_requests
  WHERE pickup_zone_id = zone_id_param 
    AND status IN ('pending', 'dispatching')
    AND vehicle_class = vehicle_class_param;
  
  -- Calculer le surge pricing basé sur l'offre et la demande
  IF available_drivers_count = 0 THEN
    surge_multiplier := 2.5;
  ELSIF pending_requests_count > available_drivers_count * 2 THEN
    surge_multiplier := 2.0;
  ELSIF pending_requests_count > available_drivers_count THEN
    surge_multiplier := 1.5;
  ELSE
    surge_multiplier := 1.0;
  END IF;
  
  -- Enregistrer le calcul
  INSERT INTO public.dynamic_pricing (
    zone_id, 
    vehicle_class, 
    surge_multiplier, 
    demand_level,
    available_drivers, 
    pending_requests
  ) VALUES (
    zone_id_param,
    vehicle_class_param,
    surge_multiplier,
    CASE 
      WHEN surge_multiplier >= 2.0 THEN 'very_high'
      WHEN surge_multiplier >= 1.5 THEN 'high'
      ELSE 'normal'
    END,
    available_drivers_count,
    pending_requests_count
  );
  
  RETURN surge_multiplier;
END;
$$;

-- Insérer des zones par défaut pour Kinshasa
INSERT INTO public.service_zones (name, city, zone_type, coordinates, surge_multiplier, base_price_multiplier) VALUES
('Centre-ville Gombe', 'kinshasa', 'premium', '{"type":"Polygon","coordinates":[[[-15.3,4.3],[-15.25,4.3],[-15.25,4.35],[-15.3,4.35],[-15.3,4.3]]]}', 1.2, 1.3),
('Kalamu', 'kinshasa', 'standard', '{"type":"Polygon","coordinates":[[[-15.35,4.25],[-15.3,4.25],[-15.3,4.3],[-15.35,4.3],[-15.35,4.25]]]}', 1.0, 1.0),
('Lemba', 'kinshasa', 'standard', '{"type":"Polygon","coordinates":[[[-15.4,4.25],[-15.35,4.25],[-15.35,4.3],[-15.4,4.3],[-15.4,4.25]]]}', 1.0, 1.0),
('Aeroport Ndjili', 'kinshasa', 'airport', '{"type":"Polygon","coordinates":[[[-15.2,4.4],[-15.15,4.4],[-15.15,4.45],[-15.2,4.45],[-15.2,4.4]]]}', 1.5, 1.8),
('Matete', 'kinshasa', 'standard', '{"type":"Polygon","coordinates":[[[-15.25,4.35],[-15.2,4.35],[-15.2,4.4],[-15.25,4.4],[-15.25,4.35]]]}', 1.0, 1.0);