-- Créer des triggers automatiques pour le dispatch des commandes
-- Trigger pour transport_bookings
CREATE OR REPLACE FUNCTION public.auto_dispatch_transport_booking()
RETURNS TRIGGER AS $$
BEGIN
  -- Vérifier si la commande est nouvelle et en attente
  IF NEW.status = 'pending' AND NEW.driver_id IS NULL THEN
    -- Déclencher le dispatcher intelligent après un petit délai
    PERFORM pg_notify('transport_dispatch', json_build_object(
      'booking_id', NEW.id,
      'pickup_lat', (NEW.pickup_coordinates->>'lat')::numeric,
      'pickup_lng', (NEW.pickup_coordinates->>'lng')::numeric,
      'city', COALESCE(NEW.city, 'Kinshasa'),
      'service_type', COALESCE(NEW.service_type, 'taxi'),
      'priority', CASE 
        WHEN NEW.is_urgent = true THEN 'urgent'
        WHEN NEW.estimated_price > 10000 THEN 'high'
        ELSE 'normal'
      END
    )::text);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour delivery_orders
CREATE OR REPLACE FUNCTION public.auto_dispatch_delivery_order()
RETURNS TRIGGER AS $$
BEGIN
  -- Vérifier si la commande est nouvelle et en attente
  IF NEW.status = 'pending' AND NEW.driver_id IS NULL THEN
    -- Déclencher le dispatcher de livraison
    PERFORM pg_notify('delivery_dispatch', json_build_object(
      'order_id', NEW.id,
      'pickup_lat', (NEW.pickup_coordinates->>'lat')::numeric,
      'pickup_lng', (NEW.pickup_coordinates->>'lng')::numeric,
      'delivery_type', NEW.delivery_type,
      'priority', CASE 
        WHEN NEW.delivery_type = 'flash' THEN 'urgent'
        WHEN NEW.package_weight > 20 THEN 'high'
        ELSE 'normal'
      END
    )::text);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Créer les triggers
DROP TRIGGER IF EXISTS trigger_auto_dispatch_transport ON public.transport_bookings;
CREATE TRIGGER trigger_auto_dispatch_transport
  AFTER INSERT ON public.transport_bookings
  FOR EACH ROW EXECUTE FUNCTION public.auto_dispatch_transport_booking();

DROP TRIGGER IF EXISTS trigger_auto_dispatch_delivery ON public.delivery_orders;
CREATE TRIGGER trigger_auto_dispatch_delivery
  AFTER INSERT ON public.delivery_orders
  FOR EACH ROW EXECUTE FUNCTION public.auto_dispatch_delivery_order();