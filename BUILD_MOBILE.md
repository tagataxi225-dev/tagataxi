# 📱 Guide de Build Mobile - Kwenda

## Configuration actuelle

| Paramètre | Valeur |
|-----------|--------|
| App ID | `cd.kwenda.app` |
| App Name | `Kwenda` |
| Web Directory | `dist` |
| Min SDK Android | 22 |
| Target SDK Android | 34 |

---

## 🚀 Étapes de build

### 1. Cloner et installer

```bash
git clone https://github.com/votre-username/kwenda.git
cd kwenda
npm install
```

### 2. Construire l'application web

```bash
npm run build
```

### 3. Ajouter les plateformes natives

**Android :**
```bash
# Supprimer le dossier android incomplet si existant
rm -rf android

# Ajouter Android
npx cap add android
```

**iOS (Mac requis) :**
```bash
npx cap add ios
```

### 4. Synchroniser Capacitor

```bash
npx cap sync
```

### 5. Configurer Firebase (notifications push)

1. Aller sur [Firebase Console](https://console.firebase.google.com)
2. Créer ou sélectionner le projet `kwenda-app`
3. Ajouter une app Android avec le package `cd.kwenda.app`
4. Télécharger `google-services.json`
5. Copier dans le projet :

```bash
cp ~/Downloads/google-services.json android/app/google-services.json
```

### 6. Ouvrir dans l'IDE

**Android Studio :**
```bash
npx cap open android
```

**Xcode (iOS) :**
```bash
npx cap open ios
```

---

## 📦 Générer l'APK/AAB signé

### Créer un keystore (première fois uniquement)

```bash
keytool -genkey -v -keystore kwenda-release.keystore \
  -alias kwenda \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000
```

⚠️ **IMPORTANT** : Conservez précieusement ce fichier et les mots de passe !

### Build via Android Studio

1. **Build > Generate Signed Bundle / APK**
2. Sélectionner **Android App Bundle** (pour Play Store)
3. Choisir le keystore créé
4. Sélectionner **release**
5. Le fichier `.aab` sera dans `android/app/release/`

### Build en ligne de commande

```bash
cd android
./gradlew bundleRelease
```

---

## 🍎 Build iOS

### Prérequis
- Mac avec Xcode 15+
- Compte Apple Developer (99$/an)

### Étapes

1. `npx cap open ios`
2. Dans Xcode : **Product > Archive**
3. **Distribute App > App Store Connect**

---

## ✅ Checklist pré-publication

### Assets graphiques

- [ ] Icône 512x512 PNG (sans transparence)
- [ ] Feature Graphic 1024x500 PNG
- [ ] 8+ captures d'écran 1080x1920 (téléphone)
- [ ] Captures tablette 7" et 10" (optionnel)

### Documents légaux

- [ ] Politique de confidentialité (URL publique)
- [ ] Conditions d'utilisation (URL publique)

### Configuration

- [ ] `google-services.json` en place
- [ ] Keystore sauvegardé en lieu sûr
- [ ] Supprimer `server.url` dans `capacitor.config.ts` pour production
- [ ] Tester sur appareil physique

### Compte développeur

- [ ] Google Play Console (25$ une fois)
- [ ] Apple Developer Program (99$/an pour iOS)

---

## 🔧 Scripts npm disponibles

```bash
# Build web + sync Capacitor
npm run cap:build

# Synchroniser Capacitor
npm run cap:sync

# Ouvrir Android Studio
npm run cap:open:android

# Ouvrir Xcode
npm run cap:open:ios

# Build complet Android
npm run android:build

# Build complet iOS
npm run ios:build
```

---

## 📝 Configuration production

Avant de publier, modifier `capacitor.config.ts` :

```typescript
const config: CapacitorConfig = {
  appId: 'cd.kwenda.app',
  appName: 'Kwenda',
  webDir: 'dist',
  
  // ⚠️ COMMENTER pour production
  // server: {
  //   url: "https://...",
  //   cleartext: true
  // },
  
  // ... reste de la config
};
```

---

## 🐛 Dépannage

### "capacitor.config.ts not found"
```bash
npx cap init
```

### "android folder is empty"
```bash
rm -rf android
npx cap add android
npx cap sync
```

### "google-services.json missing"
Télécharger depuis Firebase Console et placer dans `android/app/`

### "Build failed: SDK not found"
Ouvrir Android Studio > SDK Manager > Installer SDK 34

---

## 📊 Informations Play Store

**Catégorie** : Cartes et navigation  
**Classification** : Tout public (PEGI 3)  
**Pays cible** : RDC (Kinshasa, Lubumbashi, Kolwezi)  
**Langues** : Français, Anglais

---

## 📞 Support

Pour toute question sur le build mobile :
- Email : dev@kwenda.cd
- Documentation Capacitor : https://capacitorjs.com/docs
