-- Phase 3.1: Corrections Critiques Sécurité

-- 1. Créer la fonction de validation manquante pour l'inscription chauffeur
CREATE OR REPLACE FUNCTION public.validate_driver_registration_data(
  p_email text,
  p_phone text,
  p_license_number text,
  p_vehicle_plate text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  result jsonb := '{"valid": true, "errors": []}'::jsonb;
  errors text[] := ARRAY[]::text[];
BEGIN
  -- Validation email format
  IF p_email IS NULL OR p_email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
    errors := array_append(errors, 'Format email invalide');
  END IF;
  
  -- Validation téléphone format (Congo)
  IF p_phone IS NULL OR p_phone !~ '^\+?243[0-9]{9}$' THEN
    errors := array_append(errors, 'Format téléphone invalide (ex: +243123456789)');
  END IF;
  
  -- Validation numéro de permis
  IF p_license_number IS NULL OR length(trim(p_license_number)) < 5 THEN
    errors := array_append(errors, 'Numéro de permis invalide (minimum 5 caractères)');
  END IF;
  
  -- Validation plaque véhicule
  IF p_vehicle_plate IS NULL OR length(trim(p_vehicle_plate)) < 3 THEN
    errors := array_append(errors, 'Plaque véhicule invalide (minimum 3 caractères)');
  END IF;
  
  -- Vérifier unicité email dans toutes les tables utilisateurs
  IF EXISTS (
    SELECT 1 FROM public.chauffeurs WHERE email = p_email
    UNION ALL
    SELECT 1 FROM public.clients WHERE email = p_email
    UNION ALL
    SELECT 1 FROM public.partenaires WHERE email = p_email
    UNION ALL
    SELECT 1 FROM public.admins WHERE email = p_email
  ) THEN
    errors := array_append(errors, 'Email déjà utilisé par un autre utilisateur');
  END IF;
  
  -- Vérifier unicité téléphone
  IF EXISTS (
    SELECT 1 FROM public.chauffeurs WHERE phone_number = p_phone
    UNION ALL
    SELECT 1 FROM public.clients WHERE phone_number = p_phone
    UNION ALL
    SELECT 1 FROM public.partenaires WHERE phone_number = p_phone
    UNION ALL
    SELECT 1 FROM public.admins WHERE phone_number = p_phone
  ) THEN
    errors := array_append(errors, 'Numéro de téléphone déjà utilisé');
  END IF;
  
  -- Vérifier unicité permis de conduire
  IF EXISTS (
    SELECT 1 FROM public.chauffeurs WHERE license_number = p_license_number
  ) THEN
    errors := array_append(errors, 'Numéro de permis déjà enregistré');
  END IF;
  
  -- Vérifier unicité plaque véhicule
  IF EXISTS (
    SELECT 1 FROM public.chauffeurs WHERE vehicle_plate = p_vehicle_plate
  ) THEN
    errors := array_append(errors, 'Plaque véhicule déjà enregistrée');
  END IF;
  
  -- Construire résultat
  IF array_length(errors, 1) > 0 THEN
    result := jsonb_build_object(
      'valid', false,
      'errors', to_jsonb(errors)
    );
  END IF;
  
  RETURN result;
END;
$$;

-- 2. Corriger les fonctions avec search_path manquant
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT role::text FROM public.user_roles 
  WHERE user_id = auth.uid() 
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.has_user_role(check_role text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
      AND role::text = check_role
      AND is_active = true
  );
$$;

CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Check directly in the admins table without going through RLS
  RETURN EXISTS (
    SELECT 1 FROM public.admins 
    WHERE user_id = auth.uid() 
      AND is_active = true
  );
END;
$$;

-- 3. Ajouter RLS aux tables exposées
-- driver_service_status (si elle existe)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'driver_service_status') THEN
    EXECUTE 'ALTER TABLE public.driver_service_status ENABLE ROW LEVEL SECURITY';
    EXECUTE 'CREATE POLICY "Drivers access own service status" ON public.driver_service_status FOR ALL USING (auth.uid() = driver_id)';
    EXECUTE 'CREATE POLICY "Admins access all service status" ON public.driver_service_status FOR ALL USING (is_current_user_admin())';
  END IF;
END;
$$;

-- 4. Protéger places_database contre scraping massif
ALTER TABLE public.places_database ENABLE ROW LEVEL SECURITY;

CREATE POLICY "places_database_authenticated_read" 
ON public.places_database 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "places_database_admin_manage" 
ON public.places_database 
FOR ALL 
USING (is_current_user_admin())
WITH CHECK (is_current_user_admin());

-- 5. Améliorer intelligent_places avec rate limiting intégré
CREATE OR REPLACE FUNCTION public.intelligent_places_search_with_limits(
  search_query text DEFAULT ''::text, 
  search_city text DEFAULT 'Kinshasa'::text, 
  user_latitude numeric DEFAULT NULL::numeric, 
  user_longitude numeric DEFAULT NULL::numeric, 
  max_results integer DEFAULT 8
)
RETURNS TABLE(
  id uuid, name text, category text, subcategory text, city text, 
  commune text, quartier text, avenue text, latitude numeric, longitude numeric, 
  hierarchy_level integer, popularity_score integer, relevance_score real, 
  distance_meters integer, formatted_address text, subtitle text, badge text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Rate limiting simple basé sur l'utilisateur
  IF NOT check_location_search_rate_limit() THEN
    RAISE EXCEPTION 'Trop de recherches, veuillez attendre quelques minutes';
  END IF;
  
  -- Log de l'accès
  PERFORM log_location_access(
    'places_search', 
    NULL, 
    user_latitude, 
    user_longitude, 
    0
  );
  
  -- Appeler la fonction principale
  RETURN QUERY 
  SELECT * FROM public.intelligent_places_search_enhanced(
    search_query, search_city, user_latitude, user_longitude, max_results, true
  );
END;
$$;

-- 6. Audit log pour les accès sensibles
CREATE OR REPLACE FUNCTION public.log_driver_registration_attempt(
  p_email text,
  p_success boolean,
  p_error_message text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.security_audit_logs (
    user_id, action_type, resource_type, success, error_message, metadata
  ) VALUES (
    auth.uid(), 
    'driver_registration', 
    'chauffeurs',
    p_success,
    p_error_message,
    jsonb_build_object('email', p_email, 'timestamp', now())
  );
END;
$$;