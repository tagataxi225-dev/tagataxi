-- 🔒 PHASE 2: Correction des fonctions sans search_path sécurisé
-- Ajout de SET search_path = public, pg_temp à toutes les fonctions critiques

-- 1. auto_approve_verified_partner_vehicles
CREATE OR REPLACE FUNCTION auto_approve_verified_partner_vehicles()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public, pg_temp
LANGUAGE plpgsql
AS $$
DECLARE
  partner_verification_level TEXT;
BEGIN
  -- Récupérer le niveau de vérification du partenaire
  SELECT verification_level INTO partner_verification_level
  FROM partenaires
  WHERE id = NEW.partner_id;

  -- Si partenaire vérifié ou premium, auto-approuver le véhicule
  IF partner_verification_level IN ('verified', 'premium') THEN
    NEW.moderation_status := 'approved';
    NEW.is_active := true;
    NEW.moderated_at := NOW();
  END IF;

  RETURN NEW;
END;
$$;

-- 2. notify_admin_new_food_product
CREATE OR REPLACE FUNCTION notify_admin_new_food_product()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public, pg_temp
LANGUAGE plpgsql
AS $$
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
$$;

-- 3. calculate_ab_significance
CREATE OR REPLACE FUNCTION calculate_ab_significance(
  experiment_id_param TEXT
)
RETURNS TABLE (
  variant TEXT,
  conversions BIGINT,
  views BIGINT,
  conversion_rate NUMERIC,
  confidence_level NUMERIC
)
SECURITY DEFINER
SET search_path = public, pg_temp
LANGUAGE plpgsql
AS $$
DECLARE
  control_conversions BIGINT;
  control_views BIGINT;
  variant_conversions BIGINT;
  variant_views BIGINT;
  chi_square NUMERIC;
BEGIN
  -- Récupérer les données control
  SELECT 
    COUNT(*) FILTER (WHERE event_type = 'conversion'),
    COUNT(*) FILTER (WHERE event_type = 'view')
  INTO control_conversions, control_views
  FROM ab_test_events
  WHERE ab_test_events.experiment_id = experiment_id_param
    AND ab_test_events.variant = 'control';

  -- Récupérer les données variant
  SELECT 
    COUNT(*) FILTER (WHERE event_type = 'conversion'),
    COUNT(*) FILTER (WHERE event_type = 'view')
  INTO variant_conversions, variant_views
  FROM ab_test_events
  WHERE ab_test_events.experiment_id = experiment_id_param
    AND ab_test_events.variant = 'variant';

  -- Calculer le chi-square (formule simplifiée)
  chi_square := POWER(control_conversions * variant_views - variant_conversions * control_views, 2) / 
                NULLIF((control_conversions + variant_conversions) * (control_views + variant_views), 0);

  RETURN QUERY
  SELECT 
    e.variant,
    COUNT(*) FILTER (WHERE e.event_type = 'conversion') as conversions,
    COUNT(*) FILTER (WHERE e.event_type = 'view') as views,
    ROUND(
      (COUNT(*) FILTER (WHERE e.event_type = 'conversion')::numeric / 
       NULLIF(COUNT(*) FILTER (WHERE e.event_type = 'view'), 0) * 100), 
      2
    ) as conversion_rate,
    CASE 
      WHEN chi_square > 3.841 THEN 95.0
      WHEN chi_square > 2.706 THEN 90.0
      WHEN chi_square > 1.642 THEN 80.0
      ELSE 0.0
    END as confidence_level
  FROM ab_test_events e
  WHERE e.experiment_id = experiment_id_param
  GROUP BY e.variant;
END;
$$;

-- 4. cleanup_old_heatmap_data
CREATE OR REPLACE FUNCTION cleanup_old_heatmap_data()
RETURNS INTEGER 
SECURITY DEFINER
SET search_path = public, pg_temp
LANGUAGE plpgsql
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM heatmap_clicks
  WHERE created_at < NOW() - INTERVAL '90 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

-- Log de la migration
INSERT INTO activity_logs (activity_type, description, metadata)
VALUES (
  'security_hardening',
  'Ajout de search_path sécurisé à 4 fonctions critiques',
  jsonb_build_object(
    'migration', 'secure_search_path',
    'functions_fixed', ARRAY[
      'auto_approve_verified_partner_vehicles',
      'notify_admin_new_food_product',
      'calculate_ab_significance',
      'cleanup_old_heatmap_data'
    ]
  )
);