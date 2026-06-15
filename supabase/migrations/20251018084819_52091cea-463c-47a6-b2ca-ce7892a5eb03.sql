-- ========================================
-- PHASE 2 & 4: CRON JOBS & AUTOMATED TASKS (CORRIGÉ)
-- ========================================

-- Extension pg_cron pour tâches planifiées
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 1. RAFRAÎCHIR MATERIALIZED VIEWS (toutes les 5 min)
SELECT cron.schedule(
  'refresh-admin-stats',
  '*/5 * * * *',
  $cron$
    REFRESH MATERIALIZED VIEW CONCURRENTLY admin_dashboard_stats;
  $cron$
);

-- 2. NETTOYER ANCIENNES LOCALISATIONS CHAUFFEURS (chaque nuit à 2h)
SELECT cron.schedule(
  'cleanup-old-driver-locations',
  '0 2 * * *',
  $cron$
    DELETE FROM driver_locations 
    WHERE last_ping < NOW() - INTERVAL '7 days';
  $cron$
);

-- 3. EXPIRER PROMOTIONS AUTOMATIQUEMENT (toutes les heures)
SELECT cron.schedule(
  'expire-promos',
  '0 * * * *',
  $cron$
    UPDATE promo_codes 
    SET is_active = false 
    WHERE valid_until < NOW() 
      AND is_active = true;
  $cron$
);

-- 4. AUTO-CANCEL RÉSERVATIONS EXPIRÉES (toutes les 2 min)
SELECT cron.schedule(
  'cancel-expired-bookings',
  '*/2 * * * *',
  $cron$
    UPDATE transport_bookings 
    SET 
      status = 'cancelled', 
      cancellation_reason = 'Auto-annulé: aucun chauffeur trouvé dans le délai',
      cancelled_at = NOW(),
      cancellation_type = 'automatic'
    WHERE status = 'pending' 
      AND created_at < NOW() - INTERVAL '30 minutes';
  $cron$
);

-- 5. AUTO-CANCEL LIVRAISONS EXPIRÉES (toutes les 5 min)
SELECT cron.schedule(
  'cancel-expired-deliveries',
  '*/5 * * * *',
  $cron$
    UPDATE delivery_orders 
    SET 
      status = 'cancelled', 
      cancellation_reason = 'Auto-annulé: aucun livreur trouvé dans le délai',
      cancelled_at = NOW(),
      cancellation_type = 'automatic'
    WHERE status = 'pending' 
      AND created_at < NOW() - INTERVAL '1 hour';
  $cron$
);

-- 6. NETTOYER CACHE EXPIRÉ (toutes les heures)
SELECT cron.schedule(
  'cleanup-expired-cache',
  '0 * * * *',
  $cron$
    DELETE FROM delivery_location_access_logs 
    WHERE created_at < NOW() - INTERVAL '90 days';
    
    DELETE FROM admin_access_logs 
    WHERE created_at < NOW() - INTERVAL '1 year';
  $cron$
);

-- 7. RÉINITIALISER LIMITES QUOTIDIENNES LOTERIE (minuit)
SELECT cron.schedule(
  'reset-lottery-daily-limits',
  '0 0 * * *',
  $cron$
    SELECT reset_daily_lottery_limits();
  $cron$
);

-- 8. MONITORING ÉVÉNEMENTS DE SÉCURITÉ (toutes les 10 min)
SELECT cron.schedule(
  'monitor-security',
  '*/10 * * * *',
  $cron$
    SELECT monitor_security_events();
  $cron$
);

-- 9. VACUUM ANALYZE AUTOMATIQUE SUR TABLES VOLUMINEUSES (chaque nuit à 3h)
SELECT cron.schedule(
  'vacuum-high-volume-tables',
  '0 3 * * *',
  $cron$
    VACUUM ANALYZE transport_bookings;
    VACUUM ANALYZE marketplace_orders;
    VACUUM ANALYZE delivery_orders;
    VACUUM ANALYZE driver_locations;
    VACUUM ANALYZE wallet_transactions;
  $cron$
);