-- Phase 1: Correction des profils manquants et réparation du trigger
-- 1. Créer automatiquement des profils pour tous les utilisateurs auth existants sans profil
INSERT INTO public.profiles (user_id, display_name, user_type)
SELECT 
  au.id,
  COALESCE(
    au.raw_user_meta_data->>'display_name',
    au.raw_user_meta_data->>'full_name',
    CONCAT(au.raw_user_meta_data->>'first_name', ' ', au.raw_user_meta_data->>'last_name'),
    au.raw_user_meta_data->>'first_name',
    au.email,
    'Utilisateur'
  ) as display_name,
  'client' as user_type
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.user_id
WHERE p.user_id IS NULL;

-- 2. Réparer et améliorer le trigger handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  -- Insérer dans profiles avec gestion des erreurs
  INSERT INTO public.profiles (user_id, display_name, phone_number, user_type)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'display_name',
      NEW.raw_user_meta_data->>'full_name',
      CONCAT(NEW.raw_user_meta_data->>'first_name', ' ', NEW.raw_user_meta_data->>'last_name'),
      NEW.raw_user_meta_data->>'first_name',
      NEW.email,
      'Utilisateur'
    ),
    NEW.phone,
    'client'
  );
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't block user creation
    RAISE WARNING 'Failed to create profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- 3. Vérifier que le trigger existe toujours
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 4. Ajouter une table de vérifications utilisateur si elle n'existe pas
CREATE TABLE IF NOT EXISTS public.user_verification (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  phone_verified BOOLEAN DEFAULT FALSE,
  identity_verified BOOLEAN DEFAULT FALSE,
  verification_level TEXT DEFAULT 'none' CHECK (verification_level IN ('none', 'basic', 'full')),
  verification_documents JSONB DEFAULT '[]',
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS on user_verification
ALTER TABLE public.user_verification ENABLE ROW LEVEL SECURITY;

-- Create policies for user_verification
CREATE POLICY "Users can view their own verification status"
ON public.user_verification
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own verification"
ON public.user_verification
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "System can create verification records"
ON public.user_verification
FOR INSERT
WITH CHECK (true);

-- 5. Créer des enregistrements de vérification pour tous les utilisateurs existants
INSERT INTO public.user_verification (user_id, verification_level)
SELECT user_id, 'none'
FROM public.profiles
WHERE user_id NOT IN (SELECT user_id FROM public.user_verification);

-- 6. Fonction pour créer automatiquement un profil si manquant
CREATE OR REPLACE FUNCTION public.ensure_user_profile(p_user_id UUID)
RETURNS public.profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  profile_record public.profiles;
  user_record auth.users;
BEGIN
  -- Vérifier si le profil existe déjà
  SELECT * INTO profile_record 
  FROM public.profiles 
  WHERE user_id = p_user_id;
  
  IF profile_record IS NOT NULL THEN
    RETURN profile_record;
  END IF;
  
  -- Récupérer les données utilisateur
  SELECT * INTO user_record 
  FROM auth.users 
  WHERE id = p_user_id;
  
  IF user_record IS NULL THEN
    RAISE EXCEPTION 'User not found: %', p_user_id;
  END IF;
  
  -- Créer le profil
  INSERT INTO public.profiles (user_id, display_name, phone_number, user_type)
  VALUES (
    p_user_id,
    COALESCE(
      user_record.raw_user_meta_data->>'display_name',
      user_record.raw_user_meta_data->>'full_name',
      CONCAT(user_record.raw_user_meta_data->>'first_name', ' ', user_record.raw_user_meta_data->>'last_name'),
      user_record.raw_user_meta_data->>'first_name',
      user_record.email,
      'Utilisateur'
    ),
    user_record.phone,
    'client'
  )
  RETURNING * INTO profile_record;
  
  -- Créer l'enregistrement de vérification
  INSERT INTO public.user_verification (user_id, verification_level)
  VALUES (p_user_id, 'none');
  
  RETURN profile_record;
END;
$$;