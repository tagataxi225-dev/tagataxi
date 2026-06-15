-- =====================================================
-- CORRECTION DU SYSTÈME DE BIDDING KWENDA
-- =====================================================

-- 1. Rendre ride_request_id nullable dans ride_offers
ALTER TABLE public.ride_offers 
ALTER COLUMN ride_request_id DROP NOT NULL;

-- 2. Ajouter la colonne offer_count à transport_bookings si elle n'existe pas
ALTER TABLE public.transport_bookings 
ADD COLUMN IF NOT EXISTS offer_count INTEGER DEFAULT 0;

-- 3. Créer la fonction increment_offer_count
CREATE OR REPLACE FUNCTION public.increment_offer_count(p_booking_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.transport_bookings 
  SET offer_count = COALESCE(offer_count, 0) + 1
  WHERE id = p_booking_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Accorder les droits d'exécution
GRANT EXECUTE ON FUNCTION public.increment_offer_count(UUID) TO authenticated;

-- 5. Supprimer les anciennes politiques RLS de ride_offers pour INSERT
DROP POLICY IF EXISTS "Drivers can create ride offers" ON public.ride_offers;
DROP POLICY IF EXISTS "drivers_can_insert_offers" ON public.ride_offers;

-- 6. Créer une nouvelle politique RLS qui vérifie via la table chauffeurs
CREATE POLICY "Drivers can create ride offers" 
ON public.ride_offers 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.chauffeurs c 
    WHERE c.id = driver_id 
    AND c.user_id = auth.uid()
  )
  OR
  driver_id = auth.uid()
);

-- 7. Politique pour que les chauffeurs puissent voir leurs propres offres
DROP POLICY IF EXISTS "Drivers can view their own offers" ON public.ride_offers;
CREATE POLICY "Drivers can view their own offers" 
ON public.ride_offers 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.chauffeurs c 
    WHERE c.id = driver_id 
    AND c.user_id = auth.uid()
  )
  OR driver_id = auth.uid()
);

-- 8. Politique pour que les clients puissent voir les offres sur leurs bookings
DROP POLICY IF EXISTS "Clients can view offers on their bookings" ON public.ride_offers;
CREATE POLICY "Clients can view offers on their bookings" 
ON public.ride_offers 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.transport_bookings tb 
    WHERE tb.id = booking_id 
    AND tb.user_id = auth.uid()
  )
);

-- 9. Politique pour que les clients puissent accepter des offres (UPDATE)
DROP POLICY IF EXISTS "Clients can update offers on their bookings" ON public.ride_offers;
CREATE POLICY "Clients can update offers on their bookings" 
ON public.ride_offers 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.transport_bookings tb 
    WHERE tb.id = booking_id 
    AND tb.user_id = auth.uid()
  )
);

-- 10. Activer RLS si pas déjà fait
ALTER TABLE public.ride_offers ENABLE ROW LEVEL SECURITY;