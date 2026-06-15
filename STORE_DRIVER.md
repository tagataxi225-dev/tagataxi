# Kwenda Driver - Soumission Stores

## 📱 Informations Application

- **Nom**: Kwenda Driver - Chauffeur VTC
- **Package ID**: `cd.kwenda.driver`
- **Version**: 1.0.0
- **Catégorie**: Business / Productivity
- **Langues**: Français (FR), Anglais (EN)

## 📝 Store Metadata

### Google Play Store

**Titre** (30 caractères max)
```
Kwenda Driver - VTC Pro
```

**Description courte** (80 caractères)
```
Application professionnelle pour chauffeurs VTC et livreurs au Congo
```

**Description complète**
```
🚗 KWENDA DRIVER - Votre Espace Professionnel de Chauffeur VTC

Rejoignez des milliers de chauffeurs qui gagnent leur vie avec Kwenda Driver !

🌍 ZONES ACTIVES
• Kinshasa (RDC)
• Lubumbashi (RDC)
• Kolwezi (RDC)
• Abidjan (Côte d'Ivoire) - En test

💼 FONCTIONNALITÉS PROFESSIONNELLES

🎯 GESTION DES COURSES
• Acceptation intelligente de courses
• Notification instantanée des demandes
• GPS en temps réel avec navigation
• Suivi kilométrique automatique
• Historique complet des trajets

💰 REVENUS TRANSPARENTS
• Dashboard gains en temps réel
• Détail des commissions par course
• Statistiques quotidiennes/hebdomadaires/mensuelles
• Retraits rapides vers Mobile Money
• Portefeuille KwendaPay intégré

🏆 SYSTÈME DE DÉFIS
• Challenges quotidiens et hebdomadaires
• Récompenses et bonus
• Programme de fidélité conducteur
• Avantages exclusifs

📊 STATISTIQUES AVANCÉES
• Performance détaillée
• Note moyenne clients
• Taux d'acceptation
• Zones les plus rentables
• Temps de travail optimisé

🚀 SERVICES DISPONIBLES
• Transport VTC (Taxi, Moto-taxi, Bus)
• Livraison Express (Flash, Flex, Maxicharge)
• Multi-services selon votre véhicule

🔐 SÉCURITÉ ET SUPPORT
• Vérification d'identité obligatoire
• Assurance incluse
• Support 24/7 dédié chauffeurs
• Système d'urgence intégré
• Protection des données personnelles

📱 FONCTIONNALITÉS TECHNIQUES
• Mode hors ligne intelligent
• Géolocalisation background optimisée
• Notifications push temps réel
• Interface optimisée conduite
• Faible consommation batterie

💡 AVANTAGES KWENDA DRIVER
✅ Inscription rapide et gratuite
✅ Commissions transparentes
✅ Paiements hebdomadaires garantis
✅ Pas de loyer de véhicule
✅ Liberté totale d'horaires
✅ Formation gratuite incluse

📈 AUGMENTEZ VOS REVENUS
• Zones de forte demande en temps réel
• Tarification dynamique (surge pricing)
• Codes de parrainage rémunérés
• Bonus de performance

Téléchargez Kwenda Driver et commencez à gagner dès aujourd'hui ! 💪
```

**Mots-clés**
```
chauffeur, VTC, driver, taxi, Congo, Kinshasa, livreur, revenus, business, Kwenda
```

### Apple App Store

**Titre** (30 caractères max)
```
Kwenda Driver - VTC Pro
```

**Sous-titre** (30 caractères)
```
Chauffeur VTC Professionnel
```

**Description**
```
(Même description que Google Play)
```

**Mots-clés** (100 caractères max)
```
chauffeur,VTC,driver,taxi,Congo,Kinshasa,livreur,business,Kwenda
```

## 🎨 Assets Requis

### Icônes Application
- ✅ `icon-192.png` (192x192) - Design jaune/orange
- ✅ `icon-512.png` (512x512)
- ✅ `icon-1024.png` (1024x1024)

### Splash Screen
- ✅ `splash.png` (1920x1080)
- Fond jaune/orange (#F59E0B)
- Logo Kwenda avec volant

### Captures d'écran

**Android (min 2, recommandé 8)**
- 1080x1920 pixels (portrait)
1. Dashboard chauffeur avec statistiques
2. Notification de demande de course
3. Carte avec position et destination
4. Interface de navigation GPS
5. Détail des gains du jour
6. Historique des courses
7. Système de défis et récompenses
8. Profil et documents

**iOS (min 3, recommandé 10)**
- 1242x2688 pixels (iPhone 11 Pro Max)
- Mêmes écrans que Android

## 🔐 Configuration Sécurité

### Permissions Android
```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_BACKGROUND_LOCATION" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
<uses-permission android:name="android.permission.WAKE_LOCK" />
<uses-permission android:name="android.permission.CAMERA" />
```

### Permissions iOS (Info.plist)
```xml
<key>NSLocationWhenInUseUsageDescription</key>
<string>Kwenda Driver nécessite votre position pour vous connecter avec les clients</string>
<key>NSLocationAlwaysAndWhenInUseUsageDescription</key>
<string>Kwenda Driver suit votre position en arrière-plan pendant les courses actives</string>
<key>UIBackgroundModes</key>
<array>
  <string>location</string>
  <string>background-fetch</string>
</array>
<key>NSCameraUsageDescription</key>
<string>Autoriser la caméra pour vérifier vos documents</string>
```

## 📊 Analytics & Monitoring

### Google Play Console
- Installations actives
- Taux de rétention chauffeurs
- Crashs et ANR
- Feedback chauffeurs

### App Store Connect
- Téléchargements
- Sessions de conduite
- Métriques de performance GPS
- Retours conducteurs

## 🚀 Build Commands

```bash
# Build Android
npm run build:driver
npm run cap:sync:driver
npx cap build android --release

# Build iOS
npm run build:driver
npm run cap:sync:driver
npx cap build ios --release
```

## ✅ Checklist Pre-Soumission

- [ ] Version code incrémentée
- [ ] Certificats de signature configurés
- [ ] Tests géolocalisation background
- [ ] Tests notifications push
- [ ] Tests mode économie batterie
- [ ] Tests sur devices physiques (GPS réel)
- [ ] Captures d'écran conducteur professionnelles
- [ ] Descriptions traduites FR/EN
- [ ] Contrat chauffeur publié
- [ ] Politique de commission transparente
- [ ] Support chauffeur configuré

## 📞 Contact Support Chauffeur

- **Email**: driver@kwenda.app
- **Support WhatsApp**: +243 XXX XXX XXX
- **Site web**: https://kwenda.app/drivers
- **FAQ Chauffeurs**: https://kwenda.app/support/drivers-faq
