-- Phase 4: Security Optimizations - Fix search_path and auth settings

-- Fix search_path for all SECURITY DEFINER functions
ALTER FUNCTION public.calculate_rental_price(numeric, text, uuid) SET search_path = public;
ALTER FUNCTION public.get_zone_for_coordinates(numeric, numeric) SET search_path = public;
ALTER FUNCTION public.geocode_location(text) SET search_path = public;
ALTER FUNCTION public.process_orange_money_payment(uuid, numeric, text, text) SET search_path = public;
ALTER FUNCTION public.intelligent_places_search(text, text, text, numeric, numeric, integer, integer) SET search_path = public;
ALTER FUNCTION public.intelligent_places_search(text, text, numeric, numeric, integer, boolean) SET search_path = public;
ALTER FUNCTION public.calculate_zone_statistics(uuid, date, integer) SET search_path = public;
ALTER FUNCTION public.get_zone_pricing(uuid, text, timestamp with time zone) SET search_path = public;
ALTER FUNCTION public.search_places(text, text, text, integer) SET search_path = public;
ALTER FUNCTION public.get_notification_stats(uuid) SET search_path = public;
ALTER FUNCTION public.link_payment_to_subscription(uuid, uuid) SET search_path = public;
ALTER FUNCTION public.calculate_delivery_estimate(uuid) SET search_path = public;
ALTER FUNCTION public.notify_order_status_change() SET search_path = public;
ALTER FUNCTION public.activate_approved_vehicles() SET search_path = public;
ALTER FUNCTION public.find_nearby_drivers(numeric, numeric, numeric, text) SET search_path = public;
ALTER FUNCTION public.get_driver_zones(numeric) SET search_path = public;
ALTER FUNCTION public.log_driver_location_access(uuid, text, text) SET search_path = public;
ALTER FUNCTION public.generate_driver_code() SET search_path = public;
ALTER FUNCTION public.generate_referral_code() SET search_path = public;
ALTER FUNCTION public.get_safe_user_info(uuid) SET search_path = public;
ALTER FUNCTION public.search_users_protected(text, integer) SET search_path = public;
ALTER FUNCTION public.update_profiles_timestamp() SET search_path = public;
ALTER FUNCTION public.generate_lottery_ticket_number() SET search_path = public;
ALTER FUNCTION public.update_updated_at_escrow() SET search_path = public;
ALTER FUNCTION public.update_promotional_ads_updated_at() SET search_path = public;
ALTER FUNCTION public.check_driver_location_access(uuid) SET search_path = public;
ALTER FUNCTION public.get_secure_vendor_earnings_summary(integer) SET search_path = public;
ALTER FUNCTION public.handle_profile_deletion() SET search_path = public;
ALTER FUNCTION public.update_product_moderation_status() SET search_path = public;
ALTER FUNCTION public.calculate_surge_pricing(uuid, text) SET search_path = public;
ALTER FUNCTION public.create_vendor_notification_on_order() SET search_path = public;
ALTER FUNCTION public.handle_new_client() SET search_path = public;
ALTER FUNCTION public.has_permission(uuid, text) SET search_path = public;
ALTER FUNCTION public.check_global_email_phone_uniqueness() SET search_path = public;
ALTER FUNCTION public.update_support_messages_updated_at() SET search_path = public;
ALTER FUNCTION public.is_vehicle_subscription_active(uuid) SET search_path = public;
ALTER FUNCTION public.update_marketplace_order_timestamps() SET search_path = public;
ALTER FUNCTION public.create_support_ticket(uuid, text, text, text, text, jsonb) SET search_path = public;
ALTER FUNCTION public.bump_unified_conversation_last_message_at() SET search_path = public;

-- Create performance monitoring table for edge functions
CREATE TABLE IF NOT EXISTS public.edge_function_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  function_name TEXT NOT NULL,
  execution_time_ms INTEGER NOT NULL,
  status_code INTEGER,
  user_id UUID,
  request_id TEXT,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on performance monitoring
ALTER TABLE public.edge_function_performance ENABLE ROW LEVEL SECURITY;

-- Admin can see all performance data
CREATE POLICY "edge_function_performance_admin_access" ON public.edge_function_performance
FOR ALL USING (is_current_user_admin());

-- Create index for performance monitoring
CREATE INDEX IF NOT EXISTS idx_edge_function_performance_function_name 
ON public.edge_function_performance(function_name, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_edge_function_performance_execution_time 
ON public.edge_function_performance(execution_time_ms DESC);

-- Create function to log edge function performance
CREATE OR REPLACE FUNCTION public.log_edge_function_performance(
  p_function_name TEXT,
  p_execution_time_ms INTEGER,
  p_status_code INTEGER DEFAULT 200,
  p_user_id UUID DEFAULT NULL,
  p_request_id TEXT DEFAULT NULL,
  p_error_message TEXT DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  log_id UUID;
BEGIN
  INSERT INTO public.edge_function_performance (
    function_name,
    execution_time_ms,
    status_code,
    user_id,
    request_id,
    error_message
  ) VALUES (
    p_function_name,
    p_execution_time_ms,
    p_status_code,
    p_user_id,
    p_request_id,
    p_error_message
  ) RETURNING id INTO log_id;
  
  RETURN log_id;
END;
$$;

-- Create function to get performance stats
CREATE OR REPLACE FUNCTION public.get_edge_function_performance_stats(
  p_function_name TEXT DEFAULT NULL,
  p_hours_back INTEGER DEFAULT 24
) RETURNS TABLE(
  function_name TEXT,
  total_calls INTEGER,
  avg_execution_time_ms NUMERIC,
  p95_execution_time_ms NUMERIC,
  error_rate NUMERIC,
  success_rate NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    efp.function_name,
    COUNT(*)::INTEGER as total_calls,
    ROUND(AVG(efp.execution_time_ms), 2) as avg_execution_time_ms,
    ROUND(PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY efp.execution_time_ms), 2) as p95_execution_time_ms,
    ROUND((COUNT(*) FILTER (WHERE efp.status_code >= 400)::NUMERIC / COUNT(*)) * 100, 2) as error_rate,
    ROUND((COUNT(*) FILTER (WHERE efp.status_code < 400)::NUMERIC / COUNT(*)) * 100, 2) as success_rate
  FROM public.edge_function_performance efp
  WHERE efp.created_at >= now() - (p_hours_back || ' hours')::INTERVAL
    AND (p_function_name IS NULL OR efp.function_name = p_function_name)
  GROUP BY efp.function_name
  ORDER BY total_calls DESC;
END;
$$;