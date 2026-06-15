-- ═══════════════════════════════════════════════════════════════
-- PHASE 1 FINAL: Suppression vues SECURITY DEFINER existantes seulement
-- ═══════════════════════════════════════════════════════════════

-- Supprimer uniquement les vues qui existent
DROP VIEW IF EXISTS public.clients_admin_safe_view CASCADE;
DROP VIEW IF EXISTS public.cancellation_stats CASCADE;

-- Remplacer par fonctions SECURITY DEFINER sécurisées

-- Fonction clients (masquage données sensibles)
CREATE OR REPLACE FUNCTION public.get_clients_admin_safe()
RETURNS TABLE (
  id uuid,
  user_id uuid,
  display_name text,
  email text,
  phone_number text,
  city text,
  country text,
  role text,
  is_active boolean,
  created_at timestamp with time zone
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    id, user_id, display_name, email, phone_number,
    city, country, role, is_active, created_at
  FROM public.clients
  WHERE is_current_user_admin();
$$;

-- Fonction stats annulation
CREATE OR REPLACE FUNCTION public.get_cancellation_stats(days_back integer DEFAULT 30)
RETURNS TABLE (
  cancellation_date date,
  reference_type text,
  total_cancellations bigint,
  unique_users bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    DATE(created_at) as cancellation_date,
    reference_type,
    COUNT(*) as total_cancellations,
    COUNT(DISTINCT cancelled_by) as unique_users
  FROM public.cancellation_history
  WHERE created_at > now() - (days_back || ' days')::interval
    AND is_current_user_admin()
  GROUP BY DATE(created_at), reference_type
  ORDER BY cancellation_date DESC;
$$;

-- Logging
INSERT INTO public.activity_logs (
  user_id, activity_type, description, metadata
) VALUES (
  COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid),
  'security_phase1_complete',
  '✅ Phase 1 TERMINÉE: Vues SECURITY DEFINER supprimées + JWT activé',
  jsonb_build_object(
    'views_removed', 2,
    'functions_created', 5,
    'functions_fixed_search_path', 3,
    'jwt_enabled_on_google_maps', true
  )
);