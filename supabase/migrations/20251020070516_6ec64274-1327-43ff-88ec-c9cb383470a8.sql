-- Table pour stocker les expériences A/B
CREATE TABLE ab_experiments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  experiment_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  variants JSONB NOT NULL DEFAULT '{"control": {"weight": 50, "config": {}}, "variant": {"weight": 50, "config": {}}}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  start_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  end_date TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table pour les événements de tracking A/B
CREATE TABLE ab_test_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  session_id TEXT,
  experiment_id TEXT NOT NULL,
  variant TEXT NOT NULL CHECK (variant IN ('control', 'variant')),
  event_type TEXT NOT NULL CHECK (event_type IN ('view', 'click', 'conversion', 'custom')),
  event_data JSONB DEFAULT '{}'::jsonb,
  page_path TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table pour stocker les assignations d'utilisateurs
CREATE TABLE ab_user_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  experiment_id TEXT NOT NULL,
  variant TEXT NOT NULL CHECK (variant IN ('control', 'variant')),
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, experiment_id)
);

-- Index pour performances
CREATE INDEX idx_ab_events_experiment ON ab_test_events(experiment_id, variant, event_type);
CREATE INDEX idx_ab_events_user ON ab_test_events(user_id, created_at);
CREATE INDEX idx_ab_assignments_user ON ab_user_assignments(user_id);
CREATE INDEX idx_ab_assignments_experiment ON ab_user_assignments(experiment_id);

-- RLS Policies
ALTER TABLE ab_experiments ENABLE ROW LEVEL SECURITY;
ALTER TABLE ab_test_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE ab_user_assignments ENABLE ROW LEVEL SECURITY;

-- Les admins peuvent tout gérer
CREATE POLICY "Admins manage experiments"
  ON ab_experiments
  FOR ALL
  USING (is_current_user_admin())
  WITH CHECK (is_current_user_admin());

-- Tous les utilisateurs authentifiés peuvent voir les expériences actives
CREATE POLICY "Users view active experiments"
  ON ab_experiments
  FOR SELECT
  USING (is_active = true AND auth.uid() IS NOT NULL);

-- Les utilisateurs peuvent créer leurs propres événements
CREATE POLICY "Users create own events"
  ON ab_test_events
  FOR INSERT
  WITH CHECK (auth.uid() = user_id OR auth.uid() IS NOT NULL);

-- Les utilisateurs peuvent voir leurs propres événements
CREATE POLICY "Users view own events"
  ON ab_test_events
  FOR SELECT
  USING (auth.uid() = user_id OR is_current_user_admin());

-- Les admins peuvent tout voir
CREATE POLICY "Admins view all events"
  ON ab_test_events
  FOR SELECT
  USING (is_current_user_admin());

-- Les utilisateurs peuvent gérer leurs propres assignations
CREATE POLICY "Users manage own assignments"
  ON ab_user_assignments
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Les admins peuvent tout voir
CREATE POLICY "Admins view all assignments"
  ON ab_user_assignments
  FOR SELECT
  USING (is_current_user_admin());

-- Vue pour les métriques agrégées par expérience
CREATE OR REPLACE VIEW ab_experiment_metrics AS
SELECT 
  e.experiment_id,
  e.variant,
  COUNT(*) FILTER (WHERE e.event_type = 'view') as views,
  COUNT(*) FILTER (WHERE e.event_type = 'click') as clicks,
  COUNT(*) FILTER (WHERE e.event_type = 'conversion') as conversions,
  COUNT(DISTINCT e.user_id) as unique_users,
  ROUND(
    (COUNT(*) FILTER (WHERE e.event_type = 'click')::numeric / 
     NULLIF(COUNT(*) FILTER (WHERE e.event_type = 'view'), 0) * 100), 
    2
  ) as ctr,
  ROUND(
    (COUNT(*) FILTER (WHERE e.event_type = 'conversion')::numeric / 
     NULLIF(COUNT(*) FILTER (WHERE e.event_type = 'view'), 0) * 100), 
    2
  ) as conversion_rate
FROM ab_test_events e
GROUP BY e.experiment_id, e.variant;

-- Fonction pour calculer la significativité statistique (Chi-square test)
CREATE OR REPLACE FUNCTION calculate_ab_significance(
  experiment_id_param TEXT
)
RETURNS TABLE (
  variant TEXT,
  conversions BIGINT,
  views BIGINT,
  conversion_rate NUMERIC,
  confidence_level NUMERIC
) AS $$
DECLARE
  control_conversions BIGINT;
  control_views BIGINT;
  variant_conversions BIGINT;
  variant_views BIGINT;
  chi_square NUMERIC;
BEGIN
  -- Récupérer les données control
  SELECT 
    COUNT(*) FILTER (WHERE event_type = 'conversion'),
    COUNT(*) FILTER (WHERE event_type = 'view')
  INTO control_conversions, control_views
  FROM ab_test_events
  WHERE ab_test_events.experiment_id = experiment_id_param
    AND ab_test_events.variant = 'control';

  -- Récupérer les données variant
  SELECT 
    COUNT(*) FILTER (WHERE event_type = 'conversion'),
    COUNT(*) FILTER (WHERE event_type = 'view')
  INTO variant_conversions, variant_views
  FROM ab_test_events
  WHERE ab_test_events.experiment_id = experiment_id_param
    AND ab_test_events.variant = 'variant';

  -- Calculer chi-square (simplifié)
  IF control_views > 0 AND variant_views > 0 THEN
    chi_square := POWER(control_conversions::NUMERIC / control_views - variant_conversions::NUMERIC / variant_views, 2);
  ELSE
    chi_square := 0;
  END IF;

  RETURN QUERY
  SELECT 
    'control'::TEXT,
    control_conversions,
    control_views,
    ROUND((control_conversions::NUMERIC / NULLIF(control_views, 0) * 100), 2),
    CASE 
      WHEN chi_square > 3.841 THEN 95.0
      WHEN chi_square > 2.706 THEN 90.0
      ELSE 0.0
    END
  UNION ALL
  SELECT 
    'variant'::TEXT,
    variant_conversions,
    variant_views,
    ROUND((variant_conversions::NUMERIC / NULLIF(variant_views, 0) * 100), 2),
    CASE 
      WHEN chi_square > 3.841 THEN 95.0
      WHEN chi_square > 2.706 THEN 90.0
      ELSE 0.0
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON TABLE ab_experiments IS 'Expériences A/B Testing actives et archivées';
COMMENT ON TABLE ab_test_events IS 'Événements de tracking pour A/B Testing';
COMMENT ON TABLE ab_user_assignments IS 'Assignations utilisateur-variant pour garantir la cohérence';