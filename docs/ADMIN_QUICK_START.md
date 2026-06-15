# 🚀 Guide Rapide Admin - Kwenda Taxi

## 📍 Accès Admin

### URL de Connexion
```
Production: https://[votre-domaine]/operatorx/admin/auth
Développement: http://localhost:5173/operatorx/admin/auth
```

### Compte Super Admin
- **Email** : support@icon-sarl.com
- **Mot de passe** : [Configuré dans Supabase Auth]

---

## 🔐 Rôles et Permissions

### Hiérarchie des Rôles

#### 🟣 Super Admin (Accès Total)
**27 permissions** - Contrôle complet du système
- ✅ Gestion complète utilisateurs, chauffeurs, partenaires
- ✅ Configuration système et sécurité
- ✅ Accès analytics et rapports financiers
- ✅ Modération tous contenus (marketplace, food, restaurants)
- ✅ Gestion rôles et permissions
- ✅ Support client niveau 3

#### 🔵 Admin Support
**11 permissions** - Support client avancé
- ✅ Gestion tickets support
- ✅ Modération utilisateurs et contenus
- ✅ Accès analytics basique
- ❌ Pas de configuration système
- ❌ Pas de gestion financière

#### 🟢 Admin Financier
**8 permissions** - Gestion financière
- ✅ Dashboards financiers
- ✅ Gestion abonnements et commissions
- ✅ Rapports revenus
- ❌ Pas de modération contenus
- ❌ Pas de configuration système

#### 🟡 Admin Transport
**8 permissions** - Gestion transport
- ✅ Validation chauffeurs
- ✅ Gestion tarifs et zones
- ✅ Configuration types véhicules
- ❌ Pas d'accès marketplace/food
- ❌ Pas de gestion utilisateurs

#### 🟠 Admin Marketplace
**7 permissions** - Gestion e-commerce
- ✅ Modération produits marketplace
- ✅ Validation vendeurs
- ✅ Gestion catégories
- ❌ Pas d'accès transport
- ❌ Pas de gestion restaurants

#### 🔴 Moderator
**6 permissions** - Modération basique
- ✅ Modération contenus (produits, commentaires)
- ✅ Signalements utilisateurs
- ❌ Pas de validation chauffeurs/restaurants
- ❌ Pas de gestion financière

---

## 📋 Workflows de Modération

### 1. Validation Chauffeur (Priorité : Haute)

**Objectif** : < 24h de délai de validation

#### Étapes
1. **Aller dans** : Dashboard Admin → Onglet "Chauffeurs"
2. **Filtrer** : Status "En attente"
3. **Vérifier Documents** :
   - ✅ Permis de conduire valide
   - ✅ Photo identité claire
   - ✅ Casier judiciaire (si requis)
   - ✅ Certificat de bonne vie et mœurs
   - ✅ Photo véhicule (si taxi privé)
4. **Actions** :
   - ✅ **Approuver** → Chauffeur actif immédiatement
   - ❌ **Rejeter** → Indiquer raison précise (documents manquants, photo floue, etc.)
5. **Vérification** :
   - Notification automatique envoyée au chauffeur
   - Log créé dans `activity_logs`
   - Email de confirmation envoyé

#### KPI à Surveiller
- Délai moyen de validation : < 24h
- Taux d'approbation : 70-80%
- Taux de rejet : 20-30%

---

### 2. Validation Restaurant (Priorité : Haute)

**Objectif** : < 48h de délai de validation

#### Étapes
1. **Aller dans** : Dashboard Admin → Onglet "Gestion Restaurants"
2. **Filtrer** : Status "En attente"
3. **Vérifier Documents** :
   - ✅ RCCM (Registre de Commerce)
   - ✅ Autorisation exploitation
   - ✅ Photos locaux (cuisine, salle)
   - ✅ Menu avec prix
4. **Actions** :
   - ✅ **Approuver** → Restaurant visible dans l'app
   - ❌ **Rejeter** → Raison détaillée (document expiré, photo mauvaise qualité)
5. **Vérification** :
   - Notification restaurant propriétaire
   - Email de bienvenue avec guide vendeur

#### KPI à Surveiller
- Délai moyen validation : < 48h
- Restaurants actifs : Croissance mensuelle

---

### 3. Modération Produit Food (Priorité : Moyenne)

**Objectif** : < 2h de délai de modération

#### Étapes
1. **Aller dans** : Gestion Restaurants → Onglet "Modération Produits"
2. **Filtrer** : Status "Pending"
3. **Vérifier Contenu** :
   - ✅ Photo plat de qualité
   - ✅ Nom et description clairs
   - ✅ Prix cohérent avec catégorie
   - ✅ Ingrédients listés (si allergènes)
   - ❌ Pas de contenu inapproprié
4. **Actions** :
   - ✅ **Approuver** → Produit visible immédiatement
   - ❌ **Rejeter** → Raison (photo floue, description insuffisante)

---

### 4. Modération Produit Marketplace (Priorité : Moyenne)

