-- ==========================================
-- PHASE 3 : VUE MATÉRIALISÉE COMMANDES ACTIVES
-- ==========================================

-- Vue matérialisée pour les commandes actives des chauffeurs
-- Unifie transport_bookings et delivery_orders
CREATE MATERIALIZED VIEW IF NOT EXISTS active_driver_orders AS
SELECT 
  t.driver_id,
  'taxi' as order_type,
  t.id as order_id,
  t.status,
  t.pickup_location,
  t.destination as delivery_location,
  t.pickup_coordinates,
  t.destination_coordinates as delivery_coordinates,
  t.estimated_price,
  t.created_at,
  t.updated_at,
  t.pickup_time,
  t.user_id,
  t.city,
  NULL::text as package_type,
  NULL::text as delivery_type
FROM transport_bookings t
WHERE 
  t.driver_id IS NOT NULL 
  AND t.status IN ('accepted', 'driver_arrived', 'in_progress', 'confirmed', 'dispatching')

UNION ALL

SELECT
  d.driver_id,
  'delivery' as order_type,
  d.id as order_id,
  d.status,
  d.pickup_location,
  d.delivery_location,
  d.pickup_coordinates,
  d.delivery_coordinates,
  d.estimated_price,
  d.created_at,
  d.updated_at,
  d.pickup_time,
  d.user_id,
  d.city,
  d.package_type,
  d.delivery_type
FROM delivery_orders d
WHERE 
  d.driver_id IS NOT NULL 
  AND d.status IN ('confirmed', 'driver_assigned', 'picked_up', 'in_transit');

-- Index pour optimiser les requêtes
CREATE UNIQUE INDEX IF NOT EXISTS idx_active_driver_orders_unique 
ON active_driver_orders (order_type, order_id);

CREATE INDEX IF NOT EXISTS idx_active_driver_orders_driver 
ON active_driver_orders (driver_id);

CREATE INDEX IF NOT EXISTS idx_active_driver_orders_status 
ON active_driver_orders (status);

-- Fonction pour rafraîchir la vue automatiquement
CREATE OR REPLACE FUNCTION refresh_active_driver_orders()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY active_driver_orders;
END;
$$;

-- Trigger pour rafraîchir la vue quand transport_bookings change
CREATE OR REPLACE FUNCTION trigger_refresh_active_orders_transport()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM refresh_active_driver_orders();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS refresh_on_transport_booking_change ON transport_bookings;
CREATE TRIGGER refresh_on_transport_booking_change
AFTER INSERT OR UPDATE OR DELETE ON transport_bookings
FOR EACH STATEMENT
EXECUTE FUNCTION trigger_refresh_active_orders_transport();

-- Trigger pour rafraîchir la vue quand delivery_orders change
CREATE OR REPLACE FUNCTION trigger_refresh_active_orders_delivery()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM refresh_active_driver_orders();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS refresh_on_delivery_order_change ON delivery_orders;
CREATE TRIGGER refresh_on_delivery_order_change
AFTER INSERT OR UPDATE OR DELETE ON delivery_orders
FOR EACH STATEMENT
EXECUTE FUNCTION trigger_refresh_active_orders_delivery();

-- RLS pour la vue matérialisée
ALTER MATERIALIZED VIEW active_driver_orders OWNER TO postgres;

-- Permettre la lecture pour les chauffeurs authentifiés
GRANT SELECT ON active_driver_orders TO authenticated;

-- Rafraîchissement initial
REFRESH MATERIALIZED VIEW active_driver_orders;