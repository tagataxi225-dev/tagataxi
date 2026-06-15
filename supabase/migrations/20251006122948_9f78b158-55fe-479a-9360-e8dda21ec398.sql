-- ========================================
-- VUES MATÉRIALISÉES POUR OPTIMISER LES STATS ADMIN
-- ========================================

-- Vue pour les statistiques de location de véhicules
CREATE MATERIALIZED VIEW IF NOT EXISTS public.mv_admin_rental_vehicle_stats AS
SELECT 
  COUNT(*) FILTER (WHERE moderation_status = 'pending') as pending_moderation,
  COUNT(*) FILTER (WHERE moderation_status = 'approved') as approved_vehicles,
  COUNT(*) FILTER (WHERE is_active = true AND moderation_status = 'approved') as active_vehicles,
  COUNT(*) as total_vehicles,
  now() as last_updated
FROM public.partner_rental_vehicles;

-- Index pour améliorer les performances
CREATE UNIQUE INDEX IF NOT EXISTS mv_admin_rental_vehicle_stats_idx ON public.mv_admin_rental_vehicle_stats (last_updated);

-- Vue pour les statistiques de réservations
CREATE MATERIALIZED VIEW IF NOT EXISTS public.mv_admin_rental_booking_stats AS
SELECT 
  COUNT(*) as total_bookings,
  COUNT(*) FILTER (WHERE status = 'completed') as completed_bookings,
  COUNT(*) FILTER (WHERE status IN ('pending', 'confirmed')) as pending_bookings,
  COALESCE(SUM(total_price) FILTER (WHERE status = 'completed'), 0) as total_revenue,
  now() as last_updated
FROM public.partner_rental_bookings;

CREATE UNIQUE INDEX IF NOT EXISTS mv_admin_rental_booking_stats_idx ON public.mv_admin_rental_booking_stats (last_updated);

-- Vue pour les abonnements actifs
CREATE MATERIALIZED VIEW IF NOT EXISTS public.mv_admin_rental_subscription_stats AS
SELECT 
  COUNT(*) FILTER (WHERE status = 'active') as active_subscriptions,
  now() as last_updated
FROM public.partner_rental_subscriptions;

CREATE UNIQUE INDEX IF NOT EXISTS mv_admin_rental_subscription_stats_idx ON public.mv_admin_rental_subscription_stats (last_updated);

-- Fonction pour rafraîchir toutes les vues matérialisées
CREATE OR REPLACE FUNCTION public.refresh_admin_rental_stats()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_admin_rental_vehicle_stats;
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_admin_rental_booking_stats;
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_admin_rental_subscription_stats;
END;
$$;

-- Trigger pour rafraîchir automatiquement après modifications
CREATE OR REPLACE FUNCTION public.trigger_refresh_rental_stats()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Rafraîchir de manière asynchrone (non bloquant)
  PERFORM pg_notify('refresh_rental_stats', '');
  RETURN NEW;
END;
$$;

-- Attacher les triggers aux tables concernées
DROP TRIGGER IF EXISTS refresh_stats_on_vehicle_change ON public.partner_rental_vehicles;
CREATE TRIGGER refresh_stats_on_vehicle_change
  AFTER INSERT OR UPDATE OR DELETE ON public.partner_rental_vehicles
  FOR EACH STATEMENT
  EXECUTE FUNCTION public.trigger_refresh_rental_stats();

DROP TRIGGER IF EXISTS refresh_stats_on_booking_change ON public.partner_rental_bookings;
CREATE TRIGGER refresh_stats_on_booking_change
  AFTER INSERT OR UPDATE OR DELETE ON public.partner_rental_bookings
  FOR EACH STATEMENT
  EXECUTE FUNCTION public.trigger_refresh_rental_stats();

DROP TRIGGER IF EXISTS refresh_stats_on_subscription_change ON public.partner_rental_subscriptions;
CREATE TRIGGER refresh_stats_on_subscription_change
  AFTER INSERT OR UPDATE OR DELETE ON public.partner_rental_subscriptions
  FOR EACH STATEMENT
  EXECUTE FUNCTION public.trigger_refresh_rental_stats();

-- Rafraîchir immédiatement les vues
SELECT public.refresh_admin_rental_stats();