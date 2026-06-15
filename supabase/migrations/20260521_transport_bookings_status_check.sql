-- Élargit la contrainte de statut des transport_bookings pour inclure
-- 'bidding', 'driver_assigned', 'accepted', 'driver_arrived', 'pickup'.
ALTER TABLE public.transport_bookings
  DROP CONSTRAINT IF EXISTS transport_bookings_status_check;

ALTER TABLE public.transport_bookings
  ADD CONSTRAINT transport_bookings_status_check
  CHECK (status = ANY (ARRAY[
    'pending',
    'bidding',
    'driver_assigned',
    'accepted',
    'driver_arrived',
    'pickup',
    'in_progress',
    'completed',
    'cancelled'
  ]));
