# 🧪 Tests de Charge K6 - Kwenda

## 📋 Prérequis

1. **Installer K6**:
   ```bash
   # macOS
   brew install k6

   # Ubuntu/Debian
   sudo gpg -k
   sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
   echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
   sudo apt-get update
   sudo apt-get install k6

   # Windows (chocolatey)
   choco install k6
   ```

2. **Variables d'environnement** (optionnel):
   ```bash
   export SUPABASE_URL="https://wddlktajnhwhyquwcdgf.supabase.co"
   export SUPABASE_ANON_KEY="votre_anon_key"
   ```

## 🚀 Exécution des Tests

### 1️⃣ Test Réservation Transport (50 users)
```bash
k6 run load-tests/transport-booking.js
```
**Objectif**: 95% des requêtes < 500ms

**Ce qui est testé**:
- Récupération chauffeurs disponibles
- Calcul de prix via Edge Function
- Création de réservation
- Performance base de données

### 2️⃣ Test Navigation Marketplace (100 users)
```bash
k6 run load-tests/marketplace-browse.js
```
**Objectif**: 95% des requêtes < 300ms

**Ce qui est testé**:
- Listing de produits
- Recherche textuelle
- Filtrage par catégorie
- Performance des index

### 3️⃣ Test Tracking Temps Réel (200 users)
```bash
k6 run load-tests/realtime-tracking.js
```
**Objectif**: 95% succès sur updates GPS

**Ce qui est testé**:
- Updates de position GPS
- Connexions WebSocket Realtime
- Charge sur `driver_locations`
- Performance Edge Functions

## 📊 Exécuter Tous les Tests

```bash
# Créer dossier résultats
mkdir -p load-tests/results

# Exécuter tous les tests séquentiellement
k6 run load-tests/transport-booking.js && \
k6 run load-tests/marketplace-browse.js && \
k6 run load-tests/realtime-tracking.js
```

## 📈 Analyser les Résultats

Les résultats JSON sont sauvegardés dans `load-tests/results/`:
- `transport-booking-summary.json`
- `marketplace-browse-summary.json`
- `realtime-tracking-summary.json`

### Métriques Clés

| Métrique | Seuil Acceptable | Action si Dépassé |
|----------|------------------|-------------------|
| `http_req_duration` p95 | < 500ms | Optimiser DB queries, ajouter indexes |
| `http_req_failed` | < 5% | Vérifier RLS policies, Edge Functions |
| `location_update_success` | > 95% | Augmenter limites Supabase |
| `realtime_connection_success` | > 90% | Vérifier quotas Realtime |

## 🐛 Debugging

### Logs détaillés
```bash
k6 run --http-debug load-tests/transport-booking.js
```

### Limiter la durée
```bash
k6 run --duration 1m load-tests/marketplace-browse.js
```

### Exécution en Cloud (K6 Cloud)
```bash
k6 cloud load-tests/transport-booking.js
```

## 🎯 Critères de Succès

✅ **PASS** si:
- 95% requêtes < seuils définis
- Taux d'échec < 5%
- Aucun crash de service
- Base de données reste responsive

❌ **FAIL** si:
- Dépassement seuils de latence
- Erreurs > 5%
- Timeout Edge Functions
- CPU/RAM Supabase > 80%

## 📚 Documentation

- [K6 Docs](https://k6.io/docs/)
- [Supabase Performance](https://supabase.com/docs/guides/platform/performance)
- [Métriques K6](https://k6.io/docs/using-k6/metrics/)
