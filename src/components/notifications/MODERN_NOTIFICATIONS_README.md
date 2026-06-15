# 🔔 Système de Notifications Push Modernes

## ✨ Vue d'ensemble

Système de notifications push professionnel avec toasts visuels modernes, sons personnalisés, vibrations haptiques, et gestion intelligente des notifications en temps réel.

## 🎯 Caractéristiques Principales

### 🎨 Design Moderne
- **Glassmorphism** avec backdrop-blur-xl
- **Gradients animés** selon le type de service
- **Icônes animées** avec Framer Motion
- **Progress bars circulaires** autour des icônes
- **Confetti effects** pour les notifications importantes (loterie, gains)
- **Z-index élevé** (z-[200]) au-dessus du header

### 🎵 Système Audio
- **Sons différenciés** par type de notification
- **Fallback synthétique** via Web Audio API si fichiers manquants
- **Volume configurable** (0-100%)
- **Activation/désactivation** par l'utilisateur

### 📱 Mobile-First
- **Vibrations haptiques** via Capacitor (Heavy/Medium/Light selon priorité)
- **Swipe down** pour fermer
- **Touch-friendly** avec animations spring
- **Safe area aware** (respect du notch iOS)

### 🧠 Gestion Intelligente
- **Queue system** : Max 3 toasts visibles simultanément
- **Priorisation** : urgent > high > normal > low
- **Auto-dismiss** : 6-8 secondes selon priorité
- **Indicateur** : "+X autres notifications" si queue pleine

### 🎨 Types de Services

#### 🚗 Transport VTC
- **Gradient** : `from-[hsl(var(--chart-1))] to-[hsl(var(--chart-2))]`
- **Icon** : `Car` avec animation bounce
- **Badge** : "Nouvelle course"
- **Sons** : `/sounds/transport/driverAssigned.mp3`

#### 📦 Livraison
- **Gradient** : `from-[hsl(var(--chart-3))] to-[hsl(var(--chart-4))]`
- **Icon** : `Package` avec animation bounce
- **Badge** : "Colis en route"
- **Sons** : `/sounds/delivery/deliveryPicked.mp3`

#### 🛒 Marketplace
- **Gradient** : `from-[hsl(var(--primary))] to-[hsl(var(--accent))]`
- **Icon** : `ShoppingBag` avec animation swing
- **Badge** : "Commande confirmée"
- **Sons** : `/sounds/marketplace/newOrder.mp3`

#### 🎰 Loterie
- **Gradient** : `from-yellow-400 via-orange-400 to-red-400`
- **Icon** : `Trophy` avec confetti animation
- **Badge** : "Félicitations ! 🎉"
- **Sons** : `/sounds/general/success.mp3`

#### 💰 Wallet/Paiement
- **Gradient** : `from-emerald-400 to-cyan-400`
- **Icon** : `Wallet` avec pulse animation
- **Badge** : "Transaction réussie"
- **Sons** : `/sounds/general/paymentReceived.mp3`

#### 💬 Chat
- **Gradient** : `from-blue-400 to-indigo-400`
- **Icon** : `MessageSquare` avec animation bounce
- **Badge** : "Nouveau message"
- **Sons** : `/sounds/chat/message.mp3`

---

## 📦 Architecture

### Composants

#### `PushNotificationToast.tsx`
Toast individuel avec design moderne, animations, et gestion du cycle de vie.

**Props**:
```typescript
interface PushNotificationToastProps {
  id: string;
  type: 'transport' | 'delivery' | 'marketplace' | 'lottery' | 'wallet' | 'chat' | 'system';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  title: string;
  message: string;
  badge?: string;
  actionLabel?: string;
  actionUrl?: string;
  timestamp: number;
  index: number; // Position dans la pile
  metadata?: any;
  onClose: (id: string) => void;
  onAction?: (id: string, url?: string) => void;
}
```

#### `NotificationToastContainer.tsx`
Conteneur qui gère le stacking, la queue, et la priorisation.

