DROP POLICY "Drivers can view assigned ride requests" ON public.ride_requests;

CREATE POLICY "Drivers can view assigned ride requests"
ON public.ride_requests
FOR SELECT
TO authenticated
USING (
  (auth.uid() = assigned_driver_id) OR (status = 'pending')
);