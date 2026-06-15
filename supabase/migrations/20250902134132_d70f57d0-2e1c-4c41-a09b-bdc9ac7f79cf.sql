-- Phase 1: Critical Payment Data Protection - FINAL FIX
-- Create audit logging table for payment access (if not exists)
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

-- Enable RLS on audit logs (if not already enabled)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'payment_access_logs' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE public.payment_access_logs ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Drop existing policies and recreate
DROP POLICY IF EXISTS "Only admins can view payment access logs" ON public.payment_access_logs;
DROP POLICY IF EXISTS "System can insert payment access logs" ON public.payment_access_logs;

-- Create policies for payment access logs
CREATE POLICY "Only admins can view payment access logs"
ON public.payment_access_logs
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.admins 
    WHERE user_id = auth.uid() AND is_active = true
  )
);

CREATE POLICY "System can insert payment access logs"
ON public.payment_access_logs
FOR INSERT
WITH CHECK (true);

-- Fix escrow_payments table security
-- Drop the overly permissive system policy
DROP POLICY IF EXISTS "System can manage escrow payments" ON public.escrow_payments;
DROP POLICY IF EXISTS "Participants can view their own escrow payments" ON public.escrow_payments;
DROP POLICY IF EXISTS "Service role can manage escrow payments" ON public.escrow_payments;

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

-- Create audit function for escrow_payments
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

-- Fix admin_notification_types security
DROP POLICY IF EXISTS "Everyone can view active notification types" ON public.admin_notification_types;
DROP POLICY IF EXISTS "Authenticated users can view active notification types" ON public.admin_notification_types;

-- Create more restrictive policy
CREATE POLICY "Authenticated users can view active notification types"
ON public.admin_notification_types
FOR SELECT
USING (
  auth.uid() IS NOT NULL AND is_active = true
);

-- Fix database functions security (key functions only)
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

-- Fix driver_credits table access
DROP POLICY IF EXISTS "System can manage driver credits via service role" ON public.driver_credits;
DROP POLICY IF EXISTS "Service role can manage driver credits for system operations" ON public.driver_credits;

-- Create more specific service role policy for driver credits
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

-- Additional security hardening for wallet_transactions
-- Ensure only authenticated users can access their own wallet transactions
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'wallet_transactions') THEN
    -- Drop overly permissive policies if they exist
    DROP POLICY IF EXISTS "System can insert wallet transactions" ON public.wallet_transactions;
    
    -- Create restrictive policy for wallet transactions
    CREATE POLICY "Service role can manage wallet transactions"
    ON public.wallet_transactions
    FOR INSERT
    WITH CHECK (auth.role() = 'service_role');
  END IF;
END $$;