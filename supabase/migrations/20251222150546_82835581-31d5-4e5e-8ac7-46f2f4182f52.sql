-- Enable RLS on ride_offers if not already enabled
ALTER TABLE IF EXISTS ride_offers ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Drivers can create offers" ON ride_offers;
DROP POLICY IF EXISTS "Drivers can view their own offers" ON ride_offers;
DROP POLICY IF EXISTS "Clients can view offers for their bookings" ON ride_offers;
DROP POLICY IF EXISTS "Clients can update offers for their bookings" ON ride_offers;
DROP POLICY IF EXISTS "Drivers can update their own offers" ON ride_offers;

-- Create RLS policies for ride_offers

-- Drivers can create offers
CREATE POLICY "Drivers can create offers"
ON ride_offers
FOR INSERT
WITH CHECK (auth.uid() = driver_id);

-- Drivers can view their own offers
CREATE POLICY "Drivers can view their own offers"
ON ride_offers
FOR SELECT
USING (auth.uid() = driver_id);

-- Clients can view offers for their bookings
CREATE POLICY "Clients can view offers for their bookings"
ON ride_offers
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM transport_bookings tb
    WHERE tb.id = ride_offers.booking_id
    AND tb.user_id = auth.uid()
  )
);

-- Clients can update (accept/reject) offers for their bookings
CREATE POLICY "Clients can update offers for their bookings"
ON ride_offers
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM transport_bookings tb
    WHERE tb.id = ride_offers.booking_id
    AND tb.user_id = auth.uid()
  )
);

-- Drivers can update their own offers (withdraw)
CREATE POLICY "Drivers can update their own offers"
ON ride_offers
FOR UPDATE
USING (auth.uid() = driver_id);

-- Enable realtime for ride_offers
ALTER TABLE ride_offers REPLICA IDENTITY FULL;

-- Add table to realtime publication if not already added
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'ride_offers'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE ride_offers;
  END IF;
END $$;