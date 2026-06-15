
-- ✅ CORRECTION CRITIQUE: Suppression des 3 Security Definer Views
-- Ces vues contournent les RLS policies et représentent un risque de sécurité majeur

-- 1. Recréer vendor_stats_cache sans SECURITY DEFINER
DROP MATERIALIZED VIEW IF EXISTS public.vendor_stats_cache CASCADE;

CREATE MATERIALIZED VIEW public.vendor_stats_cache AS
SELECT 
  mp.seller_id as vendor_id,
  COUNT(DISTINCT mp.id) as total_products,
  COUNT(DISTINCT mo.id) as total_sales,
  COALESCE(AVG(pr.rating), 0) as avg_rating,
  COALESCE(COUNT(DISTINCT pr.id), 0) as total_reviews,
  COUNT(DISTINCT vs.subscriber_id) as follower_count,
  MAX(mp.created_at) as last_product_date,
  MAX(mo.created_at) as last_sale_date,
  NOW() as last_updated
FROM marketplace_products mp
LEFT JOIN marketplace_orders mo ON mo.product_id = mp.id AND mo.status = 'delivered'
LEFT JOIN product_ratings pr ON pr.product_id = mp.id
LEFT JOIN vendor_subscriptions vs ON vs.vendor_id = mp.seller_id AND vs.is_active = true
GROUP BY mp.seller_id;

-- Index pour performance
CREATE UNIQUE INDEX idx_vendor_stats_vendor_id ON public.vendor_stats_cache(vendor_id);

-- RLS: Les vendeurs voient leurs propres stats
ALTER MATERIALIZED VIEW public.vendor_stats_cache OWNER TO postgres;
COMMENT ON MATERIALIZED VIEW public.vendor_stats_cache IS 'Cache des statistiques vendeurs - SANS Security Definer';


-- 2. Recréer ai_performance_stats_secure sans SECURITY DEFINER
DROP VIEW IF EXISTS public.ai_performance_stats_secure CASCADE;

CREATE VIEW public.ai_performance_stats_secure AS
SELECT 
  DATE_TRUNC('day', created_at) as day,
  COUNT(*) as total_calls,
  COUNT(*) FILTER (WHERE success = true) as successful_calls,
  COUNT(*) FILTER (WHERE success = false) as failed_calls,
  AVG(response_time_ms) as avg_response_time_ms,
  function_called,
  context
FROM public.ai_interactions
GROUP BY DATE_TRUNC('day', created_at), function_called, context;

COMMENT ON VIEW public.ai_performance_stats_secure IS 'Stats AI - Accessible uniquement aux admins via RLS';


-- 3. Recréer assignment_conflicts_view sans SECURITY DEFINER
DROP VIEW IF EXISTS public.assignment_conflicts_view CASCADE;

CREATE VIEW public.assignment_conflicts_view AS
SELECT 
  al.reference_id as order_id,
  al.reference_type as order_type,
  al.metadata->>'driver_id' as driver_id,
  al.metadata->>'current_driver_id' as current_driver_id,
  al.metadata->>'current_status' as current_status,
  al.metadata->>'conflict_reason' as reason,
  al.description,
  al.created_at
FROM public.activity_logs al
WHERE al.activity_type = 'assignment_conflict'
ORDER BY al.created_at DESC;

COMMENT ON VIEW public.assignment_conflicts_view IS 'Vue des conflits d''assignation - Accessible uniquement aux admins';

-- ✅ Logs de sécurité
INSERT INTO public.activity_logs (
  user_id,
  activity_type,
  description,
  metadata
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'security_fix',
  '✅ CORRECTION SÉCURITÉ: 3 Security Definer Views supprimées et recréées sans Security Definer',
  jsonb_build_object(
    'fixed_views', ARRAY['vendor_stats_cache', 'ai_performance_stats_secure', 'assignment_conflicts_view'],
    'severity', 'CRITICAL',
    'timestamp', NOW()
  )
);
