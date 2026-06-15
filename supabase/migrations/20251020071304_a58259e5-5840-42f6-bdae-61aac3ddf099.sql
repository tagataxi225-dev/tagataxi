-- Table pour stocker les clics utilisateurs pour heatmaps
CREATE TABLE heatmap_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  session_id TEXT NOT NULL,
  page TEXT NOT NULL,
  element_type TEXT,
  element_id TEXT,
  element_class TEXT,
  element_text TEXT,
  x INT NOT NULL,
  y INT NOT NULL,
  relative_x NUMERIC(5,2) NOT NULL, -- Pourcentage pour responsive
  relative_y NUMERIC(5,2) NOT NULL,
  viewport_width INT NOT NULL,
  viewport_height INT NOT NULL,
  device_type TEXT NOT NULL CHECK (device_type IN ('mobile', 'tablet', 'desktop')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index pour performances
CREATE INDEX idx_heatmap_page ON heatmap_clicks(page, created_at DESC);
CREATE INDEX idx_heatmap_device ON heatmap_clicks(device_type, page);
CREATE INDEX idx_heatmap_session ON heatmap_clicks(session_id);
CREATE INDEX idx_heatmap_element ON heatmap_clicks(element_type, element_id);

-- RLS Policies
ALTER TABLE heatmap_clicks ENABLE ROW LEVEL SECURITY;

-- Les utilisateurs peuvent créer leurs propres clics
CREATE POLICY "Users create own clicks"
  ON heatmap_clicks
  FOR INSERT
  WITH CHECK (auth.uid() = user_id OR auth.uid() IS NOT NULL);

-- Les utilisateurs peuvent voir leurs propres clics
CREATE POLICY "Users view own clicks"
  ON heatmap_clicks
  FOR SELECT
  USING (auth.uid() = user_id OR is_current_user_admin());

-- Les admins peuvent tout voir
CREATE POLICY "Admins view all clicks"
  ON heatmap_clicks
  FOR SELECT
  USING (is_current_user_admin());

-- Vue agrégée pour les éléments les plus cliqués
CREATE OR REPLACE VIEW heatmap_top_elements AS
SELECT 
  page,
  element_type,
  element_id,
  element_class,
  element_text,
  device_type,
  COUNT(*) as click_count,
  COUNT(DISTINCT user_id) as unique_users,
  COUNT(DISTINCT session_id) as unique_sessions,
  AVG(relative_x) as avg_x,
  AVG(relative_y) as avg_y
FROM heatmap_clicks
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY page, element_type, element_id, element_class, element_text, device_type
ORDER BY click_count DESC;

-- Vue pour les zones chaudes (grille 50x50)
CREATE OR REPLACE VIEW heatmap_grid_density AS
SELECT 
  page,
  device_type,
  FLOOR(relative_x / 2) * 2 as grid_x, -- Grille de 2% (50 cellules)
  FLOOR(relative_y / 2) * 2 as grid_y,
  COUNT(*) as density,
  COUNT(DISTINCT user_id) as unique_users
FROM heatmap_clicks
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY page, device_type, grid_x, grid_y
HAVING COUNT(*) > 1
ORDER BY density DESC;

-- Fonction pour nettoyer les anciennes données (>90 jours)
CREATE OR REPLACE FUNCTION cleanup_old_heatmap_data()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM heatmap_clicks
  WHERE created_at < NOW() - INTERVAL '90 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON TABLE heatmap_clicks IS 'Tracking des clics utilisateurs pour générer des heatmaps';
COMMENT ON VIEW heatmap_top_elements IS 'Top éléments cliqués par page et device';
COMMENT ON VIEW heatmap_grid_density IS 'Densité de clics sur grille 50x50 pour visualisation heatmap';
