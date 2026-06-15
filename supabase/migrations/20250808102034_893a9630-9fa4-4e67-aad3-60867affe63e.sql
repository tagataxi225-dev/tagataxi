-- Create partner_taxi_vehicles table (only if not exists)
CREATE TABLE IF NOT EXISTS public.partner_taxi_vehicles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  partner_id UUID NOT NULL,
  name TEXT NOT NULL,
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER NOT NULL,
  vehicle_class TEXT NOT NULL DEFAULT 'standard' CHECK (vehicle_class IN ('moto', 'standard', 'premium', 'bus')),
  color TEXT,
  seats INTEGER NOT NULL DEFAULT 4,
  images JSONB DEFAULT '[]'::jsonb,
  license_plate TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_available BOOLEAN NOT NULL DEFAULT true,
  moderation_status TEXT NOT NULL DEFAULT 'pending' CHECK (moderation_status IN ('pending', 'approved', 'rejected')),
  rejection_reason TEXT,
  assigned_driver_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add missing columns to rental_vehicles table
ALTER TABLE public.rental_vehicles 
ADD COLUMN IF NOT EXISTS partner_id UUID,
ADD COLUMN IF NOT EXISTS moderation_status TEXT DEFAULT 'pending' CHECK (moderation_status IN ('pending', 'approved', 'rejected')),
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Enable RLS on partner_taxi_vehicles
ALTER TABLE public.partner_taxi_vehicles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for partner_taxi_vehicles
DROP POLICY IF EXISTS "Partners can manage their own taxi vehicles" ON public.partner_taxi_vehicles;
CREATE POLICY "Partners can manage their own taxi vehicles"
ON public.partner_taxi_vehicles
FOR ALL
USING (auth.uid() = partner_id);

DROP POLICY IF EXISTS "Everyone can view approved taxi vehicles" ON public.partner_taxi_vehicles;
CREATE POLICY "Everyone can view approved taxi vehicles"
ON public.partner_taxi_vehicles
FOR SELECT
USING (moderation_status = 'approved' AND is_active = true);

-- Update RLS policies for rental_vehicles to include partner access
DROP POLICY IF EXISTS "Partners can manage their own rental vehicles" ON public.rental_vehicles;
CREATE POLICY "Partners can manage their own rental vehicles"
ON public.rental_vehicles
FOR ALL
USING (auth.uid() = partner_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_partner_taxi_vehicles_partner_id ON public.partner_taxi_vehicles(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_taxi_vehicles_moderation_status ON public.partner_taxi_vehicles(moderation_status);
CREATE INDEX IF NOT EXISTS idx_partner_taxi_vehicles_is_active ON public.partner_taxi_vehicles(is_active, is_available);

CREATE INDEX IF NOT EXISTS idx_rental_vehicles_partner_id ON public.rental_vehicles(partner_id);
CREATE INDEX IF NOT EXISTS idx_rental_vehicles_moderation_status ON public.rental_vehicles(moderation_status);

-- Create triggers for updated_at columns
DROP TRIGGER IF EXISTS update_partner_taxi_vehicles_updated_at ON public.partner_taxi_vehicles;
CREATE TRIGGER update_partner_taxi_vehicles_updated_at
BEFORE UPDATE ON public.partner_taxi_vehicles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();