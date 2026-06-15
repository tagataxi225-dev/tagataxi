-- Phase 1: Système de zones et tarification dynamique

-- Table pour les zones géographiques
CREATE TABLE public.service_zones (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  city TEXT NOT NULL DEFAULT 'kinshasa',
  zone_type TEXT NOT NULL DEFAULT 'standard', -- standard, premium, airport, industrial
  coordinates JSONB NOT NULL, -- GeoJSON polygon
  is_active BOOLEAN NOT NULL DEFAULT true,
  surge_multiplier NUMERIC NOT NULL DEFAULT 1.0,
  base_price_multiplier NUMERIC NOT NULL DEFAULT 1.0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table pour l'historique des prix dynamiques
CREATE TABLE public.dynamic_pricing (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  zone_id UUID NOT NULL REFERENCES public.service_zones(id),
  vehicle_class TEXT NOT NULL DEFAULT 'standard',
  surge_multiplier NUMERIC NOT NULL DEFAULT 1.0,
  demand_level TEXT NOT NULL DEFAULT 'normal', -- low, normal, high, very_high
  available_drivers INTEGER NOT NULL DEFAULT 0,
  pending_requests INTEGER NOT NULL DEFAULT 0,
  calculated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  valid_until TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now() + INTERVAL '5 minutes'
);

-- Table pour le dispatching et file d'attente
CREATE TABLE public.driver_queue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  driver_id UUID NOT NULL,
  zone_id UUID NOT NULL REFERENCES public.service_zones(id),
  position_in_queue INTEGER NOT NULL DEFAULT 0,
  last_activity TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table pour les demandes de course en attente
CREATE TABLE public.ride_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  pickup_location TEXT NOT NULL,
  pickup_coordinates JSONB NOT NULL,
  destination TEXT NOT NULL,
  destination_coordinates JSONB NOT NULL,
  pickup_zone_id UUID REFERENCES public.service_zones(id),
  destination_zone_id UUID REFERENCES public.service_zones(id),
  vehicle_class TEXT NOT NULL DEFAULT 'standard',
  estimated_price NUMERIC,
  surge_price NUMERIC,
  final_price NUMERIC,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, dispatching, accepted, cancelled, completed
  assigned_driver_id UUID,
  request_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  dispatch_time TIMESTAMP WITH TIME ZONE,
  acceptance_time TIMESTAMP WITH TIME ZONE,
  pickup_time TIMESTAMP WITH TIME ZONE,
  completion_time TIMESTAMP WITH TIME ZONE,
  cancellation_time TIMESTAMP WITH TIME ZONE,
  cancellation_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table pour les notifications push
CREATE TABLE public.push_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  notification_type TEXT NOT NULL, -- ride_request, driver_assigned, driver_arrived, etc.
  reference_id UUID, -- booking_id, ride_request_id, etc.
  is_sent BOOLEAN NOT NULL DEFAULT false,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Activer RLS sur toutes les nouvelles tables
ALTER TABLE public.service_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dynamic_pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ride_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_notifications ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour service_zones
CREATE POLICY "Everyone can view active zones" 
ON public.service_zones 
FOR SELECT 
USING (is_active = true);

-- Politiques RLS pour dynamic_pricing
CREATE POLICY "Everyone can view current pricing" 
ON public.dynamic_pricing 
FOR SELECT 
USING (valid_until > now());

-- Politiques RLS pour driver_queue
CREATE POLICY "Drivers can view their queue position" 
ON public.driver_queue 
FOR SELECT 
USING (auth.uid() = driver_id);

CREATE POLICY "Drivers can update their queue status" 
ON public.driver_queue 
FOR UPDATE 
USING (auth.uid() = driver_id);

CREATE POLICY "System can manage driver queue" 
ON public.driver_queue 
FOR INSERT 
WITH CHECK (true);

-- Politiques RLS pour ride_requests
CREATE POLICY "Users can create their own ride requests" 
ON public.ride_requests 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own ride requests" 
ON public.ride_requests 
FOR SELECT 
USING (auth.uid() = user_id OR auth.uid() = assigned_driver_id);

CREATE POLICY "Users and drivers can update ride requests" 
ON public.ride_requests 
FOR UPDATE 
USING (auth.uid() = user_id OR auth.uid() = assigned_driver_id);

-- Politiques RLS pour push_notifications
CREATE POLICY "Users can view their own notifications" 
ON public.push_notifications 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications" 
ON public.push_notifications 
FOR INSERT 
WITH CHECK (true);

-- Triggers pour updated_at
CREATE TRIGGER update_service_zones_updated_at
BEFORE UPDATE ON public.service_zones
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_driver_queue_updated_at
BEFORE UPDATE ON public.driver_queue
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ride_requests_updated_at
BEFORE UPDATE ON public.ride_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Fonction pour calculer la zone d'un point
CREATE OR REPLACE FUNCTION public.get_zone_for_coordinates(lat NUMERIC, lng NUMERIC)
RETURNS UUID AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour calculer le surge pricing
CREATE OR REPLACE FUNCTION public.calculate_surge_pricing(zone_id_param UUID, vehicle_class_param TEXT)
RETURNS NUMERIC AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insérer des zones par défaut pour Kinshasa
INSERT INTO public.service_zones (name, city, zone_type, coordinates, surge_multiplier, base_price_multiplier) VALUES
('Centre-ville Gombe', 'kinshasa', 'premium', '{"type":"Polygon","coordinates":[[[-15.3,4.3],[-15.25,4.3],[-15.25,4.35],[-15.3,4.35],[-15.3,4.3]]]}', 1.2, 1.3),
('Kalamu', 'kinshasa', 'standard', '{"type":"Polygon","coordinates":[[[-15.35,4.25],[-15.3,4.25],[-15.3,4.3],[-15.35,4.3],[-15.35,4.25]]]}', 1.0, 1.0),
('Lemba', 'kinshasa', 'standard', '{"type":"Polygon","coordinates":[[[-15.4,4.25],[-15.35,4.25],[-15.35,4.3],[-15.4,4.3],[-15.4,4.25]]]}', 1.0, 1.0),
('Aéroport N\'djili', 'kinshasa', 'airport', '{"type":"Polygon","coordinates":[[[-15.2,4.4],[-15.15,4.4],[-15.15,4.45],[-15.2,4.45],[-15.2,4.4]]]}', 1.5, 1.8),
('Matete', 'kinshasa', 'standard', '{"type":"Polygon","coordinates":[[[-15.25,4.35],[-15.2,4.35],[-15.2,4.4],[-15.25,4.4],[-15.25,4.35]]]}', 1.0, 1.0);