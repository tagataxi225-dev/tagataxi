-- Create driver locations table for real-time tracking
CREATE TABLE public.driver_locations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  driver_id UUID NOT NULL,
  latitude NUMERIC NOT NULL,
  longitude NUMERIC NOT NULL,
  heading NUMERIC,
  speed NUMERIC,
  accuracy NUMERIC,
  is_online BOOLEAN NOT NULL DEFAULT false,
  is_available BOOLEAN NOT NULL DEFAULT true,
  vehicle_class TEXT DEFAULT 'standard',
  last_ping TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on driver_locations
ALTER TABLE public.driver_locations ENABLE ROW LEVEL SECURITY;

-- Create policies for driver_locations
CREATE POLICY "Drivers can manage their own location"
ON public.driver_locations
FOR ALL
USING (auth.uid() = driver_id);

CREATE POLICY "Users can view online drivers for matching"
ON public.driver_locations
FOR SELECT
USING (is_online = true AND is_available = true);

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_driver_locations_updated_at
BEFORE UPDATE ON public.driver_locations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create enhanced pricing table
CREATE TABLE public.pricing_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  service_type TEXT NOT NULL DEFAULT 'transport',
  vehicle_class TEXT NOT NULL DEFAULT 'standard',
  base_price NUMERIC NOT NULL DEFAULT 500,
  price_per_km NUMERIC NOT NULL DEFAULT 150,
  price_per_minute NUMERIC NOT NULL DEFAULT 25,
  minimum_fare NUMERIC NOT NULL DEFAULT 500,
  surge_multiplier NUMERIC NOT NULL DEFAULT 1.0,
  currency TEXT NOT NULL DEFAULT 'CDF',
  city TEXT NOT NULL DEFAULT 'kinshasa',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on pricing_rules
ALTER TABLE public.pricing_rules ENABLE ROW LEVEL SECURITY;

-- Create policy for pricing_rules
CREATE POLICY "Everyone can view active pricing rules"
ON public.pricing_rules
FOR SELECT
USING (is_active = true);

-- Add trigger for pricing_rules
CREATE TRIGGER update_pricing_rules_updated_at
BEFORE UPDATE ON public.pricing_rules
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default pricing rules
INSERT INTO public.pricing_rules (vehicle_class, base_price, price_per_km, price_per_minute, minimum_fare, city) VALUES
('eco', 400, 120, 20, 400, 'kinshasa'),
('standard', 500, 150, 25, 500, 'kinshasa'),
('premium', 800, 250, 40, 800, 'kinshasa'),
('moto', 200, 80, 15, 200, 'kinshasa'),
('eco', 480, 144, 24, 480, 'lubumbashi'),
('standard', 600, 180, 30, 600, 'lubumbashi'),
('premium', 960, 300, 48, 960, 'lubumbashi'),
('moto', 240, 96, 18, 240, 'lubumbashi'),
('eco', 440, 132, 22, 440, 'kolwezi'),
('standard', 550, 165, 27, 550, 'kolwezi'),
('premium', 880, 275, 44, 880, 'kolwezi');

-- Add intermediate stops support to transport_bookings
ALTER TABLE public.transport_bookings 
ADD COLUMN intermediate_stops JSONB DEFAULT '[]'::jsonb,
ADD COLUMN total_distance NUMERIC,
ADD COLUMN total_duration NUMERIC,
ADD COLUMN surge_multiplier NUMERIC DEFAULT 1.0,
ADD COLUMN driver_assigned_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN driver_arrived_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN trip_started_at TIMESTAMP WITH TIME ZONE;

-- Create driver profiles table for enhanced driver management
CREATE TABLE public.driver_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  license_number TEXT NOT NULL,
  license_expiry DATE NOT NULL,
  vehicle_make TEXT NOT NULL,
  vehicle_model TEXT NOT NULL,
  vehicle_year INTEGER NOT NULL,
  vehicle_plate TEXT NOT NULL,
  vehicle_class TEXT NOT NULL DEFAULT 'standard',
  vehicle_color TEXT,
  insurance_number TEXT NOT NULL,
  insurance_expiry DATE NOT NULL,
  profile_photo_url TEXT,
  vehicle_photo_url TEXT,
  documents JSONB DEFAULT '[]'::jsonb,
  verification_status TEXT NOT NULL DEFAULT 'pending',
  verification_level TEXT NOT NULL DEFAULT 'basic',
  is_active BOOLEAN NOT NULL DEFAULT false,
  rating_average NUMERIC DEFAULT 0,
  rating_count INTEGER DEFAULT 0,
  total_rides INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on driver_profiles
ALTER TABLE public.driver_profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for driver_profiles
CREATE POLICY "Drivers can manage their own profile"
ON public.driver_profiles
FOR ALL
USING (auth.uid() = user_id);

CREATE POLICY "Everyone can view verified driver profiles"
ON public.driver_profiles
FOR SELECT
USING (verification_status = 'verified' AND is_active = true);

-- Add trigger for driver_profiles
CREATE TRIGGER update_driver_profiles_updated_at
BEFORE UPDATE ON public.driver_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create trip chat messages table
CREATE TABLE public.trip_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID NOT NULL,
  sender_id UUID NOT NULL,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('client', 'driver')),
  message_type TEXT NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'location', 'system')),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on trip_messages
ALTER TABLE public.trip_messages ENABLE ROW LEVEL SECURITY;

-- Create policies for trip_messages
CREATE POLICY "Trip participants can manage messages"
ON public.trip_messages
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM transport_bookings 
    WHERE transport_bookings.id = trip_messages.booking_id 
    AND (transport_bookings.user_id = auth.uid() OR transport_bookings.driver_id = auth.uid())
  )
);

-- Add realtime subscription for tables
ALTER PUBLICATION supabase_realtime ADD TABLE driver_locations;
ALTER PUBLICATION supabase_realtime ADD TABLE trip_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE transport_bookings;