# 🔄 Configuration Cron Job Orange Money Retry

## 📝 Vue d'ensemble

Ce guide détaille l'installation et la configuration du système de retry automatique pour les transactions Orange Money bloquées.

**Objectif** : Automatiser la vérification et la résolution des transactions Orange Money en statut `processing` depuis plus de 10 minutes.

**Fréquence recommandée** : Toutes les 5 minutes

---

## 📋 Prérequis

Avant de commencer, assurez-vous que :

1. ✅ **Extensions Supabase** : `pg_cron` et `pg_net` disponibles
2. ✅ **Edge Function** : `orange-money-retry` déployée et fonctionnelle
3. ✅ **Secrets configurés** : `ORANGE_MONEY_API_KEY` et `ORANGE_MERCHANT_ID`
4. ✅ **Droits d'accès** : Accès au SQL Editor de Supabase

---

## 🛠️ Installation pas à pas

### Étape 1 : Vérifier les extensions disponibles

Avant d'activer les extensions, vérifiez qu'elles sont disponibles :

```sql
-- Lister toutes les extensions disponibles
SELECT * FROM pg_available_extensions 
WHERE name IN ('pg_cron', 'pg_net');
```

Si les extensions ne sont pas disponibles, contactez le support Supabase.

### Étape 2 : Activer les extensions

Exécutez ces commandes dans l'éditeur SQL de Supabase :

```sql
-- Activer pg_cron (gestion des tâches planifiées)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Activer pg_net (requêtes HTTP depuis PostgreSQL)
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Vérifier que les extensions sont bien activées
SELECT extname, extversion FROM pg_extension 
WHERE extname IN ('pg_cron', 'pg_net');
```

### Étape 3 : Créer le Cron Job

⚠️ **IMPORTANT** : Remplacez `YOUR_PROJECT_REF` et `YOUR_ANON_KEY` par vos vraies valeurs.

```sql
-- 🔧 Script complet de création du cron job
SELECT cron.schedule(
  'orange-money-retry-job',  -- Nom unique du job
  '*/5 * * * *',              -- Cron expression : toutes les 5 minutes
  $$
  SELECT
    net.http_post(
        url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/orange-money-retry',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer YOUR_ANON_KEY'
        ),
        body := jsonb_build_object(
          'timestamp', now()::text,
          'source', 'cron_job'
        )
    ) as request_id;
  $$
);
```

**Comment trouver vos valeurs** :
- `YOUR_PROJECT_REF` : Visible dans l'URL Supabase (`https://YOUR_PROJECT_REF.supabase.co`)
- `YOUR_ANON_KEY` : Settings → API → Project API keys → `anon` `public`

### Étape 4 : Vérifier l'installation

#### 4.1 Vérifier que le job est créé

```sql
-- Lister tous les jobs cron actifs
SELECT 
  jobid,
  jobname,
  schedule,
  active,
  database
FROM cron.job
WHERE jobname = 'orange-money-retry-job';
```

**Résultat attendu** :
| jobid | jobname | schedule | active | database |
|-------|---------|----------|--------|----------|
| 1 | orange-money-retry-job | */5 * * * * | t | postgres |

#### 4.2 Attendre la première exécution (max 5 minutes)

```sql
-- Voir l'historique des exécutions récentes
SELECT 
  jobid,
  runid,
  start_time,
  end_time,
  status,
  return_message,
  EXTRACT(EPOCH FROM (end_time - start_time)) as duration_seconds
FROM cron.job_run_details 
WHERE jobid = (
  SELECT jobid FROM cron.job WHERE jobname = 'orange-money-retry-job'
)
ORDER BY start_time DESC 
LIMIT 10;
```

**Statuts possibles** :
- ✅ `succeeded` : Exécution réussie
- ❌ `failed` : Échec (vérifier les logs)
- ⏳ `starting` : En cours de démarrage

#### 4.3 Vérifier les logs de la fonction

Allez dans **Supabase Dashboard** → **Edge Functions** → **orange-money-retry** → **Logs**

Recherchez des logs comme :
```
🔄 AUTO-RETRY DELIVERY DISPATCH
⏰ Timestamp: 2025-11-17T08:20:01.177Z
✅ Aucune commande en attente nécessitant un retry
```

---

## ⚙️ Configuration avancée

### Modifier la fréquence

```sql
-- Toutes les 3 minutes
SELECT cron.alter_job('orange-money-retry-job', '*/3 * * * *');

-- Toutes les 10 minutes
SELECT cron.alter_job('orange-money-retry-job', '*/10 * * * *');

-- Toutes les heures
SELECT cron.alter_job('orange-money-retry-job', '0 * * * *');
```

### Désactiver temporairement

```sql
-- Supprimer le job
SELECT cron.unschedule('orange-money-retry-job');
```

### Réactiver

Réexécutez simplement la commande de création (Étape 2).

---

## 📊 Monitoring

### Vérifier les logs du job

```sql
-- Logs des 24 dernières heures
SELECT 
  start_time,
  end_time,
  status,
  return_message
FROM cron.job_run_details 
WHERE jobname = 'orange-money-retry-job'
  AND start_time >= NOW() - INTERVAL '24 hours'
ORDER BY start_time DESC;
```

### Voir les transactions traitées

