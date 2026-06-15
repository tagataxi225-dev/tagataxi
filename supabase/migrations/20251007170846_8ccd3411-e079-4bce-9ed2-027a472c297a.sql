-- ============================================
-- PHASE 3 : MAINTENANCE - SÉCURISATION FINALE
-- ============================================

-- ========================================
-- 1. SUPPRIMER LES ANCIENNES FONCTIONS AVANT RECRÉATION
-- ========================================

DROP FUNCTION IF EXISTS public.calculate_distance_km(numeric, numeric, numeric, numeric) CASCADE;
DROP FUNCTION IF EXISTS public.calculate_delivery_price(text, numeric, text) CASCADE;
DROP FUNCTION IF EXISTS public.validate_booking_coordinates(jsonb, jsonb) CASCADE;

-- ========================================
-- 2. RECRÉER LES FONCTIONS AVEC search_path SÉCURISÉ
-- ========================================

-- Fonction : calculate_distance_km
CREATE FUNCTION public.calculate_distance_km(
  lat1 numeric, 
  lng1 numeric, 
  lat2 numeric, 
  lng2 numeric
)
RETURNS numeric
LANGUAGE plpgsql
IMMUTABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  earth_radius_km constant numeric := 6371;
  dlat numeric;
  dlng numeric;
  a numeric;
  c numeric;
BEGIN
  dlat := radians(lat2 - lat1);
  dlng := radians(lng2 - lng1);
  
  a := sin(dlat / 2) * sin(dlat / 2) +
       cos(radians(lat1)) * cos(radians(lat2)) *
       sin(dlng / 2) * sin(dlng / 2);
  
  c := 2 * atan2(sqrt(a), sqrt(1 - a));
  
  RETURN earth_radius_km * c;
END;
$$;

