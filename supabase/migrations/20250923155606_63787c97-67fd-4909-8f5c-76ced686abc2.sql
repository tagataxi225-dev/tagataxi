-- Recherche et correction complète des vues SECURITY DEFINER

-- D'abord, lister toutes les vues pour diagnostic
DO $$
DECLARE
    view_record RECORD;
BEGIN
    RAISE NOTICE '=== DIAGNOSTIC COMPLET DES VUES ===';
    
    FOR view_record IN 
        SELECT 
            schemaname, 
            viewname, 
            definition,
            CASE WHEN definition ILIKE '%SECURITY DEFINER%' THEN 'OUI' ELSE 'NON' END as has_security_definer
        FROM pg_views 
        WHERE schemaname = 'public'
        ORDER BY viewname
    LOOP
        RAISE NOTICE 'Vue: %.% | SECURITY DEFINER: % | Définition: %', 
            view_record.schemaname, 
            view_record.viewname, 
            view_record.has_security_definer,
            SUBSTRING(view_record.definition FROM 1 FOR 100) || '...';
    END LOOP;
END $$;

-- Forcer la suppression de toutes les vues potentiellement problématiques
DROP VIEW IF EXISTS public.driver_online_status CASCADE;

-- Rechercher dans pg_views avec une approche différente
DO $$
DECLARE
    view_rec RECORD;
    view_def TEXT;
BEGIN
    RAISE NOTICE '=== RECHERCHE DÉTAILLÉE SECURITY DEFINER ===';
    
    -- Vérifier chaque vue individuellement
    FOR view_rec IN (
        SELECT viewname 
        FROM pg_views 
        WHERE schemaname = 'public'
    ) LOOP
        -- Récupérer la définition complète
        SELECT pg_get_viewdef(('public.' || view_rec.viewname)::regclass, true) INTO view_def;
        
        IF view_def ILIKE '%SECURITY DEFINER%' THEN
            RAISE NOTICE 'FOUND: Vue % contient SECURITY DEFINER', view_rec.viewname;
            RAISE NOTICE 'Définition: %', view_def;
            
            -- Supprimer la vue
            EXECUTE 'DROP VIEW IF EXISTS public.' || quote_ident(view_rec.viewname) || ' CASCADE';
            RAISE NOTICE 'Vue % supprimée', view_rec.viewname;
        END IF;
    END LOOP;
END $$;

-- Vérification finale absolue
DO $$
DECLARE
    final_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO final_count
    FROM pg_views 
    WHERE schemaname = 'public' 
    AND (definition ILIKE '%SECURITY DEFINER%' OR pg_get_viewdef((schemaname || '.' || viewname)::regclass, true) ILIKE '%SECURITY DEFINER%');
    
    IF final_count = 0 THEN
        RAISE NOTICE '✅ SUCCESS: Toutes les vues SECURITY DEFINER ont été supprimées';
    ELSE
        RAISE WARNING '❌ ATTENTION: % vue(s) SECURITY DEFINER encore détectée(s)', final_count;
    END IF;
END $$;