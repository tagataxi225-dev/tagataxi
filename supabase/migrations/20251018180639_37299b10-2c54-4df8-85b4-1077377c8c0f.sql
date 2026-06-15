-- Migration : Trigger universel pour tous les types d'utilisateurs
-- Supprime les anciens triggers conditionnels et crée un système de routing automatique

-- 1. Supprimer les anciens triggers conditionnels
DROP TRIGGER IF EXISTS on_auth_user_created_client ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_restaurant ON auth.users;

-- 2. Créer les fonctions handlers directs pour chaque type d'utilisateur

-- Handler pour clients
CREATE OR REPLACE FUNCTION public.handle_new_client_user_direct(auth_user auth.users)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_phone TEXT;
  v_display_name TEXT;
  v_date_of_birth DATE;
  v_gender TEXT;
  v_city TEXT;
BEGIN
  v_phone := auth_user.raw_user_meta_data->>'phone_number';
  v_display_name := COALESCE(
    auth_user.raw_user_meta_data->>'display_name',
    auth_user.raw_user_meta_data->>'full_name',
    split_part(auth_user.email, '@', 1)
  );
  
  BEGIN
    v_date_of_birth := (auth_user.raw_user_meta_data->>'date_of_birth')::DATE;
  EXCEPTION WHEN OTHERS THEN
    v_date_of_birth := NULL;
  END;
  
  v_gender := auth_user.raw_user_meta_data->>'gender';
  v_city := COALESCE(auth_user.raw_user_meta_data->>'city', 'Kinshasa');
  
  -- Créer profil client
  INSERT INTO public.clients (
    user_id, email, phone_number, display_name, 
    date_of_birth, gender, city, role, is_active
  ) VALUES (
    auth_user.id, auth_user.email, v_phone, v_display_name,
    v_date_of_birth, v_gender, v_city, 'simple_user_client', true
  ) ON CONFLICT (user_id) DO NOTHING;
  
  -- Créer wallet
  INSERT INTO public.user_wallets (
    user_id, balance, ecosystem_credits, kwenda_points, currency, status
  ) VALUES (
    auth_user.id, 0, 0, 0, 'CDF', 'active'
  ) ON CONFLICT (user_id) DO NOTHING;
  
  -- Créer rôle
  INSERT INTO public.user_roles (
    user_id, role, is_active
  ) VALUES (
    auth_user.id, 'client', true
  ) ON CONFLICT (user_id, role) DO NOTHING;
  
  RAISE NOTICE 'Client profile created: user_id=%, email=%', auth_user.id, auth_user.email;
END;
$$;

-- Handler pour restaurants
CREATE OR REPLACE FUNCTION public.handle_new_restaurant_user_direct(auth_user auth.users)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_phone TEXT;
  v_restaurant_name TEXT;
  v_city TEXT;
BEGIN
  v_phone := auth_user.raw_user_meta_data->>'phone';
  v_restaurant_name := auth_user.raw_user_meta_data->>'restaurant_name';
  v_city := COALESCE(auth_user.raw_user_meta_data->>'city', 'Kinshasa');
  
  IF v_phone IS NULL OR trim(v_phone) = '' THEN
    RAISE WARNING 'Missing restaurant phone: user_id=%', auth_user.id;
    RETURN;
  END IF;
  
  IF v_restaurant_name IS NULL OR trim(v_restaurant_name) = '' THEN
    RAISE WARNING 'Missing restaurant name: user_id=%', auth_user.id;
    RETURN;
  END IF;
  
  -- Créer profil restaurant
  INSERT INTO public.restaurant_profiles (
    user_id, restaurant_name, phone_number, email, city,
    address, verification_status, is_active, payment_model
  ) VALUES (
    auth_user.id, v_restaurant_name, v_phone, auth_user.email, v_city,
    v_restaurant_name, 'pending', true, 'commission'
  ) ON CONFLICT (user_id) DO NOTHING;
  
  -- Créer rôle
  INSERT INTO public.user_roles (
    user_id, role, is_active
  ) VALUES (
    auth_user.id, 'restaurant', true
  ) ON CONFLICT (user_id, role) DO NOTHING;
  
  -- Logger activité
  INSERT INTO public.activity_logs (
    user_id, activity_type, description
  ) VALUES (
    auth_user.id, 'account_created', 'Nouveau restaurant inscrit: ' || v_restaurant_name
  );
  
  RAISE NOTICE 'Restaurant profile created: user_id=%, name=%', auth_user.id, v_restaurant_name;
