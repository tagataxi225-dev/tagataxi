-- Phase 2: Optimisation base de données pour performances admin
-- Note: Les index CONCURRENTLY doivent être créés manuellement via SQL Editor

-- Index composite sur user_roles pour accélérer les requêtes de permissions
CREATE INDEX IF NOT EXISTS idx_user_roles_lookup 
ON public.user_roles(user_id, role, is_active) 
WHERE is_active = true;

-- Vue matérialisée pour cache des utilisateurs admin
CREATE MATERIALIZED VIEW IF NOT EXISTS public.admin_users_cache AS
SELECT 
  ur.user_id, 
  ur.role::text as role, 
  ur.admin_role::text as admin_role, 
  ur.is_active,
  ur.created_at,
  ur.updated_at
FROM public.user_roles ur
WHERE ur.role = 'admin' AND ur.is_active = true;

-- Index unique sur la vue matérialisée
CREATE UNIQUE INDEX IF NOT EXISTS idx_admin_users_cache_user_id 
ON public.admin_users_cache(user_id);

-- Fonction pour rafraîchir le cache admin
CREATE OR REPLACE FUNCTION public.refresh_admin_cache()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.admin_users_cache;
END;
$$;

-- Trigger pour rafraîchir automatiquement le cache admin après modifications
CREATE OR REPLACE FUNCTION public.trigger_refresh_admin_cache()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM pg_notify('refresh_admin_cache', '');
  RETURN NEW;
END;
$$;

-- Créer le trigger sur user_roles
DROP TRIGGER IF EXISTS auto_refresh_admin_cache ON public.user_roles;
CREATE TRIGGER auto_refresh_admin_cache
AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
FOR EACH STATEMENT
EXECUTE FUNCTION public.trigger_refresh_admin_cache();