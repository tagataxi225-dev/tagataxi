-- Create missing pricing_configs table for delivery price calculation
CREATE TABLE IF NOT EXISTS public.pricing_configs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  service_type TEXT NOT NULL,
  base_price NUMERIC NOT NULL DEFAULT 5000,
  price_per_km NUMERIC NOT NULL DEFAULT 500,
  city TEXT NOT NULL DEFAULT 'Kinshasa',
  currency TEXT NOT NULL DEFAULT 'CDF',
  surge_multiplier NUMERIC NOT NULL DEFAULT 1.0,
  minimum_fare NUMERIC NOT NULL DEFAULT 3000,
  maximum_fare NUMERIC,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert default pricing for Kinshasa delivery services
INSERT INTO public.pricing_configs (service_type, base_price, price_per_km, minimum_fare, city) VALUES
('flash', 5000, 500, 4000, 'Kinshasa'),
('flex', 3000, 300, 2500, 'Kinshasa'),
('maxicharge', 8000, 800, 6000, 'Kinshasa');

-- Enable RLS
ALTER TABLE public.pricing_configs ENABLE ROW LEVEL SECURITY;

-- Allow public read for active pricing configs
CREATE POLICY "pricing_configs_public_read" ON public.pricing_configs
FOR SELECT USING (active = true);

-- Admin only for modifications
CREATE POLICY "pricing_configs_admin_manage" ON public.pricing_configs
FOR ALL USING (is_current_user_admin());