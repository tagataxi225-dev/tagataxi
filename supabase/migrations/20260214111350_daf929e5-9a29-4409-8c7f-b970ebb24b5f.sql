
CREATE TABLE public.food_delivery_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  food_order_id UUID NOT NULL,
  driver_id UUID NOT NULL,
  restaurant_id UUID NOT NULL,
  pickup_location TEXT,
  pickup_coordinates JSONB DEFAULT '{}',
  delivery_location TEXT,
  delivery_coordinates JSONB DEFAULT '{}',
  delivery_fee NUMERIC DEFAULT 3000,
  driver_earnings NUMERIC DEFAULT 0,
  assignment_status TEXT DEFAULT 'pending',
  estimated_pickup_time TIMESTAMPTZ,
  estimated_delivery_time TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.food_delivery_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access" ON public.food_delivery_assignments
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Drivers can view their assignments" ON public.food_delivery_assignments
  FOR SELECT USING (auth.uid() = driver_id);

CREATE POLICY "Customers can view their order assignments" ON public.food_delivery_assignments
  FOR SELECT USING (
    food_order_id IN (SELECT id FROM food_orders WHERE customer_id = auth.uid())
  );
