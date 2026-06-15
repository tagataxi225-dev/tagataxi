# Kwenda - Plateforme de Mobilité Urbaine

## Présentation

Kwenda est une solution de mobilité urbaine développée sur mesure pour le marché africain francophone. La plateforme intègre trois services principaux :

- **Transport VTC** : Réservation taxi, moto-taxi, bus urbain avec tarification dynamique
- **Livraison** : Service express, standard et gros colis avec tracking temps réel
- **Marketplace** : E-commerce multi-vendeurs avec livraison intégrée

### Zones de déploiement

| Pays | Villes | Devise |
|------|--------|--------|
| RD Congo | Kinshasa, Lubumbashi, Kolwezi | CDF |
| Côte d'Ivoire | Abidjan | XOF |

---

## Architecture Technique

### Stack Technologique

| Composant | Technologie |
|-----------|-------------|
| Frontend | React 18, TypeScript 5, Vite 5 |
| UI Components | Tailwind CSS, Radix UI, Framer Motion |
| État applicatif | TanStack Query v5, Context API |
| Backend | Supabase (PostgreSQL 15, Edge Functions Deno) |
| Mobile natif | Capacitor 7 (iOS/Android) |
| Cartographie | Google Maps Platform (JS API, Directions, Places) |
| Temps réel | Supabase Realtime (WebSockets) |
| Authentification | Supabase Auth avec Row Level Security |

### Structure du Projet

```text
src/
├── components/           # Composants React réutilisables
│   ├── transport/        # Module VTC/Taxi
│   ├── delivery/         # Module Livraison
│   ├── marketplace/      # Module E-commerce
│   ├── admin/            # Interface administration
│   ├── driver/           # Interface chauffeur
│   └── ui/               # Composants UI génériques
├── hooks/                # Hooks métier personnalisés
├── services/             # Services d'infrastructure
├── pages/                # Routes de l'application
├── integrations/         # Connecteurs externes (Supabase)
└── utils/                # Utilitaires et helpers

supabase/
├── functions/            # Edge Functions (150+)
└── migrations/           # Migrations SQL
```

---

## Modules Fonctionnels

### Transport (VTC)

Gestion complète du cycle de réservation :
1. Sélection départ/arrivée avec autocomplétion Google Places
2. Estimation tarifaire basée sur distance et conditions de zone
3. Dispatch intelligent vers les chauffeurs disponibles
4. Tracking GPS temps réel pendant la course
5. Paiement via wallet interne (KwendaPay) ou espèces

### Livraison

Trois niveaux de service :
- **Flash** : Livraison express moto (< 2h)
- **Flex** : Livraison standard (même jour)
- **Maxicharge** : Transport gros colis par camion

### Marketplace

Place de marché multi-vendeurs avec :
- Catalogue produits avec modération
- Chat acheteur-vendeur intégré
- Système d'escrow pour paiements sécurisés
- Livraison automatique via le réseau de chauffeurs

---

## Développement

### Prérequis

- Node.js 20+
- Compte Supabase avec projet configuré
- Clés API Google Maps (Maps JS, Geocoding, Places, Directions)

### Installation

```bash
# Cloner le dépôt
git clone https://github.com/votre-org/kwenda.git
cd kwenda

# Installer les dépendances
npm install

# Configurer l'environnement
cp .env.example .env.local

# Lancer le serveur de développement
npm run dev
```

### Variables d'environnement

```env
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_GOOGLE_MAPS_KEY=AIza...
```

---

## Déploiement

### Web (Production)

```bash
npm run build
# Le dossier dist/ contient l'application optimisée
```

### Mobile (Android)

```bash
npm run build
npx cap sync android
# Ouvrir Android Studio : npx cap open android
# Générer l'APK/AAB depuis Android Studio
```

### Mobile (iOS)

```bash
npm run build
npx cap sync ios
# Ouvrir Xcode : npx cap open ios
# Générer l'IPA depuis Xcode
```

---

## Sécurité

- **Authentification** : JWT avec refresh automatique
- **Autorisation** : Row Level Security (RLS) sur toutes les tables sensibles
- **Chiffrement** : AES-256 pour les données wallet
- **Rate Limiting** : Protection des Edge Functions
- **Audit Trail** : Traçabilité complète des opérations financières

---

## Base de Données

Le schéma comprend 64 tables principales avec RLS activé :

| Catégorie | Tables principales |
|-----------|-------------------|
| Transport | `transport_bookings`, `driver_locations`, `ride_bids` |
| Livraison | `delivery_orders`, `delivery_driver_alerts` |
| Marketplace | `marketplace_products`, `marketplace_orders`, `conversations` |
| Utilisateurs | `clients`, `chauffeurs`, `admins`, `user_wallets` |
| Système | `subscription_plans`, `driver_subscriptions`, `pricing_rules` |

---

## Équipe

Développé par **ICON SARL** - Solutions digitales sur mesure pour l'Afrique

- **Architecture & Développement** : Équipe technique ICON
- **Infrastructure** : ITEC SARLU

---

## Licence

Propriétaire - Tous droits réservés © 2024 Kwenda Taxi SARL
