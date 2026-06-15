-- Create driver_codes table for unique 8-character codes
CREATE TABLE public.driver_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  driver_id UUID NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on driver_codes
ALTER TABLE public.driver_codes ENABLE ROW LEVEL SECURITY;

-- Create policies for driver_codes
CREATE POLICY "Drivers can view their own codes" 
ON public.driver_codes 
FOR SELECT 
USING (auth.uid() = driver_id);

CREATE POLICY "Drivers can create their own codes" 
ON public.driver_codes 
FOR INSERT 
WITH CHECK (auth.uid() = driver_id);

CREATE POLICY "Drivers can update their own codes" 
ON public.driver_codes 
FOR UPDATE 
USING (auth.uid() = driver_id);

-- Create partner_drivers table for linking partners and drivers
CREATE TABLE public.partner_drivers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  partner_id UUID NOT NULL,
  driver_id UUID NOT NULL,
  driver_code TEXT NOT NULL,
  commission_rate NUMERIC NOT NULL DEFAULT 15.00,
  status TEXT NOT NULL DEFAULT 'active',
  added_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(partner_id, driver_id),
  UNIQUE(driver_code)
);

-- Enable RLS on partner_drivers
ALTER TABLE public.partner_drivers ENABLE ROW LEVEL SECURITY;

-- Create policies for partner_drivers
CREATE POLICY "Partners can view their own drivers" 
ON public.partner_drivers 
FOR SELECT 
USING (auth.uid() = partner_id);

CREATE POLICY "Partners can add drivers" 
ON public.partner_drivers 
FOR INSERT 
WITH CHECK (auth.uid() = partner_id);

CREATE POLICY "Partners can update their drivers" 
ON public.partner_drivers 
FOR UPDATE 
USING (auth.uid() = partner_id);

CREATE POLICY "Drivers can view their partner assignments" 
ON public.partner_drivers 
FOR SELECT 
USING (auth.uid() = driver_id);

-- Create function to generate unique 8-character driver codes
CREATE OR REPLACE FUNCTION public.generate_driver_code()
RETURNS TEXT AS $$
DECLARE
  code TEXT;
  exists_check INTEGER;
BEGIN
  LOOP
    -- Generate a 8-character alphanumeric code
    code := UPPER(substring(encode(gen_random_bytes(6), 'hex') from 1 for 8));
    
    -- Check if code already exists
    SELECT COUNT(*) INTO exists_check FROM public.driver_codes WHERE code = code;
    
    -- If code doesn't exist, exit loop
    IF exists_check = 0 THEN
      EXIT;
    END IF;
  END LOOP;
  
  RETURN code;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at columns
CREATE TRIGGER update_driver_codes_updated_at
BEFORE UPDATE ON public.driver_codes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_partner_drivers_updated_at
BEFORE UPDATE ON public.partner_drivers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();