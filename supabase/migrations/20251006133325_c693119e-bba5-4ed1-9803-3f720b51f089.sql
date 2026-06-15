-- =====================================================
-- FIX: admin_users_cache - Ajouter colonne email manquante
-- =====================================================
-- Problème: La vue matérialisée admin_users_cache n'a pas la colonne email
-- Solution: Recréer la vue avec toutes les colonnes nécessaires

-- 1. Supprimer l'ancienne vue matérialisée
DROP MATERIALIZED VIEW IF EXISTS public.admin_users_cache CASCADE;

-- 2. Créer la nouvelle vue avec la colonne email
CREATE MATERIALIZED VIEW public.admin_users_cache AS
SELECT 
  ur.user_id,
  ur.role,
  ur.admin_role,
  ur.is_active,
  ur.created_at,
  ur.updated_at,
  -- Récupérer l'email depuis auth.users
  au.email,
  -- Récupérer les informations depuis la table admins
  a.display_name,
  a.phone_number,
  a.department,
  a.admin_level,
  a.permissions,
  a.last_login
FROM public.user_roles ur
LEFT JOIN auth.users au ON au.id = ur.user_id
LEFT JOIN public.admins a ON a.user_id = ur.user_id
WHERE ur.role = 'admin'::user_role
  AND ur.is_active = true;

-- 3. Créer des index pour améliorer les performances
CREATE UNIQUE INDEX idx_admin_cache_user_id ON public.admin_users_cache(user_id);
CREATE INDEX idx_admin_cache_role ON public.admin_users_cache(role);
CREATE INDEX idx_admin_cache_admin_role ON public.admin_users_cache(admin_role);
CREATE INDEX idx_admin_cache_email ON public.admin_users_cache(email);
CREATE INDEX idx_admin_cache_is_active ON public.admin_users_cache(is_active);

-- 4. Rafraîchir la vue immédiatement
REFRESH MATERIALIZED VIEW CONCURRENTLY public.admin_users_cache;

-- 5. Accorder les permissions appropriées
GRANT SELECT ON public.admin_users_cache TO authenticated;

-- 6. Commentaire pour documentation
COMMENT ON MATERIALIZED VIEW public.admin_users_cache IS 
'Cache matérialisé des utilisateurs admin avec leurs emails et informations complètes. 
Rafraîchi automatiquement toutes les 5 minutes via la fonction refresh_admin_cache.
Corrigé pour inclure la colonne email manquante.';