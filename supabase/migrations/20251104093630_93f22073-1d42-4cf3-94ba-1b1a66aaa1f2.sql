-- Activer la réplication complète pour unified_notifications (si elle existe)
DO $$ 
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'unified_notifications'
  ) THEN
    ALTER TABLE unified_notifications REPLICA IDENTITY FULL;
  END IF;
END $$;

-- Ajouter unified_notifications à la publication realtime (si elle n'est pas déjà présente)
DO $$ 
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'unified_notifications'
  ) AND NOT EXISTS (
    SELECT FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'unified_notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE unified_notifications;
  END IF;
END $$;