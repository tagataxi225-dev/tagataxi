CREATE OR REPLACE FUNCTION public.decrement_product_stock()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_new_stock INT;
  v_product_title TEXT;
BEGIN
  -- Decrementer le stock
  UPDATE marketplace_products
  SET stock_count = GREATEST(0, stock_count - NEW.quantity),
      updated_at = NOW()
  WHERE id = NEW.product_id
  RETURNING stock_count, title INTO v_new_stock, v_product_title;

  -- Logger l'activite
  INSERT INTO activity_logs (user_id, activity_type, description, metadata)
  VALUES (NEW.seller_id, 'product_stock_decremented',
    format('Stock decremente de %s unites pour produit', NEW.quantity),
    jsonb_build_object('product_id', NEW.product_id, 'order_id', NEW.id,
      'quantity_sold', NEW.quantity, 'new_stock', v_new_stock));

  -- Notification vendeur si stock bas ou epuise
  IF v_new_stock = 0 THEN
    INSERT INTO vendor_notifications (vendor_id, type, title, message, data)
    VALUES (NEW.seller_id, 'low_stock_alert',
      'Rupture de stock',
      format('Votre produit "%s" est en rupture de stock !', v_product_title),
      jsonb_build_object('product_id', NEW.product_id, 'stock', 0));
  ELSIF v_new_stock <= 4 THEN
    INSERT INTO vendor_notifications (vendor_id, type, title, message, data)
    VALUES (NEW.seller_id, 'low_stock_alert',
      'Stock faible',
      format('Il ne reste que %s unites de "%s"', v_new_stock, v_product_title),
      jsonb_build_object('product_id', NEW.product_id, 'stock', v_new_stock));
  END IF;

  RETURN NEW;
END;
$$;