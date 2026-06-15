-- Create vehicle rental system tables

-- Vehicle rental categories
CREATE TABLE public.rental_vehicle_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT NOT NULL DEFAULT 'Car',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Vehicle rental fleet
CREATE TABLE public.rental_vehicles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID NOT NULL REFERENCES public.rental_vehicle_categories(id),
  name TEXT NOT NULL,
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER NOT NULL,
  vehicle_type TEXT NOT NULL, -- 'moto', 'eco', 'standard', 'premium', 'utility'
  fuel_type TEXT NOT NULL DEFAULT 'essence',
  transmission TEXT NOT NULL DEFAULT 'manual',
  seats INTEGER NOT NULL DEFAULT 2,
  daily_rate NUMERIC NOT NULL DEFAULT 0,
  hourly_rate NUMERIC NOT NULL DEFAULT 0,
  weekly_rate NUMERIC NOT NULL DEFAULT 0,
  security_deposit NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'CDF',
  features JSONB DEFAULT '[]'::jsonb,
  images JSONB DEFAULT '[]'::jsonb,
  license_plate TEXT NOT NULL,
  is_available BOOLEAN NOT NULL DEFAULT true,
  is_active BOOLEAN NOT NULL DEFAULT true,
  location_coordinates JSONB,
  location_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Vehicle rental bookings
CREATE TABLE public.rental_bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  vehicle_id UUID NOT NULL REFERENCES public.rental_vehicles(id),
  rental_duration_type TEXT NOT NULL, -- 'hourly', 'half_day', 'daily', 'weekly'
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  pickup_location TEXT NOT NULL,
  pickup_coordinates JSONB,
  return_location TEXT,
  return_coordinates JSONB,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  security_deposit NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'CDF',
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'confirmed', 'active', 'completed', 'cancelled'
  payment_status TEXT NOT NULL DEFAULT 'pending',
  contract_signed BOOLEAN NOT NULL DEFAULT false,
  insurance_type TEXT DEFAULT 'basic',
  additional_services JSONB DEFAULT '[]'::jsonb,
  special_requests TEXT,
  driver_license_verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  confirmed_at TIMESTAMP WITH TIME ZONE,
  picked_up_at TIMESTAMP WITH TIME ZONE,
  returned_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.rental_vehicle_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rental_vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rental_bookings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for rental_vehicle_categories
CREATE POLICY "Everyone can view active categories" 
ON public.rental_vehicle_categories 
FOR SELECT 
USING (is_active = true);

-- RLS Policies for rental_vehicles
CREATE POLICY "Everyone can view available vehicles" 
ON public.rental_vehicles 
FOR SELECT 
USING (is_available = true AND is_active = true);

-- RLS Policies for rental_bookings
CREATE POLICY "Users can create their own bookings" 
ON public.rental_bookings 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own bookings" 
ON public.rental_bookings 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own bookings" 
ON public.rental_bookings 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Add triggers for updated_at
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

-- Insert default vehicle categories
INSERT INTO public.rental_vehicle_categories (name, description, icon) VALUES
('Motos', 'Motos et scooters pour déplacements rapides', 'Bike'),
('Voitures Économiques', 'Véhicules abordables pour usage quotidien', 'Car'),
('Voitures Standard', 'Voitures confortables pour trajets moyens', 'Car'),
('Voitures Premium', 'Véhicules haut de gamme avec tout confort', 'Car'),
('Utilitaires', 'Camionnettes et véhicules de transport', 'Truck');

-- Insert sample vehicles
INSERT INTO public.rental_vehicles (category_id, name, brand, model, year, vehicle_type, seats, daily_rate, hourly_rate, weekly_rate, security_deposit, features, license_plate, location_address) VALUES
((SELECT id FROM public.rental_vehicle_categories WHERE name = 'Motos'), 'Moto Yamaha NMAX', 'Yamaha', 'NMAX 155', 2023, 'moto', 2, 15000, 2500, 90000, 50000, '["GPS", "Casques inclus", "Antivol"]'::jsonb, 'KIN-M001', 'Centre-ville Kinshasa'),
((SELECT id FROM public.rental_vehicle_categories WHERE name = 'Voitures Économiques'), 'Toyota Corolla Eco', 'Toyota', 'Corolla', 2022, 'eco', 5, 35000, 5000, 210000, 100000, '["Climatisation", "Radio", "Sièges en tissu"]'::jsonb, 'KIN-C001', 'Gombe, Kinshasa'),
((SELECT id FROM public.rental_vehicle_categories WHERE name = 'Voitures Standard'), 'Honda Civic Standard', 'Honda', 'Civic', 2023, 'standard', 5, 50000, 7500, 300000, 150000, '["Climatisation", "GPS", "Bluetooth", "Sièges en cuir"]'::jsonb, 'KIN-C002', 'Ngaliema, Kinshasa'),
((SELECT id FROM public.rental_vehicle_categories WHERE name = 'Voitures Premium'), 'Mercedes Classe C', 'Mercedes-Benz', 'Classe C', 2024, 'premium', 5, 120000, 18000, 720000, 500000, '["Climatisation auto", "GPS premium", "Sièges cuir premium", "Toit ouvrant", "Sound system"]'::jsonb, 'KIN-M003', 'Gombe, Kinshasa'),
((SELECT id FROM public.rental_vehicle_categories WHERE name = 'Utilitaires'), 'Toyota Hiace Cargo', 'Toyota', 'Hiace', 2023, 'utility', 3, 80000, 12000, 480000, 300000, '["Espace cargo 10m³", "GPS", "Assistance chargement"]'::jsonb, 'KIN-U001', 'Lemba, Kinshasa');