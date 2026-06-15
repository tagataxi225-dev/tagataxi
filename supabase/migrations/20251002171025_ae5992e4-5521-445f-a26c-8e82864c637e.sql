-- ====================================
-- MIGRATION COMPLÈTE : CORRECTION INSCRIPTION CHAUFFEURS (V3)
-- ====================================

-- ========================================
-- PHASE 0 : CORRECTIONS PRÉALABLES
-- ========================================

-- Corriger la contrainte user_type
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_user_type_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_user_type_check 
  CHECK (user_type IN ('client', 'driver', 'admin', 'partner'));

-- Ajouter une contrainte unique sur driver_credits.driver_id
CREATE UNIQUE INDEX IF NOT EXISTS driver_credits_driver_id_unique 
  ON public.driver_credits(driver_id);

-- Ajouter une contrainte unique sur driver_codes(driver_id, code)
CREATE UNIQUE INDEX IF NOT EXISTS driver_codes_driver_id_code_unique 
  ON public.driver_codes(driver_id, code);

-- Ajouter une contrainte unique sur user_roles(user_id, role)
CREATE UNIQUE INDEX IF NOT EXISTS user_roles_user_id_role_unique 
  ON public.user_roles(user_id, role);

-- ========================================
-- PHASE 1 : TRIGGER AUTH.USERS → PROFILES
-- ========================================

CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  user_role TEXT;
BEGIN
  user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'client');
  
  INSERT INTO public.profiles (
    user_id,
    display_name,
    phone_number,
    user_type,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'phone_number', ''),
    user_role,
    NOW(),
    NOW()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    updated_at = NOW();
  
  INSERT INTO public.activity_logs (
    user_id,
    activity_type,
    description,
    metadata
  ) VALUES (
    NEW.id,
    'user_profile_created',
    'Profil utilisateur créé automatiquement',
    jsonb_build_object(
      'email', NEW.email,
      'user_type', user_role,
      'trigger', 'handle_new_user_profile'
    )
  );
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Erreur création profile pour user %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;

CREATE TRIGGER on_auth_user_created_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_profile();

-- ========================================
-- PHASE 2 : TRIGGER CHAUFFEURS AMÉLIORÉ
-- ========================================

CREATE SEQUENCE IF NOT EXISTS driver_code_sequence START 1000;

CREATE OR REPLACE FUNCTION public.handle_new_driver()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  profile_exists BOOLEAN;
  generated_code TEXT;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM public.profiles WHERE user_id = NEW.user_id
  ) INTO profile_exists;
  
  IF NOT profile_exists THEN
    INSERT INTO public.profiles (
      user_id,
      display_name,
      phone_number,
      user_type,
      created_at,
      updated_at
    ) VALUES (
      NEW.user_id,
      NEW.display_name,
      NEW.phone_number,
      'driver',
      NOW(),
      NOW()
    ) ON CONFLICT (user_id) DO NOTHING;
    
    RAISE WARNING 'Profile manquant créé pour chauffeur %', NEW.user_id;
  END IF;
  
  INSERT INTO public.driver_locations (
    driver_id, latitude, longitude, is_online, is_available,
    vehicle_class, last_ping, created_at, updated_at
  ) VALUES (
    NEW.user_id,
    -4.3217,
    15.3069,
    false,
    false,
    COALESCE(NEW.vehicle_class, 'standard'),
    NOW(),
    NOW(),
    NOW()
  ) ON CONFLICT (driver_id) DO NOTHING;
  
  INSERT INTO public.driver_credits (
    driver_id, balance, currency, total_earned, total_spent,
    is_active, created_at, updated_at
  ) VALUES (
    NEW.user_id,
    0,
    'CDF',
    0,
    0,
    true,
    NOW(),
    NOW()
  ) ON CONFLICT (driver_id) DO NOTHING;
  
  generated_code := 'DRV' || LPAD(nextval('driver_code_sequence')::text, 6, '0');
  
  INSERT INTO public.driver_codes (
    driver_id, code, is_active, created_at, updated_at
  ) VALUES (
    NEW.user_id,
    generated_code,
    true,
    NOW(),
    NOW()
  ) ON CONFLICT (driver_id, code) DO NOTHING;
  
  INSERT INTO public.user_roles (
    user_id, role, is_active, created_at, updated_at
  ) VALUES (
    NEW.user_id,
    'driver',
    true,
    NOW(),
    NOW()
  ) ON CONFLICT (user_id, role) DO NOTHING;
  
  PERFORM public.log_system_activity(
    'driver_registration_complete',
    'Chauffeur enregistré avec toutes les dépendances',
    jsonb_build_object(
      'driver_id', NEW.user_id,
      'service_type', NEW.service_type,
      'vehicle_class', NEW.vehicle_class,
      'driver_code', generated_code
    )
  );
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Erreur handle_new_driver pour %: %', NEW.user_id, SQLERRM;
  
  INSERT INTO public.activity_logs (
    user_id,
    activity_type,
    description,
    metadata
  ) VALUES (
    NEW.user_id,
    'driver_registration_error',
    'Erreur lors de la création des dépendances chauffeur',
    jsonb_build_object(
      'error', SQLERRM,
      'sqlstate', SQLSTATE
    )
  );
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_chauffeur_created ON public.chauffeurs;

CREATE TRIGGER on_chauffeur_created
  AFTER INSERT ON public.chauffeurs
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_driver();

-- ========================================
-- PHASE 3 : CONTRAINTES DE CLÉ ÉTRANGÈRE
-- ========================================

ALTER TABLE public.driver_credits
  DROP CONSTRAINT IF EXISTS driver_credits_driver_id_fkey;

ALTER TABLE public.driver_credits
  ADD CONSTRAINT driver_credits_driver_id_fkey
  FOREIGN KEY (driver_id)
  REFERENCES public.profiles(user_id)
  ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_driver_credits_driver_id 
  ON public.driver_credits(driver_id);

-- ========================================
-- PHASE 4 : NETTOYAGE DONNÉES ORPHELINES
-- ========================================

INSERT INTO public.profiles (
  user_id,
  display_name,
  phone_number,
  user_type,
  created_at,
  updated_at
)
SELECT 
  c.user_id,
  c.display_name,
  COALESCE(c.phone_number, ''),
  'driver',
  c.created_at,
  NOW()
FROM public.chauffeurs c
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles p WHERE p.user_id = c.user_id
)
ON CONFLICT (user_id) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  phone_number = EXCLUDED.phone_number,
  updated_at = NOW();

INSERT INTO public.driver_credits (
  driver_id, balance, currency, total_earned, total_spent,
  is_active, created_at, updated_at
)
SELECT 
  c.user_id,
  0,
  'CDF',
  0,
  0,
  true,
  c.created_at,
  NOW()
FROM public.chauffeurs c
WHERE NOT EXISTS (
  SELECT 1 FROM public.driver_credits dc WHERE dc.driver_id = c.user_id
)
  AND EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.user_id = c.user_id
  )
ON CONFLICT (driver_id) DO NOTHING;