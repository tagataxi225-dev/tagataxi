-- Trigger pour mettre à jour les stats vendeur lors de livraison commande
CREATE OR REPLACE FUNCTION trigger_update_vendor_stats_on_order()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'delivered' AND (OLD IS NULL OR OLD.status != 'delivered') THEN
    PERFORM refresh_vendor_stats_cache(NEW.seller_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_vendor_stats_on_order_delivered
AFTER UPDATE ON marketplace_orders
FOR EACH ROW
EXECUTE FUNCTION trigger_update_vendor_stats_on_order();