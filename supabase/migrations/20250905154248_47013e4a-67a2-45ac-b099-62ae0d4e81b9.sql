-- Phase 2: Fix Critical RLS Policy Gaps
-- Secure clients table - users can only access their own data
DROP POLICY IF EXISTS "admins_view_clients" ON public.clients;
DROP POLICY IF EXISTS "clients_own_data_only" ON public.clients;

CREATE POLICY "clients_own_data_strict" ON public.clients
FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "admins_view_clients_secure" ON public.clients
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() 
      AND ur.role = 'admin'
      AND ur.is_active = true
  )
);

-- Secure chauffeurs table
DROP POLICY IF EXISTS "admins_view_chauffeurs" ON public.chauffeurs;
DROP POLICY IF EXISTS "chauffeurs_own_data_only" ON public.chauffeurs;
DROP POLICY IF EXISTS "public_minimal_verified_drivers" ON public.chauffeurs;

CREATE POLICY "chauffeurs_own_data_strict" ON public.chauffeurs
FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "admins_view_chauffeurs_secure" ON public.chauffeurs
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() 
      AND ur.role = 'admin'
      AND ur.is_active = true
  )
);

-- Public can only see basic info of verified active drivers for booking
CREATE POLICY "public_verified_drivers_basic" ON public.chauffeurs
FOR SELECT TO authenticated
USING (
  verification_status = 'verified' 
  AND is_active = true
);

-- Secure admins table  
DROP POLICY IF EXISTS "admins_own_data_only" ON public.admins;
DROP POLICY IF EXISTS "admins_strict_own_data_only" ON public.admins;
DROP POLICY IF EXISTS "super_admins_view_others" ON public.admins;

CREATE POLICY "admins_own_data_strict" ON public.admins
FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "super_admins_view_others_secure" ON public.admins
FOR SELECT TO authenticated
USING (
  auth.uid() = user_id OR
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() 
      AND ur.role = 'admin'
      AND ur.admin_role = 'super_admin'
      AND ur.is_active = true
  )
);

-- Secure partenaires table
CREATE POLICY "partenaires_own_data_strict" ON public.partenaires
FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "admins_view_partenaires_secure" ON public.partenaires
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() 
      AND ur.role = 'admin'
      AND ur.is_active = true
  )
);