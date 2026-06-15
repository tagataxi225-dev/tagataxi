-- Créer le trigger manquant pour l'inscription automatique des chauffeurs
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  -- Créer le profil dans clients ou chauffeurs selon le rôle
  IF (NEW.raw_user_meta_data->>'role') = 'simple_user_client' THEN
    INSERT INTO public.clients (
      user_id, display_name, phone_number, email
    ) VALUES (
      NEW.id,
      NEW.raw_user_meta_data->>'display_name',
      NEW.raw_user_meta_data->>'phone_number',
      NEW.email
    );
  ELSIF (NEW.raw_user_meta_data->>'role') = 'chauffeur' THEN
    INSERT INTO public.chauffeurs (
      user_id, email, display_name, phone_number
    ) VALUES (
      NEW.id,
      NEW.email,
      NEW.raw_user_meta_data->>'display_name',
      NEW.raw_user_meta_data->>'phone_number'
    );
  END IF;

  RETURN NEW;
END;
$$;

-- S'assurer que le trigger existe
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();