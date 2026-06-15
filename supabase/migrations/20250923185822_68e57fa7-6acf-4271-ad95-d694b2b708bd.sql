-- Créer une fonction de monitoring automatique pour les Edge Functions
CREATE OR REPLACE FUNCTION public.auto_monitor_edge_functions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  function_names TEXT[] := ARRAY['geocode-proxy', 'partner-driver-earnings', 'delivery-dispatcher', 'push-notifications', 'notification-dispatcher', 'send-sms-notification'];
  func_name TEXT;
  health_result JSONB;
BEGIN
  -- Invoker le monitoring automatique pour chaque fonction
  FOREACH func_name IN ARRAY function_names
  LOOP
    BEGIN
      -- Logger les tentatives de monitoring
      INSERT INTO public.function_monitoring_logs (
        function_name, 
        status, 
        response_time_ms, 
        error_message,
        metadata
      ) VALUES (
        func_name,
        'monitoring_check',
        0,
        NULL,
        jsonb_build_object('auto_check', true, 'timestamp', now())
      );
    EXCEPTION WHEN OTHERS THEN
      -- Logger les erreurs de monitoring
      INSERT INTO public.function_monitoring_logs (
        function_name, 
        status, 
        response_time_ms, 
        error_message,
        metadata
      ) VALUES (
        func_name,
        'monitoring_error',
        0,
        SQLERRM,
        jsonb_build_object('auto_check', true, 'error_timestamp', now())
      );
    END;
  END LOOP;
END;
$$;

-- Créer une fonction pour nettoyer les anciens logs de monitoring
CREATE OR REPLACE FUNCTION public.cleanup_monitoring_logs(days_to_keep INTEGER DEFAULT 7)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Supprimer les logs de monitoring plus anciens que X jours
  DELETE FROM public.function_monitoring_logs 
  WHERE created_at < now() - (days_to_keep || ' days')::interval;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN deleted_count;
END;
$$;

-- Créer une vue pour obtenir les statistiques de monitoring en temps réel
CREATE OR REPLACE VIEW public.monitoring_stats AS
SELECT 
  function_name,
  COUNT(*) as total_calls,
  COUNT(*) FILTER (WHERE status = 'healthy') as successful_calls,
  COUNT(*) FILTER (WHERE status IN ('error', 'timeout', 'down')) as failed_calls,
  ROUND(
    COUNT(*) FILTER (WHERE status IN ('error', 'timeout', 'down'))::numeric / 
    GREATEST(COUNT(*), 1) * 100, 2
  ) as error_rate_percent,
  AVG(response_time_ms) FILTER (WHERE response_time_ms > 0) as avg_response_time,
  MAX(created_at) as last_check
FROM public.function_monitoring_logs 
WHERE created_at > now() - interval '24 hours'
GROUP BY function_name;

-- Grant des permissions appropriées
GRANT SELECT ON public.monitoring_stats TO authenticated;
GRANT EXECUTE ON FUNCTION public.auto_monitor_edge_functions() TO authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_monitoring_logs(INTEGER) TO authenticated;