-- Fix remaining security warnings
-- Update all remaining functions to have proper search_path

-- Fix the generate_ticket_number function if it exists
CREATE OR REPLACE FUNCTION public.generate_ticket_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  ticket_num TEXT;
BEGIN
  -- Generate a unique ticket number with format: TK-YYYY-XXXXXX
  ticket_num := 'TK-' || 
               to_char(NOW(), 'YYYY') || '-' || 
               lpad(floor(random() * 999999)::text, 6, '0');
  
  -- Ensure uniqueness
  WHILE EXISTS (SELECT 1 FROM public.enhanced_support_tickets WHERE ticket_number = ticket_num) LOOP
    ticket_num := 'TK-' || 
                 to_char(NOW(), 'YYYY') || '-' || 
                 lpad(floor(random() * 999999)::text, 6, '0');
  END LOOP;
  
  RETURN ticket_num;
END;
$$;

-- Fix the update_updated_at_column function if it exists
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Fix any other common functions that might be missing search_path
CREATE OR REPLACE FUNCTION public.has_permission(_user_id uuid, _permission permission)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.role_permissions rp ON (
      rp.role = ur.role 
      AND (rp.admin_role = ur.admin_role OR (rp.admin_role IS NULL AND ur.admin_role IS NULL))
    )
    WHERE ur.user_id = _user_id
      AND ur.is_active = true
      AND rp.permission = _permission
      AND rp.is_active = true
      AND (ur.expires_at IS NULL OR ur.expires_at > now())
  )
$function$;

-- Fix get_user_roles function
CREATE OR REPLACE FUNCTION public.get_user_roles(_user_id uuid)
RETURNS TABLE(role user_role, admin_role admin_role, permissions permission[])
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $function$
  SELECT 
    ur.role,
    ur.admin_role,
    ARRAY_AGG(rp.permission) as permissions
  FROM public.user_roles ur
  LEFT JOIN public.role_permissions rp ON (
    rp.role = ur.role 
    AND (rp.admin_role = ur.admin_role OR (rp.admin_role IS NULL AND ur.admin_role IS NULL))
    AND rp.is_active = true
  )
  WHERE ur.user_id = _user_id
    AND ur.is_active = true
    AND (ur.expires_at IS NULL OR ur.expires_at > now())
  GROUP BY ur.role, ur.admin_role
$function$;

-- Fix user_exists function
CREATE OR REPLACE FUNCTION public.user_exists(user_id_param uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $function$
  SELECT EXISTS(SELECT 1 FROM public.profiles WHERE user_id = user_id_param);
$function$;

-- Additional security hardening for financial tables
-- Add more restrictive policies to vendor_earnings table
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'vendor_earnings') THEN
    -- Create audit trigger for vendor earnings access
    CREATE OR REPLACE FUNCTION public.audit_vendor_earnings_access()
    RETURNS TRIGGER
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = 'public'
    AS $function$
    BEGIN
      -- Audit access to sensitive financial data
      IF auth.uid() IS NOT NULL AND auth.uid() != NEW.vendor_id THEN
        INSERT INTO public.payment_access_logs (
          accessed_by, target_payment_id, access_type, access_reason,
          sensitive_data_accessed
        ) VALUES (
          auth.uid(), NEW.id, 'vendor_earnings_access', 'Cross-vendor earnings access',
          jsonb_build_object(
            'amount', NEW.amount,
            'vendor_id', NEW.vendor_id,
            'status', NEW.status
          )
        );
      END IF;
      
      RETURN NEW;
    END;
    $function$;
  END IF;
END $$;