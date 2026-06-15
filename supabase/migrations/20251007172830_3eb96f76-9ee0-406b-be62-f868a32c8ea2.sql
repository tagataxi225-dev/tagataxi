-- ============================================
-- PHASE 4 : CORRECTION FINALE DES AVERTISSEMENTS
-- ============================================

-- ========================================
-- 1. IDENTIFIER ET CORRIGER LA VUE SECURITY DEFINER
-- ========================================

-- Supprimer la vue SECURITY DEFINER problématique
DROP VIEW IF EXISTS public.admin_users_cache_secure CASCADE;

-- Supprimer la fonction existante si elle existe
DROP FUNCTION IF EXISTS public.get_admin_users_cache() CASCADE;

-- Créer une fonction de remplacement avec contrôle d'accès approprié
CREATE FUNCTION public.get_admin_users_cache()
RETURNS TABLE (
  user_id uuid,
  email text,
  display_name text,
  phone_number text,
  role user_role,
  admin_role admin_role,
  admin_level text,
  permissions text[],
  department text,
  is_active boolean,
  last_login timestamp with time zone,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT is_current_user_super_admin() THEN
    RAISE EXCEPTION 'Access denied: Super admin privileges required';
  END IF;

  RETURN QUERY
  SELECT 
    a.user_id,
    a.email,
    a.display_name,
    a.phone_number,
    ur.role,
    ur.admin_role,
    a.admin_level,
    a.permissions,
    a.department,
    a.is_active,
    a.last_login,
    a.created_at,
    a.updated_at
  FROM public.admins a
  LEFT JOIN public.user_roles ur ON a.user_id = ur.user_id
  WHERE ur.role = 'admin'::user_role
    AND ur.is_active = true;
END;
$$;

-- ========================================
-- 2. CORRIGER LES FONCTIONS SANS search_path
-- ========================================

-- Supprimer log_sensitive_access avant recréation
DROP FUNCTION IF EXISTS public.log_sensitive_access(text, text, uuid) CASCADE;

-- Recréer avec search_path sécurisé
CREATE FUNCTION public.log_sensitive_access(
  table_name text,
  access_type text,
  target_user_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  log_id uuid;
BEGIN
  INSERT INTO public.security_audit_logs (
    user_id,
    action_type,
    resource_type,
    resource_id,
    metadata,
    success
  ) VALUES (
    auth.uid(),
    access_type,
    table_name,
    target_user_id,
    jsonb_build_object(
      'timestamp', now(),
      'ip_address', current_setting('request.headers', true)::jsonb->>'x-forwarded-for'
    ),
    true
  )
  RETURNING id INTO log_id;
  
  RETURN log_id;
END;
$$;

-- ========================================
-- 3. RECRÉER LA POLICY RLS QUI DÉPEND DE log_sensitive_access
-- ========================================

-- Recréer la policy sur clients qui utilise log_sensitive_access
DROP POLICY IF EXISTS clients_admin_audited_access ON public.clients;

CREATE POLICY clients_admin_audited_access ON public.clients
  FOR SELECT
  USING (
    is_current_user_super_admin() 
    AND (log_sensitive_access('clients', 'ADMIN_SELECT', clients.user_id) IS NOT NULL)
  );

-- ========================================
-- 4. CORRIGER D'AUTRES FONCTIONS POTENTIELLES
-- ========================================

-- Note: Ces fonctions sont corrigées seulement si elles existent
DO $$
BEGIN
  -- get_driver_subscriptions_remaining_rides
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' 
    AND p.proname = 'get_driver_subscriptions_remaining_rides'
  ) THEN
    EXECUTE 'DROP FUNCTION IF EXISTS public.get_driver_subscriptions_remaining_rides CASCADE';
    EXECUTE '
      CREATE FUNCTION public.get_driver_subscriptions_remaining_rides(p_driver_id uuid)
      RETURNS integer
      LANGUAGE plpgsql
      STABLE
      SECURITY DEFINER
      SET search_path = public
      AS $func$
      DECLARE remaining_rides integer;
      BEGIN
        SELECT COALESCE(SUM(rides_remaining), 0)::integer
        INTO remaining_rides
        FROM public.driver_subscriptions
        WHERE driver_id = p_driver_id AND status = ''active'' AND end_date > now();
        RETURN COALESCE(remaining_rides, 0);
      END;
      $func$;
    ';
  END IF;

  -- decrement_driver_rides
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' 
    AND p.proname = 'decrement_driver_rides'
  ) THEN
    EXECUTE 'DROP FUNCTION IF EXISTS public.decrement_driver_rides CASCADE';
    EXECUTE '
      CREATE FUNCTION public.decrement_driver_rides(p_driver_id uuid)
      RETURNS boolean
      LANGUAGE plpgsql
      SECURITY DEFINER
      SET search_path = public
      AS $func$
      DECLARE subscription_record RECORD;
      BEGIN
        SELECT id, rides_remaining INTO subscription_record
        FROM public.driver_subscriptions
        WHERE driver_id = p_driver_id AND status = ''active'' 
          AND end_date > now() AND rides_remaining > 0
        ORDER BY end_date ASC LIMIT 1;
        
        IF subscription_record.id IS NOT NULL THEN
          UPDATE public.driver_subscriptions
          SET rides_remaining = rides_remaining - 1, updated_at = now()
          WHERE id = subscription_record.id;
          RETURN true;
        END IF;
        RETURN false;
      END;
      $func$;
    ';
  END IF;
END $$;

-- ========================================
-- 5. DOCUMENTATION EXTENSIONS EN PUBLIC
-- ========================================

COMMENT ON SCHEMA public IS 
  'SECURITY NOTE: Extensions en schéma public (uuid-ossp, pgcrypto).
   Migration vers schéma dédié recommandée mais non critique.';

-- ========================================
-- 6. LOGGER LA COMPLETION DE LA PHASE 4
-- ========================================

INSERT INTO public.activity_logs (
  user_id,
  activity_type,
  description,
  metadata
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'security_maintenance',
  'Phase 4 : Correction finale des avertissements de sécurité',
  jsonb_build_object(
    'phase', 4,
    'actions', jsonb_build_array(
      'Vue SECURITY DEFINER supprimée et remplacée par fonction sécurisée',
      'Fonction log_sensitive_access corrigée avec search_path',
      'Policy RLS clients_admin_audited_access recréée',
      'Documentation migration extensions'
    ),
    'security_warnings_remaining', 3,
    'timestamp', now()
  )
);