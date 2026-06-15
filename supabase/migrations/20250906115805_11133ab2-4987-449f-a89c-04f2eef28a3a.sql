-- Créer le trigger manquant pour l'inscription automatique des chauffeurs
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Créer un chauffeur si le rôle est chauffeur
  IF (NEW.raw_user_meta_data->>'role') = 'chauffeur' THEN
    INSERT INTO public.chauffeurs (
      user_id, 
      email, 
      display_name,
      phone_number,
      is_active
    )
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email),
      NEW.raw_user_meta_data->>'phone_number',
      false -- Inactif par défaut jusqu'à vérification
    );
  END IF;

  -- Créer un client si le rôle est client
  IF (NEW.raw_user_meta_data->>'role') = 'simple_user_client' THEN
    INSERT INTO public.clients (
      user_id, 
      display_name, 
      phone_number, 
      email
    )
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email),
      NEW.raw_user_meta_data->>'phone_number',
      NEW.email
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Supprimer l'ancien trigger s'il existe
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Créer le nouveau trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();