-- ✅ NETTOYAGE COMPLET DES DONNÉES DE TEST - MARKETPLACE
-- Date: 2025-11-04
-- Objectif: Supprimer tous les produits et commandes de test en respectant TOUTES les contraintes FK

-- 1. Supprimer les assignations de livraison liées aux commandes à supprimer
DELETE FROM marketplace_delivery_assignments
WHERE order_id IN (
  SELECT id FROM marketplace_orders 
  WHERE status IN ('pending', 'pending_payment')
);

-- 2. Supprimer les paiements escrow associés aux commandes à supprimer
DELETE FROM escrow_payments 
WHERE order_id IN (
  SELECT id FROM marketplace_orders 
  WHERE status IN ('pending', 'pending_payment')
);

-- 3. Supprimer les transactions escrow associées
DELETE FROM escrow_transactions
WHERE order_id IN (
  SELECT id FROM marketplace_orders 
  WHERE status IN ('pending', 'pending_payment')
);

-- 4. Supprimer les notifications vendeur liées aux commandes
DELETE FROM vendor_notifications
WHERE order_id IN (
  SELECT id FROM marketplace_orders 
  WHERE status IN ('pending', 'pending_payment')
);

-- 5. Supprimer les messages de chat liés aux produits Pizza
DELETE FROM marketplace_messages
WHERE chat_id IN (
  SELECT id FROM marketplace_chats
  WHERE product_id IN (
    '0ae46e08-d799-49e5-a7ee-4e2158aa01e8',
    '796055e4-668a-425e-8358-b1244448b64e',
    'ad8af2fd-4ba3-44f1-b205-9fd5c8fc563b'
  )
);

-- 6. Supprimer les chats liés aux produits Pizza
DELETE FROM marketplace_chats
WHERE product_id IN (
  '0ae46e08-d799-49e5-a7ee-4e2158aa01e8',
  '796055e4-668a-425e-8358-b1244448b64e',
  'ad8af2fd-4ba3-44f1-b205-9fd5c8fc563b'
);

-- 7. Supprimer les commandes en attente de paiement ou pending
DELETE FROM marketplace_orders 
WHERE status IN ('pending', 'pending_payment');

-- 8. Supprimer les 3 produits Pizza de test
DELETE FROM marketplace_products 
WHERE id IN (
  '0ae46e08-d799-49e5-a7ee-4e2158aa01e8',
  '796055e4-668a-425e-8358-b1244448b64e',
  'ad8af2fd-4ba3-44f1-b205-9fd5c8fc563b'
);

-- 9. Créer un trigger pour notifier les admins des nouveaux produits
CREATE OR REPLACE FUNCTION notify_admin_on_new_product()
RETURNS TRIGGER AS $$
BEGIN
  -- Appeler l'Edge Function pour notifier tous les admins
  PERFORM
    net.http_post(
      url := current_setting('app.supabase_url') || '/functions/v1/notify-admin-new-product',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.supabase_service_role_key')
      ),
      body := jsonb_build_object(
        'productId', NEW.id::text,
        'sellerId', NEW.seller_id::text,
        'productTitle', NEW.title,
        'productCategory', NEW.category,
        'productPrice', NEW.price
      )
    );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Créer le trigger (supprimer l'ancien s'il existe)
DROP TRIGGER IF EXISTS trigger_notify_admin_new_product ON marketplace_products;

CREATE TRIGGER trigger_notify_admin_new_product
AFTER INSERT ON marketplace_products
FOR EACH ROW
WHEN (NEW.moderation_status = 'pending')
EXECUTE FUNCTION notify_admin_on_new_product();