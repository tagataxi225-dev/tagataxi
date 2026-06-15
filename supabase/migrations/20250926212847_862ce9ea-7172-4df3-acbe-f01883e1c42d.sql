-- Corriger le trigger auto_dispatch_transport_booking qui référence des colonnes inexistantes
DROP TRIGGER IF EXISTS auto_dispatch_transport_booking ON public.transport_bookings;

-- Recréer le trigger avec les bonnes références
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
      'delivery_coordinates', NEW.delivery_coordinates,
      'vehicle_type', COALESCE(NEW.vehicle_type, 'standard'),
      'service_type', 'taxi', -- Valeur fixe au lieu de NEW.service_type
      'priority', CASE 
        WHEN NEW.estimated_price > 15000 THEN 'urgent'
        WHEN NEW.estimated_price > 10000 THEN 'high'
        ELSE 'normal'
      END, -- Logique au lieu de NEW.is_urgent
      'estimated_price', NEW.estimated_price,
      'city', COALESCE(NEW.city, 'Kinshasa'),
      'created_at', NEW.created_at
    )::text);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;