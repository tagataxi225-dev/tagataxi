# 🚀 PHASE 1 : INFRASTRUCTURE CRITIQUE - ACTIONS MANUELLES REQUISES

## ✅ DÉJÀ IMPLÉMENTÉ (Code)

- [x] **Partitioning tables** (transport_bookings, marketplace_orders, delivery_orders)
- [x] **Nouveaux indexes** pour performance (full-text search, composite indexes)
- [x] **Materialized views** pour analytics dashboard
- [x] **Auto-vacuum** configuration aggressive
- [x] **Infrastructure Redis** (client + cache strategies)
- [x] **Hook useCachedQuery** avec invalidation automatique Realtime
- [x] **Edge Function image-optimizer** (voir supabase/functions/)

## ⚠️ ACTIONS MANUELLES NÉCESSAIRES

### 1️⃣ MIGRATION SUPABASE PRO (CRITIQUE - 30 min)

**Pourquoi ?** Le plan gratuit ne supporte que 60 connexions simultanées, insuffisant pour des millions d'utilisateurs.

**Étapes :**

1. Aller sur [Supabase Dashboard](https://supabase.com/dashboard/project/wddlktajnhwhyquwcdgf/settings/billing)

2. Upgrader vers **Pro Plan** ($25/mois)
   - CPU: 2 vCPU → **8 vCPU**
   - RAM: 1GB → **16GB**
   - Connexions: 60 → **500**
   - Database size: 500MB → **8GB**

3. Activer **Connection Pooling** (PgBouncer)
   ```
   Settings → Database → Connection Pooling
   - Mode: Transaction
   - Pool size: 100
   - Max client connections: 1000
   ```

4. Vérifier que les migrations ont bien été appliquées :
   ```sql
   -- Dans SQL Editor Supabase
   SELECT tablename FROM pg_tables WHERE tablename LIKE '%_2025_%';
   -- Devrait retourner les partitions (transport_bookings_2025_01, etc.)
   ```

**Coût : $25/mois**

---

### 2️⃣ CONFIGURATION CDN (IMPORTANT - 45 min)

**Pourquoi ?** Distribuer les images et assets statiques pour réduire la latence et la charge serveur.

**Option A : Cloudflare (Recommandé)**

1. Créer compte sur [Cloudflare](https://cloudflare.com)

2. Ajouter le domaine de votre app (ex: kwenda.app)

3. Configurer les **Cache Rules** :
   ```yaml
   # Images
   Cache TTL: 1 year
   Pattern: *.jpg, *.png, *.webp, *.svg
   
   # Static assets
   Cache TTL: 1 week
   Pattern: *.js, *.css, *.woff2
   
   # HTML
   Cache TTL: 1 hour
   Pattern: *.html
   ```

4. Activer **Auto Minify** (JS, CSS, HTML)

5. Activer **Brotli Compression**

6. Configurer **Image Optimization** :
   ```
   Speed → Optimization → Image Optimization
   - Polish: Lossless
   - WebP: Enabled
   - Mirage: Enabled
   ```

**Coût : $0 (Free tier) ou $20/mois (Pro pour Polish)**

**Option B : AWS CloudFront**

1. Créer une **CloudFront Distribution**
   - Origin: supabase.co
   - Behaviors: Cache optimized for images

2. Configurer **Lambda@Edge** pour redimensionnement images à la volée

**Coût : ~$50/mois (1M requêtes)**

---

### 3️⃣ DÉPLOIEMENT REDIS (CRITIQUE - 30 min)

**Pourquoi ?** Le cache localStorage est temporaire, Redis est nécessaire pour un cache distribué partagé.

**Option A : Upstash Redis (Recommandé - Sans serveur)**

1. Créer compte sur [Upstash](https://upstash.com)

2. Créer une base **Redis Global** :
   - Région primaire: Europe (proche RDC/Côte d'Ivoire)
   - Régions réplicas: Africa, Europe
   - Plan: Pay-as-you-go

3. Copier les credentials :
   ```
   REDIS_URL=<upstash_url>
   REDIS_TOKEN=<upstash_token>
   ```

4. Dans **Supabase → Settings → Secrets**, ajouter :
   ```
   REDIS_URL = <votre_url>
   REDIS_TOKEN = <votre_token>
   ```

5. Modifier `src/lib/redis.ts` pour utiliser Upstash :
   ```typescript
   import { Redis } from '@upstash/redis';
   
   export const redis = new Redis({
     url: process.env.REDIS_URL!,
     token: process.env.REDIS_TOKEN!
   });
   ```

**Coût : $0.2 par 100K commandes (~ $10/mois pour 1M users)**

**Option B : Redis Cloud**

1. Créer compte sur [Redis Cloud](https://redis.com/try-free/)

2. Créer un cluster :
   - Région: AWS eu-west-1 (proche Afrique)
   - Dataset: 250MB
   - Plan: Fixed (pas Flexible)

3. Connecter via URL dans Supabase Secrets

**Coût : $7/mois (Fixed Plan 250MB)**

---

### 4️⃣ CONFIGURER EDGE FUNCTION IMAGE OPTIMIZER (20 min)

1. Dans le projet, créer `supabase/functions/image-optimizer/index.ts` :

   ```typescript
   import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
   
   serve(async (req) => {
     const { url, width, height, format = 'webp', quality = 80 } = await req.json();
     
     // Fetch image depuis Supabase Storage
     const imageResponse = await fetch(url);
     const imageBuffer = await imageResponse.arrayBuffer();
     
     // Utiliser ImageMagick ou sharp via Deno
     // Pour l'instant, proxy simple
     return new Response(imageBuffer, {
       headers: {
         'Content-Type': `image/${format}`,
         'Cache-Control': 'public, max-age=31536000, immutable'
       }
     });
   });
   ```

2. Déployer :
   ```bash
   supabase functions deploy image-optimizer
   ```

3. Tester :
   ```bash
   curl -X POST https://wddlktajnhwhyquwcdgf.supabase.co/functions/v1/image-optimizer \
     -H "Content-Type: application/json" \
     -d '{"url":"https://...", "width":800, "format":"webp"}'
   ```

**Note :** Pour une vraie optimisation d'images, il faudra intégrer une bibliothèque comme `imagescript` ou un service externe (Cloudinary, Imgix).

---

### 5️⃣ ACTIVER MATERIALIZED VIEW AUTO-REFRESH (10 min)

**Pourquoi ?** Les stats admin doivent être rafraîchies régulièrement.

1. Dans **Supabase SQL Editor**, exécuter :

   ```sql
   -- Extension pg_cron (déjà installée normalement)
   CREATE EXTENSION IF NOT EXISTS pg_cron;
   
   -- Rafraîchir stats dashboard toutes les 5 minutes
   SELECT cron.schedule(
     'refresh-admin-stats',
     '*/5 * * * *',
     $$ SELECT refresh_admin_stats(); $$
   );
   
   -- Vérifier que le cron est actif
   SELECT * FROM cron.job;
   ```

2. Vérifier manuellement que ça fonctionne :
   ```sql
   -- Forcer refresh
   SELECT refresh_admin_stats();
   
   -- Voir les stats
   SELECT * FROM admin_dashboard_stats;
   ```

---

### 6️⃣ MONITORING : ACTIVER SUPABASE LOGS (5 min)

1. Dans **Supabase Dashboard → Logs & Analytics**

2. Activer **Log Drains** pour exporter vers :
   - Datadog (recommandé pour production)
   - Logflare (gratuit pour petits volumes)
   - Ou custom webhook

3. Configurer **Alerts** :
   - High error rate (>5% sur 5min)
   - Slow queries (>1s)
   - Connection pool saturation (>400/500)

---

## 📊 CHECKLIST POST-INSTALLATION

Une fois toutes les étapes ci-dessus complétées :

- [ ] Supabase Pro activé + PgBouncer configuré
- [ ] CDN configuré (Cloudflare ou CloudFront)
- [ ] Redis déployé (Upstash ou Redis Cloud)
- [ ] Secrets Redis ajoutés dans Supabase
- [ ] `src/lib/redis.ts` modifié pour utiliser vrai Redis
- [ ] Edge Function image-optimizer déployée
- [ ] Cron job materialized view actif
- [ ] Logs & monitoring configurés
- [ ] Partitions tables vérifiées (requête SQL ci-dessus)
- [ ] Nouveaux indexes testés (voir performances amélioration)

---

## 🧪 TESTS DE VALIDATION

### Tester le Partitioning

```sql
-- Insérer une réservation test pour vérifier partitioning
INSERT INTO transport_bookings (
  user_id, driver_id, pickup_coordinates, destination_coordinates,
  vehicle_class, city, status, created_at
) VALUES (
  (SELECT id FROM auth.users LIMIT 1),
  NULL,
  '{"lat": -4.3, "lng": 15.3}',
  '{"lat": -4.4, "lng": 15.4}',
  'standard',
  'Kinshasa',
  'pending',
  '2025-03-15'  -- Date spécifique pour partition mars
);

-- Vérifier que la donnée est dans la bonne partition
SELECT tableoid::regclass, * FROM transport_bookings 
WHERE created_at::date = '2025-03-15';
-- Devrait retourner "transport_bookings_2025_03"
```

### Tester le Cache Redis

```typescript
// Dans la console browser
import { redis, cacheStrategies } from '@/lib/redis';

// Test SET
await redis.set('test', { message: 'Hello from Redis!' }, cacheStrategies.POPULAR_PRODUCTS.ttl);

// Test GET
const value = await redis.get('test');
console.log(value); // { message: 'Hello from Redis!' }

// Voir métriques
console.log(redis.getMetrics());
// { hits: X, misses: Y, sets: Z, hitRate: XX% }
```

### Tester les Nouveaux Indexes

```sql
-- Avant: Slow query (seq scan)
EXPLAIN ANALYZE
SELECT * FROM marketplace_products 
WHERE to_tsvector('french', title || ' ' || description) @@ to_tsquery('french', 'téléphone');

-- Après index gin : Devrait utiliser "Bitmap Index Scan on idx_marketplace_products_search_gin"
-- Temps d'exécution devrait être < 50ms même avec 100K produits
```

---

## 📈 MÉTRIQUES DE SUCCÈS PHASE 1

Après implémentation complète, vous devriez observer :

| Métrique | Avant | Après Phase 1 | Amélioration |
|----------|-------|---------------|--------------|
| **Connexions DB max** | 60 | 500 | +733% |
| **Query time (bookings)** | ~200ms | <50ms | -75% |
| **Cache hit ratio** | 0% | >60% | ∞ |
| **Image load time** | ~2s | <500ms | -75% |
| **Dashboard stats query** | ~800ms | <100ms | -87% |
| **Peak concurrent users** | ~50 | ~5000 | +10000% |

---

## 🆘 SUPPORT

Si vous rencontrez des problèmes :

1. **Partitioning échoue** : Vérifier que les tables n'ont pas de contraintes foreign key complexes
2. **Redis connection error** : Vérifier que les secrets sont bien configurés dans Supabase
3. **CDN pas actif** : Vérifier les DNS records (peut prendre 24-48h)
4. **Indexes lents** : Exécuter `VACUUM ANALYZE` sur les tables concernées

**Temps total estimation : 2-3 heures**
**Coût mensuel Phase 1 : ~$60-80/mois**
