
-- Fix Security Definer View Issue
-- The view 'subscription_stats_by_service' was using SECURITY DEFINER by default
-- This is a security risk as it bypasses RLS policies
-- We recreate it with SECURITY INVOKER to use the querying user's permissions

-- Drop the existing view
DROP VIEW IF EXISTS public.subscription_stats_by_service;

-- Recreate with SECURITY INVOKER
CREATE VIEW public.subscription_stats_by_service
WITH (security_invoker = on)
AS
SELECT 
  COALESCE(ds.service_type, 'transport') AS service_type,
  count(*) FILTER (WHERE ds.status = 'active') AS active_count,
  count(*) FILTER (WHERE ds.status = 'expired') AS expired_count,
  count(*) FILTER (WHERE ds.status = 'cancelled') AS cancelled_count,
  sum(sp.price) FILTER (WHERE ds.status = 'active') AS monthly_revenue,
  count(*) FILTER (WHERE ds.status = 'active' AND ds.end_date <= (now() + interval '7 days')) AS expiring_week,
  count(*) FILTER (WHERE ds.status = 'active' AND ds.end_date <= (now() + interval '30 days')) AS expiring_month,
  round(avg(ds.rides_remaining) FILTER (WHERE ds.status = 'active'), 2) AS avg_rides_remaining,
  sum(ds.rides_remaining) FILTER (WHERE ds.status = 'active') AS total_rides_remaining
FROM driver_subscriptions ds
LEFT JOIN subscription_plans sp ON ds.plan_id = sp.id
GROUP BY COALESCE(ds.service_type, 'transport');

-- Add comment explaining the security change
COMMENT ON VIEW public.subscription_stats_by_service IS 
'Statistics view for driver subscriptions by service type. Uses SECURITY INVOKER to respect RLS policies of the querying user.';
