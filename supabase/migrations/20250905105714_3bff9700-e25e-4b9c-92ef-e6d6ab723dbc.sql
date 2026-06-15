-- Phase 1: Critical RLS Policy Fixes
-- Fix infinite recursion in user_roles policies and add security definer functions

-- First, drop the problematic recursive policy if it exists  
DROP POLICY IF EXISTS "user_roles_self_access" ON public.user_roles;

-- Create security definer functions to prevent RLS recursion
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admins 
    WHERE user_id = auth.uid() 
      AND is_active = true
  );
$$;

CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT role::text FROM public.user_roles 
  WHERE user_id = auth.uid() 
  LIMIT 1;
$$;

-- Fix the type casting issue in has_user_role function
CREATE OR REPLACE FUNCTION public.has_user_role(check_role text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
      AND role::text = check_role
      AND is_active = true
  );
$$;

-- Create safe RLS policies for user_roles using security definer functions
CREATE POLICY "user_roles_self_read" ON public.user_roles
FOR SELECT USING (
  auth.uid() = user_id OR public.is_current_user_admin()
);

CREATE POLICY "user_roles_admin_manage" ON public.user_roles
FOR ALL USING (
  public.is_current_user_admin()
);

-- Phase 2: Data Access Security Fixes
-- Add RLS to dynamic_pricing table
ALTER TABLE public.dynamic_pricing ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read dynamic pricing" ON public.dynamic_pricing;
DROP POLICY IF EXISTS "Admins manage dynamic pricing" ON public.dynamic_pricing;

CREATE POLICY "authenticated_read_dynamic_pricing" ON public.dynamic_pricing
FOR SELECT TO authenticated USING (true);

CREATE POLICY "admin_manage_dynamic_pricing" ON public.dynamic_pricing
FOR ALL USING (public.is_current_user_admin());

-- Phase 3: Enhanced Input Validation
-- Add validation triggers for critical inputs
CREATE OR REPLACE FUNCTION public.validate_email_format()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.email IS NOT NULL AND NEW.email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
    RAISE EXCEPTION 'Format d''email invalide: %', NEW.email;
  END IF;
  RETURN NEW;
END;
$$;

-- Apply email validation to user tables if triggers don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'validate_client_email') THEN
    CREATE TRIGGER validate_client_email 
      BEFORE INSERT OR UPDATE ON public.clients
      FOR EACH ROW EXECUTE FUNCTION public.validate_email_format();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'validate_chauffeur_email') THEN
    CREATE TRIGGER validate_chauffeur_email 
      BEFORE INSERT OR UPDATE ON public.chauffeurs
      FOR EACH ROW EXECUTE FUNCTION public.validate_email_format();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'validate_admin_email') THEN
    CREATE TRIGGER validate_admin_email 
      BEFORE INSERT OR UPDATE ON public.admins
      FOR EACH ROW EXECUTE FUNCTION public.validate_email_format();
  END IF;
END $$;

-- Phase 4: Enhanced Security Logging
CREATE TABLE IF NOT EXISTS public.security_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  action_type text NOT NULL,
  resource_type text NOT NULL,
  resource_id uuid,
  ip_address inet,
  user_agent text,
  success boolean DEFAULT true,
  error_message text,
  metadata jsonb DEFAULT '{}',
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on security logs
ALTER TABLE public.security_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "security_audit_logs_admin_only" ON public.security_audit_logs
FOR ALL USING (public.is_current_user_admin());

-- Create function to log security events
CREATE OR REPLACE FUNCTION public.log_security_event(
  p_action_type text,
  p_resource_type text,
  p_resource_id uuid DEFAULT NULL,
  p_success boolean DEFAULT true,
  p_error_message text DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.security_audit_logs (
    user_id, action_type, resource_type, resource_id,
    success, error_message, metadata
  ) VALUES (
    auth.uid(), p_action_type, p_resource_type, p_resource_id,
    p_success, p_error_message, p_metadata
  );
END;
$$;

-- Add indexes for performance on security-critical tables
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id_active 
ON public.user_roles(user_id) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_admins_user_id_active 
ON public.admins(user_id) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_security_audit_logs_user_action 
ON public.security_audit_logs(user_id, action_type, created_at);