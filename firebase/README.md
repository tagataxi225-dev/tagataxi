# 🔥 Firebase Configuration - Kwenda Super App

## Configuration Unique

Kwenda est une **Super App** avec un seul package ID : `cd.kwenda.app`

### Structure des fichiers

```
firebase/
├── google-services.json          # Configuration Android (à télécharger)
├── GoogleService-Info.plist      # Configuration iOS (à télécharger)
└── templates/
    ├── google-services.template.json
    └── GoogleService-Info.template.plist
```

## 📱 Configuration Firebase

### 1. Créer le projet Firebase

1. Aller sur [Firebase Console](https://console.firebase.google.com/)
2. Créer un nouveau projet : **kwenda-app**
3. Activer Google Analytics (optionnel)

### 2. Ajouter l'application Android

1. Cliquer sur **"Ajouter une application"** → Android
2. Package name : `cd.kwenda.app`
3. Nickname : `Kwenda`
4. Télécharger `google-services.json`
5. Placer le fichier dans `firebase/google-services.json`

### 3. Ajouter l'application iOS

1. Cliquer sur **"Ajouter une application"** → iOS
2. Bundle ID : `cd.kwenda.app`
3. App nickname : `Kwenda`
4. Télécharger `GoogleService-Info.plist`
5. Placer le fichier dans `firebase/GoogleService-Info.plist`

### 4. Activer Cloud Messaging

1. Aller dans **Project Settings** → **Cloud Messaging**
2. Activer **Cloud Messaging API (V1)**
3. Pour iOS : Ajouter la clé APNs (voir FIREBASE_PUSH_COMPLETE.md)

### 5. Récupérer la Server Key

1. Dans **Project Settings** → **Cloud Messaging**
2. Copier la **Server Key**
3. L'ajouter dans Supabase Secrets comme `FIREBASE_SERVER_KEY`

## 🚀 Après configuration

Les fichiers seront automatiquement copiés lors du build :
- `google-services.json` → `android/app/google-services.json`
- `GoogleService-Info.plist` → `ios/App/App/GoogleService-Info.plist`

## 📖 Documentation complète

Voir [FIREBASE_PUSH_COMPLETE.md](../FIREBASE_PUSH_COMPLETE.md) pour le guide détaillé.
