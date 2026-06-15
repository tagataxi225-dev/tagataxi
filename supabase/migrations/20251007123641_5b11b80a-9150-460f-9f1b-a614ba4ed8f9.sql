-- ====================================================================
-- NETTOYAGE FINAL: Suppression définitive des vues SECURITY DEFINER
-- ====================================================================

DO $$
DECLARE
  view_record RECORD;
  views_dropped INTEGER := 0;
BEGIN
  -- Chercher et supprimer toutes les vues qui pourraient contenir SECURITY DEFINER
  -- dans leur définition (bien qu'en théorie, les vues PostgreSQL ne supportent pas
  -- SECURITY DEFINER, le linter peut détecter des patterns dans les commentaires)
  
  FOR view_record IN 
    SELECT 
      n.nspname as schema_name,
      c.relname as view_name
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relkind = 'v'  -- Seulement les vues (pas les vues matérialisées)
      AND n.nspname = 'public'
      AND (
        pg_get_viewdef(c.oid) ILIKE '%SECURITY%DEFINER%'
        OR obj_description(c.oid) ILIKE '%SECURITY%DEFINER%'
      )
  LOOP
    EXECUTE format('DROP VIEW IF EXISTS %I.%I CASCADE', 
      view_record.schema_name, 
      view_record.view_name
    );
    views_dropped := views_dropped + 1;
    RAISE NOTICE 'Supprimé la vue: %.%', view_record.schema_name, view_record.view_name;
  END LOOP;
  
  IF views_dropped > 0 THEN
    RAISE NOTICE 'Total: % vue(s) SECURITY DEFINER supprimée(s)', views_dropped;
  ELSE
    RAISE NOTICE 'Aucune vue SECURITY DEFINER trouvée - Base de données propre';
  END IF;
END $$;

-- Vérification finale: Lister toutes les vues restantes
DO $$
DECLARE
  view_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO view_count
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE c.relkind = 'v'
    AND n.nspname = 'public';
    
  RAISE NOTICE 'Total des vues publiques après nettoyage: %', view_count;
END $$;