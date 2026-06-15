-- 🔒 PHASE 3: Correction finale des 10 fonctions sans search_path sécurisé
-- Ajout de SET search_path = public, pg_temp pour sécuriser contre les attaques par schema poisoning

-- 1. add_partner_role_to_existing_user
CREATE OR REPLACE FUNCTION add_partner_role_to_existing_user(
  p_user_id UUID,
  p_company_name TEXT,
  p_phone_number TEXT,
  p_business_type TEXT,
  p_service_areas TEXT[]
)
RETURNS JSON
SECURITY DEFINER
SET search_path = public, pg_temp
LANGUAGE plpgsql
AS $$
DECLARE
  v_partner_id UUID;
  v_existing_role BOOLEAN;
BEGIN
  -- Vérifier si le rôle existe déjà
  SELECT EXISTS(
    SELECT 1 FROM user_roles 
    WHERE user_id = p_user_id AND role = 'partner'
  ) INTO v_existing_role;

  -- Ajouter le rôle si nécessaire
  IF NOT v_existing_role THEN
    INSERT INTO user_roles (user_id, role, is_active)
    VALUES (p_user_id, 'partner', true);
  END IF;

  -- Vérifier si le profil partenaire existe déjà
  SELECT id INTO v_partner_id
  FROM partenaires
  WHERE user_id = p_user_id;

  -- Créer le profil partenaire si nécessaire
  IF v_partner_id IS NULL THEN
    INSERT INTO partenaires (
      user_id,
      company_name,
      phone_number,
      business_type,
      service_areas,
      is_verified,
      is_active,
      commission_rate
    ) VALUES (
      p_user_id,
      p_company_name,
      p_phone_number,
      p_business_type::partner_business_type,
      p_service_areas,
      false,
      true,
      0.15
    )
    RETURNING id INTO v_partner_id;
  END IF;

  RETURN json_build_object(
    'success', true,
    'partner_id', v_partner_id,
    'message', 'Rôle partenaire ajouté avec succès'
  );

EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$;

-- 2. log_rental_moderation_change
CREATE OR REPLACE FUNCTION log_rental_moderation_change()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public, pg_temp
LANGUAGE plpgsql
AS $$
DECLARE
  action_value TEXT;
BEGIN
  -- Mapper moderation_status vers les valeurs action autorisées
  IF NEW.moderation_status = 'approved' THEN
    action_value := 'approve';
  ELSIF NEW.moderation_status = 'rejected' THEN
    action_value := 'reject';
  ELSIF NEW.moderation_status = 'pending' THEN
    action_value := 'pending';
  ELSE
    action_value := 'pending'; -- Fallback
  END IF;

  INSERT INTO public.rental_moderation_logs (
    vehicle_id,
    moderator_id,
    action,
    previous_status,
    new_status,
    rejection_reason,
    moderated_at
  ) VALUES (
    NEW.id,
    NEW.moderator_id,
    action_value,
    OLD.moderation_status,
    NEW.moderation_status,
    NEW.rejection_reason,
    COALESCE(NEW.moderated_at, now())
  );
  
  RETURN NEW;
END;
$$;

-- 3. notify_admin_on_new_product
CREATE OR REPLACE FUNCTION notify_admin_on_new_product()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public, pg_temp
LANGUAGE plpgsql
AS $$
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
$$;

