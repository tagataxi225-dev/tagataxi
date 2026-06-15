-- =====================================================
-- TRIGGER AUTOMATIQUE : Création profil client + wallet
-- =====================================================

-- 1. Fonction pour gérer les nouveaux utilisateurs clients
CREATE OR REPLACE FUNCTION public.handle_new_client_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_phone TEXT;
  v_display_name TEXT;
  v_date_of_birth DATE;
  v_gender TEXT;
  v_emergency_contact_name TEXT;
  v_emergency_contact_phone TEXT;
  v_address TEXT;
  v_city TEXT;
BEGIN
  -- Extraire les données des metadata
  v_phone := NEW.raw_user_meta_data->>'phone_number';
  v_display_name := COALESCE(
    NEW.raw_user_meta_data->>'display_name',
    NEW.raw_user_meta_data->>'full_name',
    split_part(NEW.email, '@', 1)
  );
  
  -- Convertir date_of_birth si présent
  BEGIN
    v_date_of_birth := (NEW.raw_user_meta_data->>'date_of_birth')::DATE;
  EXCEPTION WHEN OTHERS THEN
    v_date_of_birth := NULL;
  END;
  
  v_gender := NEW.raw_user_meta_data->>'gender';
  v_emergency_contact_name := NEW.raw_user_meta_data->>'emergency_contact_name';
  v_emergency_contact_phone := NEW.raw_user_meta_data->>'emergency_contact_phone';
  v_address := NEW.raw_user_meta_data->>'address';
  v_city := COALESCE(NEW.raw_user_meta_data->>'city', 'Kinshasa');
  
  -- Validation : téléphone obligatoire pour les clients
  IF v_phone IS NULL OR trim(v_phone) = '' THEN
    RAISE EXCEPTION 'Le numéro de téléphone est obligatoire pour créer un compte client';
  END IF;
  
  -- Insérer dans la table clients
  INSERT INTO public.clients (
    user_id,
    email,
    phone_number,
    display_name,
    date_of_birth,
    gender,
    emergency_contact_name,
    emergency_contact_phone,
    address,
    city,
    role,
    is_active
  ) VALUES (
    NEW.id,
    NEW.email,
    v_phone,
    v_display_name,
    v_date_of_birth,
    v_gender,
    v_emergency_contact_name,
    v_emergency_contact_phone,
    v_address,
    v_city,
    'simple_user_client',
    true
  );
  
  -- Créer le wallet automatiquement
  INSERT INTO public.user_wallets (
    user_id,
    balance,
    ecosystem_credits,
    kwenda_points,
    currency,
    status
  ) VALUES (
    NEW.id,
    0,
    0,
    0,
    'CDF',
    'active'
  ) ON CONFLICT (user_id) DO NOTHING;
  
  -- Créer le rôle dans user_roles
  INSERT INTO public.user_roles (
    user_id,
    role,
    is_active
  ) VALUES (
    NEW.id,
    'client',
    true
  ) ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Logger l'erreur mais ne pas bloquer la création du compte auth
  RAISE WARNING 'Erreur création profil client pour user %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$;

-- 2. Créer le trigger sur auth.users
DROP TRIGGER IF EXISTS on_auth_user_created_client ON auth.users;

CREATE TRIGGER on_auth_user_created_client
  AFTER INSERT ON auth.users
  FOR EACH ROW
  WHEN (NEW.raw_user_meta_data->>'role' = 'client')
  EXECUTE FUNCTION public.handle_new_client_user();

-- 3. Créer un index unique sur phone_number pour éviter les doublons
CREATE UNIQUE INDEX IF NOT EXISTS clients_phone_number_unique 
ON public.clients (phone_number)
WHERE is_active = true;

-- 4. Logger le déploiement
INSERT INTO public.activity_logs (
  user_id,
  activity_type,
  description,
  metadata
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'system_deployment',
  'Trigger automatique de création profil client déployé',
  jsonb_build_object(
    'trigger_name', 'on_auth_user_created_client',
    'function_name', 'handle_new_client_user',
    'timestamp', now()
  )
);