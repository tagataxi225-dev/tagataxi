# 🚗 Système de Dispatch Chauffeurs - Documentation Technique

**Version:** 2.0  
**Dernière mise à jour:** 2025-11-04  
**Statut:** Production Ready ✅

---

## 📋 Vue d'Ensemble

Le système de dispatch Kwenda gère l'assignation intelligente et sécurisée des commandes (taxi, livraison, marketplace) aux chauffeurs disponibles. Il intègre une protection atomique contre les race conditions, un filtrage par ville/véhicule, et une vérification automatique des crédits.

### Fonctionnalités Principales

- ✅ Matching intelligent chauffeur-commande (distance, rating, expérience)
- ✅ Protection atomique contre les race conditions (assignment_version)
- ✅ Vérification automatique crédits pour taxi (`rides_remaining`)
- ✅ Filtrage par ville et type de véhicule
- ✅ Notifications temps réel Supabase
- ✅ Logging automatique des conflits d'assignation
- ✅ Interface unifiée React (`useDriverDispatch`)

---

## 🏗️ Architecture

### 1. RPC Database: `find_nearby_drivers`

**Localisation:** `supabase/migrations/[timestamp]_fix_find_nearby_drivers_rpc.sql`

**Paramètres:**
```sql
find_nearby_drivers(
  pickup_lat double precision,
  pickup_lng double precision,
  service_type text,           -- 'taxi', 'delivery', 'marketplace'
  radius_km double precision,  -- Rayon de recherche (défaut: 10km)
  vehicle_class_filter text,   -- Optionnel: filtre type véhicule
  user_city_param text         -- Optionnel: filtre ville utilisateur
)
```

**Retour:**
```typescript
{
  driver_id: UUID;
  distance_km: number;
  vehicle_class: string;
  rating_average: number;
  rides_remaining: number;  // Nombre de courses restantes
}
```

**Logique de filtrage:**

1. **Chauffeurs éligibles:**
   - Status `is_online = true` ET `is_available = true`
   - Service actif pour le type demandé (`service_preferences`)
   - Dans le rayon spécifié (calcul Haversine)

2. **Filtres optionnels:**
   - Ville utilisateur = ville chauffeur
   - Type véhicule correspondant

3. **Vérification crédits (TAXI uniquement):**
   ```sql
   WHERE (service_type != 'taxi' OR rides_remaining > 0)
   ```
   ⚠️ **Important:** Les livraisons ne consomment les crédits qu'après livraison complète.

4. **Scoring:**
   ```sql
   SCORE = 
     (1 / (distance_km + 0.1)) * 10  -- Distance (max 10 points)
     + (COALESCE(rating_average, 4) * 2)  -- Rating (max 10 points)
     + (LEAST(total_rides, 100) * 0.05)   -- Expérience (max 5 points)
   ```

**Sécurité:**
- `SECURITY INVOKER` (pas de privilèges élevés)
- `SET search_path = public, pg_temp` (protection schema poisoning)

---

### 2. Edge Functions Dispatch

#### A. `ride-dispatcher` (Taxi)

**Appel:**
```typescript
await supabase.functions.invoke('ride-dispatcher', {
  body: {
    action: 'find_drivers',
    rideRequestId: string,
    pickupLat: number,
    pickupLng: number,
    userCity: string,
    vehicleClass: string
  }
});
```

**Workflow:**
1. Appel RPC `find_nearby_drivers` avec filtres ville/véhicule
2. **Vérification automatique `rides_remaining > 0`**
3. Création notifications pour chauffeurs éligibles
4. Retour liste chauffeurs avec distance/ETA

#### B. `delivery-dispatcher` (Livraison)

**Appel:**
```typescript
await supabase.functions.invoke('delivery-dispatcher', {
  body: {
    orderId: string,
    pickupLat: number,
    pickupLng: number,
    deliveryType: 'flash' | 'flex' | 'maxicharge',
    userCity: string
  }
});
```

**Workflow:**
1. Appel RPC `find_nearby_drivers` (PAS de vérification crédits)
2. Filtrage par type véhicule selon `deliveryType`:
   - `flash` → `moto`
   - `flex` → `moto`, `car`
   - `maxicharge` → `van`, `truck`
3. Création `delivery_driver_alerts` avec expiration 60s
4. Notifications temps réel aux chauffeurs

---

### 3. Hook React: `useDriverDispatch`

**Localisation:** `src/hooks/useDriverDispatch.tsx`

