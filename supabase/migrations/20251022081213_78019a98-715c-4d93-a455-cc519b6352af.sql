-- PHASE 1 CORRIGÉE: Créer le trigger automatique pour TOUS les nouveaux utilisateurs

-- 1. Fonction pour créer automatiquement profil + rôle à chaque inscription
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_type text;
BEGIN
  -- Récupérer le type d'utilisateur depuis les métadonnées (ou 'client' par défaut)
  v_user_type := COALESCE(NEW.raw_user_meta_data->>'user_type', 'client');
  
  -- Créer le profil de base
  INSERT INTO public.profiles (user_id, display_name, phone_number, user_type)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'phone_number',
    v_user_type
  )
  ON CONFLICT (user_id) DO UPDATE 
  SET 
    display_name = COALESCE(EXCLUDED.display_name, profiles.display_name),
    phone_number = COALESCE(EXCLUDED.phone_number, profiles.phone_number),
    user_type = EXCLUDED.user_type,
    updated_at = NOW();
  
  -- CRITIQUE: Créer le rôle utilisateur (obligatoire pour RLS) avec CAST vers user_role enum
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, v_user_type::user_role)
  ON CONFLICT (user_id, role) DO NOTHING;
  
  -- Logger la création pour debugging
  RAISE NOTICE 'User profile created: user_id=%, type=%', NEW.id, v_user_type;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Ne jamais bloquer la création du compte Auth
    RAISE WARNING 'Error in handle_new_user for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- 2. Créer le trigger sur auth.users (s'exécute après chaque INSERT)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 3. SCRIPT DE RÉPARATION: Créer les rôles manquants pour utilisateurs existants
INSERT INTO public.user_roles (user_id, role)
SELECT 
  u.id,
  COALESCE(u.raw_user_meta_data->>'user_type', 'client')::user_role
FROM auth.users u
LEFT JOIN public.user_roles ur ON u.id = ur.user_id
WHERE ur.user_id IS NULL
  AND u.created_at > NOW() - INTERVAL '30 days'
ON CONFLICT (user_id, role) DO NOTHING;

-- 4. Vérification finale: Tous les utilisateurs récents doivent avoir un rôle
DO $$
DECLARE
  v_count_without_role integer;
BEGIN
  SELECT COUNT(*) INTO v_count_without_role
  FROM auth.users u
  LEFT JOIN public.user_roles ur ON u.id = ur.user_id
  WHERE ur.user_id IS NULL
    AND u.created_at > NOW() - INTERVAL '7 days';
  
  IF v_count_without_role > 0 THEN
    RAISE WARNING '% utilisateurs récents sans rôle détectés', v_count_without_role;
  ELSE
    RAISE NOTICE 'Tous les utilisateurs récents ont un rôle ✓';
  END IF;
END $$;