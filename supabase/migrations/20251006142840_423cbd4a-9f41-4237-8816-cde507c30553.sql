-- ========================================
-- RAFRAÎCHIR LE CACHE ADMIN
-- ========================================
REFRESH MATERIALIZED VIEW CONCURRENTLY public.admin_users_cache;

-- ========================================
-- VÉRIFIER ET CORRIGER LES FONCTIONS AVEC DES COLONNES INVALIDES
-- ========================================

-- 1️⃣ Recréer calculate_zone_statistics sans completed_at
CREATE OR REPLACE FUNCTION public.calculate_zone_statistics(
  zone_id_param uuid, 
  date_param date DEFAULT CURRENT_DATE, 
  hour_param integer DEFAULT NULL::integer
)
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
  -- Calculer les statistiques de transport (CORRIGÉ: sans completed_at)
  SELECT 
    COUNT(*) as total_rides,
    COALESCE(SUM(actual_price), 0) as total_revenue,
    COALESCE(AVG(EXTRACT(EPOCH FROM (pickup_time - created_at))/60), 0) as avg_wait_time,
    COALESCE(AVG(EXTRACT(EPOCH FROM (delivery_time - pickup_time))/60), 0) as avg_duration,
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