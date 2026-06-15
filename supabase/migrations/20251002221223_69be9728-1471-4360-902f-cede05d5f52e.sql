-- Create delivery_driver_alerts table for real-time notifications
CREATE TABLE IF NOT EXISTS public.delivery_driver_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.delivery_orders(id) ON DELETE CASCADE,
  driver_id UUID NOT NULL,
  alert_type TEXT NOT NULL DEFAULT 'new_delivery_request',
  distance_km NUMERIC NOT NULL,
  response_status TEXT NOT NULL DEFAULT 'sent' CHECK (response_status IN ('sent', 'seen', 'accepted', 'ignored')),
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  seen_at TIMESTAMP WITH TIME ZONE,
  responded_at TIMESTAMP WITH TIME ZONE,
  order_details JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.delivery_driver_alerts ENABLE ROW LEVEL SECURITY;

-- Policy: Drivers can view their own alerts
CREATE POLICY "Drivers can view their own alerts"
  ON public.delivery_driver_alerts
  FOR SELECT
  USING (auth.uid() = driver_id);

-- Policy: Drivers can update their own alerts (mark as seen/accepted/ignored)
CREATE POLICY "Drivers can update their own alerts"
  ON public.delivery_driver_alerts
  FOR UPDATE
  USING (auth.uid() = driver_id)
  WITH CHECK (auth.uid() = driver_id);

-- Policy: Admins can view all alerts
CREATE POLICY "Admins can view all alerts"
  ON public.delivery_driver_alerts
  FOR SELECT
  USING (is_current_user_admin());

-- Create indexes for performance
CREATE INDEX idx_delivery_driver_alerts_driver_id ON public.delivery_driver_alerts(driver_id);
CREATE INDEX idx_delivery_driver_alerts_order_id ON public.delivery_driver_alerts(order_id);
CREATE INDEX idx_delivery_driver_alerts_response_status ON public.delivery_driver_alerts(response_status);
CREATE INDEX idx_delivery_driver_alerts_sent_at ON public.delivery_driver_alerts(sent_at DESC);

-- Create trigger for updated_at
CREATE TRIGGER update_delivery_driver_alerts_updated_at
  BEFORE UPDATE ON public.delivery_driver_alerts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add to Supabase Realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.delivery_driver_alerts;

COMMENT ON TABLE public.delivery_driver_alerts IS 'Alertes en temps réel pour les chauffeurs de livraison';
