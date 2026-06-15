-- Phase 1 : Correction des erreurs critiques (Version corrigée sans CREATE INDEX CONCURRENTLY)

-- 1. Corriger la récursion infinie RLS dans user_roles
-- Supprimer les policies existantes qui causent la récursion
DROP POLICY IF EXISTS "Users can access own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can access all roles" ON public.user_roles;

-- Créer une fonction security definer pour éviter la récursion
CREATE OR REPLACE FUNCTION public.get_user_role_secure(p_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO public
AS $$
  SELECT role::text FROM public.user_roles 
  WHERE user_id = p_user_id 
    AND is_active = true
  ORDER BY 
    CASE role::text
      WHEN 'admin' THEN 1
      WHEN 'partner' THEN 2  
      WHEN 'driver' THEN 3
      WHEN 'client' THEN 4
      ELSE 5
    END
  LIMIT 1;
$$;

-- Nouvelles policies sécurisées pour user_roles
CREATE POLICY "Users can view own roles secure"
ON public.user_roles
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all roles secure"
ON public.user_roles
FOR ALL
USING (is_current_user_admin())
WITH CHECK (is_current_user_admin());

-- 2. Ajouter la colonne manquante country_code à service_zones
ALTER TABLE public.service_zones 
ADD COLUMN IF NOT EXISTS country_code text DEFAULT 'CD';

-- Mettre à jour les zones existantes
UPDATE public.service_zones 
SET country_code = 'CD' 
WHERE country_code IS NULL;

-- 3. Créer des index pour optimiser les performances (sans CONCURRENTLY)
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id_active 
ON public.user_roles(user_id) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_service_zones_country_active
ON public.service_zones(country_code) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_delivery_orders_status_date
ON public.delivery_orders(status, created_at DESC);