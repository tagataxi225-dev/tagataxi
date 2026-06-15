-- ✅ CORRECTION 3: Assouplir la RLS policy pour accepter status='draft'
DROP POLICY IF EXISTS "sellers_can_create_products" ON marketplace_products;

CREATE POLICY "sellers_can_create_products"
ON marketplace_products
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = seller_id
  AND moderation_status IN ('pending', 'draft')
);

-- ✅ CORRECTION BONUS: Corriger la fonction trigger qui utilise stock_quantity au lieu de stock_count
CREATE OR REPLACE FUNCTION public.decrement_product_stock()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Décrémenter le stock du produit (CORRECTION: stock_count au lieu de stock_quantity)
  UPDATE marketplace_products
  SET 
    stock_count = GREATEST(0, stock_count - NEW.quantity),
    updated_at = NOW()
  WHERE id = NEW.product_id;
  
  -- Logger l'activité
  INSERT INTO activity_logs (
    user_id,
    activity_type,
    description,
    metadata
  ) VALUES (
    NEW.seller_id,
    'product_stock_decremented',
    format('Stock décrémenté de %s unités pour produit', NEW.quantity),
    jsonb_build_object(
      'product_id', NEW.product_id,
      'order_id', NEW.id,
      'quantity_sold', NEW.quantity,
      'timestamp', NOW()
    )
  );
  
  RETURN NEW;
END;
$$;