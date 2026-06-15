CREATE OR REPLACE FUNCTION public.get_driver_location_for_order(p_order_id UUID)
RETURNS TABLE(latitude DOUBLE PRECISION, longitude DOUBLE PRECISION, heading DOUBLE PRECISION, updated_at TIMESTAMPTZ)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN QUERY
    SELECT dl.latitude, dl.longitude, dl.heading, dl.updated_at
    FROM driver_locations dl
    JOIN food_orders fo ON fo.driver_id = dl.driver_id
    WHERE fo.id = p_order_id
      AND fo.user_id = auth.uid()
      AND fo.status IN ('driver_assigned','picked_up','in_transit','delivering');
END;
$$;