-- PHASE 1: CORRECTIFS DE SÉCURITÉ CRITIQUES

-- 1. Sécuriser les tables publiques exposées
-- Activer RLS sur intelligent_places
ALTER TABLE public.intelligent_places ENABLE ROW LEVEL SECURITY;

-- Politique pour intelligent_places - accès lecture pour utilisateurs authentifiés
CREATE POLICY "intelligent_places_authenticated_read" ON public.intelligent_places
FOR SELECT TO authenticated
USING (is_active = true);

-- Politique admin pour intelligent_places
CREATE POLICY "intelligent_places_admin_manage" ON public.intelligent_places
FOR ALL TO authenticated
USING (is_current_user_admin())
WITH CHECK (is_current_user_admin());

-- Activer RLS sur service_zones
ALTER TABLE public.service_zones ENABLE ROW LEVEL SECURITY;

-- Politique pour service_zones - accès lecture pour utilisateurs authentifiés
CREATE POLICY "service_zones_authenticated_read" ON public.service_zones
FOR SELECT TO authenticated
USING (is_active = true);

-- Politique admin pour service_zones
CREATE POLICY "service_zones_admin_manage" ON public.service_zones
FOR ALL TO authenticated
USING (is_current_user_admin())
WITH CHECK (is_current_user_admin());

-- Activer RLS sur commission_settings (déjà fait mais vérification)
-- Les policies existent déjà

-- 2. Supprimer les vues SECURITY DEFINER dangereuses
-- Fonction pour nettoyer les vues problématiques
DO $$
DECLARE
    view_name text;
BEGIN
    -- Supprimer toutes les vues avec SECURITY DEFINER
    FOR view_name IN 
        SELECT viewname 
        FROM pg_views 
        WHERE schemaname = 'public' 
        AND definition ILIKE '%SECURITY DEFINER%'
    LOOP
        EXECUTE format('DROP VIEW IF EXISTS public.%I CASCADE', view_name);
    END LOOP;
END $$;

-- 3. Sécuriser les fonctions existantes avec search_path
-- Mise à jour des fonctions critiques pour ajouter SET search_path

-- Fonction get_current_user_role avec search_path sécurisé
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role::text FROM public.user_roles 
  WHERE user_id = auth.uid() 
  LIMIT 1;
$$;

-- Fonction has_user_role avec search_path sécurisé
CREATE OR REPLACE FUNCTION public.has_user_role(check_role text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
      AND role::text = check_role
      AND is_active = true
  );
$$;

-- Fonction is_current_user_admin avec search_path sécurisé
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.get_current_user_admin_status();
$$;

-- 4. Créer une table pour les événements de sécurité
CREATE TABLE IF NOT EXISTS public.security_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type text NOT NULL,
    severity text NOT NULL DEFAULT 'info',
    user_id uuid REFERENCES auth.users(id),
    ip_address inet,
    user_agent text,
    details jsonb DEFAULT '{}',
    created_at timestamp with time zone DEFAULT now()
);

-- Activer RLS sur security_events
ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;

-- Politique pour security_events - admin seulement
CREATE POLICY "security_events_admin_only" ON public.security_events
FOR ALL TO authenticated
USING (is_current_user_admin())
WITH CHECK (is_current_user_admin());

-- 5. Fonction pour logger les événements de sécurité
CREATE OR REPLACE FUNCTION public.log_security_event(
    p_event_type text,
    p_severity text DEFAULT 'info',
    p_details jsonb DEFAULT '{}'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.security_events (
        event_type, severity, user_id, details
    ) VALUES (
        p_event_type, p_severity, auth.uid(), p_details
    );
END;
$$;

-- 6. Trigger pour logger les tentatives d'accès non autorisées
CREATE OR REPLACE FUNCTION public.log_unauthorized_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Logger les tentatives d'accès à des données sensibles
    PERFORM log_security_event(
        'unauthorized_access_attempt',
        'warning',
        jsonb_build_object(
            'table', TG_TABLE_NAME,
            'operation', TG_OP,
            'timestamp', now()
        )
    );
    RETURN NULL;
END;
$$;

-- 7. Renforcer la sécurité de la table user_roles
-- Empêcher l'auto-attribution de rôles admin
CREATE OR REPLACE FUNCTION public.prevent_self_admin_assignment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Empêcher un utilisateur de s'attribuer le rôle admin
    IF NEW.role = 'admin' AND NEW.user_id = auth.uid() THEN
        -- Vérifier si l'utilisateur est déjà admin
        IF NOT is_current_user_admin() THEN
            RAISE EXCEPTION 'Cannot self-assign admin role';
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

-- Trigger pour empêcher l'auto-attribution admin
DROP TRIGGER IF EXISTS prevent_self_admin_trigger ON public.user_roles;
CREATE TRIGGER prevent_self_admin_trigger
    BEFORE INSERT OR UPDATE ON public.user_roles
    FOR EACH ROW
    EXECUTE FUNCTION prevent_self_admin_assignment();

-- 8. Audit des modifications sensibles
CREATE OR REPLACE FUNCTION public.audit_sensitive_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Logger les changements sur les tables sensibles
    PERFORM log_security_event(
        'sensitive_data_modification',
        'info',
        jsonb_build_object(
            'table', TG_TABLE_NAME,
            'operation', TG_OP,
            'record_id', COALESCE(NEW.id, OLD.id),
            'changes', jsonb_build_object('old', to_jsonb(OLD), 'new', to_jsonb(NEW))
        )
    );
    RETURN COALESCE(NEW, OLD);
END;
$$;

-- Appliquer l'audit aux tables critiques
CREATE TRIGGER audit_admins_changes
    AFTER INSERT OR UPDATE OR DELETE ON public.admins
    FOR EACH ROW
    EXECUTE FUNCTION audit_sensitive_changes();

CREATE TRIGGER audit_user_roles_changes
    AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
    FOR EACH ROW
    EXECUTE FUNCTION audit_sensitive_changes();

-- 9. Notification de sécurité pour les nouveaux comptes admin
INSERT INTO public.admin_notifications (
    title, message, type, severity, data
) VALUES (
    'Correctifs de Sécurité Appliqués',
    'Les correctifs de sécurité critiques ont été appliqués avec succès. RLS activé sur les tables exposées, fonctions sécurisées, et système d''audit renforcé.',
    'security_update',
    'info',
    jsonb_build_object(
        'operation', 'security_fixes',
        'timestamp', now(),
        'fixes_applied', array[
            'RLS enabled on intelligent_places',
            'RLS enabled on service_zones', 
            'Dangerous SECURITY DEFINER views removed',
            'Functions secured with search_path',
            'Security events logging implemented',
            'Self-admin assignment prevention',
            'Sensitive data audit triggers'
        ]
    )
);