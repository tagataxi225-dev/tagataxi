-- =============================================
-- MIGRATION: Compléter le système de bidding
-- =============================================

-- 1. Ajouter les colonnes manquantes à transport_bookings
ALTER TABLE public.transport_bookings 
ADD COLUMN IF NOT EXISTS client_proposed_price NUMERIC,
ADD COLUMN IF NOT EXISTS bidding_mode BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS bidding_closes_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS assigned_driver_id UUID;

-- 2. Ajouter les colonnes manquantes à ride_offers
ALTER TABLE public.ride_offers 
ADD COLUMN IF NOT EXISTS booking_id UUID,
ADD COLUMN IF NOT EXISTS offered_price NUMERIC,
ADD COLUMN IF NOT EXISTS original_estimated_price NUMERIC,
ADD COLUMN IF NOT EXISTS is_counter_offer BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS client_proposal_price NUMERIC,
ADD COLUMN IF NOT EXISTS message TEXT,
ADD COLUMN IF NOT EXISTS distance_to_pickup NUMERIC;

-- 3. Créer les index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_ride_offers_booking_id ON public.ride_offers(booking_id);
CREATE INDEX IF NOT EXISTS idx_transport_bookings_bidding_mode ON public.transport_bookings(bidding_mode) WHERE bidding_mode = true;
CREATE INDEX IF NOT EXISTS idx_transport_bookings_bidding_closes ON public.transport_bookings(bidding_closes_at) WHERE bidding_mode = true;
CREATE INDEX IF NOT EXISTS idx_ride_offers_status ON public.ride_offers(status);

-- 4. Ajouter les contraintes de clé étrangère
DO $$ 
BEGIN
  -- FK pour ride_offers.booking_id
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'ride_offers_booking_id_fkey'
  ) THEN
    ALTER TABLE public.ride_offers 
    ADD CONSTRAINT ride_offers_booking_id_fkey 
    FOREIGN KEY (booking_id) REFERENCES public.transport_bookings(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 5. Politiques RLS pour les nouvelles colonnes (ride_offers)
-- Les chauffeurs peuvent voir les offres pour leurs courses
DROP POLICY IF EXISTS "Drivers can view ride offers for their bookings" ON public.ride_offers;
CREATE POLICY "Drivers can view ride offers for their bookings" 
ON public.ride_offers 
FOR SELECT 
USING (
  driver_id = auth.uid() 
  OR EXISTS (
    SELECT 1 FROM public.transport_bookings tb 
    WHERE tb.id = ride_offers.booking_id 
    AND tb.user_id = auth.uid()
  )
);

-- Les chauffeurs peuvent créer des offres
DROP POLICY IF EXISTS "Drivers can create ride offers" ON public.ride_offers;
CREATE POLICY "Drivers can create ride offers" 
ON public.ride_offers 
FOR INSERT 
WITH CHECK (driver_id = auth.uid());

-- Les chauffeurs peuvent mettre à jour leurs propres offres
DROP POLICY IF EXISTS "Drivers can update their own offers" ON public.ride_offers;
CREATE POLICY "Drivers can update their own offers" 
ON public.ride_offers 
FOR UPDATE 
USING (driver_id = auth.uid());

-- Les clients peuvent voir les offres sur leurs courses
DROP POLICY IF EXISTS "Clients can view offers on their bookings" ON public.ride_offers;
CREATE POLICY "Clients can view offers on their bookings" 
ON public.ride_offers 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.transport_bookings tb 
    WHERE tb.id = ride_offers.booking_id 
    AND tb.user_id = auth.uid()
  )
);

-- Les clients peuvent accepter/rejeter des offres (update status)
DROP POLICY IF EXISTS "Clients can update offer status on their bookings" ON public.ride_offers;
CREATE POLICY "Clients can update offer status on their bookings" 
ON public.ride_offers 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.transport_bookings tb 
    WHERE tb.id = ride_offers.booking_id 
    AND tb.user_id = auth.uid()
  )
);