-- ==========================================
-- 🔍 SCRIPT D'ANALYSE DES SLOW QUERIES
-- ==========================================
-- À exécuter dans Supabase SQL Editor
-- https://supabase.com/dashboard/project/wddlktajnhwhyquwcdgf/sql/new

-- ==========================================
-- 1. ACTIVER pg_stat_statements (si pas déjà fait)
-- ==========================================
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- ==========================================
-- 2. TOP 20 REQUÊTES LES PLUS LENTES
-- ==========================================
SELECT 
  substring(query, 1, 100) AS query_preview,
  calls,
  ROUND(mean_exec_time::numeric, 2) AS avg_time_ms,
  ROUND(total_exec_time::numeric, 2) AS total_time_ms,
  ROUND((100 * total_exec_time / sum(total_exec_time) OVER ())::numeric, 2) AS percentage
FROM pg_stat_statements
WHERE query NOT LIKE '%pg_stat_statements%'
  AND query NOT LIKE '%pg_catalog%'
ORDER BY mean_exec_time DESC
LIMIT 20;

-- ==========================================
-- 3. REQUÊTES AVEC LE PLUS D'APPELS
-- ==========================================
SELECT 
  substring(query, 1, 100) AS query_preview,
  calls,
  ROUND(mean_exec_time::numeric, 2) AS avg_time_ms,
  ROUND(total_exec_time::numeric, 2) AS total_time_ms
FROM pg_stat_statements
WHERE query NOT LIKE '%pg_stat_statements%'
ORDER BY calls DESC
LIMIT 20;

-- ==========================================
-- 4. TABLES LES PLUS ACCÉDÉES
-- ==========================================
SELECT 
  schemaname,
  tablename,
  seq_scan,  -- Nombre de scans séquentiels (mauvais si élevé)
  seq_tup_read,
  idx_scan,  -- Nombre de scans par index (bon si élevé)
  idx_tup_fetch,
  ROUND((100 * idx_scan::numeric / NULLIF(seq_scan + idx_scan, 0))::numeric, 2) AS index_usage_pct
FROM pg_stat_user_tables
ORDER BY seq_tup_read DESC
LIMIT 20;

-- ==========================================
-- 5. INDEXES JAMAIS UTILISÉS (À SUPPRIMER)
-- ==========================================
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan,  -- Nombre d'utilisations (si 0, index inutile)
  pg_size_pretty(pg_relation_size(indexrelid)) AS index_size
FROM pg_stat_user_indexes
WHERE idx_scan = 0
  AND schemaname = 'public'
ORDER BY pg_relation_size(indexrelid) DESC;

-- ==========================================
-- 6. TABLES SANS INDEX (DANGEREUX)
-- ==========================================
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS table_size
FROM pg_stat_user_tables
WHERE schemaname = 'public'
  AND indexname IS NULL
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- ==========================================
-- 7. CACHE HIT RATIO (Doit être > 95%)
-- ==========================================
SELECT 
  'Cache Hit Ratio' AS metric,
  ROUND(
    (sum(heap_blks_hit) / NULLIF(sum(heap_blks_hit) + sum(heap_blks_read), 0) * 100)::numeric, 
    2
  ) AS percentage,
  CASE 
    WHEN (sum(heap_blks_hit) / NULLIF(sum(heap_blks_hit) + sum(heap_blks_read), 0) * 100) < 95 
    THEN '⚠️ MAUVAIS - Augmenter shared_buffers'
    ELSE '✅ BON'
  END AS status
FROM pg_statio_user_tables;

-- ==========================================
-- 8. CONNEXIONS ACTIVES
-- ==========================================
SELECT 
  datname AS database,
  count(*) AS active_connections,
  max(EXTRACT(EPOCH FROM (now() - query_start))) AS longest_query_seconds
FROM pg_stat_activity
WHERE state = 'active'
  AND datname IS NOT NULL
GROUP BY datname;

-- ==========================================
-- 9. TAILLE DES TABLES (Top 20)
-- ==========================================
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS total_size,
  pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) AS table_size,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) AS indexes_size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
LIMIT 20;

-- ==========================================
-- 10. BLOAT ESTIMATION (Tables gonflées)
-- ==========================================
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
  n_dead_tup AS dead_tuples,
  ROUND((n_dead_tup::numeric / NULLIF(n_live_tup + n_dead_tup, 0) * 100)::numeric, 2) AS bloat_pct
FROM pg_stat_user_tables
WHERE n_dead_tup > 1000
ORDER BY n_dead_tup DESC
LIMIT 20;

-- ==========================================
-- 11. RECOMMANDATIONS VACUUM
-- ==========================================
SELECT 
  schemaname,
  tablename,
  last_vacuum,
  last_autovacuum,
  CASE 
    WHEN last_autovacuum < now() - interval '7 days' 
    THEN '⚠️ VACUUM recommandé (> 7 jours)'
    ELSE '✅ OK'
  END AS vacuum_status
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY last_autovacuum ASC NULLS FIRST;

-- ==========================================
-- 12. REQUÊTES EN COURS (Snapshot temps réel)
-- ==========================================
SELECT 
  pid,
  usename,
  application_name,
  state,
  EXTRACT(EPOCH FROM (now() - query_start)) AS query_duration_seconds,
  substring(query, 1, 100) AS query_preview
FROM pg_stat_activity
WHERE state != 'idle'
  AND query NOT LIKE '%pg_stat_activity%'
ORDER BY query_start ASC;

-- ==========================================
-- RÉSUMÉ POUR COPIER/COLLER DANS LOAD_TEST_RESULTS.md
-- ==========================================
SELECT 
  '📊 RÉSUMÉ PERFORMANCE DATABASE' AS title,
  '' AS separator,
  '✅ Cache Hit Ratio: ' || ROUND((sum(heap_blks_hit) / NULLIF(sum(heap_blks_hit) + sum(heap_blks_read), 0) * 100)::numeric, 2) || '%' AS cache_hit,
  '🔌 Connexions actives: ' || (SELECT count(*) FROM pg_stat_activity WHERE state = 'active') AS connections,
  '📦 Tables > 100MB: ' || (SELECT count(*) FROM pg_tables WHERE pg_total_relation_size(schemaname||'.'||tablename) > 100*1024*1024 AND schemaname = 'public') AS large_tables,
  '⚠️ Index inutilisés: ' || (SELECT count(*) FROM pg_stat_user_indexes WHERE idx_scan = 0 AND schemaname = 'public') AS unused_indexes
FROM pg_statio_user_tables;