**API:**
```typescript
const {
  loading: boolean,
  pendingNotifications: UnifiedOrderNotification[],
  activeOrders: any[],
  acceptOrder: (notification: UnifiedOrderNotification) => Promise<boolean>,
  rejectOrder: (notificationId: string) => void,
  completeOrder: (orderId: string, type: 'taxi' | 'delivery' | 'marketplace') => Promise<boolean>,
  loadActiveOrders: () => Promise<void>
} = useDriverDispatch();
```

**Interface Notification:**
```typescript
interface UnifiedOrderNotification {
  id: string;
  type: 'taxi' | 'delivery' | 'marketplace';
  orderId: string;
  title: string;
  message: string;
  location: string;
  estimatedPrice: number;
  distance?: number;
  urgency: 'low' | 'medium' | 'high';
  data: any;  // Données brutes de la commande
  created_at: string;
  expires_at?: string;
  assignment_version?: number;  // Pour protection atomique
}
```

**Protection Race Conditions (DELIVERY):**

```typescript
// 1. Lire version actuelle
const { data: currentDelivery } = await supabase
  .from('delivery_orders')
  .select('assignment_version')
  .eq('id', orderId)
  .single();

// 2. Update atomique avec versioning
const { data: updateResult } = await supabase
  .from('delivery_orders')
  .update({ 
    driver_id: userId,
    assignment_version: currentDelivery.assignment_version + 1
  })
  .eq('id', orderId)
  .eq('assignment_version', currentDelivery.assignment_version)  // WHERE condition
  .is('driver_id', null)
  .select();

// 3. Si updateResult vide = conflit
if (!updateResult || updateResult.length === 0) {
  await supabase.rpc('log_assignment_conflict', {
    p_order_type: 'delivery_order',
    p_order_id: orderId,
    p_driver_id: userId,
    p_conflict_reason: 'Race condition détectée'
  });
  // Afficher toast "Un autre chauffeur a accepté"
}
```

**Subscriptions Realtime:**

```typescript
supabase
  .channel(`unified-driver-notifications-${userId}`)
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'transport_bookings',
    filter: 'status=eq.pending'
  }, handleNewTaxiBooking)
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'delivery_orders',
    filter: 'status=eq.pending'
  }, handleNewDelivery)
  .subscribe();
```

---

## 🔒 Sécurité

### Fonctions Sécurisées (Schema Poisoning)

Toutes les fonctions database utilisent:
```sql
SECURITY INVOKER
SET search_path = public, pg_temp
```

Liste des fonctions protégées (Phase 1):
- `find_nearby_drivers`
- `update_driver_location`
- `calculate_distance`
- `log_assignment_conflict` ✅ **Nouveau**
- ... (voir scan sécurité pour liste complète)

### Audit des Conflits

**Table:** `activity_logs`

```sql
SELECT 
  user_id AS driver_id,
  description AS conflict_reason,
  reference_id AS order_id,
  metadata->'conflict_time' AS when_happened,
  created_at
FROM activity_logs
WHERE activity_type = 'assignment_conflict'
ORDER BY created_at DESC
LIMIT 100;
```

**Métriques importantes:**
- Taux de conflits par heure de pointe
- Chauffeurs avec conflits répétés (possibles abus)
- Commandes avec >2 tentatives simultanées

---

## 🧪 Tests de Validation

### Test 1: Race Condition Delivery

**Objectif:** Vérifier qu'un seul chauffeur peut accepter une livraison

**Procédure:**
1. Créer une commande test:
```sql
INSERT INTO delivery_orders (
  user_id, pickup_location, delivery_location, 
  delivery_type, estimated_price, status
) VALUES (
  '[UUID_USER]', 'Test Pickup', 'Test Destination',
  'flex', 5000, 'pending'
) RETURNING id;
```

2. Ouvrir 2 onglets navigateur avec 2 chauffeurs différents
3. Cliquer "Accepter" simultanément (écart < 1 seconde)

**Résultat attendu:**
- ✅ 1 chauffeur reçoit `toast.success("Course acceptée")`
- ✅ 1 chauffeur reçoit `toast.error("Un autre chauffeur a accepté")`
- ✅ `delivery_orders.driver_id` contient UN SEUL ID
- ✅ Log créé dans `activity_logs` avec `activity_type = 'assignment_conflict'`

**Vérification SQL:**
```sql
-- Vérifier assignation unique
SELECT driver_id, assignment_version 
FROM delivery_orders 
WHERE id = '[ORDER_ID]';

-- Vérifier log conflit
SELECT * FROM activity_logs 
WHERE activity_type = 'assignment_conflict' 
  AND reference_id = '[ORDER_ID]'
ORDER BY created_at DESC 
LIMIT 1;
```

---

