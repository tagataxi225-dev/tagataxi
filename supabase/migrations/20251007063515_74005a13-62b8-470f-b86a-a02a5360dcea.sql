-- ============================================
-- Notification Admin pour Nouveaux Produits
-- ============================================

-- Fonction pour notifier les admins quand un nouveau produit est créé
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
  -- Ne notifier que pour les produits en attente de modération
  IF NEW.moderation_status = 'pending' THEN
    
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
      '🛍️ Nouveau produit à modérer',
      format('Le vendeur %s a soumis un nouveau produit "%s" pour modération.', 
             COALESCE(v_seller_name, 'Inconnu'), 
             COALESCE(v_product_title, 'Sans titre')),
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
    
    -- Logger dans les activités
    INSERT INTO public.activity_logs (
      user_id,
      activity_type,
      description,
      metadata
    ) VALUES (
      NEW.seller_id,
      'product_submitted',
      format('Produit "%s" soumis pour modération', v_product_title),
      jsonb_build_object(
        'product_id', NEW.id,
        'moderation_status', NEW.moderation_status
      )
    );
    
  END IF;
  
  RETURN NEW;
END;
$$;

-- Créer le trigger sur marketplace_products
DROP TRIGGER IF EXISTS trigger_notify_admin_new_product ON public.marketplace_products;

CREATE TRIGGER trigger_notify_admin_new_product
  AFTER INSERT ON public.marketplace_products
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_admin_new_product();

-- ============================================
-- Fonction Helper pour Auto-créer Seller Profile
-- ============================================

CREATE OR REPLACE FUNCTION public.ensure_seller_profile(p_user_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_seller_profile_id UUID;
  v_display_name TEXT;
BEGIN
  -- Vérifier si le profil vendeur existe
  SELECT id INTO v_seller_profile_id
  FROM public.seller_profiles
  WHERE user_id = p_user_id;
  
  -- Si n'existe pas, le créer
  IF v_seller_profile_id IS NULL THEN
    
    -- Récupérer le nom d'affichage depuis clients
    SELECT display_name INTO v_display_name
    FROM public.clients
    WHERE user_id = p_user_id;
    
    -- Créer le profil vendeur
    INSERT INTO public.seller_profiles (
      user_id,
      display_name,
      verified_seller,
      seller_badge_level
    ) VALUES (
      p_user_id,
      COALESCE(v_display_name, 'Nouveau Vendeur'),
      true, -- Auto-vérifier pour simplifier
      'verified'
    )
    RETURNING id INTO v_seller_profile_id;
    
  END IF;
  
  RETURN v_seller_profile_id;
END;
$$;