**Objectif** : < 4h de délai de modération

#### Étapes
1. **Aller dans** : Dashboard Admin → Onglet "Marketplace"
2. **Sous-onglet** : "Modération Produits"
3. **Vérifier** :
   - ✅ Photos produit (min 1, max 5)
   - ✅ Description complète (> 50 caractères)
   - ✅ Prix cohérent avec marché
   - ✅ Catégorie correcte
   - ❌ Pas de produits interdits (armes, drogues, contrefaçons)
4. **Actions** :
   - ✅ **Approuver**
   - ❌ **Rejeter** avec raison
   - ⚠️ **Signaler** si suspect (contrefaçon, arnaque)

---

### 5. Gestion Signalements (Priorité : Critique)

**Objectif** : Traitement immédiat des signalements critiques

#### Types de Signalements
- 🔴 **Critique** : Fraude, harcèlement, contenu illégal → **Action immédiate**
- 🟠 **Important** : Produit non conforme, litige client → **< 2h**
- 🟡 **Normal** : Erreur prix, description incorrecte → **< 24h**

#### Étapes
1. **Aller dans** : Dashboard Admin → Onglet "Support"
2. **Filtrer** : Signalements non traités
3. **Évaluer Gravité** :
   - Si **critique** : Suspendre compte/produit immédiatement
   - Si **normal** : Contacter utilisateur pour clarification
4. **Actions** :
   - ✅ Résolu → Marquer résolu avec commentaire
   - ⛔ Suspendre utilisateur/contenu
   - 📧 Contacter utilisateur pour plus d'infos

---

## ⚠️ Actions d'Urgence

### 🚨 Suspendre un Utilisateur

**Quand ?** : Fraude avérée, comportement dangereux, contenu illégal

#### Étapes
1. Aller dans "Gestion Utilisateurs"
2. Rechercher utilisateur par email/ID
3. Cliquer "Actions" → "Suspendre Compte"
4. **Sélectionner Durée** :
   - Temporaire (7j, 30j, 90j)
   - Définitive (ban permanent)
5. **Raison Obligatoire** : Sera visible dans logs
6. Confirmer suspension

**Effet** : Utilisateur ne peut plus se connecter, toutes ses annonces désactivées

---

### 🚨 Désactiver un Produit/Restaurant

**Quand ?** : Contenu inapproprié, signalements multiples, non-conformité

#### Étapes
1. Aller dans section concernée (Marketplace/Restaurants)
2. Rechercher produit/restaurant
3. Cliquer "Désactiver"
4. Raison obligatoire
5. Notification automatique au propriétaire

**Effet** : Contenu invisible dans l'app, propriétaire peut corriger et re-soumettre

---

### 🚨 Bloquer un Chauffeur

**Quand ?** : Comportement dangereux, plaintes clients récurrentes

#### Étapes
1. Dashboard Admin → "Chauffeurs"
2. Rechercher chauffeur
3. "Actions" → "Bloquer Temporairement" ou "Retirer Accès"
4. Durée (si temporaire)
5. Raison détaillée (visible dans app chauffeur)

**Effet** : Chauffeur ne reçoit plus de courses, peut voir raison dans son app

---

## 📊 Dashboards Clés

### 1. Vue d'Ensemble (Homepage)
**Refresh** : Automatique toutes les 30 secondes

**4 KPIs Temps Réel** :
- 👥 Utilisateurs actifs (total)
- 🚗 Chauffeurs actifs (en ligne maintenant)
- 📦 Commandes aujourd'hui
- 💰 Revenus du jour

**Alertes Automatiques** :
- ⚠️ Chauffeurs en attente > 5
- ⚠️ Restaurants en attente > 3
- 🔴 Signalements critiques non traités

---

### 2. Analytics Transport
**Accès** : Onglet "Analytics Transport"

**Métriques** :
- Courses par jour/semaine/mois
- Revenus par type véhicule
- Chauffeurs les plus actifs
- Zones les plus demandées
- Taux d'annulation

**Export** : CSV disponible pour rapports

---

### 3. Analytics Food
**Accès** : Onglet "Gestion Restaurants" → "Analytics"

**Métriques** :
- Commandes par restaurant
- Plats les plus vendus
- Revenus par catégorie
- Temps moyen livraison
- Notes moyennes restaurants

---

### 4. Dashboard Financier
**Accès** : Onglet "Statistiques Revenus"

**Métriques** :
- Revenus totaux (transport + marketplace + food)
- Commissions par partenaire
- Abonnements actifs/expirés
- Retraits en attente
- Projections mensuelles

---

## 🔧 Configuration Système

### Tarifs Transport

**Accès** : Dashboard Admin → "Gestion Tarifs"

#### Paramètres Modifiables
- **Prix de base** : Par type véhicule (taxi, moto, bus)
- **Prix par km** : Tarif kilométrique
- **Frais de service** : Commission Kwenda (%)
- **Surge pricing** : Multiplicateur heures de pointe

