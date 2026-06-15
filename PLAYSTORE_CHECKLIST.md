# ✅ Checklist Play Store - Kwenda Client

## 📦 Informations Package

> ⚠️ **IMPORTANT** : Après avoir cloné le projet, modifiez manuellement :

```json
{
  "name": "kwenda-client",
  "version": "1.0.0",
  "private": true,
  ...
}
```

---

## 🎨 Icônes (✅ Toutes présentes)

| Fichier | Taille | Status |
|---------|--------|--------|
| `public/app-icon-192.png` | 192x192 | ✅ |
| `public/app-icon-512.png` | 512x512 | ✅ |
| `public/app-icon-1024.png` | 1024x1024 | ✅ |
| `public/app-icon-192-maskable.png` | 192x192 (maskable) | ✅ |
| `public/app-icon-512-maskable.png` | 512x512 (maskable) | ✅ |
| `public/app-icon-1024-maskable.png` | 1024x1024 (maskable) | ✅ |
| `public/apple-touch-icon.png` | 180x180 | ✅ |
| `public/favicon.ico` | Multi-size | ✅ |
| `public/splash-screen.png` | Splash | ✅ |

---

## 📱 Assets Play Store à Créer

### Screenshots (obligatoires)

Créez des captures d'écran de l'app (1080x1920 pixels) :

1. **Écran d'accueil** - Services (Transport, Livraison, Marketplace)
2. **Commande taxi** - Interface de réservation
3. **Carte** - Véhicules disponibles
4. **Suivi temps réel** - Course en cours
5. **Livraison** - Interface livraison
6. **Marketplace** - Produits
7. **KwendaPay** - Portefeuille
8. **Tombola** - Loterie

### Feature Graphic (obligatoire)

- Taille : **1024 x 500 pixels**
- Format : PNG ou JPEG
- Utilisez le logo Kwenda + slogan

### Icône Hi-res (obligatoire)

- Taille : **512 x 512 pixels**
- Utilisez `public/app-icon-512.png`

---

## 🔧 Configuration Android

### capacitor.config.ts

```typescript
const config: CapacitorConfig = {
  appId: 'cd.kwenda.app',
  appName: 'Kwenda Client',
  webDir: 'dist',
  server: {
    // Retirer pour production !
    // url: 'https://...',
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert']
    },
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#DC2626',
      showSpinner: false
    }
  }
};
```

### Version dans build.gradle

```gradle
android {
    defaultConfig {
        versionCode 1
        versionName "1.0.0"
    }
}
```

---

## 🔐 Sécurité

- [ ] Retirer `server.url` de capacitor.config.ts pour la production
- [ ] Créer un keystore de signature (voir BUILD_INSTRUCTIONS.md)
- [ ] Sauvegarder le keystore dans un endroit sûr
- [ ] Ne JAMAIS commiter le keystore dans Git

---

## 📝 Metadata Play Store

### Titre (30 car. max)
```
Kwenda Client - VTC Congo
```

### Description courte (80 car.)
```
Application de transport, livraison et marketplace au Congo (RDC, Côte d'Ivoire)
```

### Description complète
Voir `STORE_CLIENT.md`

### Catégorie
```
Maps & Navigation
```

### Contenu rating
```
Everyone (Tout public)
```

---

## 🌍 Pays de distribution

- 🇨🇩 République Démocratique du Congo
- 🇨🇮 Côte d'Ivoire

---

## 📋 Documents légaux

- [ ] Politique de confidentialité (URL publique requise)
- [ ] Conditions d'utilisation
- [ ] Conformité RGPD (si applicable)

---

## 🚀 Commandes de build

```bash
# 1. Cloner le projet
git clone [votre-repo]
cd kwenda

# 2. Installer les dépendances
npm install

# 3. Modifier package.json (version + nom)
# name: "kwenda-client"
# version: "1.0.0"

# 4. Build web
npm run build

# 5. Sync Capacitor
npx cap sync android

# 6. Ouvrir dans Android Studio
npx cap open android

# 7. Build > Generate Signed Bundle/APK
# Choisir Android App Bundle (.aab)
```

---

## ✅ Checklist finale avant soumission

### Code
- [ ] `package.json` version = `1.0.0`
- [ ] `package.json` name = `kwenda-client`
- [ ] `capacitor.config.ts` sans `server.url`
- [ ] `build.gradle` versionCode = 1
- [ ] `build.gradle` versionName = "1.0.0"

### Firebase
- [ ] `google-services.json` ajouté
- [ ] FCM configuré
- [ ] Server key dans Supabase secrets

### Assets
- [ ] Icône 512x512
- [ ] Feature graphic 1024x500
- [ ] 8 screenshots 1080x1920
- [ ] Splash screen

### Play Console
- [ ] App créée
- [ ] Metadata remplie
- [ ] Screenshots uploadées
- [ ] AAB uploadé
- [ ] Privacy policy URL
- [ ] Content rating complété
- [ ] Pays sélectionnés

---

## 🎉 Prêt à soumettre !

Une fois tous les éléments cochés, soumettez pour review.
Délai de review Google : 3-7 jours ouvrés.
