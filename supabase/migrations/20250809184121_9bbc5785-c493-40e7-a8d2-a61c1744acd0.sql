-- Étendre la table service_zones avec les nouveaux champs
ALTER TABLE public.service_zones ADD COLUMN IF NOT EXISTS status text DEFAULT 'active'::text;
ALTER TABLE public.service_zones ADD COLUMN IF NOT EXISTS maintenance_start timestamp with time zone;
ALTER TABLE public.service_zones ADD COLUMN IF NOT EXISTS maintenance_end timestamp with time zone;
ALTER TABLE public.service_zones ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.service_zones ADD COLUMN IF NOT EXISTS created_by uuid;
ALTER TABLE public.service_zones ADD COLUMN IF NOT EXISTS updated_by uuid;
ALTER TABLE public.service_zones ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;

-- Créer la table des règles de tarification par zone
CREATE TABLE IF NOT EXISTS public.zone_pricing_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_id uuid NOT NULL REFERENCES public.service_zones(id) ON DELETE CASCADE,
  vehicle_class text NOT NULL DEFAULT 'standard',
  base_price numeric NOT NULL DEFAULT 0,
  price_per_km numeric NOT NULL DEFAULT 0,
  price_per_minute numeric NOT NULL DEFAULT 0,
  surge_multiplier numeric NOT NULL DEFAULT 1.0,
  minimum_fare numeric NOT NULL DEFAULT 0,
  maximum_fare numeric,
  time_based_pricing jsonb DEFAULT '[]'::jsonb,
  special_pricing jsonb DEFAULT '{}'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  valid_from timestamp with time zone NOT NULL DEFAULT now(),
  valid_until timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid,
  updated_by uuid
);

-- Créer la table d'assignation des chauffeurs par zone
CREATE TABLE IF NOT EXISTS public.driver_zone_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id uuid NOT NULL,
  zone_id uuid NOT NULL REFERENCES public.service_zones(id) ON DELETE CASCADE,
  assignment_type text NOT NULL DEFAULT 'preferred', -- preferred, exclusive, restricted
  priority_level integer DEFAULT 1,
  max_concurrent_requests integer DEFAULT 3,
  is_active boolean NOT NULL DEFAULT true,
  assigned_at timestamp with time zone NOT NULL DEFAULT now(),
  assigned_by uuid,
  expires_at timestamp with time zone,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Créer la table des statistiques par zone
CREATE TABLE IF NOT EXISTS public.zone_statistics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_id uuid NOT NULL REFERENCES public.service_zones(id) ON DELETE CASCADE,
  date date NOT NULL DEFAULT CURRENT_DATE,
  hour_of_day integer, -- NULL pour statistiques journalières
  total_rides integer DEFAULT 0,
  total_deliveries integer DEFAULT 0,
  total_revenue numeric DEFAULT 0,
  average_wait_time numeric DEFAULT 0,
  average_trip_duration numeric DEFAULT 0,
  active_drivers integer DEFAULT 0,
  available_drivers integer DEFAULT 0,
  peak_demand_multiplier numeric DEFAULT 1.0,
  customer_satisfaction_avg numeric DEFAULT 0,
  customer_satisfaction_count integer DEFAULT 0,
  cancellation_rate numeric DEFAULT 0,
  completion_rate numeric DEFAULT 0,
  metadata jsonb DEFAULT '{}'::jsonb,
  calculated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(zone_id, date, hour_of_day)
);

