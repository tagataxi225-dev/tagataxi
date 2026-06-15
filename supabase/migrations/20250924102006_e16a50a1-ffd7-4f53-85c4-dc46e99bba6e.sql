-- Supprimer la fonction existante et la recréer correctement
DROP FUNCTION IF EXISTS public.validate_driver_registration_data(text,text,text,text);

-- Créer la fonction de validation des données d'inscription chauffeur
CREATE OR REPLACE FUNCTION public.validate_driver_registration_data(
  p_email text,
  p_phone_number text,
  p_license_number text,
  p_vehicle_plate text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  validation_result jsonb := '{"valid": true, "errors": []}'::jsonb;
  errors text[] := '{}';
BEGIN
  -- Vérifier l'unicité de l'email
  IF EXISTS (
    SELECT 1 FROM public.chauffeurs WHERE email = p_email
    UNION ALL
    SELECT 1 FROM public.clients WHERE email = p_email
    UNION ALL
    SELECT 1 FROM public.admins WHERE email = p_email
    UNION ALL
    SELECT 1 FROM public.partenaires WHERE email = p_email
  ) THEN
    errors := array_append(errors, 'Email déjà utilisé');
  END IF;

  -- Vérifier l'unicité du téléphone
  IF EXISTS (
    SELECT 1 FROM public.chauffeurs WHERE phone_number = p_phone_number
    UNION ALL
    SELECT 1 FROM public.clients WHERE phone_number = p_phone_number
    UNION ALL
    SELECT 1 FROM public.admins WHERE phone_number = p_phone_number
    UNION ALL
    SELECT 1 FROM public.partenaires WHERE phone_number = p_phone_number
  ) THEN
    errors := array_append(errors, 'Numéro de téléphone déjà utilisé');
  END IF;

  -- Vérifier l'unicité du permis
  IF p_license_number IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.chauffeurs WHERE license_number = p_license_number
  ) THEN
    errors := array_append(errors, 'Numéro de permis déjà utilisé');
  END IF;

  -- Vérifier l'unicité de la plaque si fournie
  IF p_vehicle_plate IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.chauffeurs WHERE vehicle_plate = p_vehicle_plate
  ) THEN
    errors := array_append(errors, 'Plaque d''immatriculation déjà utilisée');
  END IF;

  -- Construire le résultat
  IF array_length(errors, 1) > 0 THEN
    validation_result := jsonb_build_object(
      'valid', false,
      'errors', to_jsonb(errors)
    );
  END IF;

  RETURN validation_result;
END;
$$;

-- Créer la fonction de log des tentatives d'inscription
CREATE OR REPLACE FUNCTION public.log_driver_registration_attempt(
  p_user_id uuid,
  p_success boolean,
  p_error_message text DEFAULT NULL,
  p_registration_data jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.activity_logs (
    user_id,
    activity_type,
    description,
    metadata
  ) VALUES (
    p_user_id,
    CASE WHEN p_success THEN 'driver_registration_success' ELSE 'driver_registration_failure' END,
    CASE 
      WHEN p_success THEN 'Inscription chauffeur réussie'
      ELSE COALESCE('Échec inscription chauffeur: ' || p_error_message, 'Échec inscription chauffeur')
    END,
    jsonb_build_object(
      'success', p_success,
      'error_message', p_error_message,
      'registration_data', p_registration_data,
      'timestamp', now()
    )
  );
END;
$$;

-- Créer la fonction trigger pour gérer les nouveaux chauffeurs
CREATE OR REPLACE FUNCTION public.handle_new_driver()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Créer automatiquement les crédits du chauffeur
  INSERT INTO public.driver_credits (driver_id, balance, currency)
  VALUES (NEW.user_id, 0, 'CDF')
  ON CONFLICT (driver_id) DO NOTHING;

  -- Créer l'emplacement du chauffeur
  INSERT INTO public.driver_locations (
    driver_id, 
    latitude, 
    longitude, 
    is_online, 
    is_available
  ) VALUES (
    NEW.user_id,
    -4.3217, -- Coordonnées par défaut de Kinshasa
    15.3069,
    false,
    false
  ) ON CONFLICT (driver_id) DO NOTHING;

  -- Créer le code chauffeur
  INSERT INTO public.driver_codes (
    driver_id,
    code
  ) VALUES (
    NEW.user_id,
    'DRV' || EXTRACT(YEAR FROM now()) || LPAD(EXTRACT(DOY FROM now())::text, 3, '0') || LPAD(EXTRACT(EPOCH FROM now())::text, 6, '0')
  ) ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$;

-- Créer le trigger pour les nouveaux chauffeurs
DROP TRIGGER IF EXISTS on_chauffeur_created ON public.chauffeurs;
CREATE TRIGGER on_chauffeur_created
  AFTER INSERT ON public.chauffeurs
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_driver();