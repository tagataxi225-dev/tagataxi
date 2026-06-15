-- =============================================
-- NETTOYAGE DES FONCTIONS EN DOUBLON
-- Migration pour résoudre "Could not choose the best candidate function"
-- =============================================

-- 1. Supprimer TOUTES les versions existantes de validate_driver_registration_data
DROP FUNCTION IF EXISTS public.validate_driver_registration_data(jsonb);
DROP FUNCTION IF EXISTS public.validate_driver_registration_data(text, text, text, text);
DROP FUNCTION IF EXISTS public.validate_driver_registration_data(text, text, text, text, uuid);

-- 2. Supprimer les versions en doublon de log_driver_registration_attempt
DROP FUNCTION IF EXISTS public.log_driver_registration_attempt(text, text, boolean, text);
DROP FUNCTION IF EXISTS public.log_driver_registration_attempt(text, text, text, boolean, text);

-- =============================================
-- CRÉER UNE VERSION UNIQUE ET CLAIRE
-- =============================================

-- 3. Créer LA version unique de validate_driver_registration_data
-- Signature: 4 paramètres (correspond exactement à l'appel frontend)
-- Retour: jsonb avec structure { valid: boolean, errors: string[] }
CREATE OR REPLACE FUNCTION public.validate_driver_registration_data(
  p_email text,
  p_phone_number text,
  p_license_number text,
  p_vehicle_plate text DEFAULT NULL
) 
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_errors text[] := ARRAY[]::text[];
  v_email_count integer;
  v_phone_count integer;
  v_license_count integer;
  v_plate_count integer;
BEGIN
  -- ========================================
  -- VALIDATION FORMAT EMAIL
  -- ========================================
  IF p_email IS NULL OR p_email = '' THEN
    v_errors := array_append(v_errors, 'Email requis');
  ELSIF p_email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
    v_errors := array_append(v_errors, 'Format email invalide');
  END IF;

  -- ========================================
  -- VALIDATION FORMAT TÉLÉPHONE
  -- ========================================
  IF p_phone_number IS NULL OR p_phone_number = '' THEN
    v_errors := array_append(v_errors, 'Numéro de téléphone requis');
  ELSIF length(p_phone_number) < 9 THEN
    v_errors := array_append(v_errors, 'Numéro de téléphone trop court (min 9 chiffres)');
  END IF;

  -- ========================================
  -- VALIDATION PERMIS DE CONDUIRE
  -- ========================================
  IF p_license_number IS NULL OR p_license_number = '' THEN
    v_errors := array_append(v_errors, 'Numéro de permis de conduire requis');
  ELSIF length(p_license_number) < 5 THEN
    v_errors := array_append(v_errors, 'Numéro de permis invalide (trop court)');
  END IF;

  -- ========================================
  -- UNICITÉ EMAIL (toutes tables)
  -- ========================================
  SELECT COUNT(*) INTO v_email_count FROM (
    SELECT email FROM public.clients WHERE email = p_email
    UNION ALL
    SELECT email FROM public.chauffeurs WHERE email = p_email
    UNION ALL
    SELECT email FROM public.admins WHERE email = p_email
    UNION ALL
    SELECT email FROM public.partenaires WHERE email = p_email
  ) AS all_emails;

  IF v_email_count > 0 THEN
    v_errors := array_append(v_errors, 'Email déjà utilisé');
  END IF;

  -- ========================================
  -- UNICITÉ TÉLÉPHONE (toutes tables)
  -- ========================================
  SELECT COUNT(*) INTO v_phone_count FROM (
    SELECT phone_number FROM public.clients WHERE phone_number = p_phone_number
    UNION ALL
    SELECT phone_number FROM public.chauffeurs WHERE phone_number = p_phone_number
    UNION ALL
    SELECT phone_number FROM public.admins WHERE phone_number = p_phone_number
    UNION ALL
    SELECT phone_number FROM public.partenaires WHERE phone_number = p_phone_number
  ) AS all_phones;

  IF v_phone_count > 0 THEN
    v_errors := array_append(v_errors, 'Numéro de téléphone déjà utilisé');
  END IF;

  -- ========================================
  -- UNICITÉ PERMIS DE CONDUIRE (chauffeurs seulement)
  -- ========================================
  SELECT COUNT(*) INTO v_license_count
  FROM public.chauffeurs
  WHERE license_number = p_license_number;

  IF v_license_count > 0 THEN
    v_errors := array_append(v_errors, 'Numéro de permis déjà enregistré');
  END IF;

  -- ========================================
  -- UNICITÉ PLAQUE VÉHICULE (si fournie)
  -- ========================================
  IF p_vehicle_plate IS NOT NULL AND p_vehicle_plate != '' THEN
    SELECT COUNT(*) INTO v_plate_count
    FROM public.chauffeurs
    WHERE vehicle_plate = p_vehicle_plate;

    IF v_plate_count > 0 THEN
      v_errors := array_append(v_errors, 'Plaque d''immatriculation déjà enregistrée');
    END IF;
  END IF;

  -- ========================================
  -- RETOUR RÉSULTAT
  -- ========================================
  IF array_length(v_errors, 1) > 0 THEN
    RETURN jsonb_build_object(
      'valid', false,
      'errors', to_jsonb(v_errors)
    );
  ELSE
    RETURN jsonb_build_object(
      'valid', true,
      'errors', '[]'::jsonb
    );
  END IF;
END;
$function$;

-- =============================================
-- COMMENTAIRES DE DOCUMENTATION
-- =============================================
COMMENT ON FUNCTION public.validate_driver_registration_data(text, text, text, text) IS 
'Valide les données d''inscription chauffeur/livreur.
Paramètres:
- p_email: Email du chauffeur (requis)
- p_phone_number: Numéro de téléphone (requis, min 9 chiffres)
- p_license_number: Numéro de permis (requis, min 5 caractères)
- p_vehicle_plate: Plaque d''immatriculation (optionnel)

Retour: { valid: boolean, errors: string[] }

Exemple:
SELECT validate_driver_registration_data(
  ''chauffeur@example.com'',
  ''+243812345678'',
  ''CD123456'',
  ''KIN-1234-AB''
);';

-- 4. Créer LA version unique de log_driver_registration_attempt
CREATE OR REPLACE FUNCTION public.log_driver_registration_attempt(
  p_email text,
  p_phone_number text,
  p_license_number text,
  p_success boolean,
  p_error_message text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  INSERT INTO public.activity_logs (
    user_id,
    activity_type,
    description,
    metadata
  ) VALUES (
    auth.uid(),
    'driver_registration_attempt',
    CASE 
      WHEN p_success THEN 'Tentative d''inscription chauffeur réussie'
      ELSE 'Tentative d''inscription chauffeur échouée'
    END,
    jsonb_build_object(
      'email', p_email,
      'phone_number', p_phone_number,
      'license_number', p_license_number,
      'success', p_success,
      'error_message', p_error_message,
      'timestamp', now()
    )
  );
EXCEPTION WHEN OTHERS THEN
  -- Échec silencieux du logging pour ne pas bloquer l'inscription
  NULL;
END;
$function$;

COMMENT ON FUNCTION public.log_driver_registration_attempt(text, text, text, boolean, text) IS 
'Enregistre les tentatives d''inscription chauffeur dans activity_logs.
Paramètres:
- p_email: Email du chauffeur
- p_phone_number: Numéro de téléphone
- p_license_number: Numéro de permis
- p_success: true si inscription réussie, false sinon
- p_error_message: Message d''erreur (optionnel)

Cette fonction échoue silencieusement pour ne pas bloquer le processus d''inscription.';