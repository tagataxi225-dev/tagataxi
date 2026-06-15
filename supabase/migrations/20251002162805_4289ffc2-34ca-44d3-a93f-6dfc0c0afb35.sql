-- =============================================
-- NETTOYAGE DÉFINITIF DES FONCTIONS EN DOUBLON
-- Migration pour résoudre "Could not choose the best candidate function"
-- =============================================

-- 1. Supprimer TOUTES les versions existantes de log_driver_registration_attempt
DROP FUNCTION IF EXISTS public.log_driver_registration_attempt(text, boolean, text);
DROP FUNCTION IF EXISTS public.log_driver_registration_attempt(uuid, boolean, text, jsonb);
DROP FUNCTION IF EXISTS public.log_driver_registration_attempt(text, text, text, boolean, text);
DROP FUNCTION IF EXISTS public.log_driver_registration_attempt(text, text, boolean, text);

-- 2. Créer LA version unique et définitive de log_driver_registration_attempt
-- Signature: 5 paramètres (correspond EXACTEMENT à l'appel frontend)
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

-- 3. Ajouter un commentaire de documentation
COMMENT ON FUNCTION public.log_driver_registration_attempt(text, text, text, boolean, text) IS 
'Enregistre les tentatives d''inscription chauffeur dans activity_logs.
Paramètres:
- p_email: Email du chauffeur
- p_phone_number: Numéro de téléphone
- p_license_number: Numéro de permis
- p_success: true si inscription réussie, false sinon
- p_error_message: Message d''erreur (optionnel)

VERSION UNIQUE - Ne pas créer d''autres versions de cette fonction.
Cette fonction échoue silencieusement pour ne pas bloquer le processus d''inscription.';

-- 4. Vérification finale - Lister toutes les fonctions log_driver_registration_attempt restantes
DO $$
DECLARE
  func_count integer;
BEGIN
  SELECT COUNT(*) INTO func_count
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public' 
    AND p.proname = 'log_driver_registration_attempt';
  
  IF func_count != 1 THEN
    RAISE WARNING 'ATTENTION: Il existe % versions de log_driver_registration_attempt au lieu de 1', func_count;
  ELSE
    RAISE NOTICE 'SUCCESS: Une seule version de log_driver_registration_attempt existe';
  END IF;
END $$;