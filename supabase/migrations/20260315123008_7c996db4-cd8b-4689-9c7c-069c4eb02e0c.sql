-- Add eco and confort to valid vehicle classes
ALTER TABLE driver_locations DROP CONSTRAINT driver_locations_vehicle_class_check;
ALTER TABLE driver_locations ADD CONSTRAINT driver_locations_vehicle_class_check 
  CHECK (vehicle_class = ANY (ARRAY['standard', 'premium', 'moto', 'car', 'truck', 'van', 'bike', 'eco', 'confort']));