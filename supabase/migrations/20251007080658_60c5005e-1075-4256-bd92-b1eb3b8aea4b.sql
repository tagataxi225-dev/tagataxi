-- Ajouter colonne rejection_reason si elle n'existe pas
ALTER TABLE marketplace_products 
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Créer la fonction de notification admin
CREATE OR REPLACE FUNCTION notify_admin_new_product()
RETURNS TRIGGER AS $$
DECLARE
  seller_info RECORD;
BEGIN
  -- Récupérer infos vendeur
  SELECT display_name, phone_number INTO seller_info
  FROM clients WHERE user_id = NEW.seller_id;
  
  -- Insérer notification admin
  INSERT INTO admin_notifications (
    type, severity, title, message, data, is_read
  ) VALUES (
    'product_moderation',
    'info',
    'Nouveau produit à modérer',
    format('"%s" soumis par %s', NEW.title, COALESCE(seller_info.display_name, 'Vendeur inconnu')),
    jsonb_build_object(
      'product_id', NEW.id,
      'seller_id', NEW.seller_id,
      'seller_name', seller_info.display_name,
      'price', NEW.price,
      'category', NEW.category
    ),
    false
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Supprimer les triggers existants s'ils existent
DROP TRIGGER IF EXISTS trigger_notify_admin_new_product ON marketplace_products;
DROP TRIGGER IF EXISTS trigger_notify_admin_product_updated ON marketplace_products;

-- Trigger pour nouveaux produits
CREATE TRIGGER trigger_notify_admin_new_product
AFTER INSERT ON marketplace_products
FOR EACH ROW
WHEN (NEW.moderation_status = 'pending')
EXECUTE FUNCTION notify_admin_new_product();

-- Trigger pour produits approuvés modifiés
CREATE TRIGGER trigger_notify_admin_product_updated
AFTER UPDATE ON marketplace_products
FOR EACH ROW
WHEN (
  OLD.moderation_status = 'approved' AND 
  NEW.moderation_status = 'pending'
)
EXECUTE FUNCTION notify_admin_new_product();