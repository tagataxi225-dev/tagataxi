-- ============================================
-- FIX CRITIQUE: Récursion infinie dans les RLS policies de user_roles
-- ============================================
-- Problème: Les policies se référencent récursivement à user_roles
-- Solution: Créer une fonction SECURITY DEFINER non-récursive
-- ============================================

-- Étape 1: Créer une fonction sécurisée pour vérifier les super admins
CREATE OR REPLACE FUNCTION public.is_user_super_admin(check_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
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

-- Étape 2: Remplacer les policies récursives

-- Supprimer prevent_self_role_elevation (récursive)
DROP POLICY IF EXISTS "prevent_self_role_elevation" ON public.user_roles;

-- Nouvelle policy sécurisée pour prévenir l'auto-élévation
CREATE POLICY "prevent_self_role_elevation_secure"
ON public.user_roles
FOR INSERT
TO public
WITH CHECK (
  (auth.uid() <> user_id) OR public.is_user_super_admin(auth.uid())
);

-- Supprimer prevent_self_role_modification (récursive)
DROP POLICY IF EXISTS "prevent_self_role_modification" ON public.user_roles;

-- Nouvelle policy sécurisée pour prévenir l'auto-modification
CREATE POLICY "prevent_self_role_modification_secure"
ON public.user_roles
FOR UPDATE
TO public
USING (
  (auth.uid() <> user_id) OR public.is_user_super_admin(auth.uid())
);

-- Supprimer super_admin_roles_full_access (récursive)
DROP POLICY IF EXISTS "super_admin_roles_full_access" ON public.user_roles;

-- Nouvelle policy sécurisée pour super admins
CREATE POLICY "super_admin_roles_full_access_secure"
ON public.user_roles
FOR ALL
TO public
USING (public.is_user_super_admin(auth.uid()))
WITH CHECK (public.is_user_super_admin(auth.uid()));

-- Étape 3: Nettoyer les policies redondantes
DROP POLICY IF EXISTS "super_admins_manage_user_roles" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_admin_full_access" ON public.user_roles;

-- Ajouter un commentaire pour documenter le fix
COMMENT ON FUNCTION public.is_user_super_admin(uuid) IS 'Fonction SECURITY DEFINER pour vérifier les super admins sans récursion RLS. Utilisée par les policies de user_roles pour éviter les boucles infinies.';

COMMENT ON TABLE public.user_roles IS 'Table des rôles utilisateurs avec RLS sécurisé. Utilise is_user_super_admin() pour éviter la récursion infinie dans les policies.';