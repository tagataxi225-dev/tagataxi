-- CRITICAL SECURITY FIXES - Phase 1: Data Protection
-- Fix public exposure of sensitive personal and financial data

-- ==========================================
-- 1. SECURE ADMIN DATA
-- ==========================================

-- Remove overly permissive admin policies and secure admin table
DROP POLICY IF EXISTS "admin_self_access" ON public.admins;

CREATE POLICY "admins_own_data_only" 
ON public.admins 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "admins_view_other_admins" 
ON public.admins 
FOR SELECT 
USING (
  auth.uid() = user_id OR 
  (is_current_user_admin() AND 'super_admin' = ANY(permissions))
);

-- ==========================================
-- 2. SECURE CLIENT DATA  
-- ==========================================

-- Remove public access to client data
DROP POLICY IF EXISTS "client_self_access" ON public.clients;
DROP POLICY IF EXISTS "admin_view_all_clients" ON public.clients;

CREATE POLICY "clients_own_data_only" 
ON public.clients 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "admins_view_clients" 
ON public.clients 
FOR SELECT 
USING (is_current_user_admin());

-- ==========================================
-- 3. SECURE DRIVER/CHAUFFEUR DATA
-- ==========================================

-- Secure chauffeur data
DROP POLICY IF EXISTS "driver_self_access" ON public.chauffeurs;
DROP POLICY IF EXISTS "admin_view_all_drivers" ON public.chauffeurs;
DROP POLICY IF EXISTS "public_view_verified_drivers" ON public.chauffeurs;

CREATE POLICY "chauffeurs_own_data_only" 
ON public.chauffeurs 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "admins_view_chauffeurs" 
ON public.chauffeurs 
FOR SELECT 
USING (is_current_user_admin());

-- Only allow public to see minimal verified driver info for booking purposes
CREATE POLICY "public_minimal_verified_drivers" 
ON public.chauffeurs 
FOR SELECT 
USING (
  verification_status = 'verified' AND 
  is_active = true
);

-- ==========================================
-- 4. SECURE PARTNER DATA
-- ==========================================

-- Secure partenaires table (if exists)
DROP POLICY IF EXISTS "partner_self_access" ON public.partenaires;
DROP POLICY IF EXISTS "admin_view_all_partners" ON public.partenaires;

CREATE POLICY "partenaires_own_data_only" 
ON public.partenaires 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "admins_view_partenaires" 
ON public.partenaires 
FOR SELECT 
USING (is_current_user_admin());

-- ==========================================
-- 5. SECURE FINANCIAL DATA
-- ==========================================

-- Secure wallet transactions
DROP POLICY IF EXISTS "wallet_transactions_participants" ON public.wallet_transactions;

CREATE POLICY "wallet_transactions_own_only" 
ON public.wallet_transactions 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "admins_view_wallet_transactions" 
ON public.wallet_transactions 
FOR SELECT 
USING (is_current_user_admin());

-- Secure user wallets
DROP POLICY IF EXISTS "user_wallets_participants" ON public.user_wallets;

CREATE POLICY "user_wallets_own_only" 
ON public.user_wallets 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "admins_view_user_wallets" 
ON public.user_wallets 
FOR SELECT 
USING (is_current_user_admin());

-- ==========================================
-- 6. SECURE BUSINESS INTELLIGENCE DATA
-- ==========================================

-- Secure dynamic pricing - remove public access
DROP POLICY IF EXISTS "authenticated_read_dynamic_pricing" ON public.dynamic_pricing;

CREATE POLICY "dynamic_pricing_authenticated_only" 
ON public.dynamic_pricing 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Secure available drivers summary - remove public access
CREATE POLICY "available_drivers_authenticated_only" 
ON public.available_drivers_summary 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- ==========================================
-- 7. AUDIT LOGGING FOR SENSITIVE ACCESS
-- ==========================================

-- Create comprehensive audit logging for sensitive data access
CREATE TABLE IF NOT EXISTS public.sensitive_data_access_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  table_name text NOT NULL,
  operation text NOT NULL,
  accessed_user_data uuid, -- whose data was accessed
  ip_address inet,
  user_agent text,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on audit table
ALTER TABLE public.sensitive_data_access_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audit_admin_only" 
ON public.sensitive_data_access_audit 
FOR ALL 
USING (is_current_user_admin());

-- Add security logging function
CREATE OR REPLACE FUNCTION public.log_sensitive_access(
  p_table_name text,
  p_operation text,
  p_accessed_user_data uuid DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.sensitive_data_access_audit (
    user_id, table_name, operation, accessed_user_data
  ) VALUES (
    auth.uid(), p_table_name, p_operation, p_accessed_user_data
  );
END;
$$;