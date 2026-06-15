-- Phase 3.1: Corrections Critiques Sécurité (Fixed)

-- 1. Supprimer puis recréer la fonction de validation
DROP FUNCTION IF EXISTS public.validate_driver_registration_data(text,text,text,text);

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
  
  -- Vérifier unicité email
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
  IF EXISTS (SELECT 1 FROM public.chauffeurs WHERE license_number = p_license_number) THEN
    errors := array_append(errors, 'Numéro de permis déjà enregistré');
  END IF;
  
  -- Vérifier unicité plaque véhicule
  IF EXISTS (SELECT 1 FROM public.chauffeurs WHERE vehicle_plate = p_vehicle_plate) THEN
    errors := array_append(errors, 'Plaque véhicule déjà enregistrée');
  END IF;
  
  -- Construire résultat
  IF array_length(errors, 1) > 0 THEN
    result := jsonb_build_object('valid', false, 'errors', to_jsonb(errors));
  END IF;
  
  RETURN result;
END;
$$;

-- 2. Ajouter RLS aux tables exposées si elles n'existent pas déjà
DO $$
BEGIN
  -- places_database protection
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'places_database' 
    AND policyname = 'places_database_authenticated_read'
  ) THEN
    EXECUTE 'ALTER TABLE public.places_database ENABLE ROW LEVEL SECURITY';
    EXECUTE 'CREATE POLICY "places_database_authenticated_read" ON public.places_database FOR SELECT USING (auth.uid() IS NOT NULL)';
    EXECUTE 'CREATE POLICY "places_database_admin_manage" ON public.places_database FOR ALL USING (is_current_user_admin()) WITH CHECK (is_current_user_admin())';
  END IF;
END;
$$;

-- 3. Audit log pour les accès sensibles
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