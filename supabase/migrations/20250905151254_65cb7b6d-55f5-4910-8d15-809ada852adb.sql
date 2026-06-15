-- Fix infinite recursion in admin policies by creating a new security definer function
-- and updating the problematic RLS policies

-- First, let's create a proper security definer function that avoids recursion
CREATE OR REPLACE FUNCTION public.get_current_user_admin_status()
RETURNS BOOLEAN AS $$
BEGIN
  -- Check directly in the admins table without going through RLS
  RETURN EXISTS (
    SELECT 1 FROM public.admins 
    WHERE user_id = auth.uid() 
      AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Drop the problematic policy that causes recursion
DROP POLICY IF EXISTS "admins_view_other_admins" ON public.admins;

-- Create a new policy that doesn't cause recursion
-- Admins can only see their own data, period. No cross-admin viewing to avoid recursion.
CREATE POLICY "admins_strict_own_data_only" 
ON public.admins
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create a separate policy for super admins to view other admins if needed
-- This uses a direct permission check instead of the recursive function
CREATE POLICY "super_admins_view_others" 
ON public.admins
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id OR (
    -- Check if current user is a super admin directly
    EXISTS (
      SELECT 1 FROM public.admins 
      WHERE user_id = auth.uid() 
        AND is_active = true 
        AND 'super_admin'::text = ANY(permissions)
    )
  )
);

-- Update other functions that might cause similar issues
-- Fix the original is_current_user_admin function to use security definer properly
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT public.get_current_user_admin_status();
$$;

-- Create a function to check specific admin permissions safely
CREATE OR REPLACE FUNCTION public.has_admin_permission(permission_name text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER  
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admins 
    WHERE user_id = auth.uid() 
      AND is_active = true 
      AND permission_name = ANY(permissions)
  );
$$;

-- Ensure the admins table has proper constraints for security
-- Add constraint to ensure user_id is not null (security requirement)
ALTER TABLE public.admins 
ALTER COLUMN user_id SET NOT NULL;

-- Add constraint to ensure email uniqueness across the system
-- This prevents duplicate admin accounts
ALTER TABLE public.admins 
ADD CONSTRAINT admins_unique_email UNIQUE (email);

-- Add constraint to ensure phone uniqueness across the system  
ALTER TABLE public.admins 
ADD CONSTRAINT admins_unique_phone UNIQUE (phone_number);

-- Create an index on user_id for better performance on RLS policies
CREATE INDEX IF NOT EXISTS idx_admins_user_id ON public.admins(user_id);

-- Create an index on is_active for better performance  
CREATE INDEX IF NOT EXISTS idx_admins_active ON public.admins(is_active) WHERE is_active = true;