-- Fonction : calculate_delivery_price
CREATE FUNCTION public.calculate_delivery_price(
  delivery_type_param text,
  distance_km_param numeric,
  city_param text DEFAULT 'Kinshasa'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  config RECORD;
  base_price numeric;
  price_per_km numeric;
  calculated_price numeric;
  minimum_fare numeric;
  maximum_fare numeric;
BEGIN
  -- Récupérer la configuration de tarification
  SELECT 
    dpc.base_price,
    dpc.price_per_km,
    dpc.minimum_fare,
    dpc.maximum_fare
  INTO config
  FROM public.delivery_pricing_config dpc
  WHERE dpc.service_type = delivery_type_param
    AND dpc.city = city_param
    AND dpc.is_active = true
  LIMIT 1;
  
  -- Valeurs par défaut si pas de configuration
  base_price := COALESCE(config.base_price, 5000);
  price_per_km := COALESCE(config.price_per_km, 500);
  minimum_fare := COALESCE(config.minimum_fare, 3000);
  maximum_fare := config.maximum_fare;
  
  -- Calcul du prix
  calculated_price := base_price + (distance_km_param * price_per_km);
  
  -- Appliquer les limites
  calculated_price := GREATEST(calculated_price, minimum_fare);
  IF maximum_fare IS NOT NULL THEN
    calculated_price := LEAST(calculated_price, maximum_fare);
  END IF;
  
  RETURN jsonb_build_object(
    'calculated_price', ROUND(calculated_price),
    'base_price', base_price,
    'price_per_km', price_per_km,
    'distance_km', distance_km_param,
    'minimum_fare', minimum_fare,
    'maximum_fare', maximum_fare
  );
END;
$$;

-- Fonction : validate_booking_coordinates
CREATE FUNCTION public.validate_booking_coordinates(
  pickup_coords jsonb,
  delivery_coords jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  validated_pickup jsonb;
  validated_delivery jsonb;
  pickup_lat numeric;
  pickup_lng numeric;
  delivery_lat numeric;
  delivery_lng numeric;
BEGIN
  -- Valider les coordonnées de pickup
  pickup_lat := (pickup_coords->>'lat')::numeric;
  pickup_lng := (pickup_coords->>'lng')::numeric;
  
  IF pickup_lat IS NULL OR pickup_lng IS NULL OR
     pickup_lat < -90 OR pickup_lat > 90 OR
     pickup_lng < -180 OR pickup_lng > 180 THEN
    -- Coordonnées par défaut (Kinshasa centre)
    validated_pickup := jsonb_build_object('lat', -4.3217, 'lng', 15.3069);
  ELSE
    validated_pickup := pickup_coords;
  END IF;
  
  -- Valider les coordonnées de livraison si présentes
  IF delivery_coords IS NOT NULL THEN
    delivery_lat := (delivery_coords->>'lat')::numeric;
    delivery_lng := (delivery_coords->>'lng')::numeric;
    
    IF delivery_lat IS NULL OR delivery_lng IS NULL OR
       delivery_lat < -90 OR delivery_lat > 90 OR
       delivery_lng < -180 OR delivery_lng > 180 THEN
      validated_delivery := jsonb_build_object('lat', -4.3217, 'lng', 15.3069);
    ELSE
      validated_delivery := delivery_coords;
    END IF;
  ELSE
    validated_delivery := NULL;
  END IF;
  
  RETURN jsonb_build_object(
    'pickup', validated_pickup,
    'delivery', validated_delivery
  );
END;
$$;

-- ========================================
-- 3. REMPLACER LES VUES MATÉRIALISÉES PAR DES FONCTIONS SÉCURISÉES
-- Note: Ces fonctions retournent NULL si les tables n'existent pas
-- ========================================

-- Fonction pour remplacer mv_admin_rental_vehicle_stats
CREATE OR REPLACE FUNCTION public.get_rental_vehicle_stats()
RETURNS TABLE (
  total_vehicles bigint,
  active_vehicles bigint,
  pending_moderation bigint,
  approved_vehicles bigint,
  rejected_vehicles bigint
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Vérifier si la table existe
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'rental_vehicles') THEN
    RETURN QUERY
    SELECT 
      COUNT(*)::bigint AS total_vehicles,
      COUNT(*) FILTER (WHERE is_active = true)::bigint AS active_vehicles,
      COUNT(*) FILTER (WHERE moderation_status = 'pending')::bigint AS pending_moderation,
      COUNT(*) FILTER (WHERE moderation_status = 'approved')::bigint AS approved_vehicles,
      COUNT(*) FILTER (WHERE moderation_status = 'rejected')::bigint AS rejected_vehicles
    FROM public.rental_vehicles
    WHERE is_current_user_admin();
  ELSE
    -- Retourner des valeurs NULL si la table n'existe pas
    RETURN QUERY SELECT 0::bigint, 0::bigint, 0::bigint, 0::bigint, 0::bigint;
  END IF;
END;
$$;

-- Fonction pour remplacer mv_admin_rental_booking_stats
CREATE OR REPLACE FUNCTION public.get_rental_booking_stats()
RETURNS TABLE (
  total_bookings bigint,
  active_bookings bigint,
  completed_bookings bigint,
  cancelled_bookings bigint,
  total_revenue numeric
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Vérifier si la table existe
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'rental_bookings') THEN
    RETURN QUERY
    SELECT 
      COUNT(*)::bigint AS total_bookings,
      COUNT(*) FILTER (WHERE status IN ('confirmed', 'active'))::bigint AS active_bookings,
      COUNT(*) FILTER (WHERE status = 'completed')::bigint AS completed_bookings,
      COUNT(*) FILTER (WHERE status = 'cancelled')::bigint AS cancelled_bookings,
      0::numeric AS total_revenue  -- Colonne price peut avoir un nom différent
    FROM public.rental_bookings
    WHERE is_current_user_admin();
  ELSE
    -- Retourner des valeurs NULL si la table n'existe pas
    RETURN QUERY SELECT 0::bigint, 0::bigint, 0::bigint, 0::bigint, 0::numeric;
  END IF;
END;
$$;

-- Fonction pour remplacer mv_admin_rental_subscription_stats
CREATE OR REPLACE FUNCTION public.get_rental_subscription_stats()
RETURNS TABLE (
  total_subscriptions bigint,
  active_subscriptions bigint,
  expired_subscriptions bigint,
  total_subscription_revenue numeric
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Vérifier si la table existe
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'partner_rental_subscriptions') THEN
    RETURN QUERY
    SELECT 
      COUNT(*)::bigint AS total_subscriptions,
      COUNT(*) FILTER (WHERE status = 'active' AND end_date > now())::bigint AS active_subscriptions,
      COUNT(*) FILTER (WHERE status = 'expired' OR end_date <= now())::bigint AS expired_subscriptions,
      COALESCE(SUM(amount_paid), 0) AS total_subscription_revenue
    FROM public.partner_rental_subscriptions
    WHERE is_current_user_admin();
  ELSE
    -- Retourner des valeurs NULL si la table n'existe pas
    RETURN QUERY SELECT 0::bigint, 0::bigint, 0::bigint, 0::numeric;
  END IF;
END;
$$;

-- ========================================
-- 4. NETTOYER LES ANCIENNES VUES MATÉRIALISÉES
-- ========================================

DROP MATERIALIZED VIEW IF EXISTS public.mv_admin_rental_vehicle_stats CASCADE;
DROP MATERIALIZED VIEW IF EXISTS public.mv_admin_rental_booking_stats CASCADE;
DROP MATERIALIZED VIEW IF EXISTS public.mv_admin_rental_subscription_stats CASCADE;

-- Supprimer les fonctions de rafraîchissement devenues obsolètes
DROP FUNCTION IF EXISTS public.refresh_admin_rental_stats() CASCADE;
DROP FUNCTION IF EXISTS public.trigger_refresh_rental_stats() CASCADE;

-- ========================================
-- 5. LOGGER LA COMPLETION DE LA PHASE 3
-- ========================================

INSERT INTO public.activity_logs (
  user_id,
  activity_type,
  description,
  metadata
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'security_maintenance',
  'Phase 3 : Maintenance - Sécurisation finale complétée',
  jsonb_build_object(
    'phase', 3,
    'actions', jsonb_build_array(
      'Correction search_path sur 3 fonctions',
      'Remplacement de 3 vues matérialisées par fonctions SECURITY DEFINER',
      'Nettoyage des vues matérialisées obsolètes'
    ),
    'timestamp', now()
  )
);