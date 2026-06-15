-- Phase 1: Sécuriser les 3 fonctions critiques manquantes

-- 1. Corriger calculate_distance_km avec search_path sécurisé
CREATE OR REPLACE FUNCTION public.calculate_distance_km(lat1 numeric, lng1 numeric, lat2 numeric, lng2 numeric)
RETURNS numeric
LANGUAGE plpgsql
IMMUTABLE
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  earth_radius CONSTANT numeric := 6371; -- Earth radius in km
  dlat numeric;
  dlng numeric;
  a numeric;
  c numeric;
BEGIN
  dlat := radians(lat2 - lat1);
  dlng := radians(lng2 - lng1);
  
  a := sin(dlat/2) * sin(dlat/2) + 
       cos(radians(lat1)) * cos(radians(lat2)) * 
       sin(dlng/2) * sin(dlng/2);
  
  c := 2 * atan2(sqrt(a), sqrt(1-a));
  
  RETURN earth_radius * c;
END;
$function$;

-- 2. Corriger calculate_distance_meters avec search_path sécurisé
CREATE OR REPLACE FUNCTION public.calculate_distance_meters(lat1 numeric, lng1 numeric, lat2 numeric, lng2 numeric)
RETURNS integer
LANGUAGE plpgsql
IMMUTABLE
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  earth_radius CONSTANT numeric := 6371000; -- Rayon de la Terre en mètres
  dlat numeric;
  dlng numeric;
  a numeric;
  c numeric;
BEGIN
  dlat := radians(lat2 - lat1);
  dlng := radians(lng2 - lng1);
  
  a := sin(dlat/2) * sin(dlat/2) + 
       cos(radians(lat1)) * cos(radians(lat2)) * 
       sin(dlng/2) * sin(dlng/2);
  
  c := 2 * atan2(sqrt(a), sqrt(1-a));
  
  RETURN round(earth_radius * c)::INTEGER;
END;
$function$;

-- 3. Créer la fonction update_delivery_pricing_timestamp manquante avec sécurité
CREATE OR REPLACE FUNCTION public.update_delivery_pricing_timestamp()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- 4. Valider que la fonction de validation d'inscription existe et est sécurisée
CREATE OR REPLACE FUNCTION public.validate_driver_registration_data(
  p_email text,
  p_phone_number text,
  p_license_number text,
  p_vehicle_plate text,
  p_user_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  validation_result jsonb := '{"valid": true, "errors": []}'::jsonb;
  error_list text[] := ARRAY[]::text[];
  existing_count integer;
BEGIN
  -- Validation email format
  IF p_email IS NULL OR p_email = '' OR p_email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
    error_list := array_append(error_list, 'Format d''email invalide');
  END IF;

  -- Validation téléphone (format RDC)
  IF p_phone_number IS NULL OR p_phone_number = '' OR p_phone_number !~ '^(\+243|0)[0-9]{9}$' THEN
    error_list := array_append(error_list, 'Format de téléphone invalide (ex: +243XXXXXXXXX)');
  END IF;

  -- Validation numéro de permis
  IF p_license_number IS NULL OR p_license_number = '' OR length(p_license_number) < 5 THEN
    error_list := array_append(error_list, 'Numéro de permis invalide (minimum 5 caractères)');
  END IF;

  -- Validation plaque véhicule
  IF p_vehicle_plate IS NULL OR p_vehicle_plate = '' OR length(p_vehicle_plate) < 3 THEN
    error_list := array_append(error_list, 'Plaque véhicule invalide (minimum 3 caractères)');
  END IF;

  -- Vérifier unicité email (toutes tables)
  SELECT COUNT(*) INTO existing_count FROM (
    SELECT email FROM public.clients WHERE email = p_email AND (p_user_id IS NULL OR user_id != p_user_id)
    UNION ALL
    SELECT email FROM public.chauffeurs WHERE email = p_email AND (p_user_id IS NULL OR user_id != p_user_id)
    UNION ALL
    SELECT email FROM public.admins WHERE email = p_email AND (p_user_id IS NULL OR user_id != p_user_id)
    UNION ALL
    SELECT email FROM public.partenaires WHERE email = p_email AND (p_user_id IS NULL OR user_id != p_user_id)
  ) AS emails;

  IF existing_count > 0 THEN
    error_list := array_append(error_list, 'Email déjà utilisé par un autre utilisateur');
  END IF;

  -- Vérifier unicité téléphone (toutes tables)
  SELECT COUNT(*) INTO existing_count FROM (
    SELECT phone_number FROM public.clients WHERE phone_number = p_phone_number AND (p_user_id IS NULL OR user_id != p_user_id)
    UNION ALL
    SELECT phone_number FROM public.chauffeurs WHERE phone_number = p_phone_number AND (p_user_id IS NULL OR user_id != p_user_id)
    UNION ALL
    SELECT phone_number FROM public.admins WHERE phone_number = p_phone_number AND (p_user_id IS NULL OR user_id != p_user_id)
    UNION ALL
    SELECT phone_number FROM public.partenaires WHERE phone_number = p_phone_number AND (p_user_id IS NULL OR user_id != p_user_id)
  ) AS phones;

  IF existing_count > 0 THEN
    error_list := array_append(error_list, 'Numéro de téléphone déjà utilisé par un autre utilisateur');
  END IF;

  -- Vérifier unicité permis de conduire
  SELECT COUNT(*) INTO existing_count
  FROM public.chauffeurs
  WHERE license_number = p_license_number AND (p_user_id IS NULL OR user_id != p_user_id);

  IF existing_count > 0 THEN
    error_list := array_append(error_list, 'Numéro de permis déjà utilisé par un autre chauffeur');
  END IF;

  -- Vérifier unicité plaque véhicule
  SELECT COUNT(*) INTO existing_count
  FROM public.chauffeurs
  WHERE vehicle_plate = p_vehicle_plate AND (p_user_id IS NULL OR user_id != p_user_id);

  IF existing_count > 0 THEN
    error_list := array_append(error_list, 'Plaque véhicule déjà utilisée par un autre chauffeur');
  END IF;

  -- Construire résultat final
  IF array_length(error_list, 1) > 0 THEN
    validation_result := jsonb_build_object(
      'valid', false,
      'errors', to_jsonb(error_list)
    );
  END IF;

  RETURN validation_result;
END;
$function$;

-- 5. Fonction de log des tentatives d'inscription sécurisée
CREATE OR REPLACE FUNCTION public.log_driver_registration_attempt(
  p_user_id uuid,
  p_success boolean,
  p_error_message text DEFAULT NULL,
  p_registration_data jsonb DEFAULT '{}'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  INSERT INTO public.security_audit_logs (
    user_id, action_type, resource_type, resource_id,
    success, error_message, metadata
  ) VALUES (
    p_user_id, 'driver_registration', 'chauffeurs', p_user_id,
    p_success, p_error_message, 
    jsonb_build_object(
      'registration_data', p_registration_data,
      'timestamp', now(),
      'ip_address', inet_client_addr()
    )
  );
END;
$function$;