### Test 2: Vérification Crédits Taxi

**Objectif:** Un chauffeur sans crédits ne reçoit PAS de notifications taxi

**Procédure:**
1. Mettre `rides_remaining = 0` pour chauffeur test:
```sql
UPDATE driver_subscriptions
SET rides_remaining = 0
WHERE driver_id = '[CHAUFFEUR_ID]' 
  AND status = 'active';
```

2. Créer course taxi avec pickup proche du chauffeur:
```sql
INSERT INTO transport_bookings (
  user_id, pickup_location, destination, 
  pickup_lat, pickup_lng, estimated_price, status
) VALUES (
  '[USER_ID]', 'Test Location', 'Destination',
  -4.3276, 15.3136, 3000, 'pending'
) RETURNING id;
```

3. Appeler edge function:
```typescript
await supabase.functions.invoke('ride-dispatcher', {
  body: {
    action: 'find_drivers',
    rideRequestId: '[BOOKING_ID]',
    pickupLat: -4.3276,
    pickupLng: 15.3136
  }
});
```

**Résultat attendu:**
- ❌ Chauffeur test N'apparaît PAS dans les résultats RPC
- ❌ Chauffeur test ne reçoit AUCUNE notification
- ✅ Autres chauffeurs avec crédits reçoivent la notification

**Vérification:**
```sql
-- Appel direct RPC
SELECT * FROM find_nearby_drivers(
  -4.3276, 15.3136, 'taxi', 10, NULL, NULL
);
-- Le chauffeur test ne doit PAS être dans les résultats
```

---

### Test 3: Filtrage Ville et Véhicule

**Objectif:** Seuls les chauffeurs compatibles sont notifiés

**Procédure:**
1. Créer livraison `flash` (nécessite moto) à Kinshasa:
```sql
INSERT INTO delivery_orders (
  user_id, pickup_location, delivery_location, 
  delivery_type, estimated_price, status, user_city
) VALUES (
  '[USER_ID]', 'Pickup Kinshasa', 'Delivery Kinshasa',
  'flash', 5000, 'pending', 'Kinshasa'
) RETURNING id;
```

2. Dispatcher avec filtres:
```typescript
await supabase.functions.invoke('delivery-dispatcher', {
  body: {
    orderId: '[ORDER_ID]',
    pickupLat: -4.3276,
    pickupLng: 15.3136,
    deliveryType: 'flash',
    userCity: 'Kinshasa'
  }
});
```

**Résultat attendu:**
- ✅ Chauffeurs moto à Kinshasa → notifications
- ❌ Chauffeurs voiture → AUCUNE notification
- ❌ Chauffeurs autres villes → AUCUNE notification

**Vérification:**
```sql
SELECT 
  dda.driver_id,
  c.vehicle_class,
  c.city
FROM delivery_driver_alerts dda
JOIN chauffeurs c ON dda.driver_id = c.user_id
WHERE dda.order_id = '[ORDER_ID]';
-- Tous doivent avoir vehicle_class='moto' ET city='Kinshasa'
```

---

## 📊 Monitoring Production

### Métriques Clés

**Dashboard Supabase Analytics:**

```sql
-- 1. Taux de succès dispatch (dernières 24h)
SELECT 
  COUNT(*) FILTER (WHERE driver_id IS NOT NULL) * 100.0 / COUNT(*) AS success_rate
FROM delivery_orders
WHERE created_at > NOW() - INTERVAL '24 hours';

-- 2. Conflits d'assignation par heure
SELECT 
  DATE_TRUNC('hour', created_at) AS hour,
  COUNT(*) AS conflicts
FROM activity_logs
WHERE activity_type = 'assignment_conflict'
  AND created_at > NOW() - INTERVAL '24 hours'
GROUP BY hour
ORDER BY hour DESC;

-- 3. Chauffeurs sans crédits ayant tenté d'accepter
SELECT 
  al.user_id AS driver_id,
  COUNT(*) AS blocked_attempts
FROM activity_logs al
JOIN driver_subscriptions ds ON al.user_id = ds.driver_id
WHERE al.activity_type = 'assignment_conflict'
  AND ds.rides_remaining = 0
  AND al.created_at > NOW() - INTERVAL '7 days'
GROUP BY al.user_id
ORDER BY blocked_attempts DESC;

-- 4. Performance recherche par rayon
SELECT 
  CASE 
    WHEN metadata->>'searchRadius' = '5' THEN '5km'
    WHEN metadata->>'searchRadius' = '10' THEN '10km'
    ELSE '15km+'
  END AS search_radius,
  COUNT(*) AS searches,
  AVG((metadata->>'driversFound')::int) AS avg_drivers_found
FROM activity_logs
WHERE activity_type = 'driver_search'
  AND created_at > NOW() - INTERVAL '24 hours'
GROUP BY metadata->>'searchRadius';
```