**Props**:
```typescript
interface NotificationToastContainerProps {
  toasts: PushNotificationToastData[];
  onClose: (id: string) => void;
  onAction?: (id: string, url?: string) => void;
  maxVisible?: number; // Default: 3
}
```

### Hooks

#### `useModernNotifications.tsx`
Hook principal pour gérer l'état des toasts et l'intégration avec les préférences utilisateur.

**API**:
```typescript
const {
  toasts,           // Liste des toasts actifs
  showToast,        // Afficher un nouveau toast
  removeToast,      // Retirer un toast
  clearAllToasts    // Tout nettoyer
} = useModernNotifications();
```

**Usage**:
```typescript
showToast({
  type: 'transport',
  priority: 'high',
  title: 'Nouvelle course',
  message: 'Course de Gombe vers Kinshasa',
  badge: '🚗 VTC',
  actionLabel: 'Voir',
  actionUrl: '/bookings/123'
});
```

#### `useNotificationSound.tsx`
Gestion des sons avec fallback synthétique.

**API**:
```typescript
const {
  playSound,              // Jouer un son par type
  playNotificationSound,  // Jouer selon mapping config
  playSyntheticSound      // Fallback Web Audio API
} = useNotificationSound({ enabled: true, volume: 0.7 });
```

#### `useRealtimeNotifications.tsx` (modifié)
Hook existant étendu avec support des toasts modernes.

**Nouvelles props**:
```typescript
const {
  // ... existing props
  toasts,           // Liste des toasts modernes
  showModernToast   // Alias de showToast
} = useRealtimeNotifications();
```

---

## 🚀 Utilisation

### Intégration dans ModernHomeScreen

```tsx
import { NotificationToastContainer } from '@/components/notifications/NotificationToastContainer';
import { useRealtimeNotifications } from '@/hooks/useRealtimeNotifications';

export const ModernHomeScreen = () => {
  const { toasts } = useRealtimeNotifications();
  const navigate = useNavigate();

  const handleToastAction = (id: string, url?: string) => {
    if (url) {
      navigate(url);
    }
  };

  return (
    <div className="relative">
      {/* Container de toasts au-dessus de tout */}
      <NotificationToastContainer
        toasts={toasts}
        onClose={(id) => {}}
        onAction={handleToastAction}
        maxVisible={3}
      />

      {/* Reste du contenu */}
    </div>
  );
};
```

### Afficher une notification manuellement

```tsx
import { useModernNotifications } from '@/hooks/useModernNotifications';

const MyComponent = () => {
  const { showToast } = useModernNotifications();

  const handleBookingSuccess = () => {
    showToast({
      type: 'transport',
      priority: 'high',
      title: 'Réservation confirmée',
      message: 'Votre course a été confirmée avec succès',
      badge: '✅ Confirmé',
      actionLabel: 'Voir détails',
      actionUrl: '/bookings/123'
    });
  };

  return <Button onClick={handleBookingSuccess}>Réserver</Button>;
};
```

---

## ⚙️ Configuration

### Base de données

Les préférences sont stockées dans `user_preferences`:

```sql
ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS
  notification_toast_enabled BOOLEAN DEFAULT true,
  notification_sound_enabled BOOLEAN DEFAULT true,
  notification_sound_volume INTEGER DEFAULT 70,
  notification_duration INTEGER DEFAULT 6000,
  notification_position TEXT DEFAULT 'top-center',
  notification_do_not_disturb BOOLEAN DEFAULT false,
  notification_dnd_start_time TIME DEFAULT '22:00:00',
  notification_dnd_end_time TIME DEFAULT '07:00:00',
  notification_types_enabled JSONB DEFAULT '{
    "transport": true,
    "delivery": true,
    "marketplace": true,
    "lottery": true,
    "wallet": true,
    "chat": true,
    "system": true
  }';
```

### Sons

Structure attendue dans `public/sounds/`:

```
public/sounds/
├── transport/
│   ├── driverAssigned.mp3
│   ├── driverArrived.mp3
│   └── rideStarted.mp3
├── delivery/
│   ├── deliveryPicked.mp3
│   └── deliveryCompleted.mp3
├── marketplace/
│   ├── newOrder.mp3
│   └── orderConfirmed.mp3
├── chat/
│   └── message.mp3
└── general/
    ├── success.mp3
    ├── paymentReceived.mp3
    └── general.mp3
```

