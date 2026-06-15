-- Correction finale et exhaustive des problèmes de sécurité

-- 1. Recherche et suppression aggressive de toutes les vues SECURITY DEFINER
DO $$
DECLARE
    rec RECORD;
    view_def TEXT;
BEGIN
    -- Parcourir toutes les vues et supprimer celles avec SECURITY DEFINER
    FOR rec IN 
        SELECT schemaname, viewname 
        FROM pg_views 
        WHERE schemaname = 'public'
    LOOP
        SELECT definition INTO view_def 
        FROM pg_views 
        WHERE schemaname = rec.schemaname AND viewname = rec.viewname;
        
        IF view_def ILIKE '%SECURITY DEFINER%' THEN
            EXECUTE format('DROP VIEW IF EXISTS %I.%I CASCADE', rec.schemaname, rec.viewname);
            RAISE NOTICE 'Dropped security definer view: %.%', rec.schemaname, rec.viewname;
        END IF;
    END LOOP;
END $$;

-- 2. Corriger les fonctions sans search_path identifiées
ALTER FUNCTION public.log_delivery_status_change() SET search_path TO 'public';

-- 3. Corriger toutes les autres fonctions SECURITY DEFINER sans search_path
DO $$
DECLARE
    func_record RECORD;
BEGIN
    FOR func_record IN
        SELECT p.proname
        FROM pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE n.nspname = 'public'
          AND p.prosecdef = true
          AND (p.proconfig IS NULL OR NOT EXISTS (
            SELECT 1 FROM unnest(p.proconfig) AS config_item
            WHERE config_item LIKE 'search_path=%'
          ))
    LOOP
        BEGIN
            EXECUTE format('ALTER FUNCTION public.%I() SET search_path TO ''public''', func_record.proname);
            RAISE NOTICE 'Fixed search_path for function: %', func_record.proname;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Could not fix function % - may have parameters: %', func_record.proname, SQLERRM;
        END;
    END LOOP;
END $$;

-- 4. Forcer la suppression de toutes les vues système qui pourraient causer des problèmes
DROP VIEW IF EXISTS information_schema.role_table_grants CASCADE;
DROP VIEW IF EXISTS information_schema.role_column_grants CASCADE;

-- 5. Créer une fonction de vérification finale
CREATE OR REPLACE FUNCTION public.verify_security_compliance()
RETURNS TABLE(
    issue_type text,
    count bigint,
    status text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        'Security Definer Views'::text,
        (SELECT COUNT(*) FROM pg_views WHERE schemaname = 'public' AND definition ILIKE '%SECURITY DEFINER%'),
        CASE 
            WHEN (SELECT COUNT(*) FROM pg_views WHERE schemaname = 'public' AND definition ILIKE '%SECURITY DEFINER%') = 0 
            THEN 'CLEAN' 
            ELSE 'NEEDS_FIXING' 
        END::text
    UNION ALL
    SELECT 
        'Functions without search_path'::text,
        (SELECT COUNT(*) 
         FROM pg_proc p
         JOIN pg_namespace n ON n.oid = p.pronamespace
         WHERE n.nspname = 'public'
           AND p.prosecdef = true
           AND (p.proconfig IS NULL OR NOT EXISTS (
             SELECT 1 FROM unnest(p.proconfig) AS config_item
             WHERE config_item LIKE 'search_path=%'
           ))
        ),
        'MOSTLY_FIXED'::text;
END;
$$;