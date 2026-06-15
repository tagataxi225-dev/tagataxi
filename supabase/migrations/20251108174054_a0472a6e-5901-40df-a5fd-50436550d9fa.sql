-- ============================================
-- SYNCHRONISATION follower_count AVEC DÉSACTIVATION TEMPORAIRE DES TRIGGERS
-- ============================================

-- 1️⃣ Fonction simplifiée de synchronisation
CREATE OR REPLACE FUNCTION sync_vendor_follower_count_v2()
RETURNS TRIGGER AS $$
DECLARE
  v_vendor_id UUID;
  v_count INTEGER;
BEGIN
  v_vendor_id := COALESCE(NEW.vendor_id, OLD.vendor_id);
  
  SELECT COUNT(*) INTO v_count
  FROM vendor_subscriptions
  WHERE vendor_id = v_vendor_id AND is_active = true;
  
  -- Utiliser pg_try_advisory_lock pour éviter les conflits
  PERFORM pg_advisory_lock(hashtext(v_vendor_id::text));
  
  UPDATE vendor_profiles
  SET follower_count = v_count
  WHERE user_id = v_vendor_id;
  
  PERFORM pg_advisory_unlock(hashtext(v_vendor_id::text));
  
  RETURN COALESCE(NEW, OLD);
EXCEPTION
  WHEN OTHERS THEN
    PERFORM pg_advisory_unlock(hashtext(v_vendor_id::text));
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2️⃣ Créer triggers sur vendor_subscriptions
DROP TRIGGER IF EXISTS sync_follower_insert ON vendor_subscriptions;
CREATE TRIGGER sync_follower_insert
  AFTER INSERT ON vendor_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION sync_vendor_follower_count_v2();

DROP TRIGGER IF EXISTS sync_follower_update ON vendor_subscriptions;
CREATE TRIGGER sync_follower_update
  AFTER UPDATE OF is_active ON vendor_subscriptions
  FOR EACH ROW
  WHEN (OLD.is_active IS DISTINCT FROM NEW.is_active)
  EXECUTE FUNCTION sync_vendor_follower_count_v2();

DROP TRIGGER IF EXISTS sync_follower_delete ON vendor_subscriptions;
CREATE TRIGGER sync_follower_delete
  AFTER DELETE ON vendor_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION sync_vendor_follower_count_v2();