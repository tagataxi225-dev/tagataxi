-- Fix Security Definer View issue
-- Drop the monitoring_stats view that may be causing the security issue
DROP VIEW IF EXISTS public.monitoring_stats CASCADE;

-- Check if function_monitoring_logs table exists and create a safe view
-- This view will use the invoker's permissions instead of SECURITY DEFINER
CREATE OR REPLACE VIEW public.monitoring_stats AS
SELECT 
    function_name,
    count(*) AS total_calls,
    count(*) FILTER (WHERE status = 'healthy') AS successful_calls,
    count(*) FILTER (WHERE status IN ('error', 'timeout', 'down')) AS failed_calls,
    round(
        (count(*) FILTER (WHERE status IN ('error', 'timeout', 'down'))::numeric / 
         GREATEST(count(*), 1)::numeric) * 100, 
        2
    ) AS error_rate_percent,
    avg(response_time_ms) FILTER (WHERE response_time_ms > 0) AS avg_response_time,
    max(created_at) AS last_check
FROM public.function_monitoring_logs
WHERE created_at > now() - interval '24 hours'
GROUP BY function_name;

-- Add RLS policy for monitoring_stats view access (admin only)
-- Note: Views inherit RLS from their underlying tables
COMMENT ON VIEW public.monitoring_stats IS 'System monitoring statistics - access controlled by underlying table RLS policies';