-- Add sample driver requests and fix data structure
-- Add sample driver requests for testing the moderation system
INSERT INTO public.driver_requests (
    user_id, license_number, vehicle_make, vehicle_model, vehicle_year, 
    vehicle_plate, insurance_number, license_expiry, vehicle_type, 
    service_type, status
)
SELECT 
    u.id,
    'LIC' || LPAD((ROW_NUMBER() OVER())::text, 6, '0'),
    CASE (ROW_NUMBER() OVER()) % 4 
        WHEN 0 THEN 'Toyota'
        WHEN 1 THEN 'Nissan' 
        WHEN 2 THEN 'Honda'
        ELSE 'Hyundai'
    END,
    CASE (ROW_NUMBER() OVER()) % 4
        WHEN 0 THEN 'Corolla'
        WHEN 1 THEN 'Sentra'
        WHEN 2 THEN 'Civic' 
        ELSE 'Elantra'
    END,
    2015 + ((ROW_NUMBER() OVER()) % 8),
    'CD' || LPAD((ROW_NUMBER() OVER())::text, 4, '0') || 'KIN',
    'INS' || LPAD((ROW_NUMBER() OVER())::text, 8, '0'),
    CURRENT_DATE + INTERVAL '2 years',
    'sedan',
    'taxi',
    CASE (ROW_NUMBER() OVER()) % 3
        WHEN 0 THEN 'pending'
        WHEN 1 THEN 'approved'
        ELSE 'rejected'
    END
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM public.driver_requests WHERE user_id = u.id)
LIMIT 8;

-- Add some default permissions for regular roles if they don't exist
INSERT INTO public.role_permissions (role, permission, is_active) VALUES
('client', 'transport_read', true),
('client', 'marketplace_read', true),
('driver', 'transport_read', true),
('driver', 'transport_write', true),
('partner', 'transport_read', true),
('partner', 'marketplace_read', true),
('partner', 'marketplace_write', true),
('partner', 'partners_read', true)
ON CONFLICT (role, permission) DO NOTHING;