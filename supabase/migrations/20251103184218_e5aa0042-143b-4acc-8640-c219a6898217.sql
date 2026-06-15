-- Trigger pour mettre à jour les stats de notation vendeur
CREATE OR REPLACE FUNCTION trigger_update_vendor_rating_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.marketplace_order_id IS NOT NULL THEN
    PERFORM refresh_vendor_stats_cache(NEW.rated_user_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_vendor_rating_stats
AFTER INSERT OR UPDATE ON user_ratings
FOR EACH ROW
EXECUTE FUNCTION trigger_update_vendor_rating_stats();