-- ============================================
-- Trigger pour re-notification admin lors de modification produit
-- ============================================

-- Fonction pour notifier les admins quand un produit approuvé est modifié
CREATE OR REPLACE FUNCTION public.notify_admin_product_updated()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_seller_name TEXT;
  v_product_title TEXT;
BEGIN
  -- Détecter si un produit approuvé est re-soumis à modération
  IF OLD.moderation_status = 'approved' AND NEW.moderation_status = 'pending' THEN
    
    -- Récupérer le nom du vendeur
    SELECT COALESCE(c.display_name, sp.display_name, 'Vendeur Inconnu')
    INTO v_seller_name
    FROM public.seller_profiles sp
    LEFT JOIN public.clients c ON c.user_id = sp.user_id
    WHERE sp.user_id = NEW.seller_id
    LIMIT 1;
    
    v_product_title := NEW.title;
    
    -- Insérer une notification pour les admins
    INSERT INTO public.admin_notifications (
      type,
      title,
      message,
      severity,
      data,
      is_read
    ) VALUES (
      'product_moderation',
      '🔄 Produit modifié à re-modérer',
      format('Le vendeur %s a modifié le produit "%s". Re-validation nécessaire.', 
             COALESCE(v_seller_name, 'Inconnu'), 
             COALESCE(v_product_title, 'Sans titre')),
      'warning',
      jsonb_build_object(
        'product_id', NEW.id,
        'seller_id', NEW.seller_id,
        'seller_name', v_seller_name,
        'product_title', v_product_title,
        'previous_status', OLD.moderation_status,
        'new_status', NEW.moderation_status,
        'action', 'product_updated',
        'updated_at', NEW.updated_at
      ),
      false
    );
    
    -- Logger dans les activités
    INSERT INTO public.activity_logs (
      user_id,
      activity_type,
      description,
      metadata
    ) VALUES (
      NEW.seller_id,
      'product_updated_resubmitted',
      format('Produit "%s" modifié et re-soumis pour modération', v_product_title),
      jsonb_build_object(
        'product_id', NEW.id,
        'previous_status', OLD.moderation_status,
        'new_status', NEW.moderation_status
      )
    );
    
  END IF;
  
  RETURN NEW;
END;
$$;

-- Créer le trigger sur marketplace_products pour les mises à jour
DROP TRIGGER IF EXISTS trigger_notify_admin_product_updated ON public.marketplace_products;

CREATE TRIGGER trigger_notify_admin_product_updated
  AFTER UPDATE ON public.marketplace_products
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_admin_product_updated();