-- Sécuriser les données personnelles - Version finale simplifiée

-- 1. Ajouter les colonnes manquantes à la table profiles existante
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_public boolean DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_seen timestamp with time zone;

-- 2. Activer RLS sur la table profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. Supprimer TOUTES les politiques existantes (avec cascade pour éviter les erreurs)
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname FROM pg_policies WHERE tablename = 'profiles' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.profiles', policy_record.policyname);
    END LOOP;
END $$;

-- 4. Créer des politiques RLS sécurisées NOUVELLES

-- Politique 1: Les utilisateurs gèrent leur propre profil
CREATE POLICY "secure_own_profile_management" ON public.profiles
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Politique 2: Accès limité aux profils publics uniquement
CREATE POLICY "secure_public_profiles_read" ON public.profiles
FOR SELECT 
USING (
  is_public = true 
  AND auth.uid() IS NOT NULL
);

-- Politique 3: Accès admin avec audit
CREATE POLICY "secure_admin_full_access" ON public.profiles
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.admins 
    WHERE user_id = auth.uid() AND is_active = true
  )
);

-- 5. Créer une table d'audit pour les accès aux profils sensibles
CREATE TABLE IF NOT EXISTS public.profile_access_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  accessed_by uuid NOT NULL,
  target_user_id uuid NOT NULL,
  access_type text NOT NULL,
  access_reason text,
  sensitive_data_accessed jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamp with time zone DEFAULT now()
);

-- RLS pour les logs d'audit de profils
ALTER TABLE public.profile_access_logs ENABLE ROW LEVEL SECURITY;

-- Supprimer les politiques existantes sur les logs si elles existent
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname FROM pg_policies WHERE tablename = 'profile_access_logs' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.profile_access_logs', policy_record.policyname);
    END LOOP;
END $$;

-- Nouvelles politiques pour les logs
CREATE POLICY "logs_own_profile_access" ON public.profile_access_logs
FOR SELECT 
USING (auth.uid() = target_user_id);

CREATE POLICY "logs_admin_access" ON public.profile_access_logs
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.admins 
    WHERE user_id = auth.uid() AND is_active = true
  )
);

CREATE POLICY "logs_system_insert" ON public.profile_access_logs
FOR INSERT 
WITH CHECK (true);

-- 6. Créer une fonction sécurisée pour obtenir des informations publiques limitées
CREATE OR REPLACE FUNCTION public.get_protected_user_info(user_id_param uuid)
RETURNS TABLE (
  user_id uuid,
  display_name text,
  avatar_url text,
  user_type text,
  member_since timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Vérifier que l'utilisateur est authentifié
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentification requise pour accéder aux informations utilisateur';
  END IF;
  
  -- Logger l'accès aux données
  INSERT INTO public.profile_access_logs (
    accessed_by, target_user_id, access_type, access_reason
  ) VALUES (
    auth.uid(), user_id_param, 'protected_info_access', 'Protected profile information request'
  );
  
  -- Retourner seulement les informations autorisées
  RETURN QUERY
  SELECT 
    p.user_id,
    CASE 
      WHEN p.is_public = true OR p.user_id = auth.uid() THEN p.display_name 
      ELSE 'Utilisateur privé'
    END as display_name,
    CASE 
      WHEN p.is_public = true OR p.user_id = auth.uid() THEN p.avatar_url 
      ELSE NULL
    END as avatar_url,
    COALESCE(p.user_type, 'client') as user_type,
    COALESCE(p.created_at, now()) as member_since
  FROM public.profiles p
  WHERE p.user_id = user_id_param;
END;
$$;

-- 7. Accorder les permissions nécessaires
GRANT EXECUTE ON FUNCTION public.get_protected_user_info TO authenticated;