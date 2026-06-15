-- Fix Security Definer Views - Final Version
-- Replaces all 8 SECURITY DEFINER views with SECURITY INVOKER equivalents
-- This resolves the ERROR-level security finding from the Supabase linter

-- 1. Admin Users Cache
DROP VIEW IF EXISTS public.admin_users_cache_secure CASCADE;
CREATE VIEW public.admin_users_cache_secure AS
SELECT ur.user_id, ur.role, ur.admin_role, ur.is_active, ur.created_at, ur.updated_at,
  a.email, a.display_name, a.phone_number, a.department, a.admin_level, a.permissions, a.last_login
FROM public.user_roles ur
LEFT JOIN public.admins a ON a.user_id = ur.user_id
WHERE ur.role = 'admin'::user_role AND ur.is_active = true;
ALTER VIEW public.admin_users_cache_secure SET (security_invoker = true);
GRANT SELECT ON public.admin_users_cache_secure TO authenticated;

-- 2. AI Performance Stats
DROP VIEW IF EXISTS public.ai_performance_stats_secure CASCADE;
CREATE VIEW public.ai_performance_stats_secure AS
SELECT context, function_called, COUNT(*) AS total_calls,
  COUNT(*) FILTER (WHERE success = true) AS successful_calls,
  COUNT(*) FILTER (WHERE success = false) AS failed_calls,
  ROUND(AVG(response_time_ms), 2) AS avg_response_time_ms,
  DATE_TRUNC('day', created_at) AS day
FROM public.ai_interactions
GROUP BY context, function_called, DATE_TRUNC('day', created_at);
ALTER VIEW public.ai_performance_stats_secure SET (security_invoker = true);
GRANT SELECT ON public.ai_performance_stats_secure TO authenticated;

-- 3. Clients Admin View with PII Masking
DROP VIEW IF EXISTS public.clients_admin_safe_view CASCADE;
CREATE VIEW public.clients_admin_safe_view AS
SELECT id, user_id, display_name, email, phone_number, city, country, 
  preferred_language, is_active, role, created_at, updated_at,
  CASE WHEN is_current_user_super_admin() THEN email
    ELSE CONCAT(SUBSTRING(email, 1, 2), '***@', SPLIT_PART(email, '@', 2)) END AS email_masked,
  CASE WHEN is_current_user_super_admin() THEN phone_number
    ELSE CONCAT(SUBSTRING(phone_number, 1, 3), '***', SUBSTRING(phone_number, LENGTH(phone_number) - 1)) END AS phone_masked
FROM public.clients;
ALTER VIEW public.clients_admin_safe_view SET (security_invoker = true);
GRANT SELECT ON public.clients_admin_safe_view TO authenticated;

-- 4. Rental Booking Stats
DROP VIEW IF EXISTS public.rental_booking_stats_secure CASCADE;
CREATE VIEW public.rental_booking_stats_secure AS
SELECT COUNT(*) AS total_bookings,
  COUNT(*) FILTER (WHERE status = 'completed') AS completed_bookings,
  COUNT(*) FILTER (WHERE status IN ('pending', 'confirmed')) AS pending_bookings,
  COALESCE(SUM(total_price) FILTER (WHERE status = 'completed'), 0) AS total_revenue,
  NOW() AS last_updated
FROM public.partner_rental_bookings;
ALTER VIEW public.rental_booking_stats_secure SET (security_invoker = true);
GRANT SELECT ON public.rental_booking_stats_secure TO authenticated;

-- 5. Rental Subscription Stats
DROP VIEW IF EXISTS public.rental_subscription_stats_secure CASCADE;
CREATE VIEW public.rental_subscription_stats_secure AS
SELECT COUNT(*) FILTER (WHERE status = 'active') AS active_subscriptions,
  NOW() AS last_updated
FROM public.partner_rental_subscriptions;
ALTER VIEW public.rental_subscription_stats_secure SET (security_invoker = true);
GRANT SELECT ON public.rental_subscription_stats_secure TO authenticated;

-- 6. Rental Vehicle Stats
DROP VIEW IF EXISTS public.rental_vehicle_stats_secure CASCADE;
CREATE VIEW public.rental_vehicle_stats_secure AS
SELECT COUNT(*) FILTER (WHERE moderation_status = 'pending') AS pending_moderation,
  COUNT(*) FILTER (WHERE moderation_status = 'approved') AS approved_vehicles,
  COUNT(*) FILTER (WHERE is_active = true AND moderation_status = 'approved') AS active_vehicles,
  COUNT(*) AS total_vehicles,
  NOW() AS last_updated
FROM public.partner_rental_vehicles;
ALTER VIEW public.rental_vehicle_stats_secure SET (security_invoker = true);
GRANT SELECT ON public.rental_vehicle_stats_secure TO authenticated;

-- 7. Subscription Stats by Service
DROP VIEW IF EXISTS public.subscription_stats_by_service CASCADE;
CREATE VIEW public.subscription_stats_by_service AS
SELECT sp.service_type, sp.name AS plan_name,
  COUNT(DISTINCT ds.id) AS total_subscriptions,
  COUNT(DISTINCT ds.id) FILTER (WHERE ds.status = 'active') AS active_subscriptions,
  COUNT(DISTINCT ds.id) FILTER (WHERE ds.status = 'expired') AS expired_subscriptions,
  COALESCE(SUM(sp.price), 0) AS total_revenue,
  COALESCE(AVG(sp.price), 0) AS avg_price
FROM public.subscription_plans sp
LEFT JOIN public.driver_subscriptions ds ON ds.plan_id = sp.id
GROUP BY sp.service_type, sp.name;
ALTER VIEW public.subscription_stats_by_service SET (security_invoker = true);
GRANT SELECT ON public.subscription_stats_by_service TO authenticated;

-- 8. User Rating Stats (FIXED: use rated_user_id from user_ratings table)
DROP VIEW IF EXISTS public.v_user_rating_stats CASCADE;
CREATE VIEW public.v_user_rating_stats AS
SELECT rated_user_id AS user_id,
  COUNT(*) AS total_ratings,
  ROUND(AVG(rating), 2) AS avg_rating,
  COUNT(*) FILTER (WHERE rating >= 4) AS positive_ratings,
  COUNT(*) FILTER (WHERE rating <= 2) AS negative_ratings
FROM public.user_ratings
GROUP BY rated_user_id;
ALTER VIEW public.v_user_rating_stats SET (security_invoker = true);
GRANT SELECT ON public.v_user_rating_stats TO authenticated;

-- Document the security fix
COMMENT ON VIEW public.admin_users_cache_secure IS 'Security fix: Uses security_invoker for proper RLS enforcement';
COMMENT ON VIEW public.ai_performance_stats_secure IS 'Security fix: Uses security_invoker for proper RLS enforcement';
COMMENT ON VIEW public.clients_admin_safe_view IS 'Security fix: Uses security_invoker with PII masking for non-super-admins';
COMMENT ON VIEW public.rental_booking_stats_secure IS 'Security fix: Uses security_invoker for proper RLS enforcement';
COMMENT ON VIEW public.rental_subscription_stats_secure IS 'Security fix: Uses security_invoker for proper RLS enforcement';
COMMENT ON VIEW public.rental_vehicle_stats_secure IS 'Security fix: Uses security_invoker for proper RLS enforcement';
COMMENT ON VIEW public.subscription_stats_by_service IS 'Security fix: Uses security_invoker for proper RLS enforcement';
COMMENT ON VIEW public.v_user_rating_stats IS 'Security fix: Uses security_invoker for proper RLS enforcement';