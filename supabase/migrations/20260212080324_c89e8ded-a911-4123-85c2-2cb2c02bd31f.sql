
-- 1. Supprimer le trigger cassé qui référence une colonne inexistante
DROP TRIGGER IF EXISTS auto_create_ride_request ON transport_bookings;

-- 2. Supprimer la fonction associée
DROP FUNCTION IF EXISTS convert_booking_to_ride_request();

-- 3. Supprimer le trigger dispatch en double
DROP TRIGGER IF EXISTS trigger_auto_dispatch_transport ON transport_bookings;