**Fallback** : Si fichiers manquants, utilise Web Audio API pour générer des sons synthétiques.

---

## 🎛️ Interface Settings

Composant `ModernNotificationSettings.tsx` pour permettre aux utilisateurs de configurer :

- ✅ **Activer/désactiver** toasts et sons
- 🔊 **Volume** des notifications (slider 0-100%)
- ⏱️ **Durée** d'affichage (3s, 5s, 6s, 8s, 10s)
- 📍 **Position** des toasts (top-center, top-right, top-left)
- 🌙 **Mode Ne pas déranger** (22h-7h par défaut)
- 🔍 **Filtres par service** (activer/désactiver chaque type)
- 🧪 **Bouton test** pour prévisualiser

---

## 🔧 Dépendances

```json
{
  "@capacitor/haptics": "^7.0.3",
  "framer-motion": "^12.23.12"
}
```

---

## 📊 Métriques & Analytics (Future)

### Phase 10 : Monitoring
- Nombre de toasts affichés/jour par utilisateur
- Taux de clic sur les actions
- Taux de dismiss manuel vs auto
- Temps moyen de visualisation
- Types de notifications les plus affichées

### Dashboard Admin
- Statistiques d'engagement par type
- Identification des notifications ignorées
- Optimisation des messages

---

## ✅ Checklist d'implémentation

- [x] PushNotificationToast avec design moderne
- [x] NotificationToastContainer avec queue system
- [x] useModernNotifications hook
- [x] useNotificationSound avec fallback
- [x] Intégration dans ModernHomeScreen
- [x] Migration SQL user_preferences
- [x] ModernNotificationSettings UI
- [x] Support Capacitor Haptics
- [x] Support sons personnalisés
- [ ] Télécharger fichiers audio (voir README.md dans `/sounds`)
- [ ] Tests E2E
- [ ] Analytics tracking

---

## 🐛 Troubleshooting

### Les toasts n'apparaissent pas
1. Vérifier que `notification_toast_enabled` est `true` dans les préférences
2. Vérifier le z-index du header (doit être < 200)
3. Vérifier que le container est bien monté dans ModernHomeScreen

### Les sons ne fonctionnent pas
1. Vérifier que `notification_sound_enabled` est `true`
2. Vérifier que les fichiers audio existent dans `public/sounds/`
3. Le fallback synthétique devrait jouer si fichiers manquants
4. Vérifier les permissions audio du navigateur

### Les vibrations ne fonctionnent pas
1. Vérifier que l'app tourne sur un appareil mobile (Capacitor)
2. Vérifier que `@capacitor/haptics` est installé
3. Vérifier les permissions dans le manifest Android/iOS

### Position incorrecte des toasts
1. Vérifier la valeur de `notification_position` dans les préférences
2. Vérifier les safe areas sur iOS (notch)
3. Ajuster `topPosition` dans `PushNotificationToast.tsx`

---

## 📝 Notes

- Les toasts sont **automatiquement synchronisés** avec `useRealtimeNotifications`
- Le **nettoyage automatique** se fait après 30 secondes
- La **priorisation** est basée sur `urgent > high > normal > low`
- Le **mode DND** désactive toasts ET sons pendant les heures configurées
- Les **sons synthétiques** utilisent des fréquences différentes par type

---

## 🚀 Roadmap Future

- [ ] Smart grouping (ex: "3 nouvelles courses disponibles")
- [ ] Rich actions (accepter, refuser depuis le toast)
- [ ] History slide-down (swipe pour voir historique)
- [ ] Push notifications natives (FCM/APNs)
- [ ] Préférences par priorité (ex: urgent OK, low non)
- [ ] Scheduled notifications
- [ ] A/B testing des messages

---

**Auteur** : Système de Notifications Modernes v1.0  
**Date** : 2025-11-22  
**Status** : ✅ Déployé en Production