END;
$$;

-- Handler pour drivers/chauffeurs
CREATE OR REPLACE FUNCTION public.handle_new_driver_user_direct(auth_user auth.users)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_phone TEXT;
  v_display_name TEXT;
  v_license_number TEXT;
  v_vehicle_plate TEXT;
  v_service_type TEXT;
BEGIN
  v_phone := auth_user.raw_user_meta_data->>'phone_number';
  v_display_name := COALESCE(
    auth_user.raw_user_meta_data->>'display_name',
    split_part(auth_user.email, '@', 1)
  );
  v_license_number := auth_user.raw_user_meta_data->>'license_number';
  v_vehicle_plate := auth_user.raw_user_meta_data->>'vehicle_plate';
  v_service_type := auth_user.raw_user_meta_data->>'service_type';
  
  IF v_phone IS NULL OR trim(v_phone) = '' THEN
    RAISE WARNING 'Missing driver phone: user_id=%', auth_user.id;
    RETURN;
  END IF;
  
  -- Créer profil driver (sera complété lors de l'inscription détaillée)
  INSERT INTO public.chauffeurs (
    user_id, email, phone_number, display_name,
    license_number, vehicle_plate, service_type,
    is_active, verification_status, role
  ) VALUES (
    auth_user.id, auth_user.email, v_phone, v_display_name,
    v_license_number, v_vehicle_plate, v_service_type,
    false, 'pending', 'chauffeur'
  ) ON CONFLICT (user_id) DO NOTHING;
  
  -- Créer wallet
  INSERT INTO public.user_wallets (
    user_id, balance, ecosystem_credits, kwenda_points, currency, status
  ) VALUES (
    auth_user.id, 0, 0, 0, 'CDF', 'active'
  ) ON CONFLICT (user_id) DO NOTHING;
  
  -- Créer rôle
  INSERT INTO public.user_roles (
    user_id, role, is_active
  ) VALUES (
    auth_user.id, 'driver', true
  ) ON CONFLICT (user_id, role) DO NOTHING;
  
  RAISE NOTICE 'Driver profile created: user_id=%, email=%', auth_user.id, auth_user.email;
END;
$$;

-- 3. Créer la fonction de dispatching universelle
CREATE OR REPLACE FUNCTION public.handle_new_user_dispatch()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_type TEXT;
  v_role TEXT;
BEGIN
  -- Détecter le type d'utilisateur
  v_user_type := NEW.raw_user_meta_data->>'user_type';
  v_role := NEW.raw_user_meta_data->>'role';
  
  -- Logger pour debug
  RAISE NOTICE 'New user signup: user_id=%, email=%, user_type=%, role=%', 
    NEW.id, NEW.email, v_user_type, v_role;
  
  -- Router vers le bon handler
  IF v_user_type = 'restaurant' OR v_role = 'restaurant' THEN
    PERFORM public.handle_new_restaurant_user_direct(NEW);
    
  ELSIF v_user_type = 'driver' OR v_role = 'driver' OR v_role = 'chauffeur' THEN
    PERFORM public.handle_new_driver_user_direct(NEW);
    
  ELSIF v_user_type = 'client' OR v_role = 'client' OR v_role = 'simple_user_client' THEN
    PERFORM public.handle_new_client_user_direct(NEW);
    
  ELSE
    -- Par défaut : créer un client
    RAISE WARNING 'User type not specified, defaulting to client: user_id=%', NEW.id;
    PERFORM public.handle_new_client_user_direct(NEW);
  END IF;
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Logger l'erreur mais ne pas bloquer l'inscription
  RAISE WARNING 'Error in user dispatch for %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$;

-- 4. Créer le trigger universel (s'exécute pour TOUS les nouveaux utilisateurs)
CREATE TRIGGER on_auth_user_created_universal
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_dispatch();