-- Créer index pour les requêtes de performance
CREATE INDEX IF NOT EXISTS idx_zone_pricing_rules_zone_vehicle ON public.zone_pricing_rules(zone_id, vehicle_class) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_driver_zone_assignments_driver ON public.driver_zone_assignments(driver_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_driver_zone_assignments_zone ON public.driver_zone_assignments(zone_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_zone_statistics_zone_date ON public.zone_statistics(zone_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_zone_statistics_zone_datetime ON public.zone_statistics(zone_id, date, hour_of_day);

-- Activer RLS sur les nouvelles tables
ALTER TABLE public.zone_pricing_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_zone_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zone_statistics ENABLE ROW LEVEL SECURITY;

-- Créer les politiques RLS pour zone_pricing_rules
CREATE POLICY "Admins can manage zone pricing rules"
ON public.zone_pricing_rules
FOR ALL
TO authenticated
USING (has_permission(auth.uid(), 'zones_admin'::permission));

CREATE POLICY "Everyone can view active pricing rules"
ON public.zone_pricing_rules
FOR SELECT
TO authenticated
USING (is_active = true AND (valid_until IS NULL OR valid_until > now()));

-- Créer les politiques RLS pour driver_zone_assignments
CREATE POLICY "Drivers can view their zone assignments"
ON public.driver_zone_assignments
FOR SELECT
TO authenticated
USING (auth.uid() = driver_id);

CREATE POLICY "Admins can manage driver zone assignments"
ON public.driver_zone_assignments
FOR ALL
TO authenticated
USING (has_permission(auth.uid(), 'zones_admin'::permission) OR has_permission(auth.uid(), 'drivers_admin'::permission));

-- Créer les politiques RLS pour zone_statistics
CREATE POLICY "Admins can view zone statistics"
ON public.zone_statistics
FOR SELECT
TO authenticated
USING (has_permission(auth.uid(), 'zones_read'::permission) OR has_permission(auth.uid(), 'zones_admin'::permission));

CREATE POLICY "System can manage zone statistics"
ON public.zone_statistics
FOR ALL
TO authenticated
USING (true); -- Permettre aux fonctions système de gérer les stats

-- Fonction pour calculer les statistiques automatiquement
CREATE OR REPLACE FUNCTION public.calculate_zone_statistics(zone_id_param uuid, date_param date DEFAULT CURRENT_DATE, hour_param integer DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  ride_stats RECORD;
  delivery_stats RECORD;
  driver_stats RECORD;
BEGIN
  -- Calculer les statistiques de transport
  SELECT 
    COUNT(*) as total_rides,
    COALESCE(SUM(actual_price), 0) as total_revenue,
    COALESCE(AVG(EXTRACT(EPOCH FROM (pickup_time - created_at))/60), 0) as avg_wait_time,
    COALESCE(AVG(EXTRACT(EPOCH FROM (completed_at - pickup_time))/60), 0) as avg_duration,
    COALESCE(AVG(customer_rating), 0) as avg_satisfaction,
    COUNT(customer_rating) as satisfaction_count,
    ROUND(COUNT(*) FILTER (WHERE status = 'cancelled')::numeric / GREATEST(COUNT(*), 1) * 100, 2) as cancellation_rate,
    ROUND(COUNT(*) FILTER (WHERE status = 'completed')::numeric / GREATEST(COUNT(*), 1) * 100, 2) as completion_rate
  INTO ride_stats
  FROM public.transport_bookings
  WHERE pickup_zone_id = zone_id_param
    AND DATE(created_at) = date_param
    AND (hour_param IS NULL OR EXTRACT(hour FROM created_at) = hour_param);

  -- Calculer les statistiques de livraison
  SELECT 
    COUNT(*) as total_deliveries,
    COALESCE(SUM(actual_price), 0) as delivery_revenue
  INTO delivery_stats
  FROM public.delivery_orders
  WHERE pickup_coordinates->>'zone_id' = zone_id_param::text
    AND DATE(created_at) = date_param
    AND (hour_param IS NULL OR EXTRACT(hour FROM created_at) = hour_param);

  -- Calculer les statistiques de chauffeurs
  SELECT 
    COUNT(DISTINCT dl.driver_id) FILTER (WHERE dl.is_online = true AND dl.last_ping > now() - interval '10 minutes') as active_drivers,
    COUNT(DISTINCT dl.driver_id) FILTER (WHERE dl.is_online = true AND dl.is_available = true AND dl.last_ping > now() - interval '10 minutes') as available_drivers
  INTO driver_stats
  FROM public.driver_locations dl
  JOIN public.driver_zone_assignments dza ON dl.driver_id = dza.driver_id
  WHERE dza.zone_id = zone_id_param
    AND dza.is_active = true;

  -- Insérer ou mettre à jour les statistiques
  INSERT INTO public.zone_statistics (
    zone_id, date, hour_of_day,
    total_rides, total_deliveries, total_revenue,
    average_wait_time, average_trip_duration,
    active_drivers, available_drivers,
    customer_satisfaction_avg, customer_satisfaction_count,
    cancellation_rate, completion_rate
  ) VALUES (
    zone_id_param, date_param, hour_param,
    COALESCE(ride_stats.total_rides, 0),
    COALESCE(delivery_stats.total_deliveries, 0),
    COALESCE(ride_stats.total_revenue, 0) + COALESCE(delivery_stats.delivery_revenue, 0),
    COALESCE(ride_stats.avg_wait_time, 0),
    COALESCE(ride_stats.avg_duration, 0),
    COALESCE(driver_stats.active_drivers, 0),
    COALESCE(driver_stats.available_drivers, 0),
    COALESCE(ride_stats.avg_satisfaction, 0),
    COALESCE(ride_stats.satisfaction_count, 0),
    COALESCE(ride_stats.cancellation_rate, 0),
    COALESCE(ride_stats.completion_rate, 0)
  )
  ON CONFLICT (zone_id, date, hour_of_day)
  DO UPDATE SET
    total_rides = EXCLUDED.total_rides,
    total_deliveries = EXCLUDED.total_deliveries,
    total_revenue = EXCLUDED.total_revenue,
    average_wait_time = EXCLUDED.average_wait_time,
    average_trip_duration = EXCLUDED.average_trip_duration,
    active_drivers = EXCLUDED.active_drivers,
    available_drivers = EXCLUDED.available_drivers,
    customer_satisfaction_avg = EXCLUDED.customer_satisfaction_avg,
    customer_satisfaction_count = EXCLUDED.customer_satisfaction_count,
    cancellation_rate = EXCLUDED.cancellation_rate,
    completion_rate = EXCLUDED.completion_rate,
    calculated_at = now();
END;
$function$;

-- Fonction pour obtenir la tarification d'une zone
CREATE OR REPLACE FUNCTION public.get_zone_pricing(zone_id_param uuid, vehicle_class_param text DEFAULT 'standard', datetime_param timestamp with time zone DEFAULT now())
RETURNS TABLE(
  base_price numeric,
  price_per_km numeric,
  price_per_minute numeric,
  surge_multiplier numeric,
  minimum_fare numeric,
  maximum_fare numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  pricing_rule RECORD;
  time_multiplier numeric := 1.0;
  current_hour integer;
BEGIN
  current_hour := EXTRACT(hour FROM datetime_param);
  
  -- Récupérer la règle de tarification active
  SELECT * INTO pricing_rule
  FROM public.zone_pricing_rules
  WHERE zone_id = zone_id_param
    AND vehicle_class = vehicle_class_param
    AND is_active = true
    AND valid_from <= datetime_param
    AND (valid_until IS NULL OR valid_until > datetime_param)
  ORDER BY valid_from DESC
  LIMIT 1;
  
  IF pricing_rule IS NULL THEN
    -- Utiliser la tarification par défaut
    RETURN QUERY SELECT 2000::numeric, 300::numeric, 50::numeric, 1.0::numeric, 1000::numeric, NULL::numeric;
    RETURN;
  END IF;
  
  -- Appliquer la tarification selon l'heure si configurée
  IF pricing_rule.time_based_pricing IS NOT NULL AND jsonb_array_length(pricing_rule.time_based_pricing) > 0 THEN
    SELECT COALESCE((rule->>'multiplier')::numeric, 1.0) INTO time_multiplier
    FROM jsonb_array_elements(pricing_rule.time_based_pricing) as rule
    WHERE (rule->>'start_hour')::integer <= current_hour
      AND (rule->>'end_hour')::integer > current_hour
    LIMIT 1;
  END IF;
  
  RETURN QUERY SELECT 
    pricing_rule.base_price * time_multiplier,
    pricing_rule.price_per_km * time_multiplier,
    pricing_rule.price_per_minute * time_multiplier,
    pricing_rule.surge_multiplier,
    pricing_rule.minimum_fare,
    pricing_rule.maximum_fare;
END;
$function$;

-- Créer des triggers pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_zone_pricing_rules_updated_at
  BEFORE UPDATE ON public.zone_pricing_rules
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

CREATE TRIGGER update_driver_zone_assignments_updated_at
  BEFORE UPDATE ON public.driver_zone_assignments
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();