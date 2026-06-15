-- FIX CRITICAL: Corriger le trigger handle_new_driver() avec CASCADE
-- Le trigger utilisait incorrectement NEW.user_id au lieu de NEW.id
-- et n'accédait pas correctement aux métadonnées

-- 1. Supprimer l'ancien trigger et la fonction avec CASCADE
DROP TRIGGER IF EXISTS on_auth_user_created_driver ON auth.users CASCADE;
DROP TRIGGER IF EXISTS on_auth_user_driver_created ON auth.users CASCADE;
DROP TRIGGER IF EXISTS trigger_handle_new_driver ON public.chauffeurs CASCADE;
DROP TRIGGER IF EXISTS on_chauffeur_created ON public.chauffeurs CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_driver() CASCADE;

-- 2. Créer la fonction corrigée avec accès correct aux métadonnées
CREATE OR REPLACE FUNCTION public.handle_new_driver()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role TEXT;
  service_cat TEXT;
BEGIN
  -- Récupérer le rôle depuis les métadonnées
  user_role := COALESCE(NEW.raw_user_meta_data->>'role', '');
  
  -- Ne traiter que les inscriptions de chauffeurs
  IF user_role != 'driver' THEN
    RETURN NEW;
  END IF;

  -- Récupérer la catégorie de service
  service_cat := COALESCE(NEW.raw_user_meta_data->>'service_category', 'taxi');

  -- Insérer dans la table chauffeurs avec NEW.id (PAS NEW.user_id!)
  INSERT INTO public.chauffeurs (
    user_id,
    email,
    display_name,
    phone_number,
    role,
    service_type,
    verification_status,
    is_active,
    created_at
  ) VALUES (
    NEW.id,  -- CORRECTION CRITIQUE: utiliser NEW.id
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone_number', ''),
    CASE 
      WHEN service_cat = 'delivery' THEN 'livreur'
      ELSE 'chauffeur'
    END,
    service_cat,
    'pending',
    false,
    NOW()
  )
  ON CONFLICT (user_id) DO NOTHING;

  -- Créer l'entrée dans user_roles
  INSERT INTO public.user_roles (
    user_id,
    role,
    is_active
  ) VALUES (
    NEW.id,
    'driver'::user_role,
    true
  )
  ON CONFLICT (user_id, role) DO NOTHING;

  -- Logger l'événement
  INSERT INTO public.activity_logs (
    user_id,
    activity_type,
    description,
    metadata
  ) VALUES (
    NEW.id,
    'driver_registration',
    'Nouveau chauffeur inscrit via trigger',
    jsonb_build_object(
      'email', NEW.email,
      'service_type', service_cat,
      'timestamp', NOW()
    )
  );

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Logger l'erreur mais ne pas bloquer l'inscription
  INSERT INTO public.activity_logs (
    user_id,
    activity_type,
    description,
    metadata
  ) VALUES (
    NEW.id,
    'driver_registration_error',
    'Erreur lors du trigger handle_new_driver',
    jsonb_build_object(
      'error', SQLERRM,
      'email', NEW.email,
      'timestamp', NOW()
    )
  );
  
  RETURN NEW;
END;
$$;

-- 3. Recréer le trigger
CREATE TRIGGER on_auth_user_created_driver
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_driver();

-- 4. Ajouter un commentaire
COMMENT ON FUNCTION public.handle_new_driver() IS 'Trigger corrigé pour créer automatiquement le profil chauffeur lors de l''inscription. Utilise NEW.id au lieu de NEW.user_id et accède correctement à raw_user_meta_data.';