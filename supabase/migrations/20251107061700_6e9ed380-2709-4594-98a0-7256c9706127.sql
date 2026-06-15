-- ============================================================================
-- PHASE 1: UNIFICATION DU SYSTÈME DE STATUT ONLINE CHAUFFEUR
-- ============================================================================
-- Objectif: driver_locations.is_online devient la source de vérité unique
-- Suppression des redondances entre chauffeurs.is_active et driver_profiles.is_available

-- 1. Créer une vue matérialisée pour unifier le statut
CREATE MATERIALIZED VIEW IF NOT EXISTS driver_status_unified AS
SELECT 
  c.user_id,
  c.id as chauffeur_id,
  c.is_active,
  c.verification_status,
  dl.is_online,
  dl.is_available,
  dl.last_ping,
  dl.latitude,
  dl.longitude,
  dl.heading,
  dl.speed,
  CASE 
    WHEN dl.last_ping IS NULL THEN false
    WHEN dl.last_ping < NOW() - INTERVAL '5 minutes' THEN false
    WHEN dl.is_online = true AND c.is_active = true THEN true
    ELSE false
  END as truly_online
FROM chauffeurs c
LEFT JOIN driver_locations dl ON dl.driver_id = c.user_id;

-- Index pour performance
CREATE UNIQUE INDEX IF NOT EXISTS idx_driver_status_unified_user_id ON driver_status_unified(user_id);
CREATE INDEX IF NOT EXISTS idx_driver_status_unified_truly_online ON driver_status_unified(truly_online) WHERE truly_online = true;

-- 2. Fonction pour rafraîchir la vue
CREATE OR REPLACE FUNCTION refresh_driver_status_unified()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY driver_status_unified;
END;
$$;

-- 3. Trigger pour synchroniser chauffeurs.is_active -> driver_locations.is_online
CREATE OR REPLACE FUNCTION sync_driver_online_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Quand chauffeur passe en ligne, mettre à jour driver_locations
  IF TG_OP = 'UPDATE' AND NEW.is_active IS DISTINCT FROM OLD.is_active THEN
    -- Insérer ou mettre à jour driver_locations
    INSERT INTO driver_locations (
      driver_id, 
      is_online, 
      is_available,
      last_ping,
      latitude,
      longitude
    ) VALUES (
      NEW.user_id,
      NEW.is_active,
      NEW.is_active, -- Disponible si en ligne
      NOW(),
      -4.3217, -- Position par défaut Kinshasa
      15.3069
    )
    ON CONFLICT (driver_id) 
    DO UPDATE SET 
      is_online = NEW.is_active,
      is_available = CASE 
        WHEN NEW.is_active = false THEN false 
        ELSE driver_locations.is_available 
      END,
      last_ping = NOW();
  END IF;
  
  RETURN NEW;
END;
$$;

-- Attacher le trigger à chauffeurs
DROP TRIGGER IF EXISTS trigger_sync_driver_online_status ON chauffeurs;
CREATE TRIGGER trigger_sync_driver_online_status
AFTER UPDATE OF is_active ON chauffeurs
FOR EACH ROW
EXECUTE FUNCTION sync_driver_online_status();

-- 4. Fonction helper pour vérifier si chauffeur vraiment en ligne
CREATE OR REPLACE FUNCTION is_driver_truly_online(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  v_online boolean;
BEGIN
  SELECT 
    dl.is_online = true 
    AND c.is_active = true 
    AND dl.last_ping > NOW() - INTERVAL '5 minutes'
  INTO v_online
  FROM chauffeurs c
  LEFT JOIN driver_locations dl ON dl.driver_id = c.user_id
  WHERE c.user_id = p_user_id;
  
  RETURN COALESCE(v_online, false);
END;
$$;

-- 5. Synchroniser les données existantes
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT user_id, is_active 
    FROM chauffeurs 
    WHERE is_active = true
  ) LOOP
    INSERT INTO driver_locations (
      driver_id,
      is_online,
      is_available,
      last_ping,
      latitude,
      longitude
    ) VALUES (
      r.user_id,
      r.is_active,
      r.is_active,
      NOW(),
      -4.3217,
      15.3069
    )
    ON CONFLICT (driver_id) 
    DO UPDATE SET 
      is_online = r.is_active,
      last_ping = NOW();
  END LOOP;
END;
$$;

-- 6. Rafraîchir la vue matérialisée
SELECT refresh_driver_status_unified();

-- 7. Ajouter commentaires pour documentation
COMMENT ON MATERIALIZED VIEW driver_status_unified IS 'Vue unifiée du statut des chauffeurs - source de vérité unique';
COMMENT ON FUNCTION is_driver_truly_online IS 'Vérifie si un chauffeur est réellement en ligne (is_online + is_active + ping récent)';
COMMENT ON FUNCTION sync_driver_online_status IS 'Synchronise automatiquement chauffeurs.is_active vers driver_locations.is_online';