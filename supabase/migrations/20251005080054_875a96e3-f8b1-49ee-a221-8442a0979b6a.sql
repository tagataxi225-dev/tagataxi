-- Migration préventive : Sécuriser toutes les vues avec security_invoker = on
-- Date: 2025-01-05

-- ============================================================
-- 1. ASSIGNMENT_CONFLICTS_VIEW
-- ============================================================
DROP VIEW IF EXISTS public.assignment_conflicts_view CASCADE;

CREATE VIEW public.assignment_conflicts_view 
WITH (security_invoker = on)
AS
SELECT 
  al.created_at,
  al.reference_type AS order_type,
  al.reference_id AS order_id,
  al.user_id AS driver_id,
  al.description,
  al.metadata->>'conflict_reason' AS reason,
  CASE 
    WHEN al.reference_type = 'delivery_order' THEN dord.status
    WHEN al.reference_type = 'transport_booking' THEN tb.status
    ELSE NULL
  END AS current_status,
  CASE 
    WHEN al.reference_type = 'delivery_order' THEN dord.driver_id
    WHEN al.reference_type = 'transport_booking' THEN tb.driver_id
    ELSE NULL
  END AS current_driver_id
FROM public.activity_logs al
LEFT JOIN public.delivery_orders dord 
  ON al.reference_id = dord.id AND al.reference_type = 'delivery_order'
LEFT JOIN public.transport_bookings tb 
  ON al.reference_id = tb.id AND al.reference_type = 'transport_booking'
WHERE al.activity_type = 'assignment_conflict';

-- ============================================================
-- 2. SUBSCRIPTION_STATS_BY_SERVICE
-- ============================================================
DROP VIEW IF EXISTS public.subscription_stats_by_service CASCADE;

CREATE VIEW public.subscription_stats_by_service
WITH (security_invoker = on)
AS
SELECT 
  sp.service_type,
  COUNT(DISTINCT ds.id) AS total_subscriptions,
  COUNT(DISTINCT ds.id) FILTER (WHERE ds.status = 'active') AS active_subscriptions,
  COUNT(DISTINCT ds.id) FILTER (WHERE ds.status = 'expired') AS expired_subscriptions,
  COALESCE(SUM(srl.extra_charge), 0) AS total_extra_charges,
  sp.price,
  sp.rides_included
FROM public.subscription_plans sp
LEFT JOIN public.driver_subscriptions ds ON sp.id = ds.plan_id
LEFT JOIN public.subscription_ride_logs srl ON ds.id = srl.subscription_id
GROUP BY sp.id, sp.service_type, sp.price, sp.rides_included;

-- ============================================================
-- 3. USER_PROFILES_VIEW
-- ============================================================
DROP VIEW IF EXISTS public.user_profiles_view CASCADE;

CREATE VIEW public.user_profiles_view
WITH (security_invoker = on)
AS
SELECT 
  user_id,
  display_name,
  email,
  phone_number,
  'client'::text AS user_type,
  is_active,
  created_at
FROM public.clients
UNION ALL
SELECT 
  user_id,
  display_name,
  email,
  phone_number,
  'driver'::text AS user_type,
  is_active,
  created_at
FROM public.chauffeurs
UNION ALL
SELECT 
  user_id,
  display_name,
  email,
  phone_number,
  'partner'::text AS user_type,
  is_active,
  created_at
FROM public.partenaires
UNION ALL
SELECT 
  user_id,
  display_name,
  email,
  phone_number,
  'admin'::text AS user_type,
  is_active,
  created_at
FROM public.admins;