-- ========================================
-- PHASE 4 : Tests & Monitoring Navigation GPS
-- Table d'analytics et logs pour la navigation
-- ========================================

-- Table pour tracker les sessions de navigation
CREATE TABLE IF NOT EXISTS public.navigation_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id UUID NOT NULL,
  order_type TEXT NOT NULL CHECK (order_type IN ('transport', 'delivery')),
  
  -- Données de la session
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  
  -- Coordonnées de départ et destination
  pickup_coords JSONB NOT NULL,
  destination_coords JSONB NOT NULL,
  
  -- Métriques de navigation
  distance_km NUMERIC(10, 2),
  estimated_duration_minutes INTEGER,
  actual_duration_minutes INTEGER,
  
  -- Événements pendant la navigation
  off_route_count INTEGER DEFAULT 0,
  recalculations_count INTEGER DEFAULT 0,
  voice_instructions_count INTEGER DEFAULT 0,
  
  -- Statut de la session
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled', 'error')),
  completion_status TEXT CHECK (completion_status IN ('arrived', 'cancelled_by_driver', 'cancelled_by_customer', 'error')),
  
  -- Erreurs et problèmes
  geocoding_errors JSONB,
  navigation_errors JSONB,
  
  -- Métadonnées
  device_info JSONB,
  network_type TEXT,
  battery_level INTEGER,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_navigation_sessions_driver 
ON public.navigation_sessions(driver_id, started_at DESC);

CREATE INDEX IF NOT EXISTS idx_navigation_sessions_order 
ON public.navigation_sessions(order_id, order_type);

CREATE INDEX IF NOT EXISTS idx_navigation_sessions_status 
ON public.navigation_sessions(status, started_at DESC);

-- Table pour les événements de navigation (logs détaillés)
CREATE TABLE IF NOT EXISTS public.navigation_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.navigation_sessions(id) ON DELETE CASCADE,
  
  event_type TEXT NOT NULL CHECK (event_type IN (
    'session_started',
    'navigation_started',
    'off_route_detected',
    'route_recalculated',
    'voice_instruction',
    'location_update',
    'arrived_at_destination',
    'session_ended',
    'error'
  )),
  
  event_data JSONB,
  location_coords JSONB,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_navigation_events_session 
ON public.navigation_events(session_id, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_navigation_events_type 
ON public.navigation_events(event_type, timestamp DESC);

-- Table pour les stats agrégées (performance)
CREATE TABLE IF NOT EXISTS public.navigation_stats_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stats_date DATE NOT NULL,
  
  -- Métriques globales
  total_sessions INTEGER DEFAULT 0,
  completed_sessions INTEGER DEFAULT 0,
  cancelled_sessions INTEGER DEFAULT 0,
  error_sessions INTEGER DEFAULT 0,
  
  -- Métriques de qualité
  avg_duration_minutes NUMERIC(10, 2),
  avg_distance_km NUMERIC(10, 2),
  avg_off_route_count NUMERIC(10, 2),
  avg_recalculations NUMERIC(10, 2),
  
  -- Taux de succès
  completion_rate NUMERIC(5, 2),
  geocoding_success_rate NUMERIC(5, 2),
  
  -- Consommation API
  elevenlabs_calls INTEGER DEFAULT 0,
  google_geocoding_calls INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE(stats_date)
);

-- Trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION public.update_navigation_sessions_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_update_navigation_sessions_updated_at
BEFORE UPDATE ON public.navigation_sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_navigation_sessions_updated_at();

-- RLS Policies
ALTER TABLE public.navigation_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.navigation_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.navigation_stats_daily ENABLE ROW LEVEL SECURITY;

-- Chauffeurs peuvent voir leurs propres sessions
CREATE POLICY "Drivers view own navigation sessions"
ON public.navigation_sessions
FOR SELECT
USING (auth.uid() = driver_id);

-- Chauffeurs peuvent créer leurs sessions
CREATE POLICY "Drivers create own navigation sessions"
ON public.navigation_sessions
FOR INSERT
WITH CHECK (auth.uid() = driver_id);

-- Chauffeurs peuvent mettre à jour leurs sessions
CREATE POLICY "Drivers update own navigation sessions"
ON public.navigation_sessions
FOR UPDATE
USING (auth.uid() = driver_id);

-- Admins ont accès total
CREATE POLICY "Admins manage all navigation sessions"
ON public.navigation_sessions
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() 
      AND role = 'admin'
      AND is_active = true
  )
);

-- Events : chauffeurs voient leurs propres événements
CREATE POLICY "Drivers view own navigation events"
ON public.navigation_events
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.navigation_sessions
    WHERE id = session_id AND driver_id = auth.uid()
  )
);

-- Events : système peut créer des événements
CREATE POLICY "System creates navigation events"
ON public.navigation_events
FOR INSERT
WITH CHECK (true);

-- Stats : lecture publique pour les chauffeurs authentifiés
CREATE POLICY "Authenticated users view navigation stats"
ON public.navigation_stats_daily
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Stats : admins gèrent les stats
CREATE POLICY "Admins manage navigation stats"
ON public.navigation_stats_daily
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() 
      AND role = 'admin'
      AND is_active = true
  )
);

-- Commentaires
COMMENT ON TABLE public.navigation_sessions IS 'Sessions de navigation GPS des chauffeurs avec métriques de performance';
COMMENT ON TABLE public.navigation_events IS 'Événements détaillés pendant les sessions de navigation';
COMMENT ON TABLE public.navigation_stats_daily IS 'Statistiques agrégées quotidiennes de navigation';

COMMENT ON COLUMN public.navigation_sessions.off_route_count IS 'Nombre de fois où le chauffeur est sorti de la route';
COMMENT ON COLUMN public.navigation_sessions.recalculations_count IS 'Nombre de recalculs d''itinéraire';
COMMENT ON COLUMN public.navigation_sessions.voice_instructions_count IS 'Nombre d''instructions vocales jouées';