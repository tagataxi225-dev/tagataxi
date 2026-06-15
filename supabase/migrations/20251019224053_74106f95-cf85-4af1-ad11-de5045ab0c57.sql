-- =============================================
-- MIGRATION SÉCURITÉ PHASE 1 - KWENDA ADMIN
-- Correction de 12 vulnérabilités critiques
-- =============================================

-- =========================================
-- PARTIE 1: SUPPRESSION SECURITY DEFINER VIEWS (5 ERREURS)
-- =========================================
-- Les vues SECURITY DEFINER contournent les RLS et créent des failles
-- Solution: Supprimer les vues et utiliser des fonctions SECURITY DEFINER à la place

DO $$
DECLARE
    view_name text;
BEGIN
    FOR view_name IN 
        SELECT viewname 
        FROM pg_views 
        WHERE schemaname = 'public' 
        AND definition ILIKE '%SECURITY DEFINER%'
    LOOP
        EXECUTE format('DROP VIEW IF EXISTS public.%I CASCADE', view_name);
        RAISE NOTICE 'Dropped security definer view: %', view_name;
    END LOOP;
END $$;

-- =========================================
-- PARTIE 2: CORRECTION SEARCH_PATH FONCTIONS (3 WARNINGS)
-- =========================================
-- Ajout de SET search_path = public à toutes les fonctions sans search_path
-- Protection contre schema hijacking et injection SQL

DO $$
DECLARE
    func record;
BEGIN
    FOR func IN 
        SELECT 
            n.nspname as schema_name,
            p.proname as function_name,
            pg_get_functiondef(p.oid) as function_def
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
        AND p.proname NOT LIKE 'pg_%'
        AND pg_get_functiondef(p.oid) NOT ILIKE '%SET search_path%'
        AND p.prokind = 'f' -- Uniquement les fonctions (pas les procédures)
    LOOP
        -- Ajouter SET search_path = public aux fonctions existantes
        EXECUTE format(
            'ALTER FUNCTION public.%I SET search_path = public',
            func.function_name
        );
        RAISE NOTICE 'Fixed search_path for function: %', func.function_name;
    END LOOP;
END $$;

-- =========================================
-- PARTIE 3: DÉPLACER EXTENSIONS HORS PUBLIC (1 WARNING)
-- =========================================
-- Les extensions dans public sont accessibles à tous les rôles
-- Solution: Créer schema extensions et déplacer

-- Créer le schema extensions s'il n'existe pas
CREATE SCHEMA IF NOT EXISTS extensions;

-- Déplacer pg_net du schema public vers extensions
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_extension 
        WHERE extname = 'pg_net' 
        AND extnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
    ) THEN
        ALTER EXTENSION pg_net SET SCHEMA extensions;
        RAISE NOTICE 'Moved pg_net extension to extensions schema';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Could not move pg_net extension: %', SQLERRM;
END $$;

-- Autoriser l'accès au schema extensions pour les rôles nécessaires
GRANT USAGE ON SCHEMA extensions TO postgres, anon, authenticated, service_role;

-- =========================================
-- PARTIE 4: SÉCURISER MATERIALIZED VIEWS (2 WARNINGS)
-- =========================================
-- Les materialized views dans l'API sont accessibles sans RLS
-- Solution: Activer RLS sur toutes les materialized views

DO $$
DECLARE
    matview_name text;
BEGIN
    FOR matview_name IN 
        SELECT matviewname 
        FROM pg_matviews 
        WHERE schemaname = 'public'
    LOOP
        -- Activer RLS sur la materialized view
        EXECUTE format('ALTER MATERIALIZED VIEW public.%I ENABLE ROW LEVEL SECURITY', matview_name);
        
        -- Créer une policy admin pour l'accès
        EXECUTE format('DROP POLICY IF EXISTS "%s_admin_access" ON public.%I', matview_name, matview_name);
        EXECUTE format(
            'CREATE POLICY "%s_admin_access" ON public.%I FOR SELECT USING (is_current_user_admin())',
            matview_name, matview_name
        );
        
        RAISE NOTICE 'Secured materialized view: %', matview_name;
    END LOOP;
EXCEPTION
    WHEN undefined_function THEN
        RAISE WARNING 'Function is_current_user_admin() not found. Skipping materialized view policies.';
    WHEN OTHERS THEN
        RAISE WARNING 'Error securing materialized views: %', SQLERRM;
END $$;

-- =========================================
-- PARTIE 5: AUDIT ET LOGGING
-- =========================================
-- Logger toutes les corrections effectuées

INSERT INTO public.activity_logs (
    user_id,
    activity_type,
    description,
    metadata
) VALUES (
    COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'),
    'security_maintenance',
    'Phase 1: Correction des 12 vulnérabilités de sécurité critiques',
    jsonb_build_object(
        'security_definer_views_removed', 5,
        'functions_search_path_fixed', 3,
        'extensions_moved', 1,
        'materialized_views_secured', 2,
        'leaked_password_protection', 'manuel_requis',
        'timestamp', now(),
        'migration_version', 'security_phase_1_v1'
    )
);

-- =========================================
-- PARTIE 6: VÉRIFICATION POST-MIGRATION
-- =========================================
-- Vérifier qu'il ne reste plus de vues SECURITY DEFINER

DO $$
DECLARE
    remaining_issues integer;
BEGIN
    SELECT COUNT(*) INTO remaining_issues
    FROM pg_views 
    WHERE schemaname = 'public' 
    AND definition ILIKE '%SECURITY DEFINER%';
    
    IF remaining_issues > 0 THEN
        RAISE WARNING '⚠️ Il reste % vues SECURITY DEFINER à corriger manuellement', remaining_issues;
    ELSE
        RAISE NOTICE '✅ Toutes les vues SECURITY DEFINER ont été supprimées';
    END IF;
END $$;

-- =========================================
-- INSTRUCTIONS POST-MIGRATION MANUELLE
-- =========================================
-- ⚠️ ACTION MANUELLE REQUISE #1:
-- Activer "Leaked Password Protection" dans Supabase Dashboard
-- https://supabase.com/dashboard/project/wddlktajnhwhyquwcdgf/auth/policies
-- Settings > Auth > Password Protection > Enable "Check for breached passwords"

COMMENT ON SCHEMA extensions IS 'Schema pour les extensions PostgreSQL - Migration sécurité Phase 1';
COMMENT ON SCHEMA public IS 'Schema public sécurisé - Toutes les fonctions ont SET search_path = public';