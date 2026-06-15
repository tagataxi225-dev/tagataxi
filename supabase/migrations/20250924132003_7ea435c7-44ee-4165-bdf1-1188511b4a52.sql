-- Nettoyer les vues SECURITY DEFINER dangereuses
-- Cette migration supprime toutes les vues avec SECURITY DEFINER qui peuvent contourner RLS

-- Supprimer les vues problématiques
DO $$
DECLARE
    view_name text;
    view_count integer := 0;
BEGIN
    -- Identifier et supprimer les vues SECURITY DEFINER
    FOR view_name IN 
        SELECT viewname 
        FROM pg_views 
        WHERE schemaname = 'public' 
        AND definition ILIKE '%SECURITY DEFINER%'
    LOOP
        EXECUTE format('DROP VIEW IF EXISTS public.%I CASCADE', view_name);
        view_count := view_count + 1;
        RAISE NOTICE 'Supprimé la vue SECURITY DEFINER: %', view_name;
    END LOOP;
    
    RAISE NOTICE 'Total des vues SECURITY DEFINER supprimées: %', view_count;
END $$;

-- Corriger les fonctions sans search_path configuré
ALTER FUNCTION public.update_places_search_vector() SET search_path = 'public';
ALTER FUNCTION public.maintain_security_compliance() SET search_path = 'public';

-- Log de l'opération de nettoyage sécuritaire
INSERT INTO public.admin_notifications (
    title, message, type, severity, data
) VALUES (
    'Nettoyage sécuritaire terminé',
    'Les vues SECURITY DEFINER dangereuses ont été supprimées et les fonctions sécurisées',
    'security_update',
    'info',
    jsonb_build_object(
        'operation', 'security_cleanup',
        'timestamp', now(),
        'fixed_issues', ARRAY['security_definer_views', 'function_search_path']
    )
);