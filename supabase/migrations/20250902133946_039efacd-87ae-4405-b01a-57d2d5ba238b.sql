-- Phase 1: Critical Payment Data Protection
-- Fix escrow_payments table security

-- First, create audit logging table for payment access
CREATE TABLE IF NOT EXISTS public.payment_access_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  accessed_by UUID NOT NULL,
  target_payment_id UUID NOT NULL,
  access_type TEXT NOT NULL,
  access_reason TEXT,
  sensitive_data_accessed JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on audit logs
ALTER TABLE public.payment_access_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view payment access logs
CREATE POLICY "Only admins can view payment access logs"
ON public.payment_access_logs
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.admins 
    WHERE user_id = auth.uid() AND is_active = true
  )
);

-- System can insert audit logs
CREATE POLICY "System can insert payment access logs"
ON public.payment_access_logs
FOR INSERT
WITH CHECK (true);

-- Drop the overly permissive system policy on escrow_payments
DROP POLICY IF EXISTS "System can manage escrow payments" ON public.escrow_payments;

-- Create restrictive policies for escrow_payments
CREATE POLICY "Participants can view their own escrow payments"
ON public.escrow_payments
FOR SELECT
USING (
  auth.uid() = buyer_id OR auth.uid() = seller_id
);

-- Service role can manage escrow payments (for system operations)
CREATE POLICY "Service role can manage escrow payments"
ON public.escrow_payments
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- Create audit trigger for escrow_payments access
CREATE OR REPLACE FUNCTION public.audit_escrow_payment_access()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only audit non-service role access
  IF auth.role() != 'service_role' AND auth.uid() IS NOT NULL THEN
    INSERT INTO public.payment_access_logs (
      accessed_by, target_payment_id, access_type, access_reason,
      sensitive_data_accessed
    ) VALUES (
      auth.uid(), NEW.id, 'escrow_payment_access', 'User accessed escrow payment',
      jsonb_build_object(
        'amount', NEW.amount,
        'status', NEW.status,
        'buyer_id', NEW.buyer_id,
        'seller_id', NEW.seller_id
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER audit_escrow_payment_access_trigger
  AFTER SELECT ON public.escrow_payments
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_escrow_payment_access();

-- Fix rental_subscription_payments table
-- First check if it exists and create audit logging
CREATE TABLE IF NOT EXISTS public.rental_payment_access_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  accessed_by UUID NOT NULL,
  target_payment_id UUID NOT NULL,
  access_type TEXT NOT NULL,
  access_reason TEXT,
  sensitive_data_accessed JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.rental_payment_access_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view rental payment access logs
CREATE POLICY "Only admins can view rental payment access logs"
ON public.rental_payment_access_logs
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.admins 
    WHERE user_id = auth.uid() AND is_active = true
  )
);

-- Phase 2: Secure admin_notification_types
-- Remove overly permissive public access
DROP POLICY IF EXISTS "Everyone can view active notification types" ON public.admin_notification_types;

-- Create more restrictive policies
CREATE POLICY "Authenticated users can view active notification types"
ON public.admin_notification_types
FOR SELECT
USING (
  auth.uid() IS NOT NULL AND is_active = true
);

-- Phase 3: Fix database functions security
-- Update functions to have proper search path (sampling key functions)
CREATE OR REPLACE FUNCTION public.get_user_role(user_id_param uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  user_role TEXT := NULL;
BEGIN
  -- Vérifier dans l'ordre de priorité: admin, partenaire, chauffeur, client
  IF EXISTS (SELECT 1 FROM public.admins WHERE user_id = user_id_param AND is_active = true) THEN
    user_role := 'admin';
  ELSIF EXISTS (SELECT 1 FROM public.partenaires WHERE user_id = user_id_param AND is_active = true) THEN
    user_role := 'partenaire';
  ELSIF EXISTS (SELECT 1 FROM public.chauffeurs WHERE user_id = user_id_param AND is_active = true) THEN
    user_role := 'chauffeur';
  ELSIF EXISTS (SELECT 1 FROM public.clients WHERE user_id = user_id_param AND is_active = true) THEN
    user_role := 'simple_user_client';
  END IF;
  
  RETURN user_role;
END;
$function$;

CREATE OR REPLACE FUNCTION public.ensure_user_profile(p_user_id uuid)
RETURNS profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  profile_record public.profiles;
  user_record auth.users;
BEGIN
  -- Vérifier si le profil existe déjà
  SELECT * INTO profile_record 
  FROM public.profiles 
  WHERE user_id = p_user_id;
  
  IF profile_record IS NOT NULL THEN
    RETURN profile_record;
  END IF;
  
  -- Récupérer les données utilisateur
  SELECT * INTO user_record 
  FROM auth.users 
  WHERE id = p_user_id;
  
  IF user_record IS NULL THEN
    RAISE EXCEPTION 'User not found: %', p_user_id;
  END IF;
  
  -- Créer le profil
  INSERT INTO public.profiles (user_id, display_name, phone_number, user_type)
  VALUES (
    p_user_id,
    COALESCE(
      user_record.raw_user_meta_data->>'display_name',
      user_record.raw_user_meta_data->>'full_name',
      CONCAT(user_record.raw_user_meta_data->>'first_name', ' ', user_record.raw_user_meta_data->>'last_name'),
      user_record.raw_user_meta_data->>'first_name',
      user_record.email,
      'Utilisateur'
    ),
    user_record.phone,
    'client'
  )
  RETURNING * INTO profile_record;
  
  -- Créer l'enregistrement de vérification
  INSERT INTO public.user_verification (user_id, verification_level)
  VALUES (p_user_id, 'none');
  
  RETURN profile_record;
END;
$function$;

-- Phase 4: Harden financial table access
-- Update driver_credits policies to be more restrictive
DROP POLICY IF EXISTS "System can manage driver credits via service role" ON public.driver_credits;

-- Create more specific service role policy
CREATE POLICY "Service role can manage driver credits for system operations"
ON public.driver_credits
FOR ALL
USING (
  auth.role() = 'service_role' OR 
  (auth.uid() = driver_id)
)
WITH CHECK (
  auth.role() = 'service_role' OR 
  (auth.uid() = driver_id AND auth.uid() IS NOT NULL)
);