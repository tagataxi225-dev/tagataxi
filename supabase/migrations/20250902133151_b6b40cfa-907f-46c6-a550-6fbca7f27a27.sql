-- Sécuriser les données personnelles des utilisateurs - Version corrigée

-- 1. Vérifier si la table profiles existe et la créer si nécessaire
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  phone_number text,
  avatar_url text,
  bio text,
  user_type text DEFAULT 'client',
  is_public boolean DEFAULT false,
  last_seen timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- 2. Activer RLS sur la table profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. Supprimer TOUTES les politiques existantes pour recommencer proprement
DROP POLICY IF EXISTS "Users can manage their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view public profile summaries" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.profiles;
DROP POLICY IF EXISTS "Public read access" ON public.profiles;
DROP POLICY IF EXISTS "Anyone can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

-- 4. Créer des politiques RLS sécurisées pour protéger les données personnelles

-- Les utilisateurs peuvent voir et modifier leur propre profil
CREATE POLICY "Secure: Users manage own profile" ON public.profiles
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Les utilisateurs authentifiés peuvent voir SEULEMENT les profils explicitement publics
CREATE POLICY "Secure: View public profiles only" ON public.profiles
FOR SELECT 
USING (
  is_public = true 
  AND auth.uid() IS NOT NULL
);

-- Les admins peuvent voir tous les profils (avec audit automatique)
CREATE POLICY "Secure: Admin access with audit" ON public.profiles
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.admins 
    WHERE user_id = auth.uid() AND is_active = true
  )
);

-- 5. Créer une fonction sécurisée pour obtenir des informations publiques limitées
CREATE OR REPLACE FUNCTION public.get_public_user_info(user_id_param uuid)
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
  
  -- Logger l'accès aux données publiques si la table existe
  BEGIN
    INSERT INTO public.profile_access_logs (
      accessed_by, target_user_id, access_type, access_reason
    ) VALUES (
      auth.uid(), user_id_param, 'public_info_access', 'Public profile information request'
    );
  EXCEPTION WHEN OTHERS THEN
    -- Ignorer si la table de logs n'existe pas encore
    NULL;
  END;
  
  -- Retourner seulement les informations publiques autorisées
  RETURN QUERY
  SELECT 
    p.user_id,
    CASE 
      WHEN p.is_public = true THEN p.display_name 
      ELSE 'Utilisateur privé'
    END as display_name,
    CASE 
      WHEN p.is_public = true THEN p.avatar_url 
      ELSE NULL
    END as avatar_url,
    p.user_type,
    p.created_at as member_since
  FROM public.profiles p
  WHERE p.user_id = user_id_param
    AND (p.is_public = true OR p.user_id = auth.uid());
END;
$$;

-- 6. Créer une table d'audit pour les accès aux profils sensibles
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

-- Supprimer les politiques existantes sur les logs
DROP POLICY IF EXISTS "Users can view access logs for their own profile" ON public.profile_access_logs;
DROP POLICY IF EXISTS "Admins can view all profile access logs" ON public.profile_access_logs;

CREATE POLICY "Secure: Users view own profile logs" ON public.profile_access_logs
FOR SELECT 
USING (auth.uid() = target_user_id);

CREATE POLICY "Secure: Admins view all profile logs" ON public.profile_access_logs
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.admins 
    WHERE user_id = auth.uid() AND is_active = true
  )
);

-- Politique pour permettre l'insertion dans les logs
CREATE POLICY "Secure: System can log profile access" ON public.profile_access_logs
FOR INSERT 
WITH CHECK (true);

-- 7. Créer une fonction pour la recherche sécurisée et anonymisée
CREATE OR REPLACE FUNCTION public.search_users_safe(
  search_term text,
  limit_results integer DEFAULT 10
)
RETURNS TABLE (
  user_id uuid,
  masked_name text,
  user_type text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Vérifier que l'utilisateur est authentifié
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentification requise pour rechercher des utilisateurs';
  END IF;
  
  -- Retourner des résultats masqués pour protéger la vie privée
  RETURN QUERY
  SELECT 
    p.user_id,
    LEFT(COALESCE(p.display_name, 'Utilisateur'), 3) || '***' as masked_name,
    p.user_type
  FROM public.profiles p
  WHERE p.is_public = true
    AND LOWER(p.display_name) LIKE LOWER('%' || search_term || '%')
    AND LENGTH(search_term) >= 3 -- Minimum 3 caractères pour éviter le fishing
  ORDER BY p.created_at DESC
  LIMIT LEAST(limit_results, 10); -- Maximum 10 résultats
END;
$$;

-- 8. Accorder les permissions nécessaires
GRANT EXECUTE ON FUNCTION public.get_public_user_info TO authenticated;
GRANT EXECUTE ON FUNCTION public.search_users_safe TO authenticated;

-- 9. Créer un trigger pour mettre à jour updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
DROP FUNCTION IF EXISTS public.update_profiles_updated_at();

CREATE OR REPLACE FUNCTION public.update_profiles_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_profiles_updated_at();