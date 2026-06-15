-- Rechercher et corriger toutes les vues SECURITY DEFINER restantes

-- Identifier toutes les vues avec définition SECURITY DEFINER
DO $$
DECLARE
    view_record RECORD;
    view_definition TEXT;
BEGIN
    -- Parcourir toutes les vues dans le schéma public
    FOR view_record IN 
        SELECT schemaname, viewname 
        FROM pg_views 
        WHERE schemaname = 'public'
    LOOP
        -- Récupérer la définition de la vue
        SELECT definition INTO view_definition
        FROM pg_views 
        WHERE schemaname = view_record.schemaname 
        AND viewname = view_record.viewname;
        
        -- Vérifier si la définition contient SECURITY DEFINER
        IF view_definition ILIKE '%SECURITY DEFINER%' THEN
            RAISE NOTICE 'Vue SECURITY DEFINER trouvée: %.% - Définition: %', 
                view_record.schemaname, view_record.viewname, view_definition;
            
            -- Supprimer la vue problématique
            EXECUTE format('DROP VIEW IF EXISTS %I.%I CASCADE', 
                view_record.schemaname, view_record.viewname);
            
            RAISE NOTICE 'Vue %.% supprimée', view_record.schemaname, view_record.viewname;
        END IF;
    END LOOP;
END $$;

-- Vérification finale : s'assurer qu'aucune vue SECURITY DEFINER ne reste
DO $$
DECLARE
    remaining_count INTEGER := 0;
    view_record RECORD;
BEGIN
    FOR view_record IN 
        SELECT schemaname, viewname, definition
        FROM pg_views 
        WHERE schemaname = 'public' 
        AND definition ILIKE '%SECURITY DEFINER%'
    LOOP
        remaining_count := remaining_count + 1;
        RAISE WARNING 'Vue SECURITY DEFINER encore présente: %.%', 
            view_record.schemaname, view_record.viewname;
    END LOOP;
    
    IF remaining_count = 0 THEN
        RAISE NOTICE 'SUCCESS: Aucune vue SECURITY DEFINER trouvée dans le schéma public';
    ELSE
        RAISE WARNING 'ATTENTION: % vue(s) SECURITY DEFINER encore présente(s)', remaining_count;
    END IF;
END $$;