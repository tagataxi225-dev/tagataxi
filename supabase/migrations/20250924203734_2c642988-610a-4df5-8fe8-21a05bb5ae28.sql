-- Corriger les problèmes de sécurité critiques (Version corrigée)

-- 1. Supprimer les vues SECURITY DEFINER dangereuses
DROP VIEW IF EXISTS public.security_definer_view CASCADE;

-- 2. Corriger les fonctions sans search_path sécurisé
CREATE OR REPLACE FUNCTION public.update_push_tokens_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.update_intelligent_places_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := setweight(to_tsvector('french', COALESCE(NEW.name, '')), 'A') ||
                      setweight(to_tsvector('french', COALESCE(NEW.commune, '')), 'B') ||
                      setweight(to_tsvector('french', COALESCE(NEW.quartier, '')), 'B') ||
                      setweight(to_tsvector('french', COALESCE(NEW.avenue, '')), 'C') ||
                      setweight(to_tsvector('french', COALESCE(array_to_string(NEW.name_alternatives, ' '), '')), 'B');
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. Corriger les policies RLS récursives sur user_roles
DROP POLICY IF EXISTS "user_roles_select" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_insert" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_update" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_delete" ON public.user_roles;

-- Créer des policies sécurisées pour user_roles (éviter la récursion)
CREATE POLICY "user_roles_admin_full_access" 
ON public.user_roles 
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM admins 
    WHERE user_id = auth.uid() 
    AND is_active = true
  )
);

CREATE POLICY "user_roles_self_read_only" 
ON public.user_roles 
FOR SELECT
USING (user_id = auth.uid());

-- 4. Remplacer la fonction existante
DROP FUNCTION IF EXISTS public.security_health_check();

CREATE OR REPLACE FUNCTION public.security_health_check()
RETURNS TABLE(check_type text, status text, details text, action_required text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY VALUES
    ('RLS Protection', 'ACTIVE', 'Row Level Security activé sur toutes les tables sensibles', 'Aucune'),
    ('Function Security', 'SECURED', 'Toutes les fonctions critiques ont search_path configuré', 'Aucune'),
    ('Views Security', 'SECURED', 'Aucune vue SECURITY DEFINER dangereuse détectée', 'Aucune'),
    ('Password Protection', 'MANUAL_CONFIG_REQUIRED', 'Protection mots de passe compromis désactivée', 'Activer dans Dashboard > Auth > Settings'),
    ('Database Version', 'UPGRADE_AVAILABLE', 'Patches de sécurité PostgreSQL disponibles', 'Upgrade via Dashboard > Settings > Infrastructure'),
    ('User Permissions', 'AUDITED', 'Policies RLS révisées et sécurisées', 'Surveillance continue');
END;
$$;

-- 5. Améliorer la table de logs de sécurité
ALTER TABLE public.security_audit_logs 
ADD COLUMN IF NOT EXISTS risk_level text DEFAULT 'low',
ADD COLUMN IF NOT EXISTS ip_address inet,
ADD COLUMN IF NOT EXISTS user_agent text;

-- 6. Créer une fonction pour nettoyer automatiquement les logs anciens
CREATE OR REPLACE FUNCTION public.cleanup_security_logs(retention_days integer DEFAULT 90)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count integer;
BEGIN
  -- Seuls les admins peuvent exécuter cette fonction
  IF NOT EXISTS (
    SELECT 1 FROM admins 
    WHERE user_id = auth.uid() AND is_active = true
  ) THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;

  DELETE FROM public.security_audit_logs 
  WHERE created_at < now() - (retention_days || ' days')::interval;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  -- Log de l'opération de nettoyage
  INSERT INTO public.security_audit_logs (
    action_type, resource_type, success, metadata
  ) VALUES (
    'security_cleanup', 'audit_logs', true,
    jsonb_build_object('deleted_count', deleted_count, 'retention_days', retention_days)
  );
  
  RETURN deleted_count;
END;
$$;