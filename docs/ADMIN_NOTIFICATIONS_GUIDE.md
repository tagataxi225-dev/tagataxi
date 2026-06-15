# 📢 Guide du Système de Notifications Admin Temps Réel

## 📋 Vue d'ensemble

Le système de notifications admin permet d'envoyer automatiquement des alertes aux administrateurs concernés selon leurs rôles et permissions. Les notifications sont distribuées intelligemment via une edge function qui cible uniquement les admins ayant les permissions appropriées.

---

## 🎯 Fonctionnalités Clés

### ✅ Dispatch Intelligent par Rôle
- Ciblage automatique des admins selon leurs permissions
- Nouveau chauffeur → Admin Transport
- Nouveau produit marketplace → Admin Marketplace + Moderators
- Retrait demandé → Admin Financier
- Ticket urgent → Admin Support

### ⚡ Temps Réel
- Notifications instantanées via Supabase Realtime
- Mise à jour automatique du compteur non lus
- Toasts contextuels selon la priorité

### 🔔 Multi-Canal
- Notifications in-app dans le centre de notifications
- Toasts (sonner) pour alertes importantes
- Notifications navigateur pour priorités urgentes (avec permission)

### 🎨 Interface Utilisateur
- Centre de notifications dans le header admin (desktop + mobile)
- Badge avec compteur de notifications non lues
- Icônes et badges selon sévérité et priorité
- Marquer comme lu / Tout marquer comme lu

---

## 🛠️ Architecture Technique

### 1. Edge Function: `admin-role-notification-dispatcher`

**Localisation:** `supabase/functions/admin-role-notification-dispatcher/index.ts`

**Rôle:** Distribue les notifications aux admins concernés selon l'événement

**Mapping Événements → Permissions:**
```typescript
{
  'driver_pending': ['drivers_validate', 'drivers_read'],
  'partner_pending': ['partners_validate', 'partners_read'],
  'product_reported': ['marketplace_moderate', 'moderate_content'],
  'marketplace_product_pending': ['marketplace_moderate', 'marketplace_read'],
  'food_product_pending': ['food_moderate', 'food_read'],
  'restaurant_pending': ['food_validate', 'food_read'],
  'vehicle_pending': ['rental_moderate', 'rental_read'],
  'withdrawal_requested': ['finance_read', 'finance_manage'],
  'ticket_urgent': ['support_read', 'support_manage'],
  'order_issue': ['orders_read', 'orders_manage']
}
```

**Fonctionnement:**
1. Reçoit une requête avec `event_type`, `entity_id`, `title`, `message`, etc.
2. Récupère les admins ayant les permissions requises via `get_admins_with_permissions()`
3. Crée des notifications individuelles dans `unified_notifications`
4. Crée des push notifications pour priorités `high` et `urgent`
5. Logue l'activité dans `activity_logs`

---

### 2. Hook React: `useAdminRoleNotifications`

**Localisation:** `src/hooks/useAdminRoleNotifications.tsx`

**Fonctionnalités:**
- ✅ `fetchNotifications()` : Récupère les 50 dernières notifications
- ✅ `markAsRead(id)` : Marque une notification comme lue
- ✅ `markAllAsRead()` : Marque toutes les notifications comme lues
- ✅ `dispatchAdminNotification(params)` : Envoie une nouvelle notification
- ✅ Subscription Realtime pour nouvelles notifications
- ✅ Affichage automatique de toasts selon priorité
- ✅ Notifications navigateur pour priorités urgentes

**Utilisation:**
```typescript
const { 
  notifications, 
  unreadCount, 
  loading, 
  markAsRead, 
  markAllAsRead,
  dispatchAdminNotification 
} = useAdminRoleNotifications();
```

---

### 3. Composant UI: `AdminRoleNotificationCenter`

**Localisation:** `src/components/admin/AdminRoleNotificationCenter.tsx`

**Affichage:**
- Icône cloche avec badge de compteur
- Dropdown menu avec liste des notifications
- Icônes selon catégorie (erreur, warning, info, success)
- Badges de priorité (urgent, prioritaire)
- Timestamps relatifs (il y a X minutes)
- Action "Tout marquer comme lu"

**Intégration:**
Déjà intégré dans `ResponsiveAdminLayout` (header desktop + mobile)

---

### 4. Helpers de Notifications

**Localisation:** `src/utils/adminNotificationHelpers.ts`

**Fonctions prédéfinies:**
```typescript
// Chauffeur
notifyNewDriverPending(driverId, driverName)

// Partenaire
notifyNewPartnerPending(partnerId, companyName)

// Marketplace
notifyProductReported(productId, productName, reason)
notifyMarketplaceProductPending(productId, productName, vendorName)

// Food
notifyFoodProductPending(productId, productName, restaurantName)
notifyRestaurantPending(restaurantId, restaurantName)

// Location
notifyVehiclePending(vehicleId, vehicleModel, partnerName)

// Finance
notifyWithdrawalRequested(withdrawalId, amount, userName)

// Support
notifyTicketUrgent(ticketId, subject, userName)
notifyOrderIssue(orderId, issue, orderType)
```

