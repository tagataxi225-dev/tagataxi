
-- ============================================
-- FIX: Security Definer View - admin_directory_safe
-- ============================================
-- Issue: View uses SECURITY DEFINER and bypasses RLS
-- Solution: Drop the view and rely on proper RLS policies on admins table
-- The admins table already has RLS policies that are more secure
-- ============================================

-- Drop the insecure SECURITY DEFINER view
DROP VIEW IF EXISTS public.admin_directory_safe CASCADE;

-- The admins table already has proper RLS policies:
-- 1. admins_own_data_only: Users can only see/edit their own admin record
-- 2. super_admin_full_access: Super admins can see all admin records
-- These policies are more secure than the view's SECURITY DEFINER approach

-- Add a comment to document the security fix
COMMENT ON TABLE public.admins IS 'Admin user data with RLS policies. SECURITY DEFINER view removed for security compliance. Access controlled via RLS policies: admins_own_data_only and super_admin_full_access.';
