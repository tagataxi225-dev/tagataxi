-- COMPREHENSIVE SECURITY HARDENING - FINAL CORRECTED VERSION
-- Fix database function security and consolidate RLS policies

-- 1. Fix database function search paths (Critical Security Issue)
CREATE OR REPLACE FUNCTION public.update_updated_at_escrow()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_promotional_ads_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- 2. Create comprehensive audit logging for sensitive data access
CREATE TABLE IF NOT EXISTS public.sensitive_data_access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  accessed_by UUID NOT NULL,
  target_table TEXT NOT NULL,
  target_record_id UUID,
  access_type TEXT NOT NULL,
  accessed_columns TEXT[],
  access_reason TEXT,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.sensitive_data_access_logs ENABLE ROW LEVEL SECURITY;

-- Only super admins can view audit logs
DROP POLICY IF EXISTS "Only super admins can view sensitive data access logs" ON public.sensitive_data_access_logs;
CREATE POLICY "Only super admins can view sensitive data access logs"
ON public.sensitive_data_access_logs
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.admins 
    WHERE user_id = auth.uid() 
      AND admin_level = 'super_admin' 
      AND is_active = true
  )
);

-- System can insert audit logs
DROP POLICY IF EXISTS "System can insert sensitive data access logs" ON public.sensitive_data_access_logs;
CREATE POLICY "System can insert sensitive data access logs"
ON public.sensitive_data_access_logs
FOR INSERT
WITH CHECK (true);

-- 3. Create secure data access logging function
CREATE OR REPLACE FUNCTION public.log_sensitive_data_access(
  p_target_table TEXT,
  p_target_record_id UUID DEFAULT NULL,
  p_access_type TEXT DEFAULT 'select',
  p_accessed_columns TEXT[] DEFAULT ARRAY[]::TEXT[],
  p_access_reason TEXT DEFAULT NULL
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  INSERT INTO public.sensitive_data_access_logs (
    accessed_by,
    target_table,
    target_record_id,
    access_type,
    accessed_columns,
    access_reason
  ) VALUES (
    auth.uid(),
    p_target_table,
    p_target_record_id,
    p_access_type,
    p_accessed_columns,
    p_access_reason
  );
EXCEPTION
  WHEN OTHERS THEN
    -- Silently fail to avoid breaking application flow
    NULL;
END;
$function$;

-- 4. Drop and recreate vendor_earnings policies
DROP POLICY IF EXISTS "Vendors can view their own earnings" ON public.vendor_earnings;
DROP POLICY IF EXISTS "Vendors can manage their own earnings" ON public.vendor_earnings;
DROP POLICY IF EXISTS "Finance can view all vendor earnings" ON public.vendor_earnings;
DROP POLICY IF EXISTS "System can manage vendor earnings" ON public.vendor_earnings;
DROP POLICY IF EXISTS "Vendors can view own earnings with audit" ON public.vendor_earnings;
DROP POLICY IF EXISTS "Finance admins can view all earnings with audit" ON public.vendor_earnings;

-- Create consolidated, secure policies
CREATE POLICY "Vendors view own earnings"
ON public.vendor_earnings
FOR SELECT
USING (auth.uid() = vendor_id);

CREATE POLICY "Finance admins view all earnings"
ON public.vendor_earnings
FOR SELECT
USING (
  has_permission(auth.uid(), 'finance_read'::permission) OR 
  has_permission(auth.uid(), 'finance_write'::permission) OR 
  has_permission(auth.uid(), 'finance_admin'::permission)
);

CREATE POLICY "System manages vendor earnings"
ON public.vendor_earnings
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- 5. Harden driver_credits access
DROP POLICY IF EXISTS "Finance can view all driver credits" ON public.driver_credits;
DROP POLICY IF EXISTS "Finance admins can view driver credits with audit" ON public.driver_credits;

CREATE POLICY "Finance admins view driver credits"
ON public.driver_credits
FOR SELECT
USING (
  has_permission(auth.uid(), 'finance_read'::permission) OR 
  has_permission(auth.uid(), 'finance_write'::permission) OR 
  has_permission(auth.uid(), 'finance_admin'::permission)
);

-- 6. Secure sensitive personal data access
CREATE OR REPLACE FUNCTION public.get_public_chauffeur_info(chauffeur_id UUID)
RETURNS TABLE(
  id UUID,
  display_name TEXT,
  vehicle_type TEXT,
  vehicle_model TEXT,
  vehicle_color TEXT,
  rating_average NUMERIC,
  total_rides INTEGER,
  verification_status TEXT,
  is_active BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  -- Log access to sensitive data
  PERFORM public.log_sensitive_data_access(
    'chauffeurs', 
    chauffeur_id, 
    'select', 
    ARRAY['display_name', 'vehicle_info'], 
    'Public chauffeur info access'
  );
  
  RETURN QUERY
  SELECT 
    c.id,
    c.display_name,
    c.vehicle_type,
    c.vehicle_model,
    c.vehicle_color,
    c.rating_average,
    c.total_rides,
    c.verification_status,
    c.is_active
  FROM public.chauffeurs c
  WHERE c.user_id = chauffeur_id 
    AND c.verification_status = 'verified' 
    AND c.is_active = true;
END;
$function$;

-- 7. Enhanced driver location security
CREATE OR REPLACE FUNCTION public.get_driver_location_with_audit(target_driver_id UUID)
RETURNS TABLE(
  driver_id UUID,
  latitude NUMERIC,
  longitude NUMERIC,
  is_online BOOLEAN,
  is_available BOOLEAN,
  vehicle_class TEXT,
  last_ping TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  is_authorized BOOLEAN := false;
BEGIN
  -- Check authorization
  IF auth.uid() = target_driver_id THEN
    is_authorized := true;
  ELSIF EXISTS (
    SELECT 1 FROM public.admins 
    WHERE user_id = auth.uid() AND is_active = true
  ) THEN
    is_authorized := true;
    -- Log admin access
    PERFORM public.log_sensitive_data_access(
      'driver_locations', 
      target_driver_id, 
      'select', 
      ARRAY['latitude', 'longitude'], 
      'Admin accessing driver location'
    );
  END IF;
  
  IF NOT is_authorized THEN
    RAISE EXCEPTION 'Unauthorized access to driver location data';
  END IF;
  
  RETURN QUERY
  SELECT 
    dl.driver_id,
    dl.latitude,
    dl.longitude,
    dl.is_online,
    dl.is_available,
    dl.vehicle_class,
    dl.last_ping
  FROM public.driver_locations dl
  WHERE dl.driver_id = target_driver_id
    AND dl.last_ping > now() - interval '1 hour';
END;
$function$;

-- 8. Consolidate partenaires policies
DROP POLICY IF EXISTS "Partners can view their own data" ON public.partenaires;
DROP POLICY IF EXISTS "Partenaires peuvent gérer leur propre profil" ON public.partenaires;
DROP POLICY IF EXISTS "Partners can manage own profile" ON public.partenaires;
DROP POLICY IF EXISTS "Admins can view all partners" ON public.partenaires;

CREATE POLICY "Partners manage own profile"
ON public.partenaires
FOR ALL
USING (auth.uid() = user_id);

CREATE POLICY "Admins view all partners"
ON public.partenaires
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.admins 
    WHERE user_id = auth.uid() AND is_active = true
  )
);