-- Corriger le processus d'inscription des chauffeurs
-- 1. Ajouter un trigger pour créer automatiquement un profil chauffeur après inscription
CREATE OR REPLACE FUNCTION public.handle_new_driver()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Si l'utilisateur s'inscrit comme chauffeur, créer le profil automatiquement
  IF NEW.raw_user_meta_data->>'role' = 'driver' THEN
    INSERT INTO public.chauffeurs (
      user_id,
      email,
      display_name,
      phone_number,
      is_active,
      verification_status,
      role
    ) VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email),
      COALESCE(NEW.raw_user_meta_data->>'phone_number', ''),
      false, -- Désactivé par défaut jusqu'à vérification
      'pending',
      COALESCE(NEW.raw_user_meta_data->>'service_category', 'chauffeur')
    );
    
    -- Créer aussi l'entrée dans user_roles
    INSERT INTO public.user_roles (
      user_id,
      role,
      is_active
    ) VALUES (
      NEW.id,
      'driver',
      true
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Créer le trigger pour l'auto-création du profil chauffeur
CREATE OR REPLACE TRIGGER on_auth_user_driver_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_driver();

-- Améliorer la fonction de validation des coordonnées de réservation
CREATE OR REPLACE FUNCTION public.validate_driver_registration_data(
  license_number_param text,
  vehicle_plate_param text,
  phone_number_param text,
  email_param text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  validation_result jsonb := '{"valid": true, "errors": []}'::jsonb;
  errors text[] := ARRAY[]::text[];
BEGIN
  -- Vérifier l'unicité du numéro de permis
  IF EXISTS (
    SELECT 1 FROM public.chauffeurs 
    WHERE license_number = license_number_param 
    AND license_number IS NOT NULL
  ) THEN
    errors := array_append(errors, 'Ce numéro de permis est déjà utilisé');
  END IF;
  
  -- Vérifier l'unicité de la plaque d'immatriculation
  IF EXISTS (
    SELECT 1 FROM public.chauffeurs 
    WHERE vehicle_plate = vehicle_plate_param 
    AND vehicle_plate IS NOT NULL
  ) THEN
    errors := array_append(errors, 'Cette plaque d''immatriculation est déjà utilisée');
  END IF;
  
  -- Vérifier l'unicité du numéro de téléphone
  IF EXISTS (
    SELECT 1 FROM public.chauffeurs 
    WHERE phone_number = phone_number_param 
    AND phone_number IS NOT NULL
  ) THEN
    errors := array_append(errors, 'Ce numéro de téléphone est déjà utilisé');
  END IF;
  
  -- Vérifier l'unicité de l'email
  IF EXISTS (
    SELECT 1 FROM public.chauffeurs 
    WHERE email = email_param 
    AND email IS NOT NULL
  ) THEN
    errors := array_append(errors, 'Cette adresse email est déjà utilisée');
  END IF;
  
  -- Construire le résultat
  IF array_length(errors, 1) > 0 THEN
    validation_result := jsonb_build_object(
      'valid', false,
      'errors', array_to_json(errors)
    );
  END IF;
  
  RETURN validation_result;
END;
$$;