-- Phase 3: Fonction RPC pour calculer la demande par zone
CREATE OR REPLACE FUNCTION public.calculate_demand_heatmap(
  city_param TEXT DEFAULT 'Kinshasa',
  time_range_minutes INT DEFAULT 60
)
RETURNS TABLE (
  zone_id UUID,
  zone_name TEXT,
  pending_requests INT,
  available_drivers INT,
  demand_ratio NUMERIC,
  avg_price NUMERIC,
  peak_hours JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sz.id,
    sz.name,
    COUNT(DISTINCT CASE 
      WHEN dord.status IN ('pending', 'confirmed') 
        AND dord.created_at > NOW() - (time_range_minutes || ' minutes')::INTERVAL
      THEN dord.id 
    END)::INT as pending_requests,
    COUNT(DISTINCT CASE 
      WHEN dloc.is_available = true 
        AND dloc.is_online = true 
        AND dloc.last_ping > NOW() - INTERVAL '10 minutes'
      THEN dloc.driver_id 
    END)::INT as available_drivers,
    CASE 
      WHEN COUNT(DISTINCT dloc.driver_id) = 0 THEN 999.0
      ELSE (COUNT(DISTINCT dord.id)::NUMERIC / NULLIF(COUNT(DISTINCT dloc.driver_id), 0))
    END as demand_ratio,
    AVG(dord.estimated_price)::NUMERIC as avg_price,
    jsonb_build_object(
      'morning', COUNT(*) FILTER (WHERE EXTRACT(HOUR FROM dord.created_at) BETWEEN 6 AND 11),
      'afternoon', COUNT(*) FILTER (WHERE EXTRACT(HOUR FROM dord.created_at) BETWEEN 12 AND 17),
      'evening', COUNT(*) FILTER (WHERE EXTRACT(HOUR FROM dord.created_at) BETWEEN 18 AND 23)
    ) as peak_hours
  FROM public.service_zones sz
  LEFT JOIN public.delivery_orders dord ON 
    sz.city = dord.city
    AND dord.created_at > NOW() - (time_range_minutes || ' minutes')::INTERVAL
  LEFT JOIN public.driver_locations dloc ON 
    dloc.is_online = true 
    AND dloc.last_ping > NOW() - INTERVAL '10 minutes'
  WHERE sz.city = city_param
    AND sz.status = 'active'
  GROUP BY sz.id, sz.name
  ORDER BY demand_ratio DESC NULLS LAST;
END;
$$;

-- Grant access to authenticated users
GRANT EXECUTE ON FUNCTION public.calculate_demand_heatmap TO authenticated;

COMMENT ON FUNCTION public.calculate_demand_heatmap IS 'Calcule la demande en temps réel par zone de service pour les chauffeurs';

-- Create index for better performance on delivery_orders
CREATE INDEX IF NOT EXISTS idx_delivery_orders_city_status_created 
  ON public.delivery_orders(city, status, created_at DESC);

-- Create index for driver_locations performance
CREATE INDEX IF NOT EXISTS idx_driver_locations_online_ping 
  ON public.driver_locations(is_online, is_available, last_ping DESC);

-- Phase 5: Create zone analytics table for caching
CREATE TABLE IF NOT EXISTS public.zone_demand_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_id UUID NOT NULL REFERENCES public.service_zones(id) ON DELETE CASCADE,
  city TEXT NOT NULL,
  pending_requests INT NOT NULL DEFAULT 0,
  available_drivers INT NOT NULL DEFAULT 0,
  demand_ratio NUMERIC NOT NULL DEFAULT 0,
  avg_price NUMERIC,
  peak_hours JSONB,
  calculated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enable RLS on cache table
ALTER TABLE public.zone_demand_cache ENABLE ROW LEVEL SECURITY;

-- Policy: Authenticated users can read cache
CREATE POLICY "Authenticated users can read demand cache"
  ON public.zone_demand_cache
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Only admins can update cache
CREATE POLICY "Admins can update demand cache"
  ON public.zone_demand_cache
  FOR ALL
  TO authenticated
  USING (is_current_user_admin())
  WITH CHECK (is_current_user_admin());

-- Create index on cache table
CREATE INDEX idx_zone_demand_cache_zone_calculated 
  ON public.zone_demand_cache(zone_id, calculated_at DESC);

COMMENT ON TABLE public.zone_demand_cache IS 'Cache des statistiques de demande par zone pour améliorer les performances';