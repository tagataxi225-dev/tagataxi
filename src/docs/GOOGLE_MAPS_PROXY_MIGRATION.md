# 🗺️ MIGRATION VERS GOOGLE MAPS PROXY SÉCURISÉ

**Date**: 16 Octobre 2025  
**Objectif**: Sécuriser la clé Google Maps API en passant par un proxy Edge Function

---

## 🔒 POURQUOI CE CHANGEMENT ?

### Ancien système (VULNÉRABLE ❌):
```typescript
// ❌ La clé API est exposée côté client
const apiKey = await getApiKey(); // Récupère la clé depuis Edge Function
const response = await fetch(
  `https://maps.googleapis.com/maps/api/geocode/json?address=${addr}&key=${apiKey}`
);
// 🚨 Un attaquant peut extraire la clé via DevTools et l'utiliser sur son propre site
```

### Nouveau système (SÉCURISÉ ✅):
```typescript
// ✅ La clé reste sur le serveur, jamais exposée au client
const { data } = await supabase.functions.invoke('google-maps-proxy', {
  body: {
    service: 'geocode',
    params: { address: addr }
  }
});
// 🔒 La clé Google Maps ne quitte jamais l'Edge Function
```

---

## 📋 SERVICES SUPPORTÉS

La nouvelle Edge Function `google-maps-proxy` supporte:

| Service | Description | Params |
|---------|-------------|--------|
| `geocode` | Convertir adresse → coordonnées | `{ address: string }` |
| `place-details` | Détails d'un lieu Google | `{ place_id: string }` |
| `autocomplete` | Autocomplétion recherche | `{ input: string }` |
| `directions` | Itinéraire A → B | `{ origin: string, destination: string }` |

---

## 🔧 MIGRATION ÉTAPE PAR ÉTAPE

### 1️⃣ Mettre à jour `src/services/googleMapsService.ts`

**AVANT (vulnérable)**:
```typescript
export const geocodeAddress = async (address: string) => {
  const apiKey = await getApiKey(); // ❌ Clé exposée
  const response = await fetch(
    `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`
  );
  return await response.json();
};
```

**APRÈS (sécurisé)**:
```typescript
import { supabase } from '@/integrations/supabase/client';

