-- Enable RLS and add policies for transport_bookings to allow proper driver acceptance flow
-- Safely enable RLS (no-op if already enabled)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'transport_bookings'
  ) THEN
    RAISE EXCEPTION 'Table public.transport_bookings does not exist';
  END IF;
END $$;

ALTER TABLE public.transport_bookings ENABLE ROW LEVEL SECURITY;

-- Users can create their own bookings
DO $$ BEGIN
  CREATE POLICY "Users can create their own transport bookings"
  ON public.transport_bookings
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Participants (rider or driver) can view booking
DO $$ BEGIN
  CREATE POLICY "Participants can view transport bookings"
  ON public.transport_bookings
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR auth.uid() = driver_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Drivers can accept pending, unassigned bookings by setting themselves as driver
DO $$ BEGIN
  CREATE POLICY "Drivers can accept pending bookings"
  ON public.transport_bookings
  FOR UPDATE
  TO authenticated
  USING (status = 'pending' AND driver_id IS NULL)
  WITH CHECK (driver_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Drivers can update bookings they are assigned to (status transitions, location-related fields, etc.)
DO $$ BEGIN
  CREATE POLICY "Drivers can update their assigned bookings"
  ON public.transport_bookings
  FOR UPDATE
  TO authenticated
  USING (driver_id = auth.uid())
  WITH CHECK (driver_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;