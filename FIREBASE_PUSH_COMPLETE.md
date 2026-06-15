# 🔥 Guide Complet - Notifications Push Firebase pour Kwenda

Ce guide vous accompagne dans la configuration complète des notifications push pour les 3 applications Kwenda (Client, Chauffeur, Partenaire).

## 📋 Table des matières

1. [Prérequis](#prérequis)
2. [Création du projet Firebase](#création-du-projet-firebase)
3. [Configuration Android](#configuration-android)
4. [Configuration iOS](#configuration-ios)
5. [Configuration Supabase](#configuration-supabase)
6. [Test des notifications](#test-des-notifications)
7. [Intégration dans l'application](#intégration-dans-lapplication)
8. [Troubleshooting](#troubleshooting)

---

## 🔧 Prérequis

- Compte Google/Firebase
- Accès à la [Firebase Console](https://console.firebase.google.com/)
- Accès à l'[Apple Developer Console](https://developer.apple.com/) (pour iOS)
- Node.js installé
- Supabase connecté au projet

---

## 🚀 Création du projet Firebase

### Étape 1 : Créer le projet

1. Allez sur [Firebase Console](https://console.firebase.google.com/)
2. Cliquez sur **"Ajouter un projet"**
3. Nommez-le `kwenda-app` (ou un nom de votre choix)
4. Désactivez Google Analytics (optionnel pour les notifs)
5. Cliquez sur **"Créer le projet"**

### Étape 2 : Ajouter les applications

Vous devez ajouter **6 applications** (3 Android + 3 iOS) :

| Application | Platform | Package/Bundle ID |
|-------------|----------|-------------------|
| Kwenda Client | Android | `cd.kwenda.client` |
| Kwenda Client | iOS | `cd.kwenda.client` |
| Kwenda Chauffeur | Android | `cd.kwenda.driver` |
| Kwenda Chauffeur | iOS | `cd.kwenda.driver` |
| Kwenda Partenaire | Android | `cd.kwenda.partner` |
| Kwenda Partenaire | iOS | `cd.kwenda.partner` |

---

## 🤖 Configuration Android

### Pour chaque application Android :

1. Dans Firebase Console, cliquez sur **"Ajouter une application"** → **Android**

2. Remplissez les informations :
   - **Nom du package Android** : `cd.kwenda.client` (ou driver/partner)
   - **Pseudo de l'application** : Kwenda Client (optionnel)
   - **Certificat de signature SHA-1** : (optionnel pour les notifs basiques)

3. Téléchargez `google-services.json`

4. Placez le fichier dans le bon dossier :
   ```
   firebase/client/google-services.json
   firebase/driver/google-services.json
   firebase/partner/google-services.json
   ```

### Vérification de la configuration Android

Le fichier `google-services.json` doit contenir :

```json
{
  "project_info": {
    "project_number": "123456789",
    "project_id": "kwenda-app"
  },
  "client": [{
    "client_info": {
      "android_client_info": {
        "package_name": "cd.kwenda.client"  // ← Vérifiez ce package
      }
    }
  }]
}
```

### Configuration Gradle (déjà fait)

Le projet est déjà configuré avec :

**android/build.gradle** :
```gradle
dependencies {
    classpath 'com.google.gms:google-services:4.4.0'
}
```

**android/app/build.gradle** :
```gradle
apply plugin: 'com.google.gms.google-services'

dependencies {
    implementation platform('com.google.firebase:firebase-bom:32.7.0')
    implementation 'com.google.firebase:firebase-messaging'
}
```

---

## 🍎 Configuration iOS

### Prérequis iOS

1. **Compte Apple Developer** (99$/an)
2. **Certificat APNs** (Apple Push Notification service)

### Étape 1 : Créer une clé APNs

1. Allez sur [Apple Developer > Keys](https://developer.apple.com/account/resources/authkeys/list)
2. Cliquez sur **"+"** pour créer une nouvelle clé
3. Cochez **"Apple Push Notifications service (APNs)"**
4. Téléchargez le fichier `.p8` (conservez-le précieusement !)
5. Notez le **Key ID** affiché

### Étape 2 : Configurer dans Firebase

1. Dans Firebase Console → Paramètres du projet → Cloud Messaging
2. Dans la section **"Apple app configuration"**
3. Uploadez votre fichier `.p8`
4. Entrez le **Key ID** et votre **Team ID**

### Étape 3 : Ajouter les apps iOS dans Firebase

Pour chaque application iOS :

1. Cliquez sur **"Ajouter une application"** → **iOS**
2. Remplissez :
   - **Bundle ID** : `cd.kwenda.client` (ou driver/partner)
   - **Pseudo** : Kwenda Client (optionnel)
   - **App Store ID** : (laissez vide pour l'instant)

3. Téléchargez `GoogleService-Info.plist`

4. Placez le fichier :
   ```
   firebase/client/GoogleService-Info.plist
   firebase/driver/GoogleService-Info.plist
   firebase/partner/GoogleService-Info.plist
   ```

### Configuration Xcode (déjà fait)

Le projet est configuré avec Capacitor Push Notifications. Vérifiez dans Xcode :

1. Ouvrez `ios/App/App.xcworkspace`
2. Sélectionnez la target **"App"**
3. Onglet **"Signing & Capabilities"**
4. Vérifiez que **"Push Notifications"** est activé
5. Vérifiez que **"Background Modes"** → **"Remote notifications"** est coché

---

## ⚡ Configuration Supabase

### Étape 1 : Obtenir la Server Key Firebase

1. Firebase Console → Paramètres du projet
2. Onglet **"Cloud Messaging"**
3. Copiez la **"Server Key"** (ou créez-en une si absente)

### Étape 2 : Ajouter le secret dans Supabase

1. Allez sur [Supabase Dashboard](https://supabase.com/dashboard)
2. Sélectionnez votre projet
3. **Settings** → **Edge Functions** → **Secrets**
4. Ajoutez un nouveau secret :
   - **Nom** : `FIREBASE_SERVER_KEY`
   - **Valeur** : Collez la Server Key

### Étape 3 : Vérifier les tables

Assurez-vous que la table `push_notification_tokens` existe :

```sql
CREATE TABLE IF NOT EXISTS public.push_notification_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('android', 'ios', 'web')),
  device_info JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, token)
);

-- Index pour les requêtes fréquentes
CREATE INDEX idx_push_tokens_user_id ON push_notification_tokens(user_id);
CREATE INDEX idx_push_tokens_active ON push_notification_tokens(is_active) WHERE is_active = true;
```

---

## 🧪 Test des notifications

### Test via Edge Function

```bash
# Depuis le terminal
curl -X POST 'https://wddlktajnhwhyquwcdgf.supabase.co/functions/v1/send-push-notification' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "user_id": "USER_UUID",
    "title": "Test notification",
    "body": "Ceci est un test !",
    "data": {
      "type": "test",
      "action": "open_app"
    }
  }'
```

### Test depuis l'application

```typescript
import { supabase } from '@/integrations/supabase/client';

const testNotification = async (userId: string) => {
  const { data, error } = await supabase.functions.invoke('send-push-notification', {
    body: {
      user_id: userId,
      title: 'Test Kwenda',
      body: 'Notification de test réussie !',
      priority: 'high',
      data: {
        type: 'test',
        timestamp: new Date().toISOString()
      }
    }
  });
  
  console.log('Result:', data, error);
};
```

### Test via Firebase Console

1. Firebase Console → Cloud Messaging
2. **"Envoyer votre premier message"**
3. Remplissez le titre et le texte
4. Ciblez par token ou topic
5. Envoyez !

---

## 📱 Intégration dans l'application

### Hook unifié (déjà implémenté)

```typescript
import { useUnifiedPushNotifications } from '@/hooks/useUnifiedPushNotifications';

const MyComponent = () => {
  const { 
    isEnabled, 
    requestPermission, 
    notifyTransport,
    notifyDelivery 
  } = useUnifiedPushNotifications();

  useEffect(() => {
    if (!isEnabled) {
      requestPermission();
    }
  }, [isEnabled]);

  // Notification pour une course assignée
  const onDriverAssigned = () => {
    notifyTransport('driver_assigned', 'Votre chauffeur arrive dans 5 min');
  };

  // Notification pour une livraison
  const onDeliveryPickedUp = () => {
    notifyDelivery('picked_up', 'Votre colis est en route');
  };
};
```

### Types de notifications disponibles

| Catégorie | Types |
|-----------|-------|
| **Transport** | `driver_assigned`, `driver_arrived`, `in_progress`, `completed` |
| **Livraison** | `confirmed`, `picked_up`, `in_transit`, `delivered` |
| **Location** | `pending`, `approved_by_partner`, `confirmed`, `in_progress`, `completed`, `cancelled` |
| **Paiement** | `success`, `failed`, `pending` |
| **Loterie** | `win`, `lose` |

---

## 🔧 Troubleshooting

### Notification non reçue sur Android

1. **Vérifiez google-services.json**
   ```bash
   node scripts/setup-firebase.js validate
   ```

2. **Vérifiez le token**
   - Ouvrez l'app
   - Vérifiez les logs Capacitor
   - Le token doit être enregistré dans `push_notification_tokens`

3. **Mode économie de batterie**
   - Désactivez l'optimisation batterie pour l'app
   - Paramètres → Apps → Kwenda → Batterie → Non restreint

4. **Canal de notification**
   - Android 8+ requiert des canaux
   - Vérifiez que le canal est créé

### Notification non reçue sur iOS

1. **Vérifiez GoogleService-Info.plist**
   ```bash
   node scripts/setup-firebase.js validate
   ```

2. **Certificat APNs**
   - Vérifiez la validité de la clé `.p8`
   - Vérifiez qu'elle est bien uploadée dans Firebase

3. **Capability Push**
   - Ouvrez Xcode
   - Vérifiez "Push Notifications" dans Capabilities

4. **Provisioning Profile**
   - Régénérez le profil avec Push activé
   - Réinstallez l'app

### Erreur "InvalidRegistration"

Le token est invalide. Causes possibles :
- L'app a été désinstallée/réinstallée
- Token expiré
- Mauvais environnement (dev vs prod)

**Solution** : Le système désactive automatiquement les tokens invalides.

### Erreur "MismatchSenderId"

Le Sender ID ne correspond pas.

**Vérifiez** :
1. Que `google-services.json` est le bon fichier
2. Que le `project_number` correspond au projet Firebase
3. Que vous utilisez la bonne Server Key

### Logs de debug

```typescript
// Dans l'app
import { secureLog } from '@/utils/secureLogger';

// Activer les logs détaillés
secureLog.setLevel('debug');
```

**Edge Function logs** :
- Supabase Dashboard → Edge Functions → send-push-notification → Logs

---

## 📊 Monitoring

### Métriques Firebase

- Firebase Console → Cloud Messaging → Reports
- Taux de livraison
- Taux d'ouverture
- Erreurs

### Logs Supabase

- Table `push_notifications` pour l'historique
- Table `activity_logs` pour le tracking

---

## 🔐 Sécurité

1. **Ne jamais exposer la Server Key** dans le code client
2. **Toujours utiliser les Edge Functions** pour envoyer les notifications
3. **Valider les permissions** avant d'envoyer
4. **Limiter le rate** d'envoi par utilisateur

---

## 📚 Ressources

- [Firebase Cloud Messaging Docs](https://firebase.google.com/docs/cloud-messaging)
- [Capacitor Push Notifications](https://capacitorjs.com/docs/apis/push-notifications)
- [APNs Configuration](https://developer.apple.com/documentation/usernotifications)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)

---

## ✅ Checklist finale

- [ ] Projet Firebase créé
- [ ] 3 apps Android ajoutées avec les bons packages
- [ ] 3 apps iOS ajoutées avec les bons bundle IDs
- [ ] Fichiers `google-services.json` téléchargés et placés
- [ ] Fichiers `GoogleService-Info.plist` téléchargés et placés
- [ ] Clé APNs `.p8` générée et uploadée dans Firebase
- [ ] `FIREBASE_SERVER_KEY` ajouté dans Supabase
- [ ] Edge Function `send-push-notification` déployée
- [ ] Table `push_notification_tokens` créée
- [ ] Test de notification réussi sur Android
- [ ] Test de notification réussi sur iOS