```sql
-- Transactions expirées par le cron dans les dernières 24h
SELECT 
  transaction_id,
  amount,
  currency,
  created_at,
  updated_at,
  metadata->>'expired_at' as expired_at,
  metadata->>'auto_expired' as auto_expired
FROM payment_transactions
WHERE 
  payment_provider = 'orange'
  AND status = 'failed'
  AND metadata->>'auto_expired' = 'true'
  AND updated_at >= NOW() - INTERVAL '24 hours'
ORDER BY updated_at DESC;
```

---

## 🔍 Fonctionnement détaillé

### Ce que fait le job :

1. **Récupère** les transactions `processing` depuis > 10 minutes
2. **Vérifie** si la transaction a plus de 24h :
   - Si OUI → Marque comme `failed` (expirée)
   - Si NON → Continue à surveiller
3. **Notifie** les utilisateurs des transactions expirées
4. **Log** toutes les actions pour monitoring

### Règles de gestion :

| Âge de la transaction | Action |
|-----------------------|--------|
| < 10 minutes | ✅ Aucune action (normal) |
| 10 minutes - 24h | ⏳ Surveillance active |
| > 24 heures | ❌ Expiration automatique |

---

## 🚨 Alertes et notifications

### Créer une alerte si trop de transactions bloquées

```sql
-- Créer une fonction pour alerter si > 10 transactions en processing
CREATE OR REPLACE FUNCTION alert_stuck_transactions()
RETURNS void AS $$
DECLARE
  stuck_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO stuck_count
  FROM payment_transactions
  WHERE status = 'processing'
    AND payment_provider = 'orange'
    AND created_at < NOW() - INTERVAL '30 minutes';
  
  IF stuck_count > 10 THEN
    -- Insérer notification admin
    INSERT INTO admin_notifications (
      title,
      message,
      severity,
      type,
      data
    ) VALUES (
      '🚨 Alerte Orange Money',
      format('%s transactions Orange Money bloquées depuis > 30 minutes', stuck_count),
      'error',
      'payment_alert',
      json_build_object('count', stuck_count, 'provider', 'orange')
    );
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Programmer l'alerte toutes les heures
SELECT cron.schedule(
  'alert-stuck-orange-transactions',
  '0 * * * *',  -- Toutes les heures
  'SELECT alert_stuck_transactions();'
);
```

---

## 🧪 Tests

### Tester manuellement le job

```sql
-- Appeler directement l'edge function
SELECT
  net.http_post(
      url := 'https://wddlktajnhwhyquwcdgf.supabase.co/functions/v1/orange-money-retry',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndkZGxrdGFqbmh3aHlxdXdjZGdmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQxNDA1NjUsImV4cCI6MjA2OTcxNjU2NX0.rViBegpawtg1sFwafH_fczlB0oeA8E6V3MtDELcSIiU"}'::jsonb,
      body := '{"test": true}'::jsonb
  ) as request_id;
```

### Créer une transaction de test

```sql
-- Insérer une fausse transaction vieille de 25h
INSERT INTO payment_transactions (
  user_id,
  amount,
  currency,
  payment_method,
  payment_provider,
  transaction_id,
  status,
  created_at
) VALUES (
  (SELECT id FROM auth.users LIMIT 1),  -- Prendre un user existant
  1000,
  'CDF',
  'mobile_money',
  'orange',
  'TEST_EXPIRED_' || extract(epoch from now())::text,
  'processing',
  NOW() - INTERVAL '25 hours'  -- Transaction de 25h
);

-- Attendre 5 minutes puis vérifier si elle est passée en 'failed'
```

---

## 📈 Métriques de performance

### Dashboard SQL pour KPIs

```sql
-- Transactions traitées par le cron dans les 7 derniers jours
SELECT 
  DATE(updated_at) as date,
  COUNT(*) as expired_count,
  SUM(amount) as total_amount_expired
FROM payment_transactions
WHERE 
  payment_provider = 'orange'
  AND status = 'failed'
  AND metadata->>'auto_expired' = 'true'
  AND updated_at >= NOW() - INTERVAL '7 days'
GROUP BY DATE(updated_at)
ORDER BY date DESC;
```

---

## 🆘 Troubleshooting

### Le job ne s'exécute pas

**Causes possibles :**
1. Extensions pg_cron ou pg_net non activées
2. Mauvaise URL de l'edge function
3. Token d'autorisation expiré

**Solution :**
```sql
-- Vérifier les extensions
SELECT * FROM pg_extension WHERE extname IN ('pg_cron', 'pg_net');

-- Vérifier les erreurs du job
SELECT * FROM cron.job_run_details 
WHERE jobname = 'orange-money-retry-job'
  AND status = 'failed'
ORDER BY start_time DESC;
```

### Le job s'exécute mais ne traite rien

**Vérifier les logs de l'edge function :**
1. Aller dans Supabase Dashboard → Edge Functions
2. Sélectionner `orange-money-retry`
3. Voir les logs d'exécution

---

## 🔐 Sécurité

### Bonnes pratiques

1. ✅ Utiliser le token `anon` (pas de `service_role` dans pg_cron)
2. ✅ Limiter les permissions de pg_cron
3. ✅ Monitorer les logs régulièrement
4. ✅ Tester en staging avant production

---

## 📚 Ressources

- [Supabase pg_cron docs](https://supabase.com/docs/guides/database/extensions/pg_cron)
- [Cron syntax validator](https://crontab.guru/)
- [pg_net documentation](https://github.com/supabase/pg_net)

---

**🎯 Une fois configuré, le système surveillera automatiquement vos transactions Orange Money 24/7 !**
