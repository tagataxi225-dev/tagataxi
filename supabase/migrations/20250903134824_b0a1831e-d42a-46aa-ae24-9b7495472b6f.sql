-- Phase 5: Complete remaining search_path fixes and auth security

-- Fix the remaining functions missing search_path
ALTER FUNCTION public.audit_role_changes() SET search_path = public;

-- Additional functions that might be missing search_path
ALTER FUNCTION public.update_intelligent_places_search_vector() SET search_path = public;
ALTER FUNCTION public.update_places_search_vector() SET search_path = public;

-- Performance optimizations component for admin dashboard
CREATE TABLE IF NOT EXISTS public.system_performance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_type TEXT NOT NULL, -- 'cpu', 'memory', 'database', 'edge_functions'
  metric_name TEXT NOT NULL,
  metric_value NUMERIC NOT NULL,
  unit TEXT, -- 'percentage', 'ms', 'mb', 'count'
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  metadata JSONB DEFAULT '{}'
);

-- Enable RLS
ALTER TABLE public.system_performance_metrics ENABLE ROW LEVEL SECURITY;

-- Only admins can access system metrics
CREATE POLICY "system_performance_metrics_admin_only" ON public.system_performance_metrics
FOR ALL USING (is_current_user_admin());

-- Create index for time-series queries
CREATE INDEX IF NOT EXISTS idx_system_performance_metrics_type_time 
ON public.system_performance_metrics(metric_type, recorded_at DESC);

-- Function to record performance metrics
CREATE OR REPLACE FUNCTION public.record_performance_metric(
  p_metric_type TEXT,
  p_metric_name TEXT,
  p_metric_value NUMERIC,
  p_unit TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  metric_id UUID;
BEGIN
  INSERT INTO public.system_performance_metrics (
    metric_type,
    metric_name,
    metric_value,
    unit,
    metadata
  ) VALUES (
    p_metric_type,
    p_metric_name,
    p_metric_value,
    p_unit,
    p_metadata
  ) RETURNING id INTO metric_id;
  
  RETURN metric_id;
END;
$$;

-- Function to get performance trends
CREATE OR REPLACE FUNCTION public.get_performance_trends(
  p_metric_type TEXT DEFAULT NULL,
  p_hours_back INTEGER DEFAULT 24
) RETURNS TABLE(
  metric_type TEXT,
  metric_name TEXT,
  avg_value NUMERIC,
  min_value NUMERIC,
  max_value NUMERIC,
  trend_direction TEXT,
  data_points INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH metric_stats AS (
    SELECT 
      spm.metric_type,
      spm.metric_name,
      AVG(spm.metric_value) as avg_value,
      MIN(spm.metric_value) as min_value,
      MAX(spm.metric_value) as max_value,
      COUNT(*) as data_points,
      -- Simple trend calculation: compare first half vs second half
      AVG(CASE WHEN spm.recorded_at >= now() - (p_hours_back/2 || ' hours')::INTERVAL 
               THEN spm.metric_value END) as recent_avg,
      AVG(CASE WHEN spm.recorded_at < now() - (p_hours_back/2 || ' hours')::INTERVAL 
               THEN spm.metric_value END) as older_avg
    FROM public.system_performance_metrics spm
    WHERE spm.recorded_at >= now() - (p_hours_back || ' hours')::INTERVAL
      AND (p_metric_type IS NULL OR spm.metric_type = p_metric_type)
    GROUP BY spm.metric_type, spm.metric_name
  )
  SELECT 
    ms.metric_type,
    ms.metric_name,
    ROUND(ms.avg_value, 2) as avg_value,
    ms.min_value,
    ms.max_value,
    CASE 
      WHEN ms.recent_avg > ms.older_avg * 1.1 THEN 'increasing'
      WHEN ms.recent_avg < ms.older_avg * 0.9 THEN 'decreasing'
      ELSE 'stable'
    END as trend_direction,
    ms.data_points::INTEGER
  FROM metric_stats ms
  ORDER BY ms.metric_type, ms.metric_name;
END;
$$;