-- 4. refresh_vendor_stats_cache
CREATE OR REPLACE FUNCTION refresh_vendor_stats_cache(p_vendor_id UUID)
RETURNS void 
SECURITY DEFINER
SET search_path = public, pg_temp
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO vendor_stats_cache (
    vendor_id,
    total_products,
    total_sales,
    avg_rating,
    total_reviews,
    follower_count,
    last_product_date,
    last_sale_date,
    last_updated
  )
  SELECT 
    p_vendor_id,
    (SELECT COUNT(*) FROM marketplace_products WHERE seller_id = p_vendor_id AND moderation_status = 'approved'),
    (SELECT COUNT(*) FROM marketplace_orders WHERE seller_id = p_vendor_id AND status = 'delivered'),
    COALESCE((SELECT AVG(rating)::numeric(3,2) FROM user_ratings WHERE rated_user_id = p_vendor_id AND marketplace_order_id IS NOT NULL), 0),
    (SELECT COUNT(*) FROM user_ratings WHERE rated_user_id = p_vendor_id AND marketplace_order_id IS NOT NULL),
    (SELECT COUNT(*) FROM vendor_subscriptions WHERE vendor_id = p_vendor_id AND is_active = true),
    (SELECT MAX(created_at) FROM marketplace_products WHERE seller_id = p_vendor_id),
    (SELECT MAX(updated_at) FROM marketplace_orders WHERE seller_id = p_vendor_id AND status = 'delivered'),
    NOW()
  ON CONFLICT (vendor_id) DO UPDATE SET
    total_products = EXCLUDED.total_products,
    total_sales = EXCLUDED.total_sales,
    avg_rating = EXCLUDED.avg_rating,
    total_reviews = EXCLUDED.total_reviews,
    follower_count = EXCLUDED.follower_count,
    last_product_date = EXCLUDED.last_product_date,
    last_sale_date = EXCLUDED.last_sale_date,
    last_updated = NOW();
END;
$$;

-- 5. send_notification_to_vendor_subscribers
CREATE OR REPLACE FUNCTION send_notification_to_vendor_subscribers(
  p_vendor_id UUID,
  p_title TEXT,
  p_message TEXT,
  p_notification_type TEXT,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS void 
SECURITY DEFINER
SET search_path = public, pg_temp
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO vendor_notifications (
    customer_id,
    vendor_id,
    notification_type,
    title,
    message,
    metadata,
    is_read,
    is_acknowledged,
    sound_played,
    created_at
  )
  SELECT 
    customer_id,
    p_vendor_id,
    p_notification_type,
    p_title,
    p_message,
    p_metadata,
    false,
    false,
    false,
    NOW()
  FROM vendor_subscriptions
  WHERE vendor_id = p_vendor_id AND is_active = true;
END;
$$;

-- 6. trigger_notify_new_product
CREATE OR REPLACE FUNCTION trigger_notify_new_product()
RETURNS TRIGGER 
SET search_path = public, pg_temp
LANGUAGE plpgsql
AS $$
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
$$;

-- 7. trigger_update_vendor_stats_on_order
CREATE OR REPLACE FUNCTION trigger_update_vendor_stats_on_order()
RETURNS TRIGGER 
SET search_path = public, pg_temp
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.status = 'delivered' AND (OLD IS NULL OR OLD.status != 'delivered') THEN
    PERFORM refresh_vendor_stats_cache(NEW.seller_id);
  END IF;
  RETURN NEW;
END;
$$;

-- 8. trigger_update_vendor_rating_stats
CREATE OR REPLACE FUNCTION trigger_update_vendor_rating_stats()
RETURNS TRIGGER 
SET search_path = public, pg_temp
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.marketplace_order_id IS NOT NULL THEN
    PERFORM refresh_vendor_stats_cache(NEW.rated_user_id);
  END IF;
  RETURN NEW;
END;
$$;

-- 9. trigger_update_vendor_follower_count
CREATE OR REPLACE FUNCTION trigger_update_vendor_follower_count()
RETURNS TRIGGER 
SET search_path = public, pg_temp
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND NEW.is_active != OLD.is_active) THEN
    PERFORM refresh_vendor_stats_cache(NEW.vendor_id);
  END IF;
  RETURN NEW;
END;
$$;

-- 10. update_user_settings_updated_at
CREATE OR REPLACE FUNCTION update_user_settings_updated_at()
RETURNS TRIGGER 
SET search_path = public, pg_temp
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Log de la migration
INSERT INTO activity_logs (activity_type, description, metadata)
VALUES (
  'security_hardening',
  'Ajout de search_path sécurisé aux 10 dernières fonctions',
  jsonb_build_object(
    'migration', 'secure_search_path_final',
    'functions_fixed', ARRAY[
      'add_partner_role_to_existing_user',
      'log_rental_moderation_change',
      'notify_admin_on_new_product',
      'refresh_vendor_stats_cache',
      'send_notification_to_vendor_subscribers',
      'trigger_notify_new_product',
      'trigger_update_vendor_stats_on_order',
      'trigger_update_vendor_rating_stats',
      'trigger_update_vendor_follower_count',
      'update_user_settings_updated_at'
    ],
    'total_functions_secured', 14
  )
);