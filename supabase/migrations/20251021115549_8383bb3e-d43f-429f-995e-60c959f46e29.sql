-- ============================================
-- MIGRATION: Correction des inscriptions utilisateurs
-- Description: Ajout des triggers et RPC pour création automatique des profils
-- ============================================

-- 0️⃣ Supprimer l'ancienne fonction qui a un type de retour différent
DROP FUNCTION IF EXISTS public.ensure_user_profile(uuid);

-- 1️⃣ Fonction RPC pour créer un profil client sécurisé
CREATE OR REPLACE FUNCTION public.create_client_profile_secure(
  p_user_id uuid,
  p_email text,
  p_display_name text,
  p_phone_number text,
  p_date_of_birth text DEFAULT NULL,
  p_gender text DEFAULT NULL,
  p_address text DEFAULT NULL,
  p_city text DEFAULT 'Kinshasa',
  p_emergency_contact_name text DEFAULT NULL,
  p_emergency_contact_phone text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result jsonb;
  v_profile_id uuid;
BEGIN
  -- Créer profil dans profiles
  INSERT INTO public.profiles (user_id, display_name, phone_number, user_type)
  VALUES (p_user_id, p_display_name, p_phone_number, 'client')
  ON CONFLICT (user_id) DO UPDATE 
  SET display_name = EXCLUDED.display_name,
      phone_number = EXCLUDED.phone_number,
      updated_at = NOW()
  RETURNING id INTO v_profile_id;

  -- Créer entrée dans clients
  INSERT INTO public.clients (
    user_id, display_name, phone_number, email,
    date_of_birth, gender, address, city,
    emergency_contact_name, emergency_contact_phone
  ) VALUES (
    p_user_id, p_display_name, p_phone_number, p_email,
    NULLIF(p_date_of_birth, '')::date, p_gender, p_address, p_city,
    p_emergency_contact_name, p_emergency_contact_phone
  )
  ON CONFLICT (user_id) DO UPDATE
  SET display_name = EXCLUDED.display_name,
      phone_number = EXCLUDED.phone_number,
      updated_at = NOW();

  -- Créer rôle dans user_roles
  INSERT INTO public.user_roles (user_id, role)
  VALUES (p_user_id, 'client')
  ON CONFLICT (user_id, role) DO NOTHING;

  v_result := jsonb_build_object(
    'success', true,
    'profile_id', v_profile_id,
    'user_id', p_user_id
  );

  RETURN v_result;

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$;

-- 2️⃣ Fonction trigger pour créer automatiquement un profil de base
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Créer profil de base (sera complété par RPC spécifique)
  INSERT INTO public.profiles (user_id, display_name, phone_number, user_type)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', SPLIT_PART(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'phone_number',
    COALESCE(NEW.raw_user_meta_data->>'user_type', 'client')
  )
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- 3️⃣ Créer le trigger sur auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 4️⃣ Recréer la fonction ensure_user_profile avec le bon type de retour
CREATE OR REPLACE FUNCTION public.ensure_user_profile(p_user_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile_id uuid;
BEGIN
  -- Créer profil s'il n'existe pas
  INSERT INTO public.profiles (user_id, display_name, user_type)
  VALUES (p_user_id, 'Utilisateur', 'client')
  ON CONFLICT (user_id) DO UPDATE 
  SET updated_at = NOW()
  RETURNING id INTO v_profile_id;

  RETURN v_profile_id;
END;
$$;

-- 5️⃣ Commentaires pour documentation
COMMENT ON FUNCTION public.create_client_profile_secure IS 
  'Crée un profil client complet avec validation et sécurité. Utilisé par le formulaire d''inscription client.';
  
COMMENT ON FUNCTION public.handle_new_user IS 
  'Trigger automatique qui crée un profil de base pour chaque nouvel utilisateur Auth.';
  
COMMENT ON FUNCTION public.ensure_user_profile IS 
  'Fonction utilitaire pour garantir l''existence d''un profil utilisateur.';