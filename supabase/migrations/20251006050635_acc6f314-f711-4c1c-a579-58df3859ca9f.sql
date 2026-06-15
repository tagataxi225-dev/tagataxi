-- ============================================
-- CRON JOB POUR AUTO-RETRY DELIVERY DISPATCH
-- Relance automatique toutes les 5 minutes
-- ============================================

-- Activer les extensions nécessaires
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Créer le CRON job pour exécuter toutes les 5 minutes
-- (Si existe déjà, sera ignoré)
DO $$
BEGIN
  -- Essayer de supprimer le job s'il existe
  PERFORM cron.unschedule('auto-retry-delivery-dispatch-every-5min');
EXCEPTION
  WHEN OTHERS THEN
    -- Ignorer l'erreur si le job n'existe pas
    NULL;
END $$;

-- Créer le nouveau job
SELECT cron.schedule(
  'auto-retry-delivery-dispatch-every-5min',
  '*/5 * * * *', -- Toutes les 5 minutes
  $$
  SELECT
    net.http_post(
      url:='https://wddlktajnhwhyquwcdgf.supabase.co/functions/v1/auto-retry-delivery-dispatch',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndkZGxrdGFqbmh3aHlxdXdjZGdmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQxNDA1NjUsImV4cCI6MjA2OTcxNjU2NX0.rViBegpawtg1sFwafH_fczlB0oeA8E6V3MtDELcSIiU"}'::jsonb,
      body:=concat('{"timestamp": "', now(), '"}')::jsonb
    ) as request_id;
  $$
);

-- Commentaire pour documentation
COMMENT ON EXTENSION pg_cron IS 'Extension permettant de planifier des tâches récurrentes pour auto-retry des livraisons sans chauffeur';