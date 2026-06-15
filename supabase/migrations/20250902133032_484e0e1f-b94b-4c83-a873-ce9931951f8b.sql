-- Sécuriser les données personnelles des utilisateurs contre le harvesting malveillant

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

-- 3. Supprimer toute politique publique dangereuse existante
DROP POLICY IF EXISTS "Enable read access for all users" ON public.profiles;
DROP POLICY IF EXISTS "Public read access" ON public.profiles;
DROP POLICY IF EXISTS "Anyone can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

-- 4. Créer des politiques RLS sécurisées pour protéger les données personnelles

-- Les utilisateurs peuvent voir et modifier leur propre profil
CREATE POLICY "Users can manage their own profile" ON public.profiles
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Les utilisateurs peuvent voir les profils publics (informations limitées seulement)
CREATE POLICY "Users can view public profile summaries" ON public.profiles
FOR SELECT 
USING (
  is_public = true 
  AND auth.uid() IS NOT NULL
);

-- Les admins peuvent voir tous les profils (avec audit)
CREATE POLICY "Admins can view all profiles" ON public.profiles
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
  
  -- Logger l'accès aux données publiques
  INSERT INTO public.profile_access_logs (
    accessed_by, target_user_id, access_type, access_reason
  ) VALUES (
    auth.uid(), user_id_param, 'public_info_access', 'Public profile information request'
  );
  
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

-- 6. Créer une fonction pour la recherche anonymisée d'utilisateurs
CREATE OR REPLACE FUNCTION public.search_users_anonymized(
  search_term text,
  user_type_filter text DEFAULT NULL,
  limit_results integer DEFAULT 20
)
RETURNS TABLE (
  user_id uuid,
  display_name text,
  user_type text,
  is_verified boolean
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
  
  -- Retourner des résultats anonymisés pour la recherche
  RETURN QUERY
  SELECT 
    p.user_id,
    CASE 
      WHEN p.is_public = true THEN LEFT(p.display_name, 15) || '...'
      ELSE 'Profil privé'
    END as display_name,
    p.user_type,
    false as is_verified -- Ne pas exposer le statut de vérification
  FROM public.profiles p
  WHERE p.is_public = true
    AND (user_type_filter IS NULL OR p.user_type = user_type_filter)
    AND (
      LOWER(p.display_name) LIKE LOWER('%' || search_term || '%')
      OR p.user_type LIKE LOWER('%' || search_term || '%')
    )
  ORDER BY 
    CASE WHEN p.user_id = auth.uid() THEN 0 ELSE 1 END, -- Utilisateur actuel en premier
    p.created_at DESC
  LIMIT limit_results;
END;
$$;

-- 7. Créer une table d'audit pour les accès aux profils sensibles
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

CREATE POLICY "Users can view access logs for their own profile" ON public.profile_access_logs
FOR SELECT 
USING (auth.uid() = target_user_id);

CREATE POLICY "Admins can view all profile access logs" ON public.profile_access_logs
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.admins 
    WHERE user_id = auth.uid() AND is_active = true
  )
);

-- 8. Créer une fonction pour masquer les données sensibles dans les listes
CREATE OR REPLACE FUNCTION public.get_user_directory(
  page_size integer DEFAULT 50,
  page_offset integer DEFAULT 0,
  filter_type text DEFAULT NULL
)
RETURNS TABLE (
  user_id uuid,
  public_display_name text,
  user_type text,
  total_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Vérifier que l'utilisateur est authentifié
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentification requise pour accéder au répertoire utilisateur';
  END IF;
  
  -- Retourner un répertoire anonymisé des utilisateurs publics
  RETURN QUERY
  WITH filtered_profiles AS (
    SELECT 
      p.user_id,
      p.display_name,
      p.user_type,
      p.created_at
    FROM public.profiles p
    WHERE p.is_public = true
      AND (filter_type IS NULL OR p.user_type = filter_type)
  ),
  total_count_cte AS (
    SELECT COUNT(*) as total_count FROM filtered_profiles
  )
  SELECT 
    fp.user_id,
    LEFT(fp.display_name, 10) || '***' as public_display_name,
    fp.user_type,
    tc.total_count
  FROM filtered_profiles fp
  CROSS JOIN total_count_cte tc
  ORDER BY fp.created_at DESC
  LIMIT page_size
  OFFSET page_offset;
END;
$$;

-- 9. Créer une vue sécurisée pour l'administration
CREATE OR REPLACE FUNCTION public.get_admin_user_overview()
RETURNS TABLE (
  total_users bigint,
  active_users_today bigint,
  public_profiles bigint,
  private_profiles bigint,
  users_by_type jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Vérifier que l'utilisateur est admin
  IF NOT EXISTS (
    SELECT 1 FROM public.admins 
    WHERE user_id = auth.uid() AND is_active = true
  ) THEN
    RAISE EXCEPTION 'Accès non autorisé - privilèges administrateur requis';
  END IF;
  
  -- Logger l'accès admin aux statistiques
  INSERT INTO public.profile_access_logs (
    accessed_by, target_user_id, access_type, access_reason
  ) VALUES (
    auth.uid(), auth.uid(), 'admin_stats_access', 'Admin accessing user statistics'
  );
  
  -- Retourner des statistiques agrégées anonymisées
  RETURN QUERY
  SELECT 
    COUNT(*) as total_users,
    COUNT(*) FILTER (WHERE last_seen >= now() - interval '1 day') as active_users_today,
    COUNT(*) FILTER (WHERE is_public = true) as public_profiles,
    COUNT(*) FILTER (WHERE is_public = false) as private_profiles,
    jsonb_object_agg(
      user_type, 
      user_count
    ) as users_by_type
  FROM (
    SELECT 
      user_type,
      COUNT(*) as user_count,
      last_seen,
      is_public
    FROM public.profiles
    GROUP BY user_type, last_seen, is_public
  ) stats;
END;
$$;

-- 10. Accorder les permissions nécessaires
GRANT EXECUTE ON FUNCTION public.get_public_user_info TO authenticated;
GRANT EXECUTE ON FUNCTION public.search_users_anonymized TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_directory TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_user_overview TO authenticated;

-- 11. Créer un trigger pour auditer automatiquement les accès sensibles
CREATE OR REPLACE FUNCTION public.audit_profile_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Auditer les accès aux données de profil sensibles
  IF auth.uid() IS NOT NULL AND auth.uid() != NEW.user_id THEN
    INSERT INTO public.profile_access_logs (
      accessed_by, target_user_id, access_type, access_reason,
      sensitive_data_accessed
    ) VALUES (
      auth.uid(), NEW.user_id, 'profile_data_access', 'Direct profile table access',
      jsonb_build_object(
        'display_name', NEW.display_name,
        'phone_number', CASE WHEN NEW.phone_number IS NOT NULL THEN '[MASKED]' ELSE NULL END,
        'avatar_url', NEW.avatar_url
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Note: Trigger après SELECT n'est pas supporté, utiliser les fonctions sécurisées

-- 12. Créer un trigger pour mettre à jour updated_at
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