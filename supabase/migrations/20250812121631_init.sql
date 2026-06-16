-- Fix critical security vulnerability: driver_credits table publicly accessible
-- Remove overly permissive policy and replace with secure system policy

-- Drop the problematic policy that allows public access
DROP POLICY IF EXISTS "System can manage driver credits" ON public.driver_credits;

-- Create a more restrictive system policy for edge functions only
-- This allows system operations but not public access
CREATE POLICY "System can manage driver credits via service role" 
ON public.driver_credits 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

-- Ensure the existing driver-only policy is still active
-- (This should already exist but confirming it's properly set)
DROP POLICY IF EXISTS "Drivers can view their own credits" ON public.driver_credits;
CREATE POLICY "Drivers can view their own credits" 
ON public.driver_credits 
FOR SELECT 
TO authenticated 
USING (auth.uid() = driver_id);

-- Ensure finance team can still access for admin purposes
-- (This should already exist but confirming it's properly set)
DROP POLICY IF EXISTS "Finance can view all driver credits" ON public.driver_credits;
CREATE POLICY "Finance can view all driver credits" 
ON public.driver_credits 
FOR SELECT 
TO authenticated 
USING (
  has_permission(auth.uid(), 'finance_read'::permission) OR 
  has_permission(auth.uid(), 'finance_write'::permission) OR 
  has_permission(auth.uid(), 'finance_admin'::permission)
);