-- Désactiver le trigger problématique qui essaie de rafraîchir vendor_stats_cache
DROP TRIGGER IF EXISTS update_vendor_stats_on_order_delivered ON marketplace_orders;

-- Supprimer la fonction associée si elle existe
DROP FUNCTION IF EXISTS trigger_update_vendor_stats_on_order;