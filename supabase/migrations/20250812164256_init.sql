-- Phase 1: Fix Role Permissions System (simplified approach)
-- Add missing permissions for admin roles first

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
('admin', 'moderator', 'users_read', true)

ON CONFLICT (role, admin_role, permission) DO NOTHING;