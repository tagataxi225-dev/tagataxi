-- ==========================================
-- 🔧 SPRINT 1: RÉPARATION TRIGGER handle_new_user
-- ==========================================

-- 1️⃣ Créer la table restaurant_profiles si elle n'existe pas
CREATE TABLE IF NOT EXISTS public.restaurant_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  email TEXT NOT NULL,
  phone_number TEXT,
  restaurant_name TEXT NOT NULL,
  city TEXT DEFAULT 'Kinshasa',
  address TEXT,
  cuisine_type TEXT[],
  description TEXT,
  logo_url TEXT,
  cover_image_url TEXT,
  is_active BOOLEAN DEFAULT false,
  verification_status TEXT DEFAULT 'pending',
  rating_average NUMERIC(3,2) DEFAULT 0.00,
  rating_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activer RLS sur restaurant_profiles
ALTER TABLE public.restaurant_profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Les restaurants voient leur propre profil
CREATE POLICY "restaurant_profiles_own_data" 
ON public.restaurant_profiles 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy: Les admins voient tous les profils
CREATE POLICY "restaurant_profiles_admin_access" 
ON public.restaurant_profiles 
FOR SELECT 
USING (is_current_user_admin());

-- 2️⃣ Recréer le trigger handle_new_user avec NORMALISATION DES RÔLES
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = public
AS $$
DECLARE
  user_role_from_metadata TEXT;
  normalized_role TEXT;
  phone_value TEXT;
  display_name_value TEXT;
BEGIN
  -- Récupérer le rôle depuis les métadonnées
  user_role_from_metadata := COALESCE(NEW.raw_user_meta_data ->> 'role', 'client');
  
  -- ✅ NORMALISATION DES RÔLES (correction des variantes)
  normalized_role := CASE
    WHEN user_role_from_metadata IN ('simple_user_client', 'client', 'user') THEN 'client'
    WHEN user_role_from_metadata IN ('driver', 'chauffeur', 'taxi_driver', 'delivery_driver') THEN 'driver'
    WHEN user_role_from_metadata IN ('partner', 'partenaire') THEN 'partner'
    WHEN user_role_from_metadata = 'restaurant' THEN 'restaurant'
    WHEN user_role_from_metadata = 'admin' THEN 'admin'
    ELSE 'client'
  END;

  -- Valeurs communes
  phone_value := COALESCE(NEW.phone, NEW.raw_user_meta_data ->> 'phone_number', '+243000000000');
  display_name_value := COALESCE(
    NEW.raw_user_meta_data ->> 'display_name',
    NEW.raw_user_meta_data ->> 'full_name',
    split_part(NEW.email, '@', 1)
  );

  -- ✅ CRÉER PROFIL RESTAURANT
  IF normalized_role = 'restaurant' THEN
    INSERT INTO public.restaurant_profiles (
      user_id, 
      email, 
      phone_number, 
      restaurant_name, 
      is_active,
      verification_status
    ) VALUES (
      NEW.id,
      NEW.email,
      phone_value,
      COALESCE(NEW.raw_user_meta_data ->> 'restaurant_name', display_name_value),
      false, -- En attente de validation admin
      'pending'
    )
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  -- ✅ CRÉER PROFIL CLIENT
  IF normalized_role = 'client' THEN
    INSERT INTO public.clients (
      user_id, 
      email, 
      phone_number, 
      display_name, 
      is_active
    ) VALUES (
      NEW.id,
      NEW.email,
      phone_value,
      display_name_value,
      true
    )
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  -- ✅ CRÉER PROFIL CHAUFFEUR
  IF normalized_role = 'driver' THEN
    INSERT INTO public.chauffeurs (
      user_id,
      email,
      phone_number,
      display_name,
      is_active,
      verification_status
    ) VALUES (
      NEW.id,
      NEW.email,
      phone_value,
      display_name_value,
      false, -- En attente de validation
      'pending'
    )
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  -- ✅ CRÉER PROFIL PARTENAIRE
  IF normalized_role = 'partner' THEN
    INSERT INTO public.partenaires (
      user_id,
      email,
      phone_number,
      display_name,
      is_active
    ) VALUES (
      NEW.id,
      NEW.email,
      phone_value,
      display_name_value,
      false -- En attente de validation
    )
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  -- ✅ CRÉER PROFIL ADMIN
  IF normalized_role = 'admin' THEN
    INSERT INTO public.admins (
      user_id,
      email,
      phone_number,
      display_name,
      is_active,
      admin_level
    ) VALUES (
      NEW.id,
      NEW.email,
      phone_value,
      display_name_value,
      true,
      'moderator'
    )
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  -- ✅ CRÉER PROFIL DE BASE (profiles table)
  INSERT INTO public.profiles (
    user_id,
    display_name,
    user_type,
    is_public
  ) VALUES (
    NEW.id,
    display_name_value,
    normalized_role,
    true
  )
  ON CONFLICT (user_id) DO NOTHING;

  -- ✅ INSÉRER DANS user_roles AVEC RÔLE NORMALISÉ
  INSERT INTO public.user_roles (
    user_id, 
    role, 
    is_active
  ) VALUES (
    NEW.id, 
    normalized_role::user_role, 
    true
  )
  ON CONFLICT (user_id, role) DO UPDATE SET is_active = true;

  RETURN NEW;
END;
$$;

-- 3️⃣ Recréer le trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_user();

-- 4️⃣ Créer un trigger pour updated_at sur restaurant_profiles
CREATE OR REPLACE FUNCTION public.update_restaurant_profiles_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_restaurant_profiles_timestamp ON public.restaurant_profiles;

CREATE TRIGGER update_restaurant_profiles_timestamp
  BEFORE UPDATE ON public.restaurant_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_restaurant_profiles_updated_at();