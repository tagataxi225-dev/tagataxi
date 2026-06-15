-- ==========================================
-- FIX ERREURS CRITIQUES (avec permissions correctes)
-- ==========================================

-- ERREUR 2: Vérifier et corriger system_notifications.read -> is_read
DO $$
BEGIN
  -- Si system_notifications existe avec colonne 'read', la renommer
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public'
      AND table_name = 'system_notifications' 
      AND column_name = 'read'
  ) THEN
    ALTER TABLE public.system_notifications RENAME COLUMN "read" TO is_read;
    RAISE NOTICE '✅ Colonne system_notifications.read renommée en is_read';
  ELSE
    RAISE NOTICE 'ℹ️ system_notifications.read n''existe pas ou est déjà is_read';
  END IF;
END $$;

-- ERREUR 3: Investiguer vendor_notifications
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'vendor_notifications') THEN
    RAISE NOTICE '⚠️ Table vendor_notifications existe encore - peut causer des erreurs';
    RAISE NOTICE 'ℹ️ Utiliser vendor_product_notifications à la place';
  ELSE
    RAISE NOTICE '✅ vendor_notifications n''existe pas (OK)';
  END IF;
END $$;

-- Lister tous les cron jobs pour les voir
SELECT 
  jobid, 
  jobname, 
  schedule, 
  command
FROM cron.job;