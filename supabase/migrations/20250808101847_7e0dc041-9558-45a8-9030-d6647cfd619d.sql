-- Create partner_taxi_vehicles table for partner fleet management
CREATE TABLE public.partner_taxi_vehicles (
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

-- Enable RLS on partner_taxi_vehicles
ALTER TABLE public.partner_taxi_vehicles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for partner_taxi_vehicles
CREATE POLICY "Partners can manage their own taxi vehicles"
ON public.partner_taxi_vehicles
FOR ALL
USING (auth.uid() = partner_id);

CREATE POLICY "Everyone can view approved taxi vehicles"
ON public.partner_taxi_vehicles
FOR SELECT
USING (moderation_status = 'approved' AND is_active = true);

-- Create rental_vehicle_categories table
CREATE TABLE public.rental_vehicle_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  base_rate NUMERIC NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on rental_vehicle_categories
ALTER TABLE public.rental_vehicle_categories ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for rental_vehicle_categories
CREATE POLICY "Everyone can view active categories"
ON public.rental_vehicle_categories
FOR SELECT
USING (is_active = true);

-- Create rental_vehicles table
CREATE TABLE public.rental_vehicles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  partner_id UUID NOT NULL,
  category_id UUID NOT NULL REFERENCES public.rental_vehicle_categories(id),
  name TEXT NOT NULL,
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER NOT NULL,
  vehicle_type TEXT NOT NULL,
  fuel_type TEXT,
  transmission TEXT,
  seats INTEGER NOT NULL DEFAULT 4,
  features TEXT[],
  daily_rate NUMERIC NOT NULL,
  weekly_rate NUMERIC,
  monthly_rate NUMERIC,
  security_deposit NUMERIC NOT NULL DEFAULT 0,
  images JSONB DEFAULT '[]'::jsonb,
  location TEXT,
  coordinates JSONB,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_available BOOLEAN NOT NULL DEFAULT true,
  moderation_status TEXT NOT NULL DEFAULT 'pending' CHECK (moderation_status IN ('pending', 'approved', 'rejected')),
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on rental_vehicles
ALTER TABLE public.rental_vehicles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for rental_vehicles
CREATE POLICY "Partners can manage their own rental vehicles"
ON public.rental_vehicles
FOR ALL
USING (auth.uid() = partner_id);

CREATE POLICY "Everyone can view approved rental vehicles"
ON public.rental_vehicles
FOR SELECT
USING (moderation_status = 'approved' AND is_active = true);

-- Create rental_bookings table
CREATE TABLE public.rental_bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicle_id UUID NOT NULL REFERENCES public.rental_vehicles(id),
  renter_id UUID NOT NULL,
  partner_id UUID NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_days INTEGER NOT NULL,
  daily_rate NUMERIC NOT NULL,
  total_amount NUMERIC NOT NULL,
  security_deposit NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'active', 'completed', 'cancelled')),
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded')),
  pickup_location TEXT,
  return_location TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on rental_bookings
ALTER TABLE public.rental_bookings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for rental_bookings
CREATE POLICY "Renters can view their own bookings"
ON public.rental_bookings
FOR SELECT
USING (auth.uid() = renter_id);

CREATE POLICY "Partners can manage bookings for their vehicles"
ON public.rental_bookings
FOR ALL
USING (auth.uid() = partner_id);

CREATE POLICY "Renters can create bookings"
ON public.rental_bookings
FOR INSERT
WITH CHECK (auth.uid() = renter_id);

-- Create indexes for better performance
CREATE INDEX idx_partner_taxi_vehicles_partner_id ON public.partner_taxi_vehicles(partner_id);
CREATE INDEX idx_partner_taxi_vehicles_moderation_status ON public.partner_taxi_vehicles(moderation_status);
CREATE INDEX idx_partner_taxi_vehicles_is_active ON public.partner_taxi_vehicles(is_active, is_available);

CREATE INDEX idx_rental_vehicles_partner_id ON public.rental_vehicles(partner_id);
CREATE INDEX idx_rental_vehicles_category_id ON public.rental_vehicles(category_id);
CREATE INDEX idx_rental_vehicles_moderation_status ON public.rental_vehicles(moderation_status);
CREATE INDEX idx_rental_vehicles_is_active ON public.rental_vehicles(is_active, is_available);

CREATE INDEX idx_rental_bookings_vehicle_id ON public.rental_bookings(vehicle_id);
CREATE INDEX idx_rental_bookings_renter_id ON public.rental_bookings(renter_id);
CREATE INDEX idx_rental_bookings_partner_id ON public.rental_bookings(partner_id);
CREATE INDEX idx_rental_bookings_dates ON public.rental_bookings(start_date, end_date);

-- Create triggers for updated_at columns
CREATE TRIGGER update_partner_taxi_vehicles_updated_at
BEFORE UPDATE ON public.partner_taxi_vehicles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_rental_vehicle_categories_updated_at
BEFORE UPDATE ON public.rental_vehicle_categories
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_rental_vehicles_updated_at
BEFORE UPDATE ON public.rental_vehicles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_rental_bookings_updated_at
BEFORE UPDATE ON public.rental_bookings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default rental vehicle categories
INSERT INTO public.rental_vehicle_categories (name, description, base_rate) VALUES
('Économique', 'Véhicules compacts et économiques', 25000),
('Confort', 'Véhicules de taille moyenne avec plus de confort', 40000),
('Premium', 'Véhicules haut de gamme avec équipements premium', 60000),
('SUV', 'Véhicules tout-terrain et familiaux', 50000),
('Utilitaire', 'Véhicules utilitaires pour transport de marchandises', 35000);