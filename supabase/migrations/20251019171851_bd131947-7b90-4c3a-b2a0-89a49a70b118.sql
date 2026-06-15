-- ✅ PHASE 2.4: Trigger de décrémentation automatique du stock

-- Fonction pour décrémenter le stock après création de commande
CREATE OR REPLACE FUNCTION public.decrement_product_stock()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Décrémenter le stock du produit
  UPDATE marketplace_products
  SET 
    stock_quantity = GREATEST(0, stock_quantity - NEW.quantity),
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

-- Créer le trigger sur marketplace_orders INSERT
DROP TRIGGER IF EXISTS auto_decrement_product_stock ON marketplace_orders;
CREATE TRIGGER auto_decrement_product_stock
  AFTER INSERT ON public.marketplace_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.decrement_product_stock();