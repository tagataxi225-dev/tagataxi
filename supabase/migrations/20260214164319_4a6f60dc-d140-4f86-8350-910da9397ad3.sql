
ALTER TABLE service_configurations 
ADD COLUMN service_status text NOT NULL DEFAULT 'active' 
CHECK (service_status IN ('active', 'inactive', 'coming_soon'));

UPDATE service_configurations 
SET service_status = CASE WHEN is_active THEN 'active' ELSE 'inactive' END;