### Alertes Recommandées

**Supabase Edge Function Logs:**

1. **Dispatch failures > 10% (1h):**
```
SELECT COUNT(*) FROM delivery_orders 
WHERE status = 'no_drivers_available' 
  AND created_at > NOW() - INTERVAL '1 hour'
```
→ Alerte si > 10% des commandes

2. **Race conditions > 50 (1h):**
```
SELECT COUNT(*) FROM activity_logs 
WHERE activity_type = 'assignment_conflict' 
  AND created_at > NOW() - INTERVAL '1 hour'
```
→ Alerte si > 50 conflits/heure

3. **Chauffeurs sans crédits mais online:**
```
SELECT COUNT(DISTINCT dl.driver_id)
FROM driver_locations dl
JOIN driver_subscriptions ds ON dl.driver_id = ds.driver_id
WHERE dl.is_online = true 
  AND ds.rides_remaining = 0
  AND ds.status = 'active'
```
→ Notification admin si > 20 chauffeurs

---

## 🚀 Améliorations Futures (Phase 3)

### Priorité 1 - Court terme (1 mois)
- [ ] Retry automatique intelligent (expansion rayon + bonus urgence)
- [ ] Dashboard admin temps réel conflits
- [ ] Notifications push natives (Capacitor)
- [ ] A/B testing algorithme scoring

### Priorité 2 - Moyen terme (3 mois)
- [ ] Machine Learning prédiction disponibilité chauffeurs
- [ ] Optimisation routes multi-livraisons
- [ ] Système de pénalités refus répétés
- [ ] Analytics prédictives demande par zone

### Priorité 3 - Long terme (6 mois)
- [ ] Integration API trafic temps réel
- [ ] Système enchères livraisons premium
- [ ] Gamification performance chauffeurs

---

## 📝 Changelog

### v2.0.0 - 2025-11-04 (Production)
- ✅ Fonction `log_assignment_conflict` créée
- ✅ Hook `useDriverDispatch` unifié
- ✅ Suppression hooks obsolètes (`useDriverOrderNotifications`, `useDriverRideOffers`)
- ✅ Migration composants vers hook unifié
- ✅ Documentation complète système

### v1.5.0 - 2025-11-03
- ✅ Protection schema poisoning (14 fonctions + 8 vues)
- ✅ RLS policies vues matérialisées
- ✅ Fonction `is_admin()` créée

### v1.0.0 - 2025-10-30
- ✅ RPC `find_nearby_drivers` avec vérification crédits
- ✅ Edge functions dispatch initial
- ✅ Subscriptions Realtime

---

## 🆘 Support & Debugging

### Erreur: "Aucun chauffeur trouvé"

**Diagnostic:**
```sql
-- 1. Vérifier chauffeurs online
SELECT COUNT(*) FROM driver_locations 
WHERE is_online = true AND is_available = true;

-- 2. Vérifier crédits (si taxi)
SELECT driver_id, rides_remaining 
FROM driver_subscriptions 
WHERE status = 'active' AND rides_remaining > 0;

-- 3. Test RPC direct
SELECT * FROM find_nearby_drivers(
  -4.3276, 15.3136, 'taxi', 10, NULL, 'Kinshasa'
);
```

**Solutions:**
- Augmenter rayon recherche (10km → 20km)
- Retirer filtres ville/véhicule temporairement
- Vérifier abonnements chauffeurs

---

### Erreur: "Race condition persistante"

**Diagnostic:**
```sql
SELECT 
  reference_id AS order_id,
  COUNT(*) AS conflict_count,
  ARRAY_AGG(user_id) AS competing_drivers
FROM activity_logs
WHERE activity_type = 'assignment_conflict'
  AND created_at > NOW() - INTERVAL '5 minutes'
GROUP BY reference_id
HAVING COUNT(*) > 2;
```

**Solutions:**
- Vérifier colonne `assignment_version` existe dans `delivery_orders`
- Vérifier index sur `(id, assignment_version, driver_id)`
- Augmenter délai interface utilisateur (debounce bouton)

---

## 📞 Contact Technique

**Équipe Backend:** backend@kwenda.app  
**Oncall Production:** +243 XXX XXX XXX  
**Documentation Supabase:** https://supabase.com/docs

---

**Document maintenu par:** Équipe Technique Kwenda  
**Prochaine révision:** 2025-12-01
