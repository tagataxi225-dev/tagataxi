-- Corriger les fonctions avec search_path sécurisé
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';