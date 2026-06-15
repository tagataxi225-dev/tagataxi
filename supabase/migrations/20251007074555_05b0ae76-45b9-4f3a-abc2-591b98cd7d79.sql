-- ========================================
-- PHASE 1: Fonctions de notification admin pour marketplace
-- ========================================

-- Fonction pour notifier les admins lors de création de produit
CREATE OR REPLACE FUNCTION public.notify_admin_new_product()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_seller_name TEXT;
  v_product_title TEXT;
BEGIN
  -- Récupérer le nom du vendeur
  SELECT display_name INTO v_seller_name
  FROM public.clients
  WHERE user_id = NEW.seller_id
  LIMIT 1;
  
  v_product_title := NEW.title;
  
  -- Créer notification admin
  INSERT INTO public.admin_notifications (
    type,
    title,
    message,
    severity,
    data,
    is_read
  ) VALUES (
    'product_moderation',
    'Nouveau produit à modérer',
    format('Le vendeur %s a soumis "%s" pour validation', 
           COALESCE(v_seller_name, 'Inconnu'), 
           v_product_title),
    'info',
    jsonb_build_object(
      'product_id', NEW.id,
      'seller_id', NEW.seller_id,
      'seller_name', v_seller_name,
      'product_title', v_product_title,
      'category', NEW.category,
      'price', NEW.price,
      'created_at', NEW.created_at
    ),
    false
  );
  
  RETURN NEW;
END;
$$;

-- Fonction pour notifier les admins lors de modification produit approuvé
CREATE OR REPLACE FUNCTION public.notify_admin_product_updated()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_seller_name TEXT;
BEGIN
  -- Seulement si le produit était approuvé et repasse en pending
  IF OLD.moderation_status = 'approved' AND NEW.moderation_status = 'pending' THEN
    -- Récupérer le nom du vendeur
    SELECT display_name INTO v_seller_name
    FROM public.clients
    WHERE user_id = NEW.seller_id
    LIMIT 1;
    
    -- Créer notification admin
    INSERT INTO public.admin_notifications (
      type,
      title,
      message,
      severity,
      data,
      is_read
    ) VALUES (
      'product_moderation',
      'Produit modifié - Re-validation requise',
      format('Le vendeur %s a modifié "%s" (anciennement approuvé)', 
             COALESCE(v_seller_name, 'Inconnu'), 
             NEW.title),
      'warning',
      jsonb_build_object(
        'product_id', NEW.id,
        'seller_id', NEW.seller_id,
        'seller_name', v_seller_name,
        'product_title', NEW.title,
        'previous_status', OLD.moderation_status,
        'updated_at', NEW.updated_at
      ),
      false
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Attacher les triggers à marketplace_products
DROP TRIGGER IF EXISTS trigger_notify_admin_new_product ON public.marketplace_products;
CREATE TRIGGER trigger_notify_admin_new_product
  AFTER INSERT ON public.marketplace_products
  FOR EACH ROW
  WHEN (NEW.moderation_status = 'pending')
  EXECUTE FUNCTION public.notify_admin_new_product();

DROP TRIGGER IF EXISTS trigger_notify_admin_product_updated ON public.marketplace_products;
CREATE TRIGGER trigger_notify_admin_product_updated
  AFTER UPDATE ON public.marketplace_products
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_admin_product_updated();