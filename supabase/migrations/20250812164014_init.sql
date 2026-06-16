-- Phase 1: Fix Role Permissions System
-- First, let's populate the role_permissions table with proper permissions

-- Insert missing permissions for admin roles
INSERT INTO public.role_permissions (role, admin_role, permission, is_active) VALUES
-- Super Admin permissions (all permissions)
('admin', 'super_admin', 'users_read', true),
('admin', 'super_admin', 'users_write', true),
('admin', 'super_admin', 'users_delete', true),
('admin', 'super_admin', 'drivers_read', true),
('admin', 'super_admin', 'drivers_write', true),
('admin', 'super_admin', 'drivers_validate', true),
('admin', 'super_admin', 'partners_read', true),
('admin', 'super_admin', 'partners_write', true),
('admin', 'super_admin', 'partners_validate', true),
('admin', 'super_admin', 'finance_read', true),
('admin', 'super_admin', 'finance_write', true),
('admin', 'super_admin', 'finance_admin', true),
('admin', 'super_admin', 'transport_read', true),
('admin', 'super_admin', 'transport_write', true),
('admin', 'super_admin', 'transport_admin', true),
('admin', 'super_admin', 'marketplace_read', true),
('admin', 'super_admin', 'marketplace_write', true),
('admin', 'super_admin', 'marketplace_moderate', true),
('admin', 'super_admin', 'support_read', true),
('admin', 'super_admin', 'support_write', true),
('admin', 'super_admin', 'support_admin', true),
('admin', 'super_admin', 'analytics_read', true),
('admin', 'super_admin', 'analytics_admin', true),
('admin', 'super_admin', 'notifications_read', true),
('admin', 'super_admin', 'notifications_write', true),
('admin', 'super_admin', 'notifications_admin', true),
('admin', 'super_admin', 'system_admin', true),

-- Admin Financier permissions
('admin', 'admin_financier', 'finance_read', true),
('admin', 'admin_financier', 'finance_write', true),
('admin', 'admin_financier', 'finance_admin', true),
('admin', 'admin_financier', 'analytics_read', true),
('admin', 'admin_financier', 'users_read', true),
('admin', 'admin_financier', 'drivers_read', true),
('admin', 'admin_financier', 'partners_read', true),

-- Admin Transport permissions
('admin', 'admin_transport', 'transport_read', true),
('admin', 'admin_transport', 'transport_write', true),
('admin', 'admin_transport', 'transport_admin', true),
('admin', 'admin_transport', 'drivers_read', true),
('admin', 'admin_transport', 'drivers_write', true),
('admin', 'admin_transport', 'drivers_validate', true),
('admin', 'admin_transport', 'analytics_read', true),

-- Admin Marketplace permissions
('admin', 'admin_marketplace', 'marketplace_read', true),
('admin', 'admin_marketplace', 'marketplace_write', true),
('admin', 'admin_marketplace', 'marketplace_moderate', true),
('admin', 'admin_marketplace', 'users_read', true),
('admin', 'admin_marketplace', 'analytics_read', true),

-- Admin Support permissions
('admin', 'admin_support', 'support_read', true),
('admin', 'admin_support', 'support_write', true),
('admin', 'admin_support', 'support_admin', true),
('admin', 'admin_support', 'users_read', true),
('admin', 'admin_support', 'notifications_read', true),
('admin', 'admin_support', 'notifications_write', true),

-- Moderator permissions
('admin', 'moderator', 'marketplace_read', true),
('admin', 'moderator', 'marketplace_moderate', true),
('admin', 'moderator', 'support_read', true),
('admin', 'moderator', 'support_write', true),
('admin', 'moderator', 'users_read', true),

-- Default user permissions
('client', NULL, 'transport_read', true),
('client', NULL, 'marketplace_read', true),

-- Driver permissions
('driver', NULL, 'transport_read', true),
('driver', NULL, 'transport_write', true),

-- Partner permissions
('partner', NULL, 'transport_read', true),
('partner', NULL, 'marketplace_read', true),
('partner', NULL, 'marketplace_write', true),
('partner', NULL, 'partners_read', true)

ON CONFLICT (role, COALESCE(admin_role, 'null'::admin_role), permission) DO NOTHING;

-- Phase 2: Fix team_accounts table by adding missing status column
ALTER TABLE public.team_accounts 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'inactive'));

-- Update existing teams to have active status
UPDATE public.team_accounts SET status = 'active' WHERE status IS NULL;

-- Phase 3: Create sample admin user with super_admin role (if none exists)
DO $$ 
DECLARE
    admin_user_id UUID;
