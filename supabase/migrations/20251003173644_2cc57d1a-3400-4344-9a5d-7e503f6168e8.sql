-- ============================================
-- CORRECTION RLS SUBSCRIPTION_PLANS
-- Simplification de is_current_user_admin() et des politiques
-- ============================================

-- 1. Modifier is_current_user_admin() en SQL pur (plus performant)
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
      AND role = 'admin'::user_role
      AND is_active = true
  );
$$;

-- 2. Supprimer l'ancienne politique problématique
DROP POLICY IF EXISTS subscription_plans_admin_all ON public.subscription_plans;

-- 3. Créer une nouvelle politique avec vérification directe
CREATE POLICY subscription_plans_admin_full_access 
ON public.subscription_plans
FOR ALL 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role = 'admin'::user_role
      AND is_active = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role = 'admin'::user_role
      AND is_active = true
  )
);

-- 4. Ajouter une politique de lecture publique pour les plans actifs
CREATE POLICY subscription_plans_public_read 
ON public.subscription_plans
FOR SELECT 
TO authenticated
USING (is_active = true);