---

## 📝 Comment Utiliser le Système

### Cas 1: Notification Automatique lors d'une Action Utilisateur

**Exemple:** Notifier les admins quand un nouveau chauffeur s'inscrit

```typescript
import { notifyNewDriverPending } from '@/utils/adminNotificationHelpers';

// Dans votre composant ou fonction
const handleDriverRegistration = async (driverId: string, driverName: string) => {
  // ... votre logique métier ...
  
  // Envoyer notification aux admins transport
  await notifyNewDriverPending(driverId, driverName);
};
```

---

### Cas 2: Notification Personnalisée

**Exemple:** Créer une notification spécifique

```typescript
import { useAdminRoleNotifications } from '@/hooks/useAdminRoleNotifications';

const MyComponent = () => {
  const { dispatchAdminNotification } = useAdminRoleNotifications();
  
  const handleCustomAlert = async () => {
    await dispatchAdminNotification({
      event_type: 'ticket_urgent',
      entity_id: 'ticket-123',
      entity_type: 'support_ticket',
      title: '🆘 Ticket critique',
      message: 'Un client VIP a signalé un problème de paiement',
      severity: 'error',
      priority: 'urgent',
      metadata: {
        client_name: 'Jean Dupont',
        ticket_category: 'paiement'
      }
    });
  };
  
  return <button onClick={handleCustomAlert}>Alerter Admins</button>;
};
```

---

### Cas 3: Notifications via Triggers Database

**Exemple:** Notifier automatiquement lors d'un INSERT dans une table

```sql
-- Créer une fonction trigger
CREATE OR REPLACE FUNCTION notify_admin_new_partner()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  company_name TEXT;
BEGIN
  -- Récupérer le nom de l'entreprise
  company_name := NEW.company_name;
  
  -- Appeler l'edge function via HTTP (à implémenter avec pg_net)
  -- Ou insérer directement dans unified_notifications
  
  INSERT INTO unified_notifications (
    user_id,
    notification_type,
    title,
    message,
    priority,
    category,
    data
  )
  SELECT 
    ur.user_id,
    'partner_pending',
    '🤝 Nouvelle demande de partenaire',
    company_name || ' a soumis une demande de partenariat',
    'high',
    'admin_info',
    jsonb_build_object(
      'partner_id', NEW.id,
      'company_name', company_name
    )
  FROM user_roles ur
  INNER JOIN role_permissions rp ON rp.role = ur.role OR rp.admin_role = ur.admin_role
  WHERE ur.is_active = true
    AND ur.role IN ('admin', 'super_admin')
    AND rp.permission IN ('partners_validate', 'partners_read')
    AND rp.is_active = true;
  
  RETURN NEW;
END;
$$;

-- Attacher le trigger
CREATE TRIGGER trigger_notify_admin_new_partner
AFTER INSERT ON partenaires
FOR EACH ROW
WHEN (NEW.verification_status = 'pending')
EXECUTE FUNCTION notify_admin_new_partner();
```

---

## 🧪 Page de Test

**Localisation:** `/admin/notification-test`

**Accès:** Menu Admin → route directe ou via URL

**Fonctionnalités:**
- Tests rapides avec 10 scénarios prédéfinis
- Formulaire de notification personnalisée
- Documentation intégrée du système

**Comment tester:**
1. Allez sur `/admin/notification-test`
2. Choisissez un type de notification de test
3. Cliquez sur "Envoyer notification de test"
4. Vérifiez la réception dans le centre de notifications (icône cloche)

---

## 🔐 Sécurité & Permissions

### RPC Sécurisée: `get_admins_with_permissions`

**Fonction:** Retourne les user_id des admins ayant les permissions spécifiées

```sql
CREATE OR REPLACE FUNCTION get_admins_with_permissions(permission_names text[])
RETURNS SETOF uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT ur.user_id
  FROM user_roles ur
  INNER JOIN role_permissions rp ON rp.role = ur.role OR rp.admin_role = ur.admin_role
  WHERE ur.is_active = true
    AND ur.role IN ('admin', 'super_admin')
    AND rp.permission = ANY(permission_names)
    AND rp.is_active = true;
END;
$$;
```

### Table: `unified_notifications`

**RLS:** Activé avec policies appropriées (voir les policies existantes)

**Realtime:** ✅ Activé (REPLICA IDENTITY FULL + publication supabase_realtime)

---

## 📊 Monitoring & Analytics

### Métriques Disponibles

**Via `activity_logs`:**
- Nombre de notifications dispatched par type
- Timestamp de dispatch
- Metadata associée

**Via `unified_notifications`:**
- Nombre total de notifications par admin
- Taux de lecture (is_read)
- Temps moyen de lecture
- Notifications par priorité

### Queries Utiles

