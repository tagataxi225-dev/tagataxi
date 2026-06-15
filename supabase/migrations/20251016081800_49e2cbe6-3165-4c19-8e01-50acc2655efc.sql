-- PHASE 1.1 : Corriger le schéma de données marketplace
-- Ajouter category_id UUID pour remplacer category TEXT

ALTER TABLE marketplace_products 
ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES marketplace_categories(id);

-- Migrer les données existantes (slug → UUID)
UPDATE marketplace_products 
SET category_id = mc.id
FROM marketplace_categories mc
WHERE marketplace_products.category = mc.slug
  AND marketplace_products.category_id IS NULL;

-- Pour les produits sans catégorie valide, assigner une catégorie par défaut
UPDATE marketplace_products
SET category_id = (SELECT id FROM marketplace_categories WHERE slug = 'autres' LIMIT 1)
WHERE category_id IS NULL;

-- Créer index pour performance
CREATE INDEX IF NOT EXISTS idx_marketplace_products_category_id 
ON marketplace_products(category_id);

-- PHASE 1.3 : Ajouter foreign keys manquantes pour les commandes
-- Vérifier et ajouter seulement si n'existe pas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'fk_marketplace_orders_buyer'
  ) THEN
    ALTER TABLE marketplace_orders
    ADD CONSTRAINT fk_marketplace_orders_buyer 
    FOREIGN KEY (buyer_id) REFERENCES profiles(user_id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'fk_marketplace_orders_seller'
  ) THEN
    ALTER TABLE marketplace_orders
    ADD CONSTRAINT fk_marketplace_orders_seller 
    FOREIGN KEY (seller_id) REFERENCES profiles(user_id) ON DELETE CASCADE;
  END IF;
END $$;

-- Ajouter index pour les jointures fréquentes
CREATE INDEX IF NOT EXISTS idx_marketplace_orders_buyer_id 
ON marketplace_orders(buyer_id);

CREATE INDEX IF NOT EXISTS idx_marketplace_orders_seller_id 
ON marketplace_orders(seller_id);

CREATE INDEX IF NOT EXISTS idx_marketplace_orders_product_id 
ON marketplace_orders(product_id);

-- Ajouter colonne pour tracking de modération
ALTER TABLE marketplace_products
ADD COLUMN IF NOT EXISTS moderation_notified_at TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS idx_marketplace_products_moderation_status 
ON marketplace_products(moderation_status) 
WHERE moderation_status = 'pending';