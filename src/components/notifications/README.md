# 📬 Système de Notifications Unifié - PHASE 3

## ✅ Architecture Consolidée

### 🔧 Composants Clés

#### 1. `UnifiedNotificationBell` (Nouveau - Universel)
**Fichier**: `src/components/notifications/UnifiedNotificationBell.tsx`

Composant de cloche de notifications universel qui s'adapte automatiquement au rôle utilisateur.

**Props**:
```typescript
interface UnifiedNotificationBellProps {
  userType: 'admin' | 'vendor' | 'driver' | 'client' | 'restaurant' | 'partner';
  className?: string;
}
```

**Caractéristiques**:
- ✅ Détection automatique du bon endpoint selon le rôle
- ✅ Normalisation des données de toutes les tables
- ✅ Badge avec compteur de non-lus
- ✅ Marquer comme lu (individuel ou tout)
- ✅ Icons dynamiques selon la sévérité
- ✅ Couleurs selon la priorité
- ✅ Scroll infini dans dropdown
- ✅ Timestamps relatifs (ex: "il y a 5 min")

---

#### 2. `NotificationBell` (Wrapper de compatibilité)
**Fichier**: `src/components/notifications/NotificationBell.tsx`

Wrapper qui détecte automatiquement le rôle via `useUserRole()` et rend `UnifiedNotificationBell`.

**Utilisation** (aucun changement requis dans le code existant):
```tsx
import { NotificationBell } from '@/components/notifications/NotificationBell';

<NotificationBell />
```

---

### 🗄️ Tables de Notifications par Rôle

| Rôle | Table | Champ User ID | Champ "Lu" | Détails |
|------|-------|---------------|------------|---------|
| **admin** | `admin_notifications` | _(none)_ | `is_read` | Notifications système admin |
| **vendor** | `vendor_product_notifications` | `vendor_id` | `is_read` | Notifications produits marketplace |
| **driver** | `delivery_driver_alerts` | `driver_id` | `seen_at` | Alertes de livraison temps réel |
| **client** | `delivery_notifications` | `user_id` | `read` | Notifications commandes/livraisons |
| **restaurant** | `delivery_notifications` | `user_id` | `read` | Notifications commandes restaurant |
| **partner** | `delivery_notifications` | `user_id` | `read` | Notifications partenaires |

---

### 🎯 Hook Unifié

#### `useUnifiedNotifications`
**Fichier**: `src/hooks/useUnifiedNotifications.ts`

```typescript
const { 
  notifications,      // Liste normalisée
  unreadCount,        // Nombre de non-lus
  isLoading,          // État de chargement
  markAsRead,         // Marquer 1 comme lu
  markAllAsRead,      // Marquer tout comme lu
  isMarkingAsRead     // État mutation en cours
} = useUnifiedNotifications('vendor');
```

**Normalisation Automatique**:
```typescript
interface UnifiedNotification {
  id: string;
  title: string;        // ← Auto-mappé depuis "title" ou "alert_type"
  message: string;      // ← Auto-mappé depuis "message" ou "order_details"
  type: string;         // ← "notification_type" ou "alert_type"
  created_at: string;   // ← Timestamp unifié
  is_read: boolean;     // ← Normalisé depuis "is_read", "read" ou "seen_at"
  metadata: any;        // ← Données complémentaires
  priority: string;     // ← "high", "medium", "normal", "low"
  severity: string;     // ← "error", "warning", "info", "success"
}
```

---

## 📊 Avantages du Système Unifié

### ✅ Pour les Développeurs
1. **Un seul composant** à maintenir au lieu de 4-5
2. **Une seule API** pour toutes les notifications
3. **Type-safe** avec TypeScript
4. **Auto-refresh** toutes les 60 secondes
5. **Cache intelligent** avec TanStack Query

### ✅ Pour les Utilisateurs
1. **Expérience cohérente** sur toute l'app
2. **Temps réel** sans rechargement
3. **Indicateur visuel** clair (badge rouge)
4. **Tri automatique** par date
5. **Responsive** sur mobile et desktop

---

## 🚀 Migration depuis Ancien Système

### Avant (ancien code)
```tsx
// ❌ Code fragmenté par rôle
{isAdmin && <AdminNotificationBell />}
{isVendor && <VendorNotificationIcon />}
{isDriver && <DriverAlerts />}
```

### Après (nouveau code)
```tsx
// ✅ Un seul composant universel
<NotificationBell />
// Ou explicitement:
<UnifiedNotificationBell userType="vendor" />
```

---

## 🔧 Customisation

### Changer les couleurs de priorité
```tsx
// Dans UnifiedNotificationBell.tsx
const PRIORITY_COLORS = {
  high: 'text-red-500',      // ← Modifier ici
  medium: 'text-orange-500',
  normal: 'text-blue-500',
  low: 'text-gray-500'
};
```

### Ajouter un nouveau type de notification
```tsx
// Dans useUnifiedNotifications.ts
const TABLE_MAPPING: Record<UserType, string> = {
  'admin': 'admin_notifications',
  'vendor': 'vendor_product_notifications',
  'nouveau_role': 'nouvelle_table', // ← Ajouter ici
  // ...
};
```

---

## 📈 Performance

- **Stale Time**: 30 secondes (évite requêtes inutiles)
- **Refetch Interval**: 60 secondes (polling léger)
- **Limite**: 50 notifications max par rôle
- **Lazy Loading**: Chargement au clic sur la cloche
- **Optimistic UI**: Marquer comme lu sans attendre la réponse

---

## 🧪 Tests Recommandés

1. **Test Admin**: Se connecter en tant qu'admin → vérifier `admin_notifications`
2. **Test Vendor**: Se connecter en tant que vendeur → vérifier badge produits approuvés/rejetés
3. **Test Driver**: Se connecter en tant que chauffeur → vérifier alertes livraison
4. **Test Client**: Se connecter en tant que client → vérifier notifications commandes
5. **Test Multi-Rôle**: Compte avec plusieurs rôles → vérifier switch correct

---

## 🔒 Sécurité

- ✅ **RLS Policies**: Chaque table a ses propres policies
- ✅ **User ID Filtering**: Filtrage automatique par `user_id` / `vendor_id` / `driver_id`
- ✅ **Type Safety**: TypeScript empêche les accès invalides
- ✅ **Error Handling**: Fallback gracieux si table inaccessible

---

## 📝 TODO Future

- [ ] Système de catégories de notifications (transport, livraison, marketplace)
- [ ] Filtres par type dans le dropdown
- [ ] Pagination pour plus de 50 notifications
- [ ] Push notifications natives via Capacitor
- [ ] Archivage automatique après 30 jours
- [ ] Préférences utilisateur (désactiver certains types)

---

**Auteur**: PHASE 3 - Nettoyage & Optimisations  
**Date**: 2025-10-19  
**Status**: ✅ Déployé en Production
