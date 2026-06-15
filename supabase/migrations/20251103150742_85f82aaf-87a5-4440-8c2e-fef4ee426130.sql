-- Fonction de notification automatique pour nouveaux produits food
CREATE OR REPLACE FUNCTION notify_admin_new_food_product()
RETURNS TRIGGER AS $$
DECLARE
  v_restaurant_name TEXT;
  v_restaurant_city TEXT;
  v_restaurant_user_id UUID;
BEGIN
  -- Récupérer les infos du restaurant
  SELECT 
    restaurant_name, 
    city, 
    user_id
  INTO 
    v_restaurant_name, 
    v_restaurant_city, 
    v_restaurant_user_id
  FROM restaurant_profiles
  WHERE id = NEW.restaurant_id;

  -- Insérer notification admin
  INSERT INTO admin_notifications (
    type,
    severity,
    title,
    message,
    data
  ) VALUES (
    'product_moderation',
    'info',
    '🍽️ Nouveau plat à modérer',
    format(
      '%s (%s) a publié "%s" - Catégorie: %s - Prix: %s CDF',
      COALESCE(v_restaurant_name, 'Restaurant inconnu'),
      COALESCE(v_restaurant_city, 'Ville inconnue'),
      NEW.name,
      COALESCE(NEW.category, 'Non catégorisé'),
      NEW.price::TEXT
    ),
    jsonb_build_object(
      'product_id', NEW.id,
      'restaurant_id', NEW.restaurant_id,
      'restaurant_name', v_restaurant_name,
      'restaurant_city', v_restaurant_city,
      'restaurant_user_id', v_restaurant_user_id,
      'product_name', NEW.name,
      'product_category', NEW.category,
      'product_price', NEW.price
    )
  );

  -- Notification vendeur
  IF v_restaurant_user_id IS NOT NULL THEN
    INSERT INTO delivery_notifications (
      user_id,
      title,
      message,
      notification_type
    ) VALUES (
      v_restaurant_user_id,
      '⏳ Produit en modération',
      format('Votre plat "%s" est en cours de vérification par notre équipe.', NEW.name),
      'product_pending'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Supprimer l'ancien trigger s'il existe
DROP TRIGGER IF EXISTS trigger_notify_admin_new_food_product ON food_products;

-- Créer le trigger pour les nouveaux produits en attente de modération
CREATE TRIGGER trigger_notify_admin_new_food_product
  AFTER INSERT ON food_products
  FOR EACH ROW
  WHEN (NEW.moderation_status = 'pending')
  EXECUTE FUNCTION notify_admin_new_food_product();