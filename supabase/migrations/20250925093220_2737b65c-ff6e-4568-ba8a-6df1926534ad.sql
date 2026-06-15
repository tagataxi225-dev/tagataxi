-- CORRECTION SÉCURITÉ CRITIQUE - Phase 1 Complète

-- 1. Supprimer l'ancienne fonction avec conflit de paramètres
DROP FUNCTION IF EXISTS public.calculate_delivery_price(text, numeric, text);

-- 2. Nettoyer les vues SECURITY DEFINER dangereuses
DO $$
DECLARE
    view_name text;
BEGIN
    FOR view_name IN 
        SELECT viewname 
        FROM pg_views 
        WHERE schemaname = 'public' 
        AND definition ILIKE '%SECURITY DEFINER%'
    LOOP
        EXECUTE format('DROP VIEW IF EXISTS public.%I CASCADE', view_name);
    END LOOP;
END $$;

-- 3. Sécuriser la table ip_geolocation_cache
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'ip_geolocation_cache'
        AND policyname = 'ip_cache_authenticated_access'
    ) THEN
        ALTER TABLE public.ip_geolocation_cache ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "ip_cache_authenticated_access" 
        ON public.ip_geolocation_cache 
        FOR ALL 
        USING (auth.uid() IS NOT NULL)
        WITH CHECK (auth.uid() IS NOT NULL);
    END IF;
END $$;

-- 4. Fonctions critiques sécurisées avec search_path
CREATE OR REPLACE FUNCTION public.calculate_distance_meters(lat1 numeric, lng1 numeric, lat2 numeric, lng2 numeric)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  RETURN ROUND((6371000 * acos(
    cos(radians(lat1)) * cos(radians(lat2)) * 
    cos(radians(lng2) - radians(lng1)) + 
    sin(radians(lat1)) * sin(radians(lat2))
  ))::numeric);
END;
$$;

CREATE OR REPLACE FUNCTION public.calculate_distance_km(lat1 numeric, lng1 numeric, lat2 numeric, lng2 numeric)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  RETURN ROUND((6371 * acos(
    cos(radians(lat1)) * cos(radians(lat2)) * 
    cos(radians(lng2) - radians(lng1)) + 
    sin(radians(lat1)) * sin(radians(lat2))
  ))::numeric, 2);
END;
$$;

-- 5. Fonction de calcul de prix sécurisée
CREATE OR REPLACE FUNCTION public.calculate_delivery_price(
  delivery_type_param text,
  distance_km_param numeric,
  city_param text DEFAULT 'Kinshasa'::text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  base_price numeric;
  price_per_km numeric;
  calculated_price numeric;
  config_record RECORD;
BEGIN
  SELECT * INTO config_record
  FROM public.delivery_pricing_config
  WHERE service_type = delivery_type_param
    AND city = city_param
    AND is_active = true
  ORDER BY created_at DESC
  LIMIT 1;
  
  IF config_record IS NULL THEN
    base_price := 5000;
    price_per_km := 500;
  ELSE
    base_price := config_record.base_price;
    price_per_km := config_record.price_per_km;
  END IF;
  
  calculated_price := base_price + (distance_km_param * price_per_km);
  
  RETURN jsonb_build_object(
    'calculated_price', calculated_price,
    'base_price', base_price,
    'distance_price', distance_km_param * price_per_km,
    'distance_km', distance_km_param,
    'currency', 'CDF'
  );
END;
$$;

-- 6. Audit de sécurité automatique
CREATE OR REPLACE FUNCTION public.log_security_audit(
  action_type text,
  table_accessed text,
  user_data jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.security_audit_logs (
    user_id, action_type, resource_type, metadata, success
  ) VALUES (
    auth.uid(), action_type, table_accessed, user_data, true
  );
EXCEPTION WHEN OTHERS THEN
  -- Silencieux si la table n'existe pas encore
  NULL;
END;
$$;

-- 7. Fonction de nettoyage sécurisé
CREATE OR REPLACE FUNCTION public.cleanup_sensitive_data_automated()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  cleaned_records integer := 0;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
      AND role = 'admin' 
      AND admin_role = 'super_admin'
      AND is_active = true
  ) THEN
    RAISE EXCEPTION 'Access denied: Super admin privileges required';
  END IF;
  
  DELETE FROM public.driver_locations 
  WHERE updated_at < now() - interval '7 days'
    AND is_online = false;
  
  GET DIAGNOSTICS cleaned_records = ROW_COUNT;
  
  -- Logger avec gestion d'erreur
  BEGIN
    PERFORM public.log_security_audit(
      'automated_cleanup',
      'driver_locations',
      jsonb_build_object('records_cleaned', cleaned_records)
    );
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
  
  RETURN cleaned_records;
END;
$$;