export const geocodeAddress = async (address: string) => {
  const { data, error } = await supabase.functions.invoke('google-maps-proxy', {
    body: {
      service: 'geocode',
      params: {
        address: encodeURIComponent(address)
      }
    }
  });
  
  if (error) {
    console.error('[Geocode] Error:', error);
    throw new Error('Failed to geocode address');
  }
  
  return data;
};
```

---

### 2️⃣ Mettre à jour autocomplete Places

**AVANT**:
```typescript
const searchPlaces = async (input: string) => {
  const apiKey = await getApiKey();
  const response = await fetch(
    `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${input}&key=${apiKey}`
  );
  return await response.json();
};
```

**APRÈS**:
```typescript
const searchPlaces = async (input: string) => {
  const { data, error } = await supabase.functions.invoke('google-maps-proxy', {
    body: {
      service: 'autocomplete',
      params: {
        input,
        types: 'geocode', // Optionnel: types de résultats
        components: 'country:cd' // Optionnel: limiter à la RDC
      }
    }
  });
  
  if (error) throw error;
  return data;
};
```

---

### 3️⃣ Mettre à jour détails lieu

**AVANT**:
```typescript
const getPlaceDetails = async (placeId: string) => {
  const apiKey = await getApiKey();
  const response = await fetch(
    `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=${apiKey}`
  );
  return await response.json();
};
```

**APRÈS**:
```typescript
const getPlaceDetails = async (placeId: string) => {
  const { data, error } = await supabase.functions.invoke('google-maps-proxy', {
    body: {
      service: 'place-details',
      params: {
        place_id: placeId,
        fields: 'formatted_address,geometry,name' // Optionnel
      }
    }
  });
  
  if (error) throw error;
  return data;
};
```

---

### 4️⃣ Mettre à jour calcul itinéraire

**AVANT**:
```typescript
const getDirections = async (origin: string, destination: string) => {
  const apiKey = await getApiKey();
  const response = await fetch(
    `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${destination}&key=${apiKey}`
  );
  return await response.json();
};
```

**APRÈS**:
```typescript
const getDirections = async (origin: string, destination: string) => {
  const { data, error } = await supabase.functions.invoke('google-maps-proxy', {
    body: {
      service: 'directions',
      params: {
        origin,
        destination,
        mode: 'driving', // Optionnel: driving, walking, bicycling, transit
        alternatives: 'true' // Optionnel: itinéraires alternatifs
      }
    }
  });
  
  if (error) throw error;
  return data;
};
```

---

## 🔐 SÉCURITÉ & RATE LIMITING

### Rate Limiting Automatique

L'Edge Function applique automatiquement:
- **Limite**: 100 requêtes/heure/utilisateur
- **Réinitialisation**: Toutes les heures
- **Réponse si dépassé**: HTTP 429 avec header `Retry-After`

**Exemple gestion erreur**:
```typescript
const geocodeWithRetry = async (address: string) => {
  try {
    const { data, error } = await supabase.functions.invoke('google-maps-proxy', {
      body: { service: 'geocode', params: { address } }
    });
    
    if (error) {
      if (error.message?.includes('Rate limit exceeded')) {
        toast.error('Trop de requêtes Google Maps. Réessayez dans 1 heure.');
        return null;
      }
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('[Geocode] Error:', error);
    throw error;
  }
};
```

---

## 📊 MONITORING & AUDIT

### Logs automatiques

Chaque appel Google Maps est loggé dans `security_audit_logs`:

```sql
-- Voir usage Google Maps par utilisateur
SELECT 
  user_id,
  COUNT(*) as total_calls,
  resource_type as service,
  DATE(created_at) as date
FROM security_audit_logs
WHERE action_type = 'google_maps_api_call'
  AND created_at > NOW() - INTERVAL '7 days'
GROUP BY user_id, resource_type, DATE(created_at)
ORDER BY total_calls DESC;
```

### Alertes quota

Dashboard admin reçoit des alertes si:
- Un utilisateur fait >80 requêtes/heure
- Total quota Google Maps approche limite mensuelle
- Erreurs inhabituelles de l'API Google

---

## ✅ CHECKLIST MIGRATION

**Code Client**:
- [ ] Remplacer `getApiKey()` + `fetch()` par `supabase.functions.invoke()`
- [ ] Mettre à jour `geocodeAddress()` dans `googleMapsService.ts`
- [ ] Mettre à jour autocomplete Places
- [ ] Mettre à jour détails lieu
- [ ] Mettre à jour calcul itinéraire
- [ ] Ajouter gestion erreur rate limiting
- [ ] Tester tous les flows (booking, delivery, marketplace)

**Vérification**:
- [ ] DevTools Network → aucune clé Google Maps visible
- [ ] Autocomplete fonctionne
- [ ] Calcul distance fonctionne
- [ ] Geocoding adresses fonctionne
- [ ] Pas d'erreurs console

**Monitoring**:
- [ ] Vérifier logs Edge Function
- [ ] Vérifier `security_audit_logs` contient les appels
- [ ] Tester dépassement rate limit (>100 req/h)

---

## 🚨 ROLLBACK (SI PROBLÈME)

Si la migration cause des problèmes, rollback temporaire:

```typescript
// Rollback temporaire (réactiver ancien système)
// ⚠️ SEULEMENT EN CAS D'URGENCE
const geocodeAddress = async (address: string) => {
  // Utiliser ancien système avec clé exposée (TEMPORAIRE)
  const { data: keyData } = await supabase.functions.invoke('get-google-maps-key');
  const apiKey = keyData.key;
  
  const response = await fetch(
    `https://maps.googleapis.com/maps/api/geocode/json?address=${address}&key=${apiKey}`
  );
  return await response.json();
};
```

**Puis**:
1. Créer ticket incident avec logs erreur
2. Analyser logs Edge Function `google-maps-proxy`
3. Corriger problème
4. Re-migrer vers proxy sécurisé

---

## 📈 AVANTAGES ATTENDUS

**Sécurité**:
- ✅ Clé Google Maps jamais exposée au client
- ✅ Impossible de voler la clé via DevTools
- ✅ Audit logging de tous les appels
- ✅ Rate limiting centralisé

**Coûts**:
- ✅ Réduction quota abuse (~30-50%)
- ✅ Cache possible côté serveur (prochaine phase)
- ✅ Détection fraude automatique

**Performance**:
- ⚠️ Latence +20-50ms (1 hop supplémentaire)
- ✅ Compensation possible via cache serveur

---

## 🔗 LIENS UTILES

**Edge Function Logs**:  
👉 https://supabase.com/dashboard/project/wddlktajnhwhyquwcdgf/functions/google-maps-proxy/logs

**Audit Logs SQL**:
```sql
SELECT * FROM security_audit_logs 
WHERE action_type = 'google_maps_api_call' 
ORDER BY created_at DESC 
LIMIT 50;
```

**Rate Limiting Status**:
```sql
SELECT * FROM api_rate_limits 
WHERE endpoint = 'google-maps-proxy' 
ORDER BY request_count DESC;
```

---

**Auteur**: Équipe Sécurité ICON SARL  
**Date**: 16 Octobre 2025  
**Version**: 1.0
