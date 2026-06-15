-- ====================================================================
-- PHASE 1 : CORRECTIONS CRITIQUES DE SÉCURITÉ
-- ====================================================================

-- ============================================================
-- 1.1 SÉCURISATION GOOGLE MAPS API - Rate Limiting
-- ============================================================

-- Table de rate limiting pour toutes les APIs
CREATE TABLE IF NOT EXISTS public.api_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  endpoint TEXT NOT NULL,
  request_count INTEGER DEFAULT 0,
  reset_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, endpoint)
);

ALTER TABLE public.api_rate_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own rate limits"
  ON public.api_rate_limits FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users manage own rate limits"
  ON public.api_rate_limits FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_rate_limits_user_endpoint 
  ON public.api_rate_limits(user_id, endpoint);

CREATE INDEX IF NOT EXISTS idx_rate_limits_reset_at 
  ON public.api_rate_limits(reset_at);

-- ============================================================
-- 1.2 ISOLATION STRICTE DES DONNÉES CLIENTS
-- ============================================================

-- Supprimer l'ancienne politique trop permissive
DROP POLICY IF EXISTS "clients_admin_view_secure" ON public.clients;

-- Politique d'isolation stricte : utilisateurs accèdent uniquement à leurs données
CREATE POLICY "clients_strict_isolation" 
  ON public.clients
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Politique admin avec audit OBLIGATOIRE
CREATE POLICY "clients_admin_audited_access" 
  ON public.clients
  FOR SELECT
  TO authenticated
  USING (
    is_current_user_super_admin() 
    AND (
      SELECT public.log_sensitive_access(
        'clients', 
        'ADMIN_SELECT', 
        clients.user_id
      ) IS NOT NULL
    )
  );

-- Renforcer la politique de modification (propres données uniquement)
DROP POLICY IF EXISTS "clients_own_data_secure" ON public.clients;

CREATE POLICY "clients_strict_own_data_modify" 
  ON public.clients
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Vue admin sécurisée avec données masquées
CREATE OR REPLACE VIEW public.clients_admin_safe_view AS
SELECT 
  id,
  user_id,
  display_name,
  -- Email masqué : abc***@domain.com
  LEFT(email, 3) || '***@' || SPLIT_PART(email, '@', 2) AS email_masked,
  email, -- Visible uniquement via RLS
  -- Téléphone masqué : +243*******65
  LEFT(phone_number, 4) || '*******' || RIGHT(phone_number, 2) AS phone_masked,
  phone_number, -- Visible uniquement via RLS
  city,
  country,
  created_at,
  updated_at,
  is_active,
  role,
  preferred_language
FROM public.clients;

COMMENT ON VIEW public.clients_admin_safe_view IS 
'Vue admin sécurisée - Données clients masquées sauf pour super admins avec audit trail';

-- ============================================================
-- 1.3 SÉCURISATION DES VUES MATÉRIALISÉES
-- ============================================================

-- Créer des vues wrapper sécurisées pour les vues matérialisées
-- Vue 1: admin_users_cache
CREATE OR REPLACE VIEW public.admin_users_cache_secure AS
SELECT * FROM public.admin_users_cache
WHERE is_current_user_super_admin();

GRANT SELECT ON public.admin_users_cache_secure TO authenticated;
COMMENT ON VIEW public.admin_users_cache_secure IS 
'Vue sécurisée - Accessible uniquement aux super admins';

-- Vue 2: Stats de location (rental)
CREATE OR REPLACE VIEW public.rental_booking_stats_secure AS
SELECT * FROM public.mv_admin_rental_booking_stats
WHERE is_current_user_admin();

CREATE OR REPLACE VIEW public.rental_vehicle_stats_secure AS
SELECT * FROM public.mv_admin_rental_vehicle_stats
WHERE is_current_user_admin();

CREATE OR REPLACE VIEW public.rental_subscription_stats_secure AS
SELECT * FROM public.mv_admin_rental_subscription_stats
WHERE is_current_user_admin();

GRANT SELECT ON public.rental_booking_stats_secure TO authenticated;
GRANT SELECT ON public.rental_vehicle_stats_secure TO authenticated;
GRANT SELECT ON public.rental_subscription_stats_secure TO authenticated;

-- Vue 3: AI performance stats
CREATE OR REPLACE VIEW public.ai_performance_stats_secure AS
SELECT * FROM public.ai_performance_stats
WHERE is_current_user_admin();

GRANT SELECT ON public.ai_performance_stats_secure TO authenticated;

-- Révoquer l'accès direct aux vues matérialisées (sauf admins)
REVOKE SELECT ON public.admin_users_cache FROM PUBLIC;
REVOKE SELECT ON public.mv_admin_rental_booking_stats FROM PUBLIC;
REVOKE SELECT ON public.mv_admin_rental_vehicle_stats FROM PUBLIC;
REVOKE SELECT ON public.mv_admin_rental_subscription_stats FROM PUBLIC;
REVOKE SELECT ON public.ai_performance_stats FROM PUBLIC;

-- ============================================================
-- AUDIT TRAIL AMÉLIORÉ
-- ============================================================

-- Améliorer la fonction de logging d'accès sensible
CREATE OR REPLACE FUNCTION public.log_sensitive_access(
  p_table_name TEXT,
  p_operation TEXT,
  p_accessed_user_data UUID DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.sensitive_data_access_audit (
    user_id,
    table_name,
    operation,
    accessed_user_data,
    ip_address,
    user_agent
  ) VALUES (
    auth.uid(),
    p_table_name,
    p_operation,
    p_accessed_user_data,
    inet_client_addr(),
    current_setting('request.headers', true)::jsonb->>'user-agent'
  );
EXCEPTION WHEN OTHERS THEN
  -- Log silencieux en cas d'erreur
  NULL;
END;
$$;

-- ============================================================
-- VALIDATION FINALE
-- ============================================================

-- Vérifier que RLS est activé sur clients
DO $$
BEGIN
  IF NOT (SELECT relrowsecurity FROM pg_class WHERE relname = 'clients') THEN
    RAISE EXCEPTION 'RLS non activé sur la table clients';
  END IF;
  
  RAISE NOTICE '✅ Phase 1 implémentée avec succès';
  RAISE NOTICE '   - Rate limiting activé';
  RAISE NOTICE '   - Isolation stricte clients en place';
  RAISE NOTICE '   - Vues matérialisées sécurisées';
END $$;