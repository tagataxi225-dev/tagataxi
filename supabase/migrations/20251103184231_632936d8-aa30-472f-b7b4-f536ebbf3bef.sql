-- Trigger pour notifier les abonnés lors de l'ajout d'un nouveau produit
CREATE OR REPLACE FUNCTION trigger_notify_new_product()
RETURNS TRIGGER AS $$
DECLARE
  v_shop_name TEXT;
BEGIN
  IF NEW.moderation_status = 'approved' AND (OLD IS NULL OR OLD.moderation_status != 'approved') THEN
    SELECT shop_name INTO v_shop_name
    FROM vendor_profiles
    WHERE user_id = NEW.seller_id;

    PERFORM send_notification_to_vendor_subscribers(
      NEW.seller_id,
      '🎉 Nouveau produit disponible !',
      format('%s a ajouté "%s" à sa boutique', COALESCE(v_shop_name, 'Un vendeur'), NEW.title),
      'new_product',
      jsonb_build_object('product_id', NEW.id, 'product_title', NEW.title, 'product_price', NEW.price)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER notify_vendor_subscribers_on_new_product
AFTER INSERT OR UPDATE ON marketplace_products
FOR EACH ROW
EXECUTE FUNCTION trigger_notify_new_product();