-- Fonction trigger pour création automatique profil restaurant
CREATE OR REPLACE FUNCTION public.handle_new_restaurant_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_phone TEXT;
  v_restaurant_name TEXT;
  v_city TEXT;
BEGIN
  -- Extraire les données des metadata
  v_phone := NEW.raw_user_meta_data->>'phone';
  v_restaurant_name := NEW.raw_user_meta_data->>'restaurant_name';
  v_city := COALESCE(NEW.raw_user_meta_data->>'city', 'Kinshasa');
  
  -- Validation : téléphone obligatoire
  IF v_phone IS NULL OR trim(v_phone) = '' THEN
    RAISE EXCEPTION 'Le numéro de téléphone est obligatoire pour créer un compte restaurant';
  END IF;
  
  -- Validation : nom restaurant obligatoire
  IF v_restaurant_name IS NULL OR trim(v_restaurant_name) = '' THEN
    RAISE EXCEPTION 'Le nom du restaurant est obligatoire';
  END IF;
  
  -- Insérer dans restaurant_profiles
  INSERT INTO public.restaurant_profiles (
    user_id,
    restaurant_name,
    phone_number,
    email,
    city,
    address,
    verification_status,
    is_active,
    payment_model
  ) VALUES (
    NEW.id,
    v_restaurant_name,
    v_phone,
    NEW.email,
    v_city,
    v_restaurant_name, -- Temporaire, à compléter plus tard
    'pending',
    true,
    'commission'
  );
  
  -- Créer le rôle dans user_roles
  INSERT INTO public.user_roles (
    user_id,
    role,
    is_active
  ) VALUES (
    NEW.id,
    'restaurant',
    true
  ) ON CONFLICT (user_id, role) DO NOTHING;
  
  -- Logger l'activité
  INSERT INTO public.activity_logs (
    user_id,
    activity_type,
    description
  ) VALUES (
    NEW.id,
    'account_created',
    'Nouveau restaurant inscrit: ' || v_restaurant_name
  );
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Logger l'erreur mais ne pas bloquer la création du compte auth
  RAISE WARNING 'Erreur création profil restaurant pour user %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$;

-- Créer le trigger sur auth.users
DROP TRIGGER IF EXISTS on_auth_user_created_restaurant ON auth.users;
CREATE TRIGGER on_auth_user_created_restaurant
  AFTER INSERT ON auth.users
  FOR EACH ROW
  WHEN (NEW.raw_user_meta_data->>'user_type' = 'restaurant')
  EXECUTE FUNCTION public.handle_new_restaurant_user();

-- Index unique pour téléphone restaurants
CREATE UNIQUE INDEX IF NOT EXISTS restaurant_profiles_phone_number_unique 
ON public.restaurant_profiles (phone_number)
WHERE is_active = true;