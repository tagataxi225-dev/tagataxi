# Kwenda Client - Soumission Stores

## 📱 Informations Application

- **Nom**: Kwenda Client
- **Package ID**: `cd.kwenda.client`
- **Version**: 1.0.0
- **Catégorie**: Travel & Local / Business
- **Langues**: Français (FR), Anglais (EN)

## 📝 Store Metadata

### Google Play Store

**Titre** (30 caractères max)
```
Kwenda Client - VTC Congo
```

**Description courte** (80 caractères)
```
Application de transport, livraison et marketplace au Congo (RDC, Côte d'Ivoire)
```

**Description complète**
```
🚗 KWENDA CLIENT - Votre Application de Transport Intelligent

Découvrez Kwenda Client, l'application qui révolutionne le transport en Afrique francophone !

🌍 DISPONIBLE DANS VOS VILLES
• Kinshasa (RDC)
• Lubumbashi (RDC)
• Kolwezi (RDC)
• Abidjan (Côte d'Ivoire) - En test

✨ SERVICES INCLUS

🚕 TRANSPORT VTC
• Taxi-bus, Moto-taxi, VTC privé
• Tarification transparente et dynamique
• Suivi GPS en temps réel
• Paiement sécurisé (Cash, Mobile Money, KwendaPay)

📦 LIVRAISON EXPRESS
• Flash : Livraison moto ultra-rapide
• Flex : Livraison standard économique
• Maxicharge : Colis volumineux
• Tracking temps réel de vos colis

🛍️ MARKETPLACE INTÉGRÉ
• E-commerce local
• Chat avec les vendeurs
• Livraison à domicile
• Produits locaux et importés

🎰 KWENDA TOMBOLA
• Tickets gratuits à chaque commande
• Tirages quotidiens
• Gains en crédits KwendaPay

💰 KWENDA PAY - PORTEFEUILLE INTÉGRÉ
• Recharge facile
• Paiements rapides
• Programme de fidélité
• Historique complet

🔐 SÉCURITÉ ET FIABILITÉ
• Chauffeurs vérifiés et notés
• Support client 24/7
• Assurance incluse
• Traçabilité complète

📍 CARACTÉRISTIQUES
• Interface multilingue (FR/EN)
• Mode hors ligne intelligent
• Adresses favorites
• Partage de trajet
• Estimations de prix instantanées

Téléchargez Kwenda Client et rejoignez la révolution du transport en Afrique ! 🚀
```

**Mots-clés**
```
VTC, taxi, Congo, Kinshasa, transport, livraison, marketplace, RDC, moto-taxi, Kwenda
```

### Apple App Store

**Titre** (30 caractères max)
```
Kwenda Client - VTC Congo
```

**Sous-titre** (30 caractères)
```
Transport & Livraison Afrique
```

**Description**
```
(Même description que Google Play)
```

**Mots-clés** (100 caractères max)
```
VTC,taxi,Congo,Kinshasa,transport,livraison,marketplace,RDC,Kwenda
```

## 🎨 Assets Requis

### Icônes Application
- ✅ `icon-192.png` (192x192)
- ✅ `icon-512.png` (512x512)
- ✅ `icon-1024.png` (1024x1024)

### Splash Screen
- ✅ `splash.png` (1920x1080)
- Fond rouge (#DC2626)
- Logo Kwenda blanc

### Captures d'écran

**Android (min 2, recommandé 8)**
- 1080x1920 pixels (portrait)
1. Écran d'accueil avec services (Transport, Livraison, Marketplace)
2. Interface de commande de taxi
3. Carte avec véhicules disponibles
4. Suivi en temps réel d'une course
5. Interface de livraison express
6. Marketplace avec produits
7. Portefeuille KwendaPay
8. Programme tombola

**iOS (min 3, recommandé 10)**
- 1242x2688 pixels (iPhone 11 Pro Max)
- Mêmes écrans que Android

**Tablette (optionnel)**
- 2048x2732 pixels (iPad Pro 12.9")

## 🔐 Configuration Sécurité

### Permissions Android
```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.CAMERA" />
```

### Permissions iOS (Info.plist)
```xml
<key>NSLocationWhenInUseUsageDescription</key>
<string>Kwenda utilise votre position pour trouver les chauffeurs à proximité</string>
<key>NSCameraUsageDescription</key>
<string>Autoriser l'accès à la caméra pour ajouter des photos de profil</string>
```

## 📊 Analytics & Monitoring

### Google Play Console
- Installations actives
- Taux de rétention
- Crashs et ANR
- Avis utilisateurs

### App Store Connect
- Téléchargements
- Sessions actives
- Métriques de performance
- Retours utilisateurs

## 🚀 Build Commands

```bash
# Build Android
npm run build:client
npm run cap:sync:client
npx cap build android --release

# Build iOS
npm run build:client
npm run cap:sync:client
npx cap build ios --release
```

## ✅ Checklist Pre-Soumission

- [ ] Version code incrémentée
- [ ] Certificats de signature configurés
- [ ] Tests sur émulateurs Android (API 21+)
- [ ] Tests sur simulateurs iOS (iOS 13+)
- [ ] Tests sur devices physiques
- [ ] Captures d'écran haute résolution prêtes
- [ ] Descriptions traduites FR/EN
- [ ] Politique de confidentialité publiée
- [ ] Conditions d'utilisation publiées
- [ ] Support email configuré (support@kwenda.app)

## 📞 Contact Support

- **Email**: support@kwenda.app
- **Site web**: https://kwenda.app
- **Politique de confidentialité**: https://kwenda.app/legal/privacy
- **Conditions d'utilisation**: https://kwenda.app/legal/terms
