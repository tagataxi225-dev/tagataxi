-- ✅ PHASE 3: Système de notation marketplace
CREATE TABLE IF NOT EXISTS marketplace_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES marketplace_orders(id) ON DELETE CASCADE,
  buyer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  seller_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID REFERENCES marketplace_products(id) ON DELETE SET NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(order_id, buyer_id)
);

-- RLS Policies
ALTER TABLE marketplace_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Acheteurs peuvent noter commandes complétées" ON marketplace_ratings
  FOR INSERT WITH CHECK (
    auth.uid() = buyer_id 
    AND EXISTS (
      SELECT 1 FROM marketplace_orders 
      WHERE id = order_id 
        AND buyer_id = auth.uid() 
        AND status = 'completed'
    )
  );

CREATE POLICY "Tout le monde peut voir les notes" ON marketplace_ratings
  FOR SELECT USING (true);

-- Trigger pour mettre à jour la moyenne des produits
CREATE OR REPLACE FUNCTION update_product_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE marketplace_products
  SET 
    rating_average = (
      SELECT AVG(rating)::numeric(3,2) FROM marketplace_ratings 
      WHERE product_id = NEW.product_id
    ),
    rating_count = (
      SELECT COUNT(*) FROM marketplace_ratings 
      WHERE product_id = NEW.product_id
    )
  WHERE id = NEW.product_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER rating_update_trigger
AFTER INSERT ON marketplace_ratings
FOR EACH ROW EXECUTE FUNCTION update_product_rating();

-- ✅ PHASE 4: Foreign keys pour conversations
ALTER TABLE conversations 
  DROP CONSTRAINT IF EXISTS conversations_buyer_id_fkey;
  
ALTER TABLE conversations 
  DROP CONSTRAINT IF EXISTS conversations_seller_id_fkey;

ALTER TABLE conversations 
  ADD CONSTRAINT conversations_buyer_id_fkey 
  FOREIGN KEY (buyer_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE conversations 
  ADD CONSTRAINT conversations_seller_id_fkey 
  FOREIGN KEY (seller_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- ✅ PHASE 1: Débloquer commandes en preparing anciennes
UPDATE marketplace_orders
SET status = 'ready_for_pickup',
    ready_for_pickup_at = NOW()
WHERE status = 'preparing' 
  AND created_at < NOW() - INTERVAL '7 days';