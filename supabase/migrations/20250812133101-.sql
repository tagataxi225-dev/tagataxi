-- Insert test data for driver locations to enable real driver search
INSERT INTO public.driver_locations (driver_id, latitude, longitude, is_online, is_available, vehicle_class, last_ping) VALUES
-- Kinshasa drivers
('12345678-1234-1234-1234-123456789001', -4.3217, 15.3069, true, true, 'moto', now()),
('12345678-1234-1234-1234-123456789002', -4.3180, 15.3120, true, true, 'car', now()),
('12345678-1234-1234-1234-123456789003', -4.3250, 15.3000, true, true, 'truck', now()),
('12345678-1234-1234-1234-123456789004', -4.3100, 15.3150, true, true, 'moto', now()),
('12345678-1234-1234-1234-123456789005', -4.3300, 15.3200, true, true, 'car', now()),
('12345678-1234-1234-1234-123456789006', -4.3050, 15.2950, true, true, 'truck', now()),
('12345678-1234-1234-1234-123456789007', -4.3350, 15.3100, true, false, 'moto', now()),
('12345678-1234-1234-1234-123456789008', -4.3200, 15.3300, true, true, 'car', now());