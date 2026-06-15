-- ============================================================
-- Fix ride_offers: enable Realtime + add booking_id + RLS
-- ============================================================

-- 1. Add booking_id column if missing
ALTER TABLE public.ride_offers
  ADD COLUMN IF NOT EXISTS booking_id uuid REFERENCES public.transport_bookings(id) ON DELETE CASCADE;

-- 2. Add offered_price column if missing
ALTER TABLE public.ride_offers
  ADD COLUMN IF NOT EXISTS offered_price numeric DEFAULT 0;

-- 3. REPLICA IDENTITY FULL needed for Realtime UPDATE events
ALTER TABLE public.ride_offers REPLICA IDENTITY FULL;

-- 4. Add to Realtime publication
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'ride_offers'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.ride_offers;
  END IF;
END $$;

-- 5. Allow CLIENT (booking owner) to update ride_offers status (accept counter-offer)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'ride_offers'
    AND policyname = 'Clients can accept counter offers'
  ) THEN
    CREATE POLICY "Clients can accept counter offers"
    ON public.ride_offers
    FOR UPDATE
    USING (
      EXISTS (
        SELECT 1 FROM public.transport_bookings tb
        WHERE tb.id = ride_offers.booking_id
        AND tb.user_id = auth.uid()
      )
    );
  END IF;
END $$;

-- 6. transport_bookings: also enable Realtime if not already
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'transport_bookings'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.transport_bookings;
  END IF;
END $$;

ALTER TABLE public.transport_bookings REPLICA IDENTITY FULL;
