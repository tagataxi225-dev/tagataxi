-- =============================================
-- CORRECTION FONCTION ET POLICIES ABONNEMENTS (sans DROP)
-- =============================================

-- 1. Recréer la fonction is_current_user_admin SANS DROP (utiliser CREATE OR REPLACE)
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id uuid;
  is_admin_result boolean;
BEGIN
  -- Récupérer l'ID utilisateur actuel
  current_user_id := auth.uid();
  
  -- Si pas d'utilisateur connecté, retourner false
  IF current_user_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Vérifier dans la table admins
  SELECT EXISTS (
    SELECT 1 FROM public.admins 
    WHERE user_id = current_user_id 
      AND is_active = true
  ) INTO is_admin_result;
  
  -- Si trouvé dans admins, retourner true
  IF is_admin_result THEN
    RETURN true;
  END IF;
  
  -- Vérifier aussi dans user_roles pour double sécurité
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = current_user_id 
      AND role = 'admin'
      AND is_active = true
  ) INTO is_admin_result;
  
  RETURN is_admin_result;
END;
$$;

-- 2. Recréer les policies pour driver_subscriptions
DROP POLICY IF EXISTS "driver_subscriptions_admin_access" ON public.driver_subscriptions;
DROP POLICY IF EXISTS "driver_subscriptions_driver_access" ON public.driver_subscriptions;
DROP POLICY IF EXISTS "driver_subscriptions_own_access" ON public.driver_subscriptions;
DROP POLICY IF EXISTS "driver_subscriptions_self_access" ON public.driver_subscriptions;

-- Admin peut tout voir
CREATE POLICY "driver_subscriptions_admin_full_access"
ON public.driver_subscriptions
FOR ALL
TO authenticated
USING (public.is_current_user_admin())
WITH CHECK (public.is_current_user_admin());

-- Chauffeur peut voir ses propres abonnements
CREATE POLICY "driver_subscriptions_driver_view_own"
ON public.driver_subscriptions
FOR SELECT
TO authenticated
USING (auth.uid() = driver_id);

-- 3. Recréer les policies pour partner_rental_subscriptions
DROP POLICY IF EXISTS "rental_subscriptions_admin_access" ON public.partner_rental_subscriptions;
DROP POLICY IF EXISTS "rental_subscriptions_partner_access" ON public.partner_rental_subscriptions;
DROP POLICY IF EXISTS "rental_subscriptions_own_access" ON public.partner_rental_subscriptions;
DROP POLICY IF EXISTS "partner_rental_subscriptions_admin_access_admin_access" ON public.partner_rental_subscriptions;

-- Admin peut tout voir
CREATE POLICY "rental_subscriptions_admin_full_access"
ON public.partner_rental_subscriptions
FOR ALL
TO authenticated
USING (public.is_current_user_admin())
WITH CHECK (public.is_current_user_admin());

-- Partenaire peut voir ses propres abonnements
CREATE POLICY "rental_subscriptions_partner_view_own"
ON public.partner_rental_subscriptions
FOR SELECT
TO authenticated
USING (
  auth.uid() IN (
    SELECT user_id FROM public.partenaires WHERE id = partner_id
  )
);

-- 4. Recréer les policies pour subscription_plans
DROP POLICY IF EXISTS "subscription_plans_public_read" ON public.subscription_plans;
DROP POLICY IF EXISTS "subscription_plans_admin_manage" ON public.subscription_plans;

-- Tout le monde peut voir les plans actifs
CREATE POLICY "subscription_plans_authenticated_read"
ON public.subscription_plans
FOR SELECT
TO authenticated
USING (is_active = true);

-- Admin peut gérer
CREATE POLICY "subscription_plans_admin_all"
ON public.subscription_plans
FOR ALL
TO authenticated
USING (public.is_current_user_admin())
WITH CHECK (public.is_current_user_admin());