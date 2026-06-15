-- ==========================================
-- SUPPRIMER LE CRON JOB PROBLÉMATIQUE
-- ==========================================

-- Utiliser cron.unschedule qui a les bonnes permissions
SELECT cron.unschedule(2); -- jobid du cron job admin_dashboard_stats

-- Vérifier que le job est bien supprimé
SELECT jobid, jobname FROM cron.job WHERE jobid = 2;