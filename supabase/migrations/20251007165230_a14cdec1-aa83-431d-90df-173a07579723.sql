-- ═══════════════════════════════════════════════════════════════
-- PHASE 2 FINALE: Sécurisation vues matérialisées + Fonctions
-- ═══════════════════════════════════════════════════════════════

-- ════════════════════════════════════════════════════════════════
-- ÉTAPE 1: Supprimer fonction log_sensitive_access avec CASCADE
-- ════════════════════════════════════════════════════════════════
DROP FUNCTION IF EXISTS public.log_sensitive_access(text, text, uuid) CASCADE;

-- ════════════════════════════════════════════════════════════════
-- ÉTAPE 2: Créer fonctions SECURITY DEFINER pour vues matérialisées
-- ════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.get_admin_users_safe()
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
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  last_login timestamp with time zone
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    user_id, email, display_name, phone_number,
    role, admin_role, admin_level, permissions,
    department, is_active, created_at, updated_at, last_login
  FROM public.admin_users_cache_secure
  WHERE is_current_user_super_admin();
$$;

CREATE OR REPLACE FUNCTION public.get_ai_performance_stats(days_back integer DEFAULT 7)
RETURNS TABLE (
  day timestamp with time zone,
  context text,
  function_called text,
  total_calls bigint,
  successful_calls bigint,
  failed_calls bigint,
  avg_response_time_ms numeric
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    day, context, function_called,
    total_calls, successful_calls, failed_calls,
    avg_response_time_ms
  FROM public.ai_performance_stats_secure
  WHERE is_current_user_admin()
    AND day > now() - (days_back || ' days')::interval
  ORDER BY day DESC;
$$;

-- ════════════════════════════════════════════════════════════════
-- ÉTAPE 3: Recréer fonction log_sensitive_access avec search_path
-- ════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.log_sensitive_access(
  p_table_name text,
  p_access_type text,
  p_target_user_id uuid DEFAULT NULL
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
    user_id, action_type, resource_type, resource_id, metadata, success
  ) VALUES (
    auth.uid(), p_access_type, p_table_name, p_target_user_id,
    jsonb_build_object(
      'timestamp', now(),
      'ip_address', current_setting('request.headers', true)::jsonb->>'x-real-ip'
    ),
    true
  ) RETURNING id INTO log_id;
  
  RETURN log_id;
EXCEPTION WHEN OTHERS THEN
  RETURN NULL;
END;
$$;

-- ════════════════════════════════════════════════════════════════
-- ÉTAPE 4: Recréer RLS policy clients_admin_audited_access
-- ════════════════════════════════════════════════════════════════

CREATE POLICY clients_admin_audited_access
ON public.clients
FOR SELECT
TO authenticated
USING (
  is_current_user_super_admin() 
  AND (SELECT log_sensitive_access('clients', 'ADMIN_SELECT', clients.user_id) IS NOT NULL)
);

-- ════════════════════════════════════════════════════════════════
-- ÉTAPE 5: Logging Phase 2
-- ════════════════════════════════════════════════════════════════
INSERT INTO public.activity_logs (
  user_id, activity_type, description, metadata
) VALUES (
  COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid),
  'security_phase2_complete',
  '✅ Phase 2 TERMINÉE: Vues matérialisées sécurisées + RLS policies restaurées',
  jsonb_build_object(
    'mv_secure_functions', 2,
    'utility_functions_secured', 1,
    'rls_policies_restored', 1,
    'security_status', 'hardened'
  )
);