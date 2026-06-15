# 📱 GUIDE DE SOUMISSION AUX STORES

## **🎯 INFORMATIONS DE BASE**

### **Application Kwenda Taxi**
- **Nom** : Kwenda Taxi
- **Package ID** : `cd.kwenda.taxi`
- **Version** : 1.0.0
- **Catégorie** : Transport & Navigation

---

## **📋 MÉTADONNÉES POUR GOOGLE PLAY STORE**

### **Titre de l'application**
```
Kwenda Taxi - VTC Congo RDC
```

### **Description courte (80 caractères)**
```
Transport, livraison et marketplace à Kinshasa, Lubumbashi et Kolwezi
```

### **Description complète**
```
🚗 KWENDA TAXI - La révolution du transport en RDC !

Découvrez l'application VTC multimodale conçue spécialement pour les villes congolaises. Kwenda Taxi connecte passagers, chauffeurs et commerçants dans un écosystème innovant.

🌟 SERVICES PRINCIPAUX :
• 🚕 Transport VTC - Courses rapides et sûres
• 📦 Livraison Express - Flash, Flex et Maxicharge  
• 🛒 Marketplace - Achat/vente avec livraison intégrée
• 💰 KwendaPay - Portefeuille électronique sécurisé

🏆 AVANTAGES CLIENTS :
✓ Géolocalisation précise à Kinshasa, Lubumbashi et Kolwezi
✓ Tarification transparente en CDF
✓ Support 24/7 en français
✓ Programme de fidélité avec loterie gratuite
✓ Interface optimisée pour connexions locales

👨‍💼 POUR LES CHAUFFEURS :
✓ Revenus réguliers et flexibilité totale
✓ Système de défis et récompenses
✓ Formation gratuite et support technique
✓ Gestion simplifiée des courses

🏪 POUR LES COMMERÇANTS :
✓ Marketplace intégrée avec livraison
✓ Audience dans 3 grandes villes
✓ Paiements sécurisés
✓ Commission compétitive

🇨🇩 Fièrement développé en République Démocratique du Congo pour soutenir l'innovation locale et moderniser le transport urbain.

Téléchargez maintenant et rejoignez la communauté qui transforme Kinshasa !
```

### **Mots-clés**
```
taxi, vtc, transport, kinshasa, congo, rdc, livraison, marketplace, chauffeur
```

---

## **🍎 MÉTADONNÉES POUR APP STORE (iOS)**

### **Nom de l'app**
```
Kwenda Taxi
```

### **Sous-titre (30 caractères)**
```
Transport VTC Congo RDC
```

### **Description**
```
🚗 KWENDA TAXI - Transport intelligent en RDC

L'application VTC révolutionnaire pour Kinshasa, Lubumbashi et Kolwezi. Connectez-vous à un écosystème complet de transport, livraison et marketplace.

SERVICES :
• Transport VTC fiable et rapide
• Livraison express multi-format
• Marketplace avec livraison intégrée
• Portefeuille KwendaPay sécurisé

AVANTAGES :
• Géolocalisation optimisée pour les villes congolaises
• Support en français 24/7
• Tarification transparente en CDF
• Programme de fidélité exclusif

Développé avec ❤️ au Congo pour moderniser le transport urbain africain.
```

### **Mots-clés (100 caractères)**
```
taxi,vtc,transport,kinshasa,congo,livraison,chauffeur,marketplace
```

---

## **🎨 ASSETS REQUIS**

### **✅ DÉJÀ DISPONIBLES**
- Icône app : `public/app-icon-1024.png` (1024x1024)
- Splash screen : `public/splash-screen.png` (1920x1080)
- Favicons multiples tailles

### **📱 CAPTURES D'ÉCRAN NÉCESSAIRES**
Générer 5-8 captures pour chaque plateforme :

**Android (Google Play)**
- 1080x1920 (Portrait)
- 1920x1080 (Paysage) - optionnel

**iOS (App Store)**
- iPhone 6.7" : 1290x2796
- iPhone 6.5" : 1242x2688
- iPhone 5.5" : 1242x2208
- iPad : 2048x2732

---

## **⚙️ COMMANDES DE BUILD**

### **1. Préparation**
```bash
# Build production
npm run build

# Sync Capacitor
npx cap sync
```

### **2. Android (APK/AAB)**
```bash
# Ajouter plateforme Android
npx cap add android

# Build Android
npx cap build android

# Ou directement depuis Android Studio
npx cap open android
```

### **3. iOS (IPA)**
```bash
# Ajouter plateforme iOS
npx cap add ios

# Build iOS
npx cap build ios

# Ou directement depuis Xcode
npx cap open ios
```

---

## **🔒 CONFIGURATION SÉCURITÉ**

### **Permissions Android**
```xml
<!-- Déjà configurées dans capacitor.config.ts -->
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_BACKGROUND_LOCATION" />
<uses-permission android:name="android.permission.CAMERA" />
```

### **Permissions iOS**
```xml
<!-- Info.plist automatiquement généré -->
NSLocationWhenInUseUsageDescription
NSLocationAlwaysAndWhenInUseUsageDescription
NSCameraUsageDescription
```

---

## **📈 ANALYTICS & MONITORING**

### **Google Play Console**
- Suivre les métriques de téléchargement
- Analyser les crash reports
- Monitoring des performances

### **App Store Connect**
- Suivi des téléchargements iOS
- Gestion des versions TestFlight
- Analyse des reviews utilisateurs

---

## **🚀 PROCHAINES ÉTAPES**

1. **Finaliser le build** avec `npm run build`
2. **Tester sur appareils** physiques
3. **Générer captures d'écran** représentatives
4. **Soumettre sur Google Play** (review 24-48h)
5. **Soumettre sur App Store** (review 1-7 jours)
6. **Mettre à jour landing page** avec liens stores réels

---

## **📞 SUPPORT TECHNIQUE**

En cas de problème durant la soumission :
- Vérifier les logs Capacitor
- Tester la géolocalisation sur appareil réel
- Valider les permissions natives
- Consulter la documentation officielle stores