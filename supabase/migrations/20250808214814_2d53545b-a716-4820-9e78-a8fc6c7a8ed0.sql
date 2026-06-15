
-- 1) transport_bookings: visibilité et acceptation par les chauffeurs actifs
CREATE POLICY "Drivers can view available pending bookings"
  ON public.transport_bookings
  FOR SELECT
  USING (
    status = 'pending'
    AND driver_id IS NULL
    AND EXISTS (
      SELECT 1
      FROM public.driver_profiles dp
      WHERE dp.user_id = auth.uid()
        AND dp.is_active = true
    )
  );

CREATE POLICY "Drivers can accept pending bookings"
  ON public.transport_bookings
  FOR UPDATE
  USING (
    driver_id IS NULL
    AND status = 'pending'
    AND EXISTS (
      SELECT 1
      FROM public.driver_profiles dp
      WHERE dp.user_id = auth.uid()
        AND dp.is_active = true
    )
  )
  WITH CHECK (
    driver_id = auth.uid()
    AND status IN ('accepted','driver_assigned')
  );

-- 2) delivery_orders: visibilité et acceptation par les chauffeurs actifs
CREATE POLICY "Drivers can view available direct deliveries"
  ON public.delivery_orders
  FOR SELECT
  USING (
    status = 'pending'
    AND driver_id IS NULL
    AND EXISTS (
      SELECT 1
      FROM public.driver_profiles dp
      WHERE dp.user_id = auth.uid()
        AND dp.is_active = true
    )
  );

CREATE POLICY "Drivers can accept direct deliveries"
  ON public.delivery_orders
  FOR UPDATE
  USING (
    driver_id IS NULL
    AND status = 'pending'
    AND EXISTS (
      SELECT 1
      FROM public.driver_profiles dp
      WHERE dp.user_id = auth.uid()
        AND dp.is_active = true
    )
  )
  WITH CHECK (
    driver_id = auth.uid()
    AND status IN ('confirmed','picked_up','in_transit')
  );

-- 3) marketplace_delivery_assignments: visibilité et acceptation par les chauffeurs actifs
CREATE POLICY "Drivers can view available marketplace deliveries"
  ON public.marketplace_delivery_assignments
  FOR SELECT
  USING (
    assignment_status = 'pending'
    AND driver_id IS NULL
    AND EXISTS (
      SELECT 1
      FROM public.driver_profiles dp
      WHERE dp.user_id = auth.uid()
        AND dp.is_active = true
    )
  );

CREATE POLICY "Drivers can accept marketplace deliveries"
  ON public.marketplace_delivery_assignments
  FOR UPDATE
  USING (
    driver_id IS NULL
    AND assignment_status = 'pending'
    AND EXISTS (
      SELECT 1
      FROM public.driver_profiles dp
      WHERE dp.user_id = auth.uid()
        AND dp.is_active = true
    )
  )
  WITH CHECK (
    driver_id = auth.uid()
    AND assignment_status IN ('assigned','picked_up','in_transit','delivered')
  );
