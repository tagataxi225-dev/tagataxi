-- Créer table vendor_product_favorites pour gérer les favoris produits
CREATE TABLE vendor_product_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES marketplace_products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, product_id)
);

-- Index pour améliorer les performances
CREATE INDEX idx_vendor_product_favorites_user ON vendor_product_favorites(user_id);
CREATE INDEX idx_vendor_product_favorites_product ON vendor_product_favorites(product_id);

-- RLS Policies
ALTER TABLE vendor_product_favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own favorites"
  ON vendor_product_favorites FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);