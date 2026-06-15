-- Trigger pour mettre à jour le nombre d'abonnés vendeur
CREATE OR REPLACE FUNCTION trigger_update_vendor_follower_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND NEW.is_active != OLD.is_active) THEN
    PERFORM refresh_vendor_stats_cache(NEW.vendor_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_vendor_follower_count
AFTER INSERT OR UPDATE ON vendor_subscriptions
FOR EACH ROW
EXECUTE FUNCTION trigger_update_vendor_follower_count();