BEGIN
    -- Check if any super admin exists
    IF NOT EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE role = 'admin' AND admin_role = 'super_admin' AND is_active = true
    ) THEN
        -- Get the first authenticated user ID (assuming it's an admin)
        SELECT id INTO admin_user_id 
        FROM auth.users 
        ORDER BY created_at ASC 
        LIMIT 1;
        
        IF admin_user_id IS NOT NULL THEN
            -- Assign super admin role
            INSERT INTO public.user_roles (user_id, role, admin_role, assigned_by, is_active)
            VALUES (admin_user_id, 'admin', 'super_admin', admin_user_id, true)
            ON CONFLICT (user_id, role, COALESCE(admin_role, 'null'::admin_role)) DO NOTHING;
        END IF;
    END IF;
END $$;

-- Phase 4: Create some sample data for testing
-- Add sample driver profiles (if none exist)
INSERT INTO public.driver_profiles (
    user_id, license_number, vehicle_make, vehicle_model, vehicle_year, 
    vehicle_color, vehicle_plate, insurance_number, license_expiry, 
    insurance_expiry, vehicle_class, service_type, verification_status, is_active
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
    CASE (ROW_NUMBER() OVER()) % 5
        WHEN 0 THEN 'Blanc'
        WHEN 1 THEN 'Noir'
        WHEN 2 THEN 'Gris'
        WHEN 3 THEN 'Bleu'
        ELSE 'Rouge'
    END,
    'CD' || LPAD((ROW_NUMBER() OVER())::text, 4, '0') || 'KIN',
    'INS' || LPAD((ROW_NUMBER() OVER())::text, 8, '0'),
    CURRENT_DATE + INTERVAL '2 years',
    CURRENT_DATE + INTERVAL '1 year',
    CASE (ROW_NUMBER() OVER()) % 3
        WHEN 0 THEN 'standard'
        WHEN 1 THEN 'premium'
        ELSE 'economy'
    END,
    'taxi',
    CASE (ROW_NUMBER() OVER()) % 3
        WHEN 0 THEN 'verified'
        WHEN 1 THEN 'pending'
        ELSE 'rejected'
    END,
    CASE (ROW_NUMBER() OVER()) % 3
        WHEN 0 THEN true
        ELSE false
    END
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM public.driver_profiles WHERE user_id = u.id)
LIMIT 10;

-- Add corresponding driver locations for online status tracking
INSERT INTO public.driver_locations (
    driver_id, latitude, longitude, is_online, is_available, last_ping
)
SELECT 
    dp.user_id,
    -4.3 + (random() - 0.5) * 0.2, -- Around Kinshasa
    15.3 + (random() - 0.5) * 0.2,
    random() > 0.3, -- 70% online
    random() > 0.5, -- 50% available
    NOW() - (random() * INTERVAL '1 hour')
FROM public.driver_profiles dp
WHERE NOT EXISTS (SELECT 1 FROM public.driver_locations WHERE driver_id = dp.user_id);

-- Add sample rental vehicles for testing vehicle moderation
INSERT INTO public.rental_vehicles (
    partner_id, name, brand, model, year, license_plate, seats, 
    vehicle_class, daily_rate, moderation_status, features, images
)
SELECT 
    (SELECT id FROM public.partner_profiles LIMIT 1),
    brands.brand || ' ' || models.model || ' ' || years.year,
    brands.brand,
    models.model, 
    years.year,
    'CD' || LPAD(series.n::text, 4, '0') || 'LOC',
    seats.seat_count,
    classes.class_name,
    rates.rate,
    statuses.status,
    '{"climatisation": true, "gps": true}',
    '["https://example.com/car1.jpg"]'
FROM 
    (SELECT unnest(ARRAY['Toyota', 'Nissan', 'Honda', 'Hyundai']) as brand) brands,
    (SELECT unnest(ARRAY['Corolla', 'Sentra', 'Civic', 'Elantra']) as model) models,
    (SELECT unnest(ARRAY[2018, 2019, 2020, 2021]) as year) years,
    (SELECT unnest(ARRAY[4, 5, 7]) as seat_count) seats,
    (SELECT unnest(ARRAY['economy', 'standard', 'premium']) as class_name) classes,
    (SELECT unnest(ARRAY[25000, 35000, 45000]) as rate) rates,
    (SELECT unnest(ARRAY['pending', 'approved', 'rejected']) as status) statuses,
    (SELECT generate_series(1, 5) as n) series
WHERE (SELECT COUNT(*) FROM public.rental_vehicles) < 15
LIMIT 15;

-- Add sample team requests
INSERT INTO public.team_requests (
    user_id, company_name, industry, team_size, contact_email, 
    phone, request_reason, status
)
SELECT 
    u.id,
    'Entreprise ' || u.email,
    CASE (ROW_NUMBER() OVER()) % 4
        WHEN 0 THEN 'Transport'
        WHEN 1 THEN 'Commerce'
        WHEN 2 THEN 'Services'
        ELSE 'Construction'
    END,
    CASE (ROW_NUMBER() OVER()) % 3
        WHEN 0 THEN '1-10'
        WHEN 1 THEN '11-50'
        ELSE '51+'
    END,
    u.email,
    '+243' || LPAD((800000000 + (ROW_NUMBER() OVER()))::text, 9, '0'),
    'Demande de création d''équipe pour gérer les commandes en groupe',
    CASE (ROW_NUMBER() OVER()) % 3
        WHEN 0 THEN 'pending'
        WHEN 1 THEN 'approved'
        ELSE 'rejected'
    END
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM public.team_requests WHERE user_id = u.id)
LIMIT 8;