#### Par Ville
- **Kinshasa** : Tarifs de base
- **Lubumbashi** : +20% (conditions minières)
- **Kolwezi** : +10% (ville minière)
- **Abidjan** : Tarifs XOF adaptés

---

### Zones Tarifaires

**Accès** : Dashboard Admin → "Zones Tarifaires"

#### Actions
- ✅ Créer nouvelle zone (dessiner sur carte)
- ✅ Modifier multiplicateur zone (ex: aéroport +50%)
- ✅ Activer/désactiver zone temporairement
- ✅ Heures de pointe par zone

---

### Commissions Marketplace

**Accès** : Dashboard Admin → "Marketplace" → "Configuration Commissions"

#### Paramètres
- **Commission standard** : 15% (défaut)
- **Commission par catégorie** : Personnalisable
- **Frais livraison** : Si géré par Kwenda
- **Seuil livraison gratuite** : Montant minimum

---

### Plans d'Abonnement

**Accès** : Dashboard Admin → "Gestion Abonnements" → "Configuration Plans"

#### Types
1. **Chauffeurs** :
   - Basique : 25,000 CDF/mois (1 véhicule)
   - Pro : 50,000 CDF/mois (3 véhicules)
   - Entreprise : 100,000 CDF/mois (illimité)

2. **Restaurants** :
   - Starter : 30,000 CDF/mois
   - Business : 60,000 CDF/mois
   - Premium : 120,000 CDF/mois

3. **Partenaires Location** :
   - Standard : 40,000 CDF/mois
   - Plus : 80,000 CDF/mois

---

## 🔔 Notifications Admin

### Types de Notifications

#### 🔴 Critiques (Action Immédiate)
- Nouveau signalement frauduleux
- Litige client-chauffeur
- Paiement échoué récurrent
- Tentative accès non autorisé

#### 🟠 Importantes (< 2h)
- Nouveau restaurant en attente
- Nouveau partenaire en attente
- Produit signalé 3+ fois
- Chauffeur inactif > 30 jours

#### 🟡 Normales (< 24h)
- Nouveau chauffeur en attente
- Produit en attente modération
- Abonnement expiré
- Retrait demandé

### Centre de Notifications

**Accès** : Icône 🔔 en haut à droite

**Fonctionnalités** :
- Compteur non lus
- Filtres par type/priorité
- Marquer comme lu
- Actions rapides (approuver, rejeter)

---

## 📈 KPIs à Surveiller Post-Production

### Performance Admin
- ⏱️ Temps moyen modération chauffeur : **< 24h**
- ⏱️ Temps moyen validation restaurant : **< 48h**
- ⏱️ Temps moyen modération produit : **< 2h**
- 📊 % éléments en attente > 72h : **< 5%**

### Utilisation Admin
- 📊 Connexions admin/jour
- 📊 Sections les plus consultées
- 📊 Actions effectuées/jour par admin
- ⏱️ Temps session moyen

### Sécurité
- 🔒 Tentatives connexion échouées
- 🔒 Accès non autorisés bloqués
- 🔒 Modifications permissions suspectes
- 📝 Logs audit générés/jour

---

## 🆘 Support & Escalade

### Problème Technique

1. **Consulter logs** : Dashboard Admin → "Système" → "Logs"
2. **Vérifier status services** : Onglet "Monitoring"
3. **Si critique** : Contacter équipe technique

### Problème Utilisateur

1. **Rechercher utilisateur** : Dashboard → "Utilisateurs"
2. **Consulter historique** : Onglet "Activité"
3. **Actions possibles** :
   - Débloquer compte
   - Réinitialiser mot de passe
   - Ajuster solde wallet (avec raison)

### Escalade

- **Niveau 1** : Moderator (modération basique)
- **Niveau 2** : Admin Support (support avancé)
- **Niveau 3** : Super Admin (décisions critiques)

---

## 🔗 Liens Utiles

- **Dashboard Admin** : `/app/admin`
- **Supabase Dashboard** : https://supabase.com/dashboard
- **Documentation Technique** : `/docs/DRIVER_DISPATCH_SYSTEM.md`
- **Guide Architecture** : `/PRODUCTION_STATUS.md`

---

## ✅ Checklist Journalière Admin

### Matin (9h-10h)
- [ ] Vérifier notifications critiques
- [ ] Valider chauffeurs en attente (objectif 0)
- [ ] Valider restaurants en attente
- [ ] Modérer produits food en attente
- [ ] Vérifier signalements prioritaires

### Midi (12h-13h)
- [ ] Vérifier KPIs temps réel
- [ ] Traiter tickets support urgents
- [ ] Valider nouveaux produits marketplace

### Soir (17h-18h)
- [ ] Vérifier éléments en attente > 24h
- [ ] Traiter signalements non critiques
- [ ] Préparer rapport journalier (si requis)
- [ ] Marquer notifications comme lues

---

**Dernière mise à jour** : 2025-11-04  
**Version** : 1.0.0  
**Contact Support Technique** : support@icon-sarl.com
