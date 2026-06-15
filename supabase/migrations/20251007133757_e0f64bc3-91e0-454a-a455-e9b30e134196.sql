-- Phase 3 : Corrections techniques pour le système de modération des produits

-- ================================================================
-- 1. AMÉLIORATION DES POLITIQUES RLS POUR marketplace_products
-- ================================================================

-- Politique INSERT explicite pour les vendeurs
DROP POLICY IF EXISTS "marketplace_products_sellers_can_insert" ON public.marketplace_products;
CREATE POLICY "marketplace_products_sellers_can_insert" ON public.marketplace_products
  FOR INSERT 
  WITH CHECK (
    auth.uid() = seller_id
    AND moderation_status = 'pending'
  );

-- ================================================================
-- 2. TRIGGER AUTOMATIQUE POUR NOTIFICATIONS ADMIN
-- ================================================================

-- Fonction trigger pour créer une notification admin lors de la création d'un produit
CREATE OR REPLACE FUNCTION public.notify_admin_on_new_product()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_seller_name TEXT;
BEGIN
  -- Récupérer le nom du vendeur
  SELECT display_name INTO v_seller_name
  FROM public.clients
  WHERE user_id = NEW.seller_id;

  -- Créer une notification admin
  INSERT INTO public.admin_notifications (
    type,
    severity,
    title,
    message,
    data
  ) VALUES (
    'product_moderation',
    'info',
    '📦 Nouveau produit à modérer',
    COALESCE(v_seller_name, 'Vendeur inconnu') || ' a publié "' || NEW.title || '" - ' || 
    'Catégorie: ' || NEW.category || ' - Prix: ' || NEW.price::TEXT || ' CDF',
    jsonb_build_object(
      'product_id', NEW.id,
      'seller_id', NEW.seller_id,
      'product_title', NEW.title,
      'product_category', NEW.category,
      'product_price', NEW.price
    )
  );

  -- Créer une notification pour le vendeur
  INSERT INTO public.user_notifications (
    user_id,
    title,
    message,
    type,
    metadata
  ) VALUES (
    NEW.seller_id,
    '⏳ Produit en cours de modération',
    'Votre produit "' || NEW.title || '" est en cours de vérification. Vous serez notifié une fois la modération terminée (24-48h).',
    'product_status',
    jsonb_build_object(
      'product_id', NEW.id,
      'status', 'pending'
    )
  );

  RETURN NEW;
END;
$$;

-- Créer le trigger sur marketplace_products
DROP TRIGGER IF EXISTS trigger_notify_admin_on_product_create ON public.marketplace_products;
CREATE TRIGGER trigger_notify_admin_on_product_create
  AFTER INSERT ON public.marketplace_products
  FOR EACH ROW
  WHEN (NEW.moderation_status = 'pending')
  EXECUTE FUNCTION public.notify_admin_on_new_product();

-- ================================================================
-- 3. AMÉLIORATION DU TRIGGER DE NOTIFICATION VENDEUR (MODÉRATION)
-- ================================================================

-- Fonction pour notifier le vendeur du changement de statut de modération
CREATE OR REPLACE FUNCTION public.notify_seller_on_moderation_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Notification uniquement si le statut de modération change
  IF OLD.moderation_status IS DISTINCT FROM NEW.moderation_status THEN
    
    -- Si approuvé
    IF NEW.moderation_status = 'approved' THEN
      INSERT INTO public.user_notifications (
        user_id,
        title,
        message,
        type,
        metadata
      ) VALUES (
        NEW.seller_id,
        '✅ Produit approuvé !',
        'Félicitations ! Votre produit "' || NEW.title || '" a été approuvé et est maintenant visible sur la marketplace.',
        'product_status',
        jsonb_build_object(
          'product_id', NEW.id,
          'status', 'approved'
        )
      );
    
    -- Si rejeté
    ELSIF NEW.moderation_status = 'rejected' THEN
      INSERT INTO public.user_notifications (
        user_id,
        title,
        message,
        type,
        metadata
      ) VALUES (
        NEW.seller_id,
        '❌ Produit rejeté',
        'Votre produit "' || NEW.title || '" a été rejeté. Raison: ' || COALESCE(NEW.rejection_reason, 'Non spécifiée') || '. Vous pouvez le modifier et le soumettre à nouveau.',
        'product_status',
        jsonb_build_object(
          'product_id', NEW.id,
          'status', 'rejected',
          'rejection_reason', NEW.rejection_reason
        )
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Créer le trigger sur marketplace_products (UPDATE)
DROP TRIGGER IF EXISTS trigger_notify_seller_moderation ON public.marketplace_products;
CREATE TRIGGER trigger_notify_seller_moderation
  AFTER UPDATE ON public.marketplace_products
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_seller_on_moderation_change();

-- ================================================================
-- 4. LOGS D'ACTIVITÉ POUR TRAÇABILITÉ
-- ================================================================

-- Fonction pour logger les changements de modération
CREATE OR REPLACE FUNCTION public.log_product_moderation_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Logger uniquement si le statut de modération change
  IF OLD.moderation_status IS DISTINCT FROM NEW.moderation_status THEN
    INSERT INTO public.activity_logs (
      user_id,
      activity_type,
      description,
      reference_type,
      reference_id,
      metadata
    ) VALUES (
      COALESCE(NEW.moderator_id, auth.uid()),
      'product_moderation_' || NEW.moderation_status,
      'Produit "' || NEW.title || '" - Statut: ' || OLD.moderation_status || ' → ' || NEW.moderation_status,
      'marketplace_products',
      NEW.id,
      jsonb_build_object(
        'product_id', NEW.id,
        'seller_id', NEW.seller_id,
        'old_status', OLD.moderation_status,
        'new_status', NEW.moderation_status,
        'moderator_id', NEW.moderator_id,
        'rejection_reason', NEW.rejection_reason
      )
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Créer le trigger de logging
DROP TRIGGER IF EXISTS trigger_log_product_moderation ON public.marketplace_products;
CREATE TRIGGER trigger_log_product_moderation
  AFTER UPDATE ON public.marketplace_products
  FOR EACH ROW
  EXECUTE FUNCTION public.log_product_moderation_activity();

-- ================================================================
-- DOCUMENTATION
-- ================================================================

COMMENT ON POLICY "marketplace_products_sellers_can_insert" ON public.marketplace_products IS 
'Permet aux vendeurs de créer des produits avec statut pending automatique';

COMMENT ON FUNCTION public.notify_admin_on_new_product() IS 
'Créer automatiquement des notifications admin et vendeur lors de la création d''un produit';

COMMENT ON FUNCTION public.notify_seller_on_moderation_change() IS 
'Notifier le vendeur lorsque le statut de modération de son produit change';

COMMENT ON FUNCTION public.log_product_moderation_activity() IS 
'Logger toutes les actions de modération pour traçabilité et audit';
