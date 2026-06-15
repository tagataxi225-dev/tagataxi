-- Create commission settings table for admin configurable rates
CREATE TABLE IF NOT EXISTS public.commission_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  service_type TEXT NOT NULL, -- 'transport', 'delivery', 'wallet_topup'
  admin_rate NUMERIC NOT NULL DEFAULT 10.00, -- Admin commission percentage
  driver_rate NUMERIC NOT NULL DEFAULT 85.00, -- Driver commission percentage  
  platform_rate NUMERIC NOT NULL DEFAULT 5.00, -- Platform commission percentage
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.commission_settings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Everyone can view commission settings" 
ON public.commission_settings 
FOR SELECT 
USING (true);

-- Insert default commission rates
INSERT INTO public.commission_settings (service_type, admin_rate, driver_rate, platform_rate) VALUES
('transport', 10.00, 85.00, 5.00),
('delivery', 12.00, 83.00, 5.00),  
('wallet_topup', 2.50, 97.50, 0.00)
ON CONFLICT DO NOTHING;

-- Create trigger for updated_at
CREATE TRIGGER update_commission_settings_updated_at
BEFORE UPDATE ON public.commission_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();