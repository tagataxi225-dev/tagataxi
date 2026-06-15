-- ========================================
-- PHASE 1: Synchroniser user_roles avec admins
-- ========================================
INSERT INTO public.user_roles (user_id, role, admin_role, is_active)
SELECT 
  a.user_id,
  'admin'::user_role,
  CASE 
    WHEN a.admin_level = 'super_admin' THEN 'super_admin'::admin_role
    WHEN a.admin_level = 'admin_financier' THEN 'admin_financier'::admin_role
    WHEN a.admin_level = 'admin_transport' THEN 'admin_transport'::admin_role
    WHEN a.admin_level = 'admin_marketplace' THEN 'admin_marketplace'::admin_role
    WHEN a.admin_level = 'admin_support' THEN 'admin_support'::admin_role
    ELSE 'moderator'::admin_role
  END,
  a.is_active
FROM public.admins a
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_roles ur 
  WHERE ur.user_id = a.user_id AND ur.role = 'admin'::user_role
);

-- ========================================
-- PHASE 2: Supprimer les politiques qui utilisent is_current_user_admin_secure()
-- ========================================
DROP POLICY IF EXISTS "user_roles_admin_view_secure" ON public.user_roles;
DROP POLICY IF EXISTS "clients_admin_view_secure" ON public.clients;
DROP POLICY IF EXISTS "chauffeurs_admin_view_secure" ON public.chauffeurs;
DROP POLICY IF EXISTS "partenaires_admin_view_secure" ON public.partenaires;

-- ========================================
-- PHASE 3: Nettoyer les politiques RLS redondantes sur user_roles
-- ========================================
DROP POLICY IF EXISTS "user_roles_admin_simple" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_own_access" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_self_read" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_self_read_only" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_self_select" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_self_view" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_secure_self_access" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_admin_manage" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_secure_admin_access" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage all roles secure" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view own roles enhanced" ON public.user_roles;
DROP POLICY IF EXISTS "Prevent self role elevation" ON public.user_roles;
DROP POLICY IF EXISTS "Prevent unauthorized role changes" ON public.user_roles;
DROP POLICY IF EXISTS "Admins manage all user roles" ON public.user_roles;
DROP POLICY IF EXISTS "super_admin_full_control" ON public.user_roles;
DROP POLICY IF EXISTS "admin_view_all_roles" ON public.user_roles;

-- ========================================
-- PHASE 4: Supprimer les fonctions redondantes
-- ========================================
DROP FUNCTION IF EXISTS public.is_current_user_admin_secure() CASCADE;
DROP FUNCTION IF EXISTS public.get_current_user_admin_status() CASCADE;

-- ========================================
-- PHASE 5: Fonction unifiée pour vérifier admin
-- ========================================
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
      AND role = 'admin'::user_role
      AND is_active = true
  );
$$;

-- ========================================
-- PHASE 6: Fonction pour vérifier super admin
-- ========================================
CREATE OR REPLACE FUNCTION public.is_user_super_admin(check_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = check_user_id
      AND role = 'admin'::user_role
      AND admin_role = 'super_admin'::admin_role
      AND is_active = true
  );
$$;

-- ========================================
-- PHASE 7: Recréer les politiques essentielles sur user_roles
-- ========================================
CREATE POLICY "user_roles_self_access" ON public.user_roles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "user_roles_admin_full_access" ON public.user_roles
  FOR ALL TO authenticated
  USING (is_current_user_admin());

CREATE POLICY "prevent_self_elevation" ON public.user_roles
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() != user_id OR is_user_super_admin(auth.uid()));

CREATE POLICY "prevent_self_modification" ON public.user_roles
  FOR UPDATE TO authenticated
  USING (auth.uid() != user_id OR is_user_super_admin(auth.uid()));

-- ========================================
-- PHASE 8: Recréer les politiques sur clients, chauffeurs, partenaires
-- ========================================
CREATE POLICY "clients_admin_view_secure" ON public.clients
  FOR SELECT TO authenticated
  USING ((auth.uid() = user_id) OR is_current_user_admin());

CREATE POLICY "chauffeurs_admin_view_secure" ON public.chauffeurs
  FOR SELECT TO authenticated
  USING ((auth.uid() = user_id) OR is_current_user_admin());

CREATE POLICY "partenaires_admin_view_secure" ON public.partenaires
  FOR SELECT TO authenticated
  USING ((auth.uid() = user_id) OR is_current_user_admin());