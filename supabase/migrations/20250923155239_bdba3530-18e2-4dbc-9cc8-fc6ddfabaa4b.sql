-- Phase 2: Nettoyer la dernière vue SECURITY DEFINER

-- Identifier et supprimer toutes les vues SECURITY DEFINER dangereuses
DROP VIEW IF EXISTS public.driver_online_status CASCADE;

-- Recréer la vue driver_online_status sans SECURITY DEFINER
CREATE VIEW public.driver_online_status AS
SELECT 
  COALESCE(dl.vehicle_class, 'standard') as vehicle_class,
  COUNT(CASE WHEN dl.is_online = true AND dl.last_ping > now() - interval '10 minutes' THEN 1 END) as online_drivers,
  COUNT(*) as total_drivers
FROM public.driver_locations dl
JOIN public.chauffeurs c ON dl.driver_id = c.user_id
WHERE c.is_active = true
GROUP BY COALESCE(dl.vehicle_class, 'standard');

-- Accorder les permissions appropriées
GRANT SELECT ON public.driver_online_status TO authenticated;
GRANT SELECT ON public.driver_online_status TO anon;

-- Vérifier qu'aucune autre vue SECURITY DEFINER n'existe
-- Cette requête listera toutes les vues restantes pour vérification
DO $$
DECLARE
    view_record RECORD;
    view_count INTEGER := 0;
BEGIN
    FOR view_record IN 
        SELECT schemaname, viewname 
        FROM pg_views 
        WHERE schemaname = 'public'
    LOOP
        view_count := view_count + 1;
        RAISE NOTICE 'Vue trouvée: %.%', view_record.schemaname, view_record.viewname;
    END LOOP;
    
    RAISE NOTICE 'Total vues dans le schéma public: %', view_count;
END $$;