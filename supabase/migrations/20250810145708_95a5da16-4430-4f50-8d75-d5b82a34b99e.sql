-- Add unique constraint on driver_id to fix the ON CONFLICT error
ALTER TABLE public.driver_locations 
ADD CONSTRAINT driver_locations_driver_id_unique UNIQUE (driver_id);

-- Create an index for better performance on location queries
CREATE INDEX IF NOT EXISTS idx_driver_locations_online_available 
ON public.driver_locations (is_online, is_available) 
WHERE is_online = true;

-- Create an index for geospatial queries
CREATE INDEX IF NOT EXISTS idx_driver_locations_coordinates 
ON public.driver_locations (latitude, longitude) 
WHERE is_online = true AND is_available = true;