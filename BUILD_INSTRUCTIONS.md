# 📱 Guide de Build Kwenda pour Play Store & App Store

## 🎯 Prérequis

### Outils nécessaires
- **Node.js** 18+ et npm
- **Git** pour cloner le projet
- **Android Studio** (pour Android)
- **Xcode 15+** (pour iOS, Mac uniquement)

### Comptes développeur requis
- **Google Play Console** (pour Android)
- **Apple Developer Program** (pour iOS, 99$/an)

---

## 📥 Étape 1 : Cloner et installer le projet

```bash
# Cloner depuis GitHub
git clone https://github.com/votre-repo/kwenda.git
cd kwenda

# Installer les dépendances
npm install
```

---

## 🏗️ Étape 2 : Build du projet web

```bash
# Build de production
npm run build

# Vérifier que le dossier dist/ a été créé
ls -la dist/
```

---

## 📱 Étape 3 : Ajouter les plateformes natives

### Première fois uniquement

```bash
# Ajouter Android
npx cap add android

# Ajouter iOS (Mac uniquement)
npx cap add ios
```

> **Note** : Ces commandes créent les dossiers `android/` et `ios/` avec la configuration native.

---

## 🔄 Étape 4 : Synchroniser le code web avec les apps natives

À faire **après chaque modification du code web** :

```bash
# Synchroniser les changements
npx cap sync

# Ou synchroniser une plateforme spécifique
npx cap sync android
npx cap sync ios
```

> **Important** : `npx cap sync` copie le build web dans les projets natifs et met à jour les plugins.

---

## 🤖 Étape 5 : Build Android pour Google Play Store

### 5.1 - Ouvrir le projet dans Android Studio

```bash
npx cap open android
```

### 5.2 - Configurer le signing

1. Dans Android Studio, aller dans **Build** → **Generate Signed Bundle/APK**
2. Sélectionner **Android App Bundle (AAB)**
3. Créer ou choisir un keystore :
   - **Key store path** : `kwenda-release-key.jks`
   - **Key store password** : Votre mot de passe
   - **Key alias** : `kwenda`
   - **Key password** : Votre mot de passe

> **Sauvegarder** : Conservez précieusement votre keystore et vos mots de passe !

### 5.3 - Générer l'AAB de production

1. Cliquer sur **Next**
2. Sélectionner **release** comme Build Variant
3. Cocher **V1 (Jar Signature)** et **V2 (Full APK Signature)**
4. Cliquer sur **Finish**

Le fichier AAB sera généré dans :
```
android/app/release/app-release.aab
```

### 5.4 - Tester l'AAB localement (optionnel)

```bash
# Installer bundletool
curl -LO https://github.com/google/bundletool/releases/latest/download/bundletool-all.jar

# Générer un APK universel pour tester
java -jar bundletool-all.jar build-apks \
  --bundle=android/app/release/app-release.aab \
  --output=kwenda.apks \
  --mode=universal

# Extraire l'APK
unzip kwenda.apks -d apk/

# Installer sur un appareil connecté
adb install apk/universal.apk
```

### 5.5 - Uploader sur Google Play Console

1. Aller sur [Google Play Console](https://play.google.com/console)
2. Sélectionner votre application ou créer une nouvelle application
3. Aller dans **Production** → **Créer une version**
4. Uploader le fichier `app-release.aab`
5. Remplir les informations (notes de version, captures d'écran, etc.)
6. Soumettre pour révision

---

## 🍎 Étape 6 : Build iOS pour Apple App Store

### 6.1 - Ouvrir le projet dans Xcode

```bash
npx cap open ios
```

### 6.2 - Configurer le projet iOS

1. Sélectionner le projet `App` dans la sidebar
2. Onglet **Signing & Capabilities** :
   - Cocher **Automatically manage signing**
   - Sélectionner votre **Team** (Apple Developer)
   - Vérifier le **Bundle Identifier** : `cd.kwenda.client`

### 6.3 - Configurer les capabilities requises

Dans Xcode, onglet **Signing & Capabilities**, ajouter :
- ✅ Background Modes → Location updates
- ✅ Push Notifications
- ✅ Maps

### 6.4 - Créer une Archive

1. Sélectionner **Any iOS Device** dans la barre d'outils
2. Menu **Product** → **Archive**
3. Attendre la fin du processus (peut prendre 5-10 min)

### 6.5 - Distribuer sur App Store Connect

1. Une fois l'archive créée, la fenêtre **Organizer** s'ouvre
2. Sélectionner votre archive
3. Cliquer sur **Distribute App**
4. Choisir **App Store Connect**
5. Suivre les étapes :
   - Upload → Next
   - Automatically manage signing → Next
   - Upload

### 6.6 - Finaliser sur App Store Connect

1. Aller sur [App Store Connect](https://appstoreconnect.apple.com)
2. Sélectionner votre application
3. Dans **TestFlight**, vérifier que le build apparaît (après traitement)
4. Aller dans **App Store** → **Préparer pour soumission**
5. Remplir toutes les informations requises :
   - Captures d'écran (iPhone 6.7", 6.5", 5.5")
   - Description
   - Mots-clés
   - Support URL
   - Privacy Policy URL
6. Soumettre pour révision

---

## 🎨 Étape 7 : Préparer les assets (icônes et splash screens)

### Android

Les icônes sont dans `android/app/src/main/res/` :

```
mipmap-hdpi/ic_launcher.png (72x72)
mipmap-mdpi/ic_launcher.png (48x48)
mipmap-xhdpi/ic_launcher.png (96x96)
mipmap-xxhdpi/ic_launcher.png (144x144)
mipmap-xxxhdpi/ic_launcher.png (192x192)
```

### iOS

Les icônes sont dans `ios/App/App/Assets.xcassets/AppIcon.appiconset/` :

- Icône requise : 1024x1024 (App Store)
- Générer toutes les tailles dans Xcode

### Splash Screens

Configurer dans `capacitor.config.ts` :

```typescript
{
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#ffffff",
      androidSplashResourceName: "splash",
      iosLaunchAnimation: "fade"
    }
  }
}
```

---

## 📋 Checklist avant soumission

### Configuration Capacitor
- ✅ `appId` configuré : `cd.kwenda.client`
- ✅ `appName` défini : `Kwenda`
- ✅ Permissions géolocalisation configurées
- ✅ Push notifications configurées
- ✅ Clés API Google Maps ajoutées

### Android
- ✅ Version code incrémentée dans `android/app/build.gradle`
- ✅ Version name mise à jour (ex: 1.0.0 → 1.0.1)
- ✅ Keystore configuré et sauvegardé
- ✅ AAB généré en mode release
- ✅ Captures d'écran préparées (720x1280, 1080x1920)

### iOS
- ✅ Version incrémentée dans Xcode (Build et Version)
- ✅ Bundle ID vérifié : `cd.kwenda.client`
- ✅ Certificats et profils de provisioning valides
- ✅ Capabilities configurées (Location, Push, Maps)
- ✅ Captures d'écran préparées (iPhone 6.7", 6.5", 5.5")

### Stores
- ✅ Description app traduite FR/EN
- ✅ Mots-clés SEO définis
- ✅ Privacy Policy URL valide
- ✅ Support URL/Email configuré
- ✅ Vidéo de démo (optionnel mais recommandé)

---

## 🔄 Workflow de mise à jour

Pour publier une nouvelle version après des changements :

```bash
# 1. Pull des dernières modifications
git pull origin main

# 2. Installer les dépendances si nécessaire
npm install

# 3. Build du projet web
npm run build

# 4. Synchroniser avec les plateformes natives
npx cap sync

# 5. Incrémenter les versions
# Android : android/app/build.gradle
#   versionCode 2 → 3
#   versionName "1.0.0" → "1.0.1"
# iOS : Xcode → General → Version et Build

# 6. Ouvrir dans l'IDE et rebuild
npx cap open android  # ou ios

# 7. Générer AAB/IPA et uploader
```

---

## 🆘 Problèmes courants

### Android : "App not installed"
```bash
# Désinstaller l'ancienne version
adb uninstall cd.kwenda.client

# Réinstaller
adb install app-release.apk
```

### iOS : "Signing certificate expired"
1. Aller dans Xcode → Preferences → Accounts
2. Télécharger les certificats manuellement
3. Re-signer le projet

### Capacitor : "Plugin not found"
```bash
# Réinstaller les plugins
npm install
npx cap sync
```

### Build web ne se met pas à jour
```bash
# Nettoyer et rebuild
rm -rf dist/
npm run build
npx cap copy
```

---

## 📚 Ressources officielles

- **Capacitor** : https://capacitorjs.com/docs
- **Google Play Console** : https://play.google.com/console/developers
- **App Store Connect** : https://appstoreconnect.apple.com
- **Kwenda Docs** : Voir `STORE_CLIENT.md`, `STORE_DRIVER.md`, `STORE_PARTNER.md`

---

## ✅ Résumé des commandes essentielles

```bash
# Setup initial
npm install
npm run build
npx cap add android
npx cap add ios

# Développement
npm run build
npx cap sync
npx cap open android
npx cap open ios

# Mise à jour
git pull
npm install
npm run build
npx cap sync
```

---

**🎉 Bon courage pour la publication de Kwenda sur les stores !**
