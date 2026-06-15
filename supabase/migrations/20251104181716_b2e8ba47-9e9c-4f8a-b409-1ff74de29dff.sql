-- ✅ CORRECTION: Supprimer l'ancienne fonction avant de créer la nouvelle
DROP FUNCTION IF EXISTS get_vendor_stats_optimized(UUID);

-- ✅ PHASE 1: Créer la vue matérialisée vendor_stats_mv pour optimiser les stats vendeur

-- Supprimer si existe déjà (pour éviter erreur de conflit)
DROP MATERIALIZED VIEW IF EXISTS vendor_stats_mv;

-- Créer la vue matérialisée avec toutes les stats vendeur agrégées
CREATE MATERIALIZED VIEW vendor_stats_mv AS
SELECT 
  mp.seller_id,
  
  -- Stats produits
  COUNT(DISTINCT CASE WHEN mp.moderation_status = 'approved' THEN mp.id END) AS active_products,
  COUNT(DISTINCT CASE WHEN mp.moderation_status = 'pending' THEN mp.id END) AS pending_products,
  
  -- Stats commandes
  COUNT(DISTINCT mo.id) AS total_orders,
  COUNT(DISTINCT CASE WHEN mo.vendor_confirmation_status = 'awaiting_confirmation' THEN mo.id END) AS pending_orders,
  
  -- Stats financières (merchant_accounts peut ne pas exister pour tous les vendeurs)
  COALESCE(ma.balance, 0) AS escrow_balance,
  COALESCE(
    (SELECT SUM(et.seller_amount) 
     FROM escrow_transactions et 
     WHERE et.seller_id = mp.seller_id 
       AND et.status = 'held'),
    0
  ) AS pending_escrow,
  
  -- Métadonnées
  NOW() AS last_updated
  
FROM marketplace_products mp
LEFT JOIN marketplace_orders mo ON mo.product_id = mp.id
LEFT JOIN merchant_accounts ma ON ma.vendor_id = mp.seller_id
GROUP BY mp.seller_id, ma.balance;

-- Créer un index unique pour améliorer les performances
CREATE UNIQUE INDEX idx_vendor_stats_mv_seller_id ON vendor_stats_mv(seller_id);

-- ✅ PHASE 2: Créer la fonction RPC pour récupérer les stats d'un vendeur
CREATE OR REPLACE FUNCTION get_vendor_stats_optimized(vendor_user_id UUID)
RETURNS TABLE(
  active_products BIGINT,
  pending_products BIGINT,
  total_orders BIGINT,
  pending_orders BIGINT,
  escrow_balance NUMERIC,
  pending_escrow NUMERIC
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    vs.active_products,
    vs.pending_products,
    vs.total_orders,
    vs.pending_orders,
    vs.escrow_balance,
    vs.pending_escrow
  FROM vendor_stats_mv vs
  WHERE vs.seller_id = vendor_user_id;
END;
$$;

-- ✅ PHASE 3: Créer un cron job pour rafraîchir automatiquement toutes les 3 minutes
SELECT cron.schedule(
  'refresh-vendor-stats-mv',
  '*/3 * * * *', -- Toutes les 3 minutes
  $$REFRESH MATERIALIZED VIEW CONCURRENTLY vendor_stats_mv$$
);

-- ✅ PHASE 4: Rafraîchir immédiatement après création
REFRESH MATERIALIZED VIEW vendor_stats_mv;