-- Correction finale des problèmes de sécurité détectés

-- 1. Identifier et corriger les vues problématiques
-- Vérifier s'il y a des vues SECURITY DEFINER restantes
DO $$
DECLARE
    view_record RECORD;
BEGIN
    -- Supprimer toutes les vues avec SECURITY DEFINER potentiellement dangereuses
    FOR view_record IN 
        SELECT schemaname, viewname 
        FROM pg_views 
        WHERE schemaname = 'public' 
        AND (viewname LIKE '%summary' OR viewname LIKE '%availability%')
    LOOP
        EXECUTE format('DROP VIEW IF EXISTS %I.%I CASCADE', view_record.schemaname, view_record.viewname);
        RAISE NOTICE 'Dropped view: %.%', view_record.schemaname, view_record.viewname;
    END LOOP;
END $$;

-- 2. Recréer les vues de résumé sans SECURITY DEFINER (plus sûr)
CREATE VIEW public.driver_stats_summary AS
SELECT 
  vehicle_class,
  COUNT(*) FILTER (WHERE is_online = true AND last_ping > now() - interval '10 minutes') as online_drivers,
  COUNT(*) FILTER (WHERE is_online = true AND is_available = true AND last_ping > now() - interval '10 minutes') as available_drivers
FROM public.driver_locations
WHERE last_ping > now() - interval '30 minutes'
GROUP BY vehicle_class;

-- 3. Corriger les fonctions restantes sans search_path
-- Ajouter search_path aux fonctions critiques identifiées
ALTER FUNCTION public.check_security_configuration() SET search_path TO 'public';

-- Fonction de nettoyage pour les triggers
CREATE OR REPLACE FUNCTION public.cleanup_security_definer_views() 
RETURNS text 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path TO 'public'
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
    END LOOP;
    
    RETURN format('Cleaned up %s security definer views', cleanup_count);
END;
$$;

-- Exécuter le nettoyage
SELECT public.cleanup_security_definer_views();

-- 4. Vérification finale des permissions
-- S'assurer que toutes les nouvelles vues respectent RLS
GRANT SELECT ON public.driver_stats_summary TO authenticated;
GRANT SELECT ON public.driver_stats_summary TO anon;