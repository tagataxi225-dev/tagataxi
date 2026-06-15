-- Phase 1: Ajouter la colonne notes manquante dans transport_bookings
ALTER TABLE public.transport_bookings 
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Phase 2: Nettoyer les vues SECURITY DEFINER problématiques
SELECT cleanup_security_definer_views();

-- Phase 3: Vérifier l'intégrité des données de géolocalisation pour transport_bookings
UPDATE public.transport_bookings 
SET pickup_coordinates = validate_booking_coordinates(pickup_coordinates, NULL)->'pickup'
WHERE pickup_coordinates IS NULL 
   OR (pickup_coordinates->>'lat')::NUMERIC IS NULL 
   OR (pickup_coordinates->>'lng')::NUMERIC IS NULL;

-- Phase 4: Optimiser les index pour les recherches de géolocalisation  
CREATE INDEX IF NOT EXISTS idx_transport_bookings_status_user 
ON public.transport_bookings(status, user_id) 
WHERE status IN ('pending', 'confirmed', 'driver_assigned');

CREATE INDEX IF NOT EXISTS idx_driver_locations_availability 
ON public.driver_locations(is_online, is_available, last_ping) 
WHERE is_online = true AND is_available = true;

-- Phase 5: Corriger les coordonnées invalides dans delivery_orders
UPDATE public.delivery_orders 
SET pickup_coordinates = validate_booking_coordinates(pickup_coordinates, delivery_coordinates)->'pickup',
    delivery_coordinates = validate_booking_coordinates(pickup_coordinates, delivery_coordinates)->'delivery'
WHERE pickup_coordinates IS NULL 
   OR (pickup_coordinates->>'lat')::NUMERIC IS NULL 
   OR (pickup_coordinates->>'lng')::NUMERIC IS NULL
   OR delivery_coordinates IS NULL 
   OR (delivery_coordinates->>'lat')::NUMERIC IS NULL 
   OR (delivery_coordinates->>'lng')::NUMERIC IS NULL;