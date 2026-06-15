-- Phase 3 : Vérification rides_remaining dans dispatchers

-- 1. Créer table de logs des rejets
CREATE TABLE IF NOT EXISTS public.dispatcher_rejections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id uuid REFERENCES chauffeurs(user_id),
  booking_id uuid,
  booking_type text,
  rejection_reason text NOT NULL,
  rides_remaining integer,
  subscription_status text,
  created_at timestamp with time zone DEFAULT now()
);

-- Index pour analytics
CREATE INDEX IF NOT EXISTS idx_dispatcher_rejections_driver ON public.dispatcher_rejections(driver_id);
CREATE INDEX IF NOT EXISTS idx_dispatcher_rejections_reason ON public.dispatcher_rejections(rejection_reason);
CREATE INDEX IF NOT EXISTS idx_dispatcher_rejections_created ON public.dispatcher_rejections(created_at DESC);

-- RLS pour admins uniquement
ALTER TABLE public.dispatcher_rejections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view dispatcher rejections"
  ON public.dispatcher_rejections
  FOR SELECT
  TO authenticated
  USING (is_current_user_admin());

-- 2. Mettre à jour find_nearby_drivers avec vérification rides_remaining
CREATE OR REPLACE FUNCTION public.find_nearby_drivers(
  pickup_lat numeric,
  pickup_lng numeric,
  service_type_param text DEFAULT 'transport',
  radius_km numeric DEFAULT 15
)
RETURNS TABLE(
  driver_id uuid,
  distance_km numeric,
  vehicle_class text,
  rating_average numeric,
  total_rides integer,
  is_verified boolean,
  latitude numeric,
  longitude numeric,
  last_ping timestamp with time zone,
  rides_remaining integer,
  subscription_status text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    dl.driver_id,
    (6371 * acos(
      cos(radians(pickup_lat)) * 
      cos(radians(dl.latitude)) * 
      cos(radians(dl.longitude) - radians(pickup_lng)) + 
      sin(radians(pickup_lat)) * 
      sin(radians(dl.latitude))
    ))::numeric as distance_km,
    COALESCE(dl.vehicle_class, 'standard')::text as vehicle_class,
    COALESCE(c.rating_average, 0)::numeric as rating_average,
    COALESCE(c.total_rides, 0)::integer as total_rides,
    COALESCE(c.verification_status = 'verified', false)::boolean as is_verified,
    dl.latitude,
    dl.longitude,
    dl.last_ping,
    COALESCE(ds.rides_remaining, 0)::integer as rides_remaining,
    COALESCE(ds.status, 'no_subscription')::text as subscription_status
  FROM driver_locations dl
  JOIN chauffeurs c ON dl.driver_id = c.user_id
  LEFT JOIN driver_subscriptions ds ON dl.driver_id = ds.driver_id 
    AND ds.status = 'active' 
    AND ds.end_date > now()
  WHERE 
    dl.is_online = true 
    AND dl.is_available = true
    AND c.is_active = true
    AND c.verification_status IN ('verified', 'pending')
    AND dl.last_ping > now() - interval '5 minutes'
    AND COALESCE(ds.rides_remaining, 0) > 0
    AND (6371 * acos(
      cos(radians(pickup_lat)) * 
      cos(radians(dl.latitude)) * 
      cos(radians(dl.longitude) - radians(pickup_lng)) + 
      sin(radians(pickup_lat)) * 
      sin(radians(dl.latitude))
    )) <= radius_km
  ORDER BY distance_km ASC
  LIMIT 20;
END;
$function$;

-- 3. Index pour performance
CREATE INDEX IF NOT EXISTS idx_driver_subscriptions_active 
  ON public.driver_subscriptions(driver_id, status, rides_remaining) 
  WHERE status = 'active';

-- 4. Logger l'implémentation
INSERT INTO public.activity_logs (
  activity_type,
  description,
  metadata
) VALUES (
  'system_migration',
  'Phase 3 : Dispatchers avec vérification rides_remaining déployés',
  jsonb_build_object(
    'phase', 3,
    'changes', jsonb_build_array(
      'find_nearby_drivers updated with rides_remaining filter',
      'dispatcher_rejections table created',
      'All dispatchers will call consume-ride'
    ),
    'deployed_at', now()
  )
);