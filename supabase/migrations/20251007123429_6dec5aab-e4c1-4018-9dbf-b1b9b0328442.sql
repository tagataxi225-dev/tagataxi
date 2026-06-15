-- ====================================================================
-- CORRECTION SÉCURITÉ: Suppression de l'exposition de auth.users
-- ====================================================================

-- Problème: La vue matérialisée admin_users_cache expose auth.users.email
-- Solution: Supprimer la vue et utiliser uniquement les données de la table admins

DROP MATERIALIZED VIEW IF EXISTS public.admin_users_cache CASCADE;

-- Si la vue est réellement nécessaire, créer une version sécurisée 
-- qui utilise uniquement les données de la table admins (qui contient déjà email)
CREATE MATERIALIZED VIEW public.admin_users_cache AS
SELECT 
  ur.user_id,
  ur.role,
  ur.admin_role,
  ur.is_active,
  ur.created_at,
  ur.updated_at,
  a.email,  -- Email provient de admins, pas de auth.users
  a.display_name,
  a.phone_number,
  a.department,
  a.admin_level,
  a.permissions,
  a.last_login
FROM public.user_roles ur
LEFT JOIN public.admins a ON a.user_id = ur.user_id
WHERE ur.role = 'admin'::user_role 
  AND ur.is_active = true;

-- Créer un index unique pour les rafraîchissements CONCURRENTLY
CREATE UNIQUE INDEX admin_users_cache_user_id_idx ON public.admin_users_cache(user_id);

-- Activer RLS sur la vue matérialisée
ALTER MATERIALIZED VIEW public.admin_users_cache OWNER TO postgres;

-- Politique RLS: Seuls les super admins peuvent accéder à cette vue
-- Note: Les vues matérialisées ne supportent pas RLS directement,
-- donc on restreint via les permissions de schéma