```sql
-- Notifications non lues par admin
SELECT 
  u.email,
  COUNT(*) as unread_count
FROM unified_notifications un
INNER JOIN auth.users u ON u.id = un.user_id
WHERE un.is_read = false
GROUP BY u.email
ORDER BY unread_count DESC;

-- Notifications par type et priorité
SELECT 
  notification_type,
  priority,
  COUNT(*) as count
FROM unified_notifications
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY notification_type, priority
ORDER BY count DESC;

-- Taux de lecture moyen
SELECT 
  notification_type,
  COUNT(*) FILTER (WHERE is_read) * 100.0 / COUNT(*) as read_rate_percent
FROM unified_notifications
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY notification_type;
```

---

## 🎨 Personnalisation

### Ajouter un Nouveau Type d'Événement

**1. Ajouter le mapping dans l'edge function**

```typescript
// supabase/functions/admin-role-notification-dispatcher/index.ts
const EVENT_PERMISSIONS_MAP: Record<string, string[]> = {
  // ... événements existants ...
  'custom_event': ['custom_permission_1', 'custom_permission_2']
};
```

**2. Créer un helper**

```typescript
// src/utils/adminNotificationHelpers.ts
export const notifyCustomEvent = async (entityId: string, details: string) => {
  return notifyAdmins({
    event_type: 'custom_event',
    entity_id: entityId,
    entity_type: 'custom_entity',
    title: '🎯 Événement personnalisé',
    message: details,
    severity: 'info',
    priority: 'normal',
    metadata: { additional_info: 'value' }
  });
};
```

**3. Utiliser le helper**

```typescript
import { notifyCustomEvent } from '@/utils/adminNotificationHelpers';

await notifyCustomEvent('entity-123', 'Quelque chose s\'est produit');
```

---

### Personnaliser l'Affichage des Notifications

**Modifier les icônes et couleurs:**

```typescript
// src/components/admin/AdminRoleNotificationCenter.tsx
const getCategoryIcon = (category: string, priority: string) => {
  if (category === 'custom_category') {
    return <YourCustomIcon className="h-4 w-4 text-custom" />;
  }
  // ... logique existante ...
};
```

---

## 🚀 Roadmap / Améliorations Futures

### Court Terme (Semaine 1)
- [ ] Ajouter notifications email pour priorités urgentes
- [ ] Dashboard analytics des notifications admin
- [ ] Système de rappel pour notifications non traitées (24h)

### Moyen Terme (Mois 1)
- [ ] Groupement de notifications similaires
- [ ] Préférences de notifications par admin
- [ ] Mode "Ne pas déranger" avec horaires personnalisés
- [ ] Templates de notifications personnalisables

### Long Terme (Trimestre 1)
- [ ] Machine learning pour priorisation intelligente
- [ ] Escalade automatique si pas d'action sous X heures
- [ ] Intégration Slack/Discord pour notifications externes
- [ ] Statistiques prédictives de charge admin

---

## ❓ FAQ & Troubleshooting

### Q: Les notifications n'arrivent pas en temps réel

**R:** Vérifiez que:
1. La table `unified_notifications` a `REPLICA IDENTITY FULL`
2. La table est dans la publication `supabase_realtime`
3. Le hook `useAdminRoleNotifications` est bien monté dans le composant
4. L'admin a les permissions appropriées

### Q: Comment tester les notifications localement ?

**R:** Utilisez la page `/admin/notification-test` ou appelez directement les helpers:
```typescript
import { notifyNewDriverPending } from '@/utils/adminNotificationHelpers';
await notifyNewDriverPending('test-id', 'Test Driver');
```

### Q: Les notifications push navigateur ne s'affichent pas

**R:** L'utilisateur doit autoriser les notifications navigateur. Vérifiez:
```typescript
console.log('Permission:', Notification.permission);
// Si 'default', demander la permission:
await Notification.requestPermission();
```

### Q: Comment supprimer les anciennes notifications ?

**R:** Créez une edge function ou un cron job Supabase:
```sql
DELETE FROM unified_notifications 
WHERE created_at < NOW() - INTERVAL '90 days';
```

---

## 📚 Ressources

- [Documentation Supabase Realtime](https://supabase.com/docs/guides/realtime)
- [Documentation Sonner (toasts)](https://sonner.emilkowal.ski/)
- [Edge Functions Supabase](https://supabase.com/docs/guides/functions)

---

## 🎉 Conclusion

Le système de notifications admin temps réel est maintenant **100% opérationnel** et prêt pour la production !

**Points forts:**
- ✅ Dispatch intelligent par rôles
- ✅ Temps réel via Supabase
- ✅ Multi-canal (in-app, toasts, push)
- ✅ Interface intuitive
- ✅ Extensible et personnalisable
- ✅ Sécurisé avec RLS

**Support:**
- Page de test: `/admin/notification-test`
- Helpers prêts à l'emploi
- Documentation complète

**Prochaines étapes recommandées:**
1. Tester avec des données réelles
2. Former les admins à l'utilisation
3. Monitorer les métriques pendant 1 semaine
4. Implémenter les notifications email (priorité urgente)

---

*Dernière mise à jour: 2025*
