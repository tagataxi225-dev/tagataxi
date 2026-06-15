-- =====================================================
-- FINAL SECURITY CLEANUP - Remove Last Security Issues
-- =====================================================

-- Drop the remaining security definer view
DROP VIEW IF EXISTS public.monitoring_stats CASCADE;

-- Create a secure function replacement for monitoring stats
CREATE OR REPLACE FUNCTION public.get_monitoring_stats()
RETURNS TABLE(
  stat_name text,
  stat_value text,
  description text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Only admins can access monitoring stats
  IF NOT public.is_current_user_admin_secure() THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;

  RETURN QUERY VALUES
    ('active_drivers', 
     (SELECT COUNT(*)::text FROM public.driver_locations WHERE is_online = true AND last_ping > now() - interval '10 minutes'),
     'Chauffeurs actifs en ligne'),
    ('pending_bookings',
     (SELECT COUNT(*)::text FROM public.transport_bookings WHERE status = 'pending'),
     'Réservations en attente'),
    ('daily_revenue',
     (SELECT COALESCE(SUM(actual_price), 0)::text FROM public.transport_bookings WHERE DATE(created_at) = CURRENT_DATE AND status = 'completed'),
     'Revenus du jour'),
    ('security_alerts',
     (SELECT COUNT(*)::text FROM public.security_audit_logs WHERE created_at > now() - interval '24 hours' AND success = false),
     'Alertes de sécurité (24h)');
END;
$$;

-- Log final security cleanup
INSERT INTO public.security_audit_logs (
  user_id, action_type, resource_type, success, metadata
) VALUES (
  COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid),
  'security_final_cleanup',
  'database_wide',
  true,
  jsonb_build_object(
    'action', 'removed_last_security_definer_view',
    'view_name', 'monitoring_stats',
    'replacement', 'get_monitoring_stats_function',
    'timestamp', now()
  )
);