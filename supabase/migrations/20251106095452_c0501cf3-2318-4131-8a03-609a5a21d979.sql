-- ✅ NETTOYAGE COMPLET EN CASCADE DE TOUTES LES DÉPENDANCES

-- ÉTAPE 1: Identifier les produits orphelins (sans profil vendeur)
CREATE TEMP TABLE orphan_products AS
SELECT id FROM marketplace_products
WHERE seller_id NOT IN (
  SELECT user_id FROM vendor_profiles WHERE user_id IS NOT NULL
);

-- ÉTAPE 2: Identifier les commandes liées
CREATE TEMP TABLE orphan_orders AS
SELECT id FROM marketplace_orders
WHERE product_id IN (SELECT id FROM orphan_products);

-- ÉTAPE 3: Supprimer marketplace_delivery_assignments
DELETE FROM marketplace_delivery_assignments
WHERE order_id IN (SELECT id FROM orphan_orders);

-- ÉTAPE 4: Supprimer escrow_payments
DELETE FROM escrow_payments
WHERE order_id IN (SELECT id FROM orphan_orders);

-- ÉTAPE 5: Supprimer conversations
DELETE FROM conversations
WHERE product_id IN (SELECT id FROM orphan_products);

-- ÉTAPE 6: Supprimer marketplace_orders
DELETE FROM marketplace_orders
WHERE id IN (SELECT id FROM orphan_orders);

-- ÉTAPE 7: Supprimer marketplace_products orphelins
DELETE FROM marketplace_products
WHERE id IN (SELECT id FROM orphan_products);

-- ÉTAPE 8: Créer index pour performances
CREATE INDEX IF NOT EXISTS idx_marketplace_products_seller_active 
ON marketplace_products(seller_id, status, moderation_status)
WHERE status = 'active' AND moderation_status = 'approved';

-- ÉTAPE 9: Ajouter contrainte FK marketplace_products -> vendor_profiles
ALTER TABLE marketplace_products
DROP CONSTRAINT IF EXISTS fk_marketplace_products_seller;

ALTER TABLE marketplace_products
ADD CONSTRAINT fk_marketplace_products_seller 
FOREIGN KEY (seller_id) 
REFERENCES vendor_profiles(user_id)
ON DELETE CASCADE;

-- Nettoyer
DROP TABLE orphan_orders;
DROP TABLE orphan_products;