-- 1. PRIVILEGE ESCALATION: Drop overly broad user_roles_own_secure policy
DROP POLICY IF EXISTS "user_roles_own_secure" ON public.user_roles;

-- 2. INACTIVE ADMIN BYPASS: Add is_active check to is_current_user_admin()
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role = 'admin'
      AND is_active = true
  );
$$;

-- 3. CLIENT PII EXPOSURE: Drop the broad recipient search policy
DROP POLICY IF EXISTS "allow_recipient_search_for_transfers" ON public.clients;

-- Create a scoped RPC function for recipient lookup (returns minimal PII only)
CREATE OR REPLACE FUNCTION public.search_transfer_recipient(search_phone text)
RETURNS TABLE(id uuid, display_name text, phone_number text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT c.id, c.display_name, c.phone_number
  FROM public.clients c
  WHERE c.phone_number = search_phone
    AND c.is_active = true
  LIMIT 5;
$$;

-- 4. PUBLIC FINANCIAL ACCESS: Fix deferred_commissions policy
DROP POLICY IF EXISTS "Service role can manage deferred commissions" ON public.deferred_commissions;

CREATE POLICY "Service role can manage deferred commissions"
ON public.deferred_commissions
FOR ALL
TO authenticated
USING (current_setting('request.jwt.claim.role', true) = 'service_role')
WITH CHECK (current_setting('request.jwt.claim.role', true) = 'service_role');