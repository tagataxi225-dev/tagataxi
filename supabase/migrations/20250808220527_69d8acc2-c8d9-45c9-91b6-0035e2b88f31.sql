-- Create ride_offers table for targeted driver offers
CREATE TABLE IF NOT EXISTS public.ride_offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_request_id uuid NOT NULL,
  driver_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending', -- pending | accepted | declined | expired
  expires_at timestamptz NULL,
  accepted_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Basic indexes
CREATE INDEX IF NOT EXISTS idx_ride_offers_driver_status ON public.ride_offers (driver_id, status);
CREATE INDEX IF NOT EXISTS idx_ride_offers_request ON public.ride_offers (ride_request_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_ride_offers_request_driver ON public.ride_offers (ride_request_id, driver_id);

-- Enable RLS
ALTER TABLE public.ride_offers ENABLE ROW LEVEL SECURITY;

-- Policies
DO $$ BEGIN
  -- Drivers can see their own offers
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'ride_offers' AND policyname = 'Drivers can view their own ride offers'
  ) THEN
    CREATE POLICY "Drivers can view their own ride offers"
    ON public.ride_offers
    FOR SELECT
    USING (auth.uid() = driver_id);
  END IF;

  -- System can insert ride offers
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'ride_offers' AND policyname = 'System can insert ride offers'
  ) THEN
    CREATE POLICY "System can insert ride offers"
    ON public.ride_offers
    FOR INSERT
    WITH CHECK (true);
  END IF;

  -- Drivers can update their own offers (accept/decline)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'ride_offers' AND policyname = 'Drivers can update their own ride offers'
  ) THEN
    CREATE POLICY "Drivers can update their own ride offers"
    ON public.ride_offers
    FOR UPDATE
    USING (auth.uid() = driver_id);
  END IF;
END $$;

-- updated_at trigger function (if not exists already)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach trigger
DROP TRIGGER IF EXISTS trg_ride_offers_updated_at ON public.ride_offers;
CREATE TRIGGER trg_ride_offers_updated_at
BEFORE UPDATE ON public.ride_offers
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- DELIVERY ACCESS POLICIES
-- Allow active drivers to view available, unassigned direct deliveries
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='delivery_orders' AND policyname='Drivers can view available deliveries'
  ) THEN
    CREATE POLICY "Drivers can view available deliveries"
    ON public.delivery_orders
    FOR SELECT
    USING (
      status = 'pending'
      AND driver_id IS NULL
      AND EXISTS (
        SELECT 1 FROM public.driver_profiles dp
        WHERE dp.user_id = auth.uid() AND dp.is_active = true
      )
    );
  END IF;

  -- Allow drivers to claim available deliveries by setting driver_id to themselves
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='delivery_orders' AND policyname='Drivers can claim available deliveries'
  ) THEN
    CREATE POLICY "Drivers can claim available deliveries"
    ON public.delivery_orders
    FOR UPDATE
    USING (
      status = 'pending'
      AND driver_id IS NULL
      AND EXISTS (
        SELECT 1 FROM public.driver_profiles dp
        WHERE dp.user_id = auth.uid() AND dp.is_active = true
      )
    )
    WITH CHECK (driver_id = auth.uid());
  END IF;
END $$;

-- MARKETPLACE DELIVERY ASSIGNMENTS POLICIES
DO $$ BEGIN
  -- View available assignments
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='marketplace_delivery_assignments' AND policyname='Drivers can view available marketplace deliveries'
  ) THEN
    CREATE POLICY "Drivers can view available marketplace deliveries"
    ON public.marketplace_delivery_assignments
    FOR SELECT
    USING (
      assignment_status = 'pending'
      AND driver_id IS NULL
      AND EXISTS (
        SELECT 1 FROM public.driver_profiles dp
        WHERE dp.user_id = auth.uid() AND dp.is_active = true
      )
    );
  END IF;

  -- Claim available assignments
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='marketplace_delivery_assignments' AND policyname='Drivers can claim available marketplace deliveries'
  ) THEN
    CREATE POLICY "Drivers can claim available marketplace deliveries"
    ON public.marketplace_delivery_assignments
    FOR UPDATE
    USING (
      assignment_status = 'pending'
      AND driver_id IS NULL
      AND EXISTS (
        SELECT 1 FROM public.driver_profiles dp
        WHERE dp.user_id = auth.uid() AND dp.is_active = true
      )
    )
    WITH CHECK (driver_id = auth.uid());
  END IF;
END $$;
