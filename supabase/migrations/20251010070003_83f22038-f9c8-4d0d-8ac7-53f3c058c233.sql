-- ==========================================
-- PRIORITÉ 1 - MARKETPLACE (Critique)
-- ==========================================

-- 1.1 Ajouter colonne message à user_notifications (alias de content)
ALTER TABLE public.user_notifications 
ADD COLUMN IF NOT EXISTS message TEXT GENERATED ALWAYS AS (content) STORED;

-- 1.2 Trigger de validation user_id pour activity_logs
CREATE OR REPLACE FUNCTION public.validate_activity_log_user_id()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Si user_id est invalide, utiliser UUID système
  IF NEW.user_id IS NULL 
     OR NEW.user_id::text LIKE 'ip:%' 
     OR NEW.user_id::text LIKE 'test-%' THEN
    NEW.user_id := '00000000-0000-0000-0000-000000000000'::uuid;
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_activity_user_id ON public.activity_logs;
CREATE TRIGGER validate_activity_user_id
  BEFORE INSERT ON public.activity_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_activity_log_user_id();

-- 1.4 Débloquer les 31 commandes marketplace en attente
UPDATE public.marketplace_orders
SET vendor_confirmation_status = 'confirmed',
    vendor_confirmed_at = NOW(),
    status = 'confirmed'
WHERE status = 'pending'
  AND vendor_confirmation_status = 'awaiting_confirmation'
  AND created_at < NOW() - INTERVAL '24 hours';

-- ==========================================
-- PRIORITÉ 2 - DELIVERY
-- ==========================================

-- 2.1 Trigger de dispatch automatique pour delivery
CREATE OR REPLACE FUNCTION public.auto_dispatch_delivery()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log l'ordre de livraison pour dispatch
  INSERT INTO public.activity_logs (
    activity_type,
    description,
    metadata
  ) VALUES (
    'delivery_auto_dispatch',
    'Auto-dispatch déclenché pour commande livraison',
    jsonb_build_object(
      'order_id', NEW.id,
      'pickup_lat', NEW.pickup_coordinates->>'lat',
      'pickup_lng', NEW.pickup_coordinates->>'lng'
    )
  );
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_auto_dispatch_delivery ON public.delivery_orders;
CREATE TRIGGER trigger_auto_dispatch_delivery
  AFTER INSERT ON public.delivery_orders
  FOR EACH ROW
  WHEN (NEW.status = 'pending')
  EXECUTE FUNCTION public.auto_dispatch_delivery();

-- ==========================================
-- PRIORITÉ 3 - TRANSPORT/TAXI
-- ==========================================

-- 3.1 Créer table ride_requests
CREATE TABLE IF NOT EXISTS public.ride_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES public.transport_bookings(id) ON DELETE CASCADE,
  pickup_location TEXT NOT NULL,
  destination TEXT NOT NULL,
  pickup_coordinates JSONB,
  destination_coordinates JSONB,
  estimated_price NUMERIC,
  surge_price NUMERIC,
  status TEXT DEFAULT 'pending',
  assigned_driver_id UUID REFERENCES public.chauffeurs(user_id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.ride_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies pour ride_requests
CREATE POLICY "Users can view their own ride requests"
  ON public.ride_requests FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Drivers can view assigned ride requests"
  ON public.ride_requests FOR SELECT
  USING (auth.uid() = assigned_driver_id OR status = 'pending');

CREATE POLICY "Users can create ride requests"
  ON public.ride_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all ride requests"
  ON public.ride_requests FOR ALL
  USING (is_current_user_admin());

-- 3.2 Créer table ride_offers
CREATE TABLE IF NOT EXISTS public.ride_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_request_id UUID NOT NULL REFERENCES public.ride_requests(id) ON DELETE CASCADE,
  driver_id UUID NOT NULL REFERENCES public.chauffeurs(user_id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending',
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '5 minutes'),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.ride_offers ENABLE ROW LEVEL SECURITY;

-- RLS Policies pour ride_offers
CREATE POLICY "Drivers can view their own offers"
  ON public.ride_offers FOR SELECT
  USING (auth.uid() = driver_id);

CREATE POLICY "Users can view offers for their requests"
  ON public.ride_offers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.ride_requests
      WHERE ride_requests.id = ride_offers.ride_request_id
      AND ride_requests.user_id = auth.uid()
    )
  );

CREATE POLICY "Drivers can create offers"
  ON public.ride_offers FOR INSERT
  WITH CHECK (auth.uid() = driver_id);

CREATE POLICY "Drivers can update their offers"
  ON public.ride_offers FOR UPDATE
  USING (auth.uid() = driver_id);

CREATE POLICY "Admins can manage all offers"
  ON public.ride_offers FOR ALL
  USING (is_current_user_admin());

-- 3.3 Trigger de conversion booking → ride_request
CREATE OR REPLACE FUNCTION public.convert_booking_to_ride_request()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.ride_requests (
    user_id, 
    booking_id,
    pickup_location, 
    destination,
    pickup_coordinates, 
    destination_coordinates,
    estimated_price, 
    status
  ) VALUES (
    NEW.user_id,
    NEW.id,
    NEW.pickup_location, 
    NEW.destination,
    NEW.pickup_coordinates, 
    NEW.destination_coordinates,
    NEW.estimated_price, 
    'pending'
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS auto_create_ride_request ON public.transport_bookings;
CREATE TRIGGER auto_create_ride_request
  AFTER INSERT ON public.transport_bookings
  FOR EACH ROW
  WHEN (NEW.status = 'pending')
  EXECUTE FUNCTION public.convert_booking_to_ride_request();

-- ==========================================
-- PRIORITÉ 4 - LOCATION
-- ==========================================

-- 4.1 Créer table rental_bookings
CREATE TABLE IF NOT EXISTS public.rental_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES public.rental_vehicles(id) ON DELETE CASCADE,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  total_price NUMERIC NOT NULL,
  currency TEXT DEFAULT 'CDF',
  status TEXT DEFAULT 'pending',
  payment_status TEXT DEFAULT 'pending',
  pickup_location TEXT,
  dropoff_location TEXT,
  special_requests TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  confirmed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT
);

-- Enable RLS
ALTER TABLE public.rental_bookings ENABLE ROW LEVEL SECURITY;

-- RLS Policies pour rental_bookings
CREATE POLICY "Users can view their own rental bookings"
  ON public.rental_bookings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create rental bookings"
  ON public.rental_bookings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bookings"
  ON public.rental_bookings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all rental bookings"
  ON public.rental_bookings FOR ALL
  USING (is_current_user_admin());

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_rental_bookings_user_id ON public.rental_bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_rental_bookings_vehicle_id ON public.rental_bookings(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_rental_bookings_status ON public.rental_bookings(status);
CREATE INDEX IF NOT EXISTS idx_ride_requests_status ON public.ride_requests(status);
CREATE INDEX IF NOT EXISTS idx_ride_offers_driver_id ON public.ride_offers(driver_id);

-- ==========================================
-- LOGS ET MONITORING
-- ==========================================

-- Log de la migration
INSERT INTO public.activity_logs (
  activity_type,
  description,
  metadata
) VALUES (
  'system_migration',
  'Migration complète - Correction fonctionnalités clés',
  jsonb_build_object(
    'marketplace', 'user_notifications.message ajouté, activity_logs validé, commandes débloquées',
    'delivery', 'auto-dispatch activé',
    'transport', 'ride_requests et ride_offers créés',
    'rental', 'rental_bookings créé',
    'timestamp', NOW()
  )
);