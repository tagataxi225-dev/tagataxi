-- Sprint 1.3 : Débloquer les commandes marketplace anciennes bloquées
-- Mettre à jour les commandes "confirmed" qui sont bloquées depuis plus de 24h

UPDATE marketplace_orders
SET 
  status = 'preparing',
  updated_at = NOW()
WHERE status = 'confirmed'
  AND updated_at < NOW() - INTERVAL '24 hours';

-- Logger l'action dans les logs système
DO $$
DECLARE
  affected_count INTEGER;
BEGIN
  GET DIAGNOSTICS affected_count = ROW_COUNT;
  
  -- Insérer un log de l'opération si des commandes ont été mises à jour
  IF affected_count > 0 THEN
    INSERT INTO system_notifications (
      title,
      message,
      notification_type,
      priority,
      data
    ) VALUES (
      'Déblocage automatique des commandes',
      format('Déblocage de %s commandes marketplace bloquées', affected_count),
      'system_maintenance',
      'info',
      jsonb_build_object(
        'action', 'unblock_orders',
        'count', affected_count,
        'old_status', 'confirmed',
        'new_status', 'preparing',
        'timestamp', NOW()
      )
    );
  END IF;
END $$;

-- Créer un index pour améliorer les performances des requêtes de statut
CREATE INDEX IF NOT EXISTS idx_marketplace_orders_status_updated 
  ON marketplace_orders(status, updated_at DESC);

-- Créer un index pour les requêtes par buyer/seller
CREATE INDEX IF NOT EXISTS idx_marketplace_orders_buyer_created 
  ON marketplace_orders(buyer_id, created_at DESC);
  
CREATE INDEX IF NOT EXISTS idx_marketplace_orders_seller_created 
  ON marketplace_orders(seller_id, created_at DESC);

COMMENT ON INDEX idx_marketplace_orders_status_updated IS 'Index pour optimiser les requêtes de suivi des commandes par statut';
COMMENT ON INDEX idx_marketplace_orders_buyer_created IS 'Index pour optimiser les requêtes des commandes clients';
COMMENT ON INDEX idx_marketplace_orders_seller_created IS 'Index pour optimiser les requêtes des commandes vendeurs';