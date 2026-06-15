-- ========================================
-- PHASE 1 : Migration Base de Données GPS
-- Ajouter colonnes Google Maps enrichies et fonction de validation
-- ========================================

-- 1.1 Ajouter colonnes Google Maps à transport_bookings
ALTER TABLE public.transport_bookings 
ADD COLUMN IF NOT EXISTS pickup_google_address TEXT,
ADD COLUMN IF NOT EXISTS pickup_google_place_name TEXT,
ADD COLUMN IF NOT EXISTS pickup_google_place_id TEXT,
ADD COLUMN IF NOT EXISTS destination_google_address TEXT,
ADD COLUMN IF NOT EXISTS destination_google_place_name TEXT,
ADD COLUMN IF NOT EXISTS destination_google_place_id TEXT,
ADD COLUMN IF NOT EXISTS google_geocoded_at TIMESTAMPTZ;

-- 1.2 Ajouter colonnes Google Maps à delivery_orders (si pas déjà présent)
ALTER TABLE public.delivery_orders 
ADD COLUMN IF NOT EXISTS pickup_google_address TEXT,
ADD COLUMN IF NOT EXISTS pickup_google_place_name TEXT,
ADD COLUMN IF NOT EXISTS pickup_google_place_id TEXT,
ADD COLUMN IF NOT EXISTS delivery_google_address TEXT,
ADD COLUMN IF NOT EXISTS delivery_google_place_name TEXT,
ADD COLUMN IF NOT EXISTS delivery_google_place_id TEXT,
ADD COLUMN IF NOT EXISTS google_geocoded_at TIMESTAMPTZ;

-- 2. Créer index de performance pour requêtes géospatiales
CREATE INDEX IF NOT EXISTS idx_transport_bookings_pickup_coords 
ON public.transport_bookings USING GIN (pickup_coordinates jsonb_path_ops);

CREATE INDEX IF NOT EXISTS idx_transport_bookings_destination_coords 
ON public.transport_bookings USING GIN (destination_coordinates jsonb_path_ops);

CREATE INDEX IF NOT EXISTS idx_delivery_orders_pickup_coords 
ON public.delivery_orders USING GIN (pickup_coordinates jsonb_path_ops);

CREATE INDEX IF NOT EXISTS idx_delivery_orders_delivery_coords 
ON public.delivery_orders USING GIN (delivery_coordinates jsonb_path_ops);

-- 3. Fonction de validation coordonnées GPS
CREATE OR REPLACE FUNCTION public.validate_gps_coordinates(coords JSONB)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  lat NUMERIC;
  lng NUMERIC;
BEGIN
  -- Vérifier que coords n'est pas NULL
  IF coords IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Vérifier présence lat/lng
  IF NOT (coords ? 'lat' AND coords ? 'lng') THEN
    RETURN FALSE;
  END IF;
  
  -- Extraire et valider coordonnées
  BEGIN
    lat := (coords->>'lat')::NUMERIC;
    lng := (coords->>'lng')::NUMERIC;
    
    -- Vérifier validité des coordonnées
    IF lat < -90 OR lat > 90 THEN
      RETURN FALSE;
    END IF;
    IF lng < -180 OR lng > 180 THEN
      RETURN FALSE;
    END IF;
    
    RETURN TRUE;
  EXCEPTION WHEN OTHERS THEN
    RETURN FALSE;
  END;
END;
$$;

-- Commentaires pour documentation
COMMENT ON COLUMN public.transport_bookings.pickup_google_address IS 'Adresse formatée Google Maps pour le point de départ';
COMMENT ON COLUMN public.transport_bookings.pickup_google_place_id IS 'Place ID Google Maps pour géocodage précis';
COMMENT ON COLUMN public.transport_bookings.destination_google_address IS 'Adresse formatée Google Maps pour la destination';
COMMENT ON COLUMN public.transport_bookings.destination_google_place_id IS 'Place ID Google Maps pour géocodage précis';
COMMENT ON COLUMN public.transport_bookings.google_geocoded_at IS 'Timestamp du dernier géocodage Google Maps';

COMMENT ON COLUMN public.delivery_orders.pickup_google_address IS 'Adresse formatée Google Maps pour le point de collecte';
COMMENT ON COLUMN public.delivery_orders.pickup_google_place_id IS 'Place ID Google Maps pour géocodage précis';
COMMENT ON COLUMN public.delivery_orders.delivery_google_address IS 'Adresse formatée Google Maps pour la livraison';
COMMENT ON COLUMN public.delivery_orders.delivery_google_place_id IS 'Place ID Google Maps pour géocodage précis';
COMMENT ON COLUMN public.delivery_orders.google_geocoded_at IS 'Timestamp du dernier géocodage Google Maps';

COMMENT ON FUNCTION public.validate_gps_coordinates IS 'Valide la structure et les valeurs des coordonnées GPS au format JSONB {lat, lng}';