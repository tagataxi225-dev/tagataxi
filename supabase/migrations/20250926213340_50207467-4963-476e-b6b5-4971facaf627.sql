-- Corriger le trigger auto_dispatch_transport_booking pour utiliser destination_coordinates
DROP TRIGGER IF EXISTS auto_dispatch_transport_booking ON public.transport_bookings;

-- Recréer le trigger avec la bonne référence de colonne
CREATE OR REPLACE FUNCTION public.auto_dispatch_transport_booking()
RETURNS TRIGGER AS $$
BEGIN
  -- Seulement pour les nouvelles réservations avec status 'pending'
  IF NEW.status = 'pending' AND OLD IS NULL THEN
    -- Appeler la fonction de dispatching automatique
    PERFORM pg_notify('dispatch_request', jsonb_build_object(
      'booking_id', NEW.id,
      'user_id', NEW.user_id,
      'pickup_coordinates', NEW.pickup_coordinates,
      'destination_coordinates', NEW.destination_coordinates, -- Corrigé: utilise destination_coordinates
      'vehicle_type', COALESCE(NEW.vehicle_type, 'standard'),
      'service_type', 'taxi',
      'priority', CASE 
        WHEN NEW.estimated_price > 15000 THEN 'urgent'
        WHEN NEW.estimated_price > 10000 THEN 'high'
        ELSE 'normal'
      END,
      'estimated_price', NEW.estimated_price,
      'city', COALESCE(NEW.city, 'Kinshasa'),
      'created_at', NEW.created_at
    )::text);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Recréer le trigger
CREATE TRIGGER auto_dispatch_transport_booking
  AFTER INSERT ON public.transport_bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_dispatch_transport_booking();