-- Fix critical security vulnerability: profiles table publicly accessible
-- Create secure RLS policies for profiles table

-- First, ensure RLS is enabled on profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop any existing overly permissive policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Anyone can view profiles" ON public.profiles;

-- Policy 1: Users can view and update their own profile
CREATE POLICY "Users can manage their own profile" 
ON public.profiles 
FOR ALL 
TO authenticated 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy 2: Users can view profiles of people they interact with in marketplace
CREATE POLICY "Users can view marketplace interaction profiles" 
ON public.profiles 
FOR SELECT 
TO authenticated 
USING (
  user_id IN (
    -- Profiles of sellers from whom user has bought
    SELECT seller_id FROM public.marketplace_orders 
    WHERE buyer_id = auth.uid()
    UNION
    -- Profiles of buyers who have bought from user
    SELECT buyer_id FROM public.marketplace_orders 
    WHERE seller_id = auth.uid()
    UNION
    -- Profiles of conversation participants
    SELECT seller_id FROM public.conversations 
    WHERE buyer_id = auth.uid()
    UNION
    SELECT buyer_id FROM public.conversations 
    WHERE seller_id = auth.uid()
  )
);

-- Policy 3: Users can view profiles of drivers who served them
CREATE POLICY "Users can view driver profiles from bookings" 
ON public.profiles 
FOR SELECT 
TO authenticated 
USING (
  user_id IN (
    -- Drivers from transport bookings
    SELECT driver_id FROM public.transport_bookings 
    WHERE user_id = auth.uid() AND driver_id IS NOT NULL
    UNION
    -- Drivers from delivery orders
    SELECT driver_id FROM public.delivery_orders 
    WHERE user_id = auth.uid() AND driver_id IS NOT NULL
  )
);

-- Policy 4: System can manage profiles for essential operations
CREATE POLICY "System can manage profiles via service role" 
ON public.profiles 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

-- Policy 5: Drivers can view customer profiles for active bookings
CREATE POLICY "Drivers can view customer profiles for active bookings" 
ON public.profiles 
FOR SELECT 
TO authenticated 
USING (
  user_id IN (
    -- Customers from current transport bookings
    SELECT user_id FROM public.transport_bookings 
    WHERE driver_id = auth.uid() 
    AND status IN ('confirmed', 'driver_assigned', 'driver_arrived', 'in_progress')
    UNION
    -- Customers from current delivery orders
    SELECT user_id FROM public.delivery_orders 
    WHERE driver_id = auth.uid() 
    AND status IN ('confirmed', 'driver_assigned', 'picked_up', 'in_transit')
  )
);

-- Create function to safely check if user exists (for public operations)
CREATE OR REPLACE FUNCTION public.user_exists(user_id_param uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = 'public'
AS $$
  SELECT EXISTS(SELECT 1 FROM public.profiles WHERE user_id = user_id_param);
$$;