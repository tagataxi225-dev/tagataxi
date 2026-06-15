-- Migration pour uniformiser le système escrow
-- Phase 1: S'assurer que escrow_transactions est la source unique de vérité

-- Ajouter un index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_escrow_transactions_order_id ON escrow_transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_escrow_transactions_status ON escrow_transactions(status);
CREATE INDEX IF NOT EXISTS idx_escrow_transactions_seller_id ON escrow_transactions(seller_id);

-- Ajouter un champ auto_release_at pour le système de libération automatique
ALTER TABLE escrow_transactions 
ADD COLUMN IF NOT EXISTS auto_release_at TIMESTAMPTZ;

-- Trigger pour définir auto_release_at automatiquement (7 jours après held)
CREATE OR REPLACE FUNCTION set_auto_release_date()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'held' AND NEW.auto_release_at IS NULL THEN
    NEW.auto_release_at := NEW.created_at + INTERVAL '7 days';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_auto_release_date ON escrow_transactions;
CREATE TRIGGER trigger_set_auto_release_date
BEFORE INSERT OR UPDATE ON escrow_transactions
FOR EACH ROW
EXECUTE FUNCTION set_auto_release_date();

-- Améliorer les index sur marketplace_orders pour les requêtes de libération automatique
CREATE INDEX IF NOT EXISTS idx_marketplace_orders_delivered ON marketplace_orders(status, delivered_at) 
WHERE status = 'delivered';

-- Fonction RPC pour obtenir les statistiques escrow vendeur
CREATE OR REPLACE FUNCTION get_vendor_escrow_stats(vendor_uuid UUID)
RETURNS TABLE (
  total_held NUMERIC,
  total_released NUMERIC,
  pending_orders_count INTEGER,
  auto_release_soon_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM(CASE WHEN et.status = 'held' THEN et.seller_amount ELSE 0 END), 0) as total_held,
    COALESCE(SUM(CASE WHEN et.status = 'released' THEN et.seller_amount ELSE 0 END), 0) as total_released,
    COUNT(CASE WHEN et.status = 'held' THEN 1 END)::INTEGER as pending_orders_count,
    COUNT(CASE WHEN et.status = 'held' AND et.auto_release_at < NOW() + INTERVAL '24 hours' THEN 1 END)::INTEGER as auto_release_soon_count
  FROM escrow_transactions et
  WHERE et.seller_id = vendor_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Donner les permissions
GRANT EXECUTE ON FUNCTION get_vendor_escrow_stats(UUID) TO authenticated;

-- Commentaires de documentation
COMMENT ON TABLE escrow_transactions IS 'Table unique pour gérer les paiements escrow marketplace';
COMMENT ON COLUMN escrow_transactions.auto_release_at IS 'Date de libération automatique (7 jours après création si non confirmé)';
COMMENT ON FUNCTION get_vendor_escrow_stats IS 'Statistiques escrow pour un vendeur (appelée par le dashboard vendeur)';