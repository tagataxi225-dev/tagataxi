-- Add service_type to driver_profiles table
ALTER TABLE public.driver_profiles 
ADD COLUMN service_type TEXT DEFAULT 'taxi' CHECK (service_type IN ('taxi', 'delivery', 'both'));

-- Add service_type to driver_requests table  
ALTER TABLE public.driver_requests
ADD COLUMN service_type TEXT DEFAULT 'taxi' CHECK (service_type IN ('taxi', 'delivery', 'both'));

-- Update vehicle_class options in partner_taxi_vehicles to include new classes
ALTER TABLE public.partner_taxi_vehicles 
DROP CONSTRAINT IF EXISTS partner_taxi_vehicles_vehicle_class_check;

ALTER TABLE public.partner_taxi_vehicles 
ADD CONSTRAINT partner_taxi_vehicles_vehicle_class_check 
CHECK (vehicle_class IN ('moto', 'eco', 'premium', 'first_class', 'bus'));

-- Update vehicle_class options in driver_profiles
ALTER TABLE public.driver_profiles 
DROP CONSTRAINT IF EXISTS driver_profiles_vehicle_class_check;

ALTER TABLE public.driver_profiles 
ADD CONSTRAINT driver_profiles_vehicle_class_check 
CHECK (vehicle_class IN ('moto', 'eco', 'premium', 'first_class', 'bus'));

-- Update driver_locations vehicle_class
ALTER TABLE public.driver_locations 
DROP CONSTRAINT IF EXISTS driver_locations_vehicle_class_check;

ALTER TABLE public.driver_locations 
ADD CONSTRAINT driver_locations_vehicle_class_check 
CHECK (vehicle_class IN ('moto', 'eco', 'premium', 'first_class', 'bus'));