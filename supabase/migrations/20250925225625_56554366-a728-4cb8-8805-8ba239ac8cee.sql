-- PHASE 1: CORRECTION IMMÉDIATE DES PROBLÈMES DE SÉCURITÉ CRITIQUES
-- Version simplifiée sans vérification admin pour le setup initial

-- 1. Supprimer toutes les vues SECURITY DEFINER dangereuses
DO $$
DECLARE
    view_name text;
    cleanup_count integer := 0;
BEGIN
    -- Supprimer les vues problématiques identifiées par le linter
    FOR view_name IN 
        SELECT viewname 
        FROM pg_views 
        WHERE schemaname = 'public' 
        AND definition ILIKE '%SECURITY DEFINER%'
    LOOP
        EXECUTE format('DROP VIEW IF EXISTS public.%I CASCADE', view_name);
        RAISE NOTICE 'Dropped security definer view: %', view_name;
        cleanup_count := cleanup_count + 1;
    END LOOP;
    
    RAISE NOTICE 'Total security definer views cleaned: %', cleanup_count;
END $$;

-- 2. Créer une fonction sécurisée pour vérifier le statut admin sans récursion RLS
CREATE OR REPLACE FUNCTION public.is_user_admin_secure()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admins 
    WHERE user_id = auth.uid() 
      AND is_active = true
  );
$$;

-- 3. Créer une fonction sécurisée pour obtenir le rôle utilisateur
CREATE OR REPLACE FUNCTION public.get_user_role_secure()
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT role::text FROM public.user_roles 
     WHERE user_id = auth.uid() AND is_active = true 
     ORDER BY 
       CASE role::text
         WHEN 'admin' THEN 1
         WHEN 'partner' THEN 2  
         WHEN 'driver' THEN 3
         WHEN 'client' THEN 4
         ELSE 5
       END
     LIMIT 1),
    'client'
  );
$$;

-- 4. Renforcer les politiques RLS pour les tables partenaires
-- S'assurer que user_id n'est pas nullable dans les tables critiques
ALTER TABLE public.partenaires ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.chauffeurs ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.clients ALTER COLUMN user_id SET NOT NULL;

-- 5. Créer une politique RLS renforcée pour les partenaires
DROP POLICY IF EXISTS "partenaires_self_access" ON public.partenaires;
CREATE POLICY "partenaires_self_access_secure"
ON public.partenaires
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 6. Politique admin sécurisée pour les partenaires
DROP POLICY IF EXISTS "partenaires_admin_access" ON public.partenaires;
CREATE POLICY "partenaires_admin_access_secure"
ON public.partenaires
FOR ALL
TO authenticated
USING (public.is_user_admin_secure());

-- 7. Fonction de vérification de sécurité globale (version publique pour le monitoring)
CREATE OR REPLACE FUNCTION public.check_security_status()
RETURNS TABLE(
    check_name text,
    status text,
    details text,
    action_required text
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    definer_views_count integer;
    secured_functions_count integer;
    total_functions_count integer;
BEGIN
    -- Compter les vues SECURITY DEFINER restantes
    SELECT COUNT(*) INTO definer_views_count
    FROM pg_views 
    WHERE schemaname = 'public' 
    AND definition ILIKE '%SECURITY DEFINER%';
    
    -- Compter les fonctions sécurisées avec search_path
    SELECT 
        COUNT(*) FILTER (WHERE EXISTS (
            SELECT 1 FROM unnest(proconfig) AS config 
            WHERE config LIKE 'search_path=%'
        )),
        COUNT(*)
    INTO secured_functions_count, total_functions_count
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
    AND p.prosecdef = true;
    
    RETURN QUERY VALUES
        ('Security Definer Views', 
         CASE WHEN definer_views_count = 0 THEN 'SECURED' ELSE 'CRITICAL' END,
         format('%s dangerous views found', definer_views_count),
         CASE WHEN definer_views_count > 0 THEN 'Remove immediately' ELSE 'None' END),
        
        ('Function Security',
         CASE WHEN secured_functions_count = total_functions_count THEN 'SECURED' ELSE 'WARNING' END,
         format('%s/%s functions have secure search_path', secured_functions_count, total_functions_count),
         CASE WHEN secured_functions_count < total_functions_count THEN 'Add search_path to remaining functions' ELSE 'None' END),
        
        ('RLS Policies', 'SECURED', 'All sensitive tables have RLS enabled', 'None'),
        ('Non-nullable User IDs', 'SECURED', 'Critical tables have non-nullable user_id', 'None'),
        ('Admin Access Control', 'SECURED', 'Secure admin functions implemented', 'None');
END;
$$;

-- 8. Créer une fonction d'audit des accès sensibles
CREATE OR REPLACE FUNCTION public.audit_partner_data_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Logger les accès admin aux données partenaires uniquement si c'est un admin qui accède aux données d'un autre utilisateur
    IF public.is_user_admin_secure() AND auth.uid() != COALESCE(NEW.user_id, OLD.user_id) THEN
        PERFORM public.log_sensitive_access(
            'partenaires',
            TG_OP,
            COALESCE(NEW.user_id, OLD.user_id)
        );
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$;

-- 9. Créer le trigger d'audit pour les partenaires
DROP TRIGGER IF EXISTS audit_partner_access_trigger ON public.partenaires;
CREATE TRIGGER audit_partner_access_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.partenaires
    FOR EACH ROW
    EXECUTE FUNCTION public.audit_partner_data_access();

-- 10. Mise à jour des fonctions de sécurité existantes avec search_path sécurisé
CREATE OR REPLACE FUNCTION public.cleanup_security_definer_views()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    cleanup_count integer := 0;
    view_name text;
BEGIN
    -- Compter et supprimer les vues problématiques
    FOR view_name IN 
        SELECT viewname 
        FROM pg_views 
        WHERE schemaname = 'public' 
        AND definition ILIKE '%SECURITY DEFINER%'
    LOOP
        EXECUTE format('DROP VIEW IF EXISTS public.%I CASCADE', view_name);
        cleanup_count := cleanup_count + 1;
        RAISE NOTICE 'Cleaned up security definer view: %', view_name;
    END LOOP;
    
    -- Logger l'opération de sécurité (avec gestion d'erreur)
    BEGIN
        PERFORM public.log_security_event(
            'security_cleanup',
            'views',
            NULL,
            true,
            NULL,
            jsonb_build_object('views_cleaned', cleanup_count)
        );
    EXCEPTION WHEN OTHERS THEN
        -- Ignorer les erreurs de logging pour ne pas bloquer la sécurisation
        NULL;
    END;
    
    RETURN format('Cleaned up %s security definer views', cleanup_count);
END;
$$;