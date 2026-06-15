-- Phase 4 complète: Migration Google Maps pour toutes les tables de géolocalisation

-- Ajouter colonnes Google Maps à transport_bookings
ALTER TABLE public.transport_bookings 
ADD COLUMN IF NOT EXISTS pickup_google_address TEXT,
ADD COLUMN IF NOT EXISTS pickup_google_place_name TEXT,
ADD COLUMN IF NOT EXISTS pickup_google_place_id TEXT,
ADD COLUMN IF NOT EXISTS delivery_google_address TEXT,
ADD COLUMN IF NOT EXISTS delivery_google_place_name TEXT,
ADD COLUMN IF NOT EXISTS delivery_google_place_id TEXT,
ADD COLUMN IF NOT EXISTS google_geocoded_at TIMESTAMP WITH TIME ZONE;

-- Ajouter colonnes Google Maps à delivery_orders
ALTER TABLE public.delivery_orders 
ADD COLUMN IF NOT EXISTS pickup_google_address TEXT,
ADD COLUMN IF NOT EXISTS pickup_google_place_name TEXT,
ADD COLUMN IF NOT EXISTS pickup_google_place_id TEXT,
ADD COLUMN IF NOT EXISTS delivery_google_address TEXT,
ADD COLUMN IF NOT EXISTS delivery_google_place_name TEXT,
ADD COLUMN IF NOT EXISTS delivery_google_place_id TEXT,
ADD COLUMN IF NOT EXISTS google_geocoded_at TIMESTAMP WITH TIME ZONE;

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_transport_bookings_pickup_google_address 
ON public.transport_bookings (pickup_google_address);

CREATE INDEX IF NOT EXISTS idx_transport_bookings_delivery_google_address 
ON public.transport_bookings (delivery_google_address);

CREATE INDEX IF NOT EXISTS idx_delivery_orders_pickup_google_address 
ON public.delivery_orders (pickup_google_address);

CREATE INDEX IF NOT EXISTS idx_delivery_orders_delivery_google_address 
ON public.delivery_orders (delivery_google_address);

-- Fonction pour migration batch des coordonnées existantes
CREATE OR REPLACE FUNCTION public.migrate_coordinates_to_google_addresses()
RETURNS TABLE(processed_drivers INTEGER, processed_bookings INTEGER, processed_deliveries INTEGER) AS $$
DECLARE
  driver_count INTEGER := 0;
  booking_count INTEGER := 0;
  delivery_count INTEGER := 0;
BEGIN
  -- Compter les enregistrements à traiter
  SELECT COUNT(*) INTO driver_count
  FROM public.driver_locations 
  WHERE google_address IS NULL AND latitude IS NOT NULL AND longitude IS NOT NULL;
  
  SELECT COUNT(*) INTO booking_count
  FROM public.transport_bookings 
  WHERE pickup_google_address IS NULL AND pickup_coordinates IS NOT NULL;
  
  SELECT COUNT(*) INTO delivery_count
  FROM public.delivery_orders 
  WHERE pickup_google_address IS NULL AND pickup_coordinates IS NOT NULL;
  
  -- Note: La migration réelle des données sera faite via Edge Function
  -- pour éviter les timeouts et utiliser l'API Google Maps
  
  RETURN QUERY SELECT driver_count, booking_count, delivery_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Fonction pour valider les adresses Google Maps
CREATE OR REPLACE FUNCTION public.validate_google_address(address_text TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  -- Validation basique des adresses Google Maps
  RETURN address_text IS NOT NULL 
    AND LENGTH(TRIM(address_text)) > 10
    AND address_text NOT LIKE '%undefined%'
    AND address_text NOT LIKE '%null%';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger pour mettre à jour automatiquement google_geocoded_at sur transport_bookings
CREATE OR REPLACE FUNCTION public.update_transport_booking_geocoded_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.pickup_google_address IS DISTINCT FROM OLD.pickup_google_address 
     OR NEW.delivery_google_address IS DISTINCT FROM OLD.delivery_google_address THEN
    NEW.google_geocoded_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_update_transport_booking_geocoded_timestamp
    BEFORE UPDATE ON public.transport_bookings
    FOR EACH ROW
    EXECUTE FUNCTION public.update_transport_booking_geocoded_timestamp();

-- Trigger pour delivery_orders
CREATE OR REPLACE FUNCTION public.update_delivery_order_geocoded_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.pickup_google_address IS DISTINCT FROM OLD.pickup_google_address 
     OR NEW.delivery_google_address IS DISTINCT FROM OLD.delivery_google_address THEN
    NEW.google_geocoded_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_update_delivery_order_geocoded_timestamp
    BEFORE UPDATE ON public.delivery_orders
    FOR EACH ROW
    EXECUTE FUNCTION public.update_delivery_order_geocoded_timestamp();

-- Commentaires pour documentation
COMMENT ON COLUMN public.transport_bookings.pickup_google_address IS 'Adresse Google Maps réelle du point de ramassage';
COMMENT ON COLUMN public.transport_bookings.delivery_google_address IS 'Adresse Google Maps réelle de la destination';
COMMENT ON COLUMN public.delivery_orders.pickup_google_address IS 'Adresse Google Maps réelle du point de ramassage';
COMMENT ON COLUMN public.delivery_orders.delivery_google_address IS 'Adresse Google Maps réelle de livraison';