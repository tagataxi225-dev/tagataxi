-- Fix critical security vulnerability: vendor_earnings table publicly accessible
-- Create secure RLS policies for vendor_earnings table

-- First, ensure RLS is enabled on vendor_earnings table
ALTER TABLE public.vendor_earnings ENABLE ROW LEVEL SECURITY;

-- Drop any existing overly permissive policies
DROP POLICY IF EXISTS "Public vendor earnings are viewable by everyone" ON public.vendor_earnings;
DROP POLICY IF EXISTS "Anyone can view vendor earnings" ON public.vendor_earnings;
DROP POLICY IF EXISTS "Everyone can view vendor earnings" ON public.vendor_earnings;

-- Policy 1: Vendors can only view and manage their own earnings
CREATE POLICY "Vendors can manage their own earnings" 
ON public.vendor_earnings 
FOR ALL 
TO authenticated 
USING (auth.uid() = vendor_id)
WITH CHECK (auth.uid() = vendor_id);

-- Policy 2: System can manage vendor earnings for essential operations
CREATE POLICY "System can manage vendor earnings via service role" 
ON public.vendor_earnings 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

-- Policy 3: Finance team can view all vendor earnings for admin purposes
CREATE POLICY "Finance team can view all vendor earnings" 
ON public.vendor_earnings 
FOR SELECT 
TO authenticated 
USING (
  has_permission(auth.uid(), 'finance_read'::permission) OR 
  has_permission(auth.uid(), 'finance_write'::permission) OR 
  has_permission(auth.uid(), 'finance_admin'::permission) OR
  has_permission(auth.uid(), 'marketplace_read'::permission) OR
  has_permission(auth.uid(), 'marketplace_write'::permission) OR
  has_permission(auth.uid(), 'marketplace_moderate'::permission)
);

-- Policy 4: Platform admins can manage vendor earnings for dispute resolution
CREATE POLICY "Platform admins can manage vendor earnings" 
ON public.vendor_earnings 
FOR ALL 
TO authenticated 
USING (
  has_permission(auth.uid(), 'marketplace_moderate'::permission) OR
  has_permission(auth.uid(), 'finance_admin'::permission) OR
  has_permission(auth.uid(), 'system_admin'::permission)
)
WITH CHECK (
  has_permission(auth.uid(), 'marketplace_moderate'::permission) OR
  has_permission(auth.uid(), 'finance_admin'::permission) OR
  has_permission(auth.uid(), 'system_admin'::permission)
);