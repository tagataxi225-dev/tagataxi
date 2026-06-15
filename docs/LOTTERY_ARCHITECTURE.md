# 🎰 Architecture Système de Tombola Kwenda

## Vue d'ensemble

Le système de tombola Kwenda est un système gamifié complet avec cartes à gratter, pity system, badges automatiques et super loterie mensuelle.

---

## 🏗️ Architecture Technique

### Système Principal : Cartes à Gratter Instantanées

#### 1. Attribution des Tickets
- **Table** : `lottery_tickets`
- **Statuts** : `available`, `used`, `expired`
- **Sources** : Transport, livraison, marketplace, parrainage, défis, connexion quotidienne
- **Hook** : `useLotteryTickets()`

#### 2. Jeu de Grattage
- **Edge Function** : `instant-scratch-win`
- **Mécanisme** : Sélection aléatoire avec pity system
- **Composant** : `ScratchCard.tsx`
- **Animations** : Confetti selon rareté

#### 3. Résultats
- **Table** : `lottery_wins`
- **Champs clés** : `scratch_percentage`, `scratch_revealed_at`, `prize_value`, `rarity`
- **Statuts** : Non révélé → Révélé → Réclamé

---

### Système de Pity (Garanties)

**Table** : `scratch_card_pity_tracker`

**Garanties** :
- 10 communes consécutives → Rare minimum garanti
- 25 sans épique → Épique garanti
- 50 sans légendaire → Légendaire garanti

**Réinitialisation** : Auto après gain de rareté supérieure

---

### Probabilités des Prix

**Table** : `lottery_prize_types`

```
Rareté      | Probabilité | Couleur   | Confetti
------------|-------------|-----------|----------
Common      | 70%         | Gris      | 0
Rare        | 20%         | Bleu      | 15
Epic        | 8%          | Violet    | 50
Legendary   | 2%          | Or        | 200
```

---

### Multiplicateurs Temporels

**Source** : `useLotteryTickets().getEventMultiplier()`

```typescript
- Weekend (Sam-Dim) : x2
- Happy Hour future : x1.5
- Événements spéciaux : x3-x5
```

---

## 🎮 Système de Gamification

### 1. Points Kwenda

**Table** : `user_wallets.kwenda_points`

**Gains** :
- Common : 10 points
- Rare : 50 points
- Epic : 200 points
- Legendary : 1000 points

**Conversion** :
- 100 points = 500 CDF
- 500 points = 1 entrée super loterie

**Hook** : `useKwendaPoints()`

---

### 2. Badges Automatiques

**Table** : `user_lottery_badges`

**Trigger** : `trigger_award_lottery_badges` (sur `lottery_wins` UPDATE)

**Badges disponibles** :
- 🎰 Première Carte (1 carte grattée)
- 👑 VIP Platinum (100 cartes)
- 💎 Collectionneur Rare (5 rares)
- 🌟 Chanceux du Mois (1 légendaire)

**Composant** : `BadgeDisplay.tsx`

---

### 3. Limites Quotidiennes

**Table** : `lottery_user_limits`

**Limites par défaut** :
- 5 cartes gratuites / jour
- VIP : +2 cartes
- Unlimited : illimité

**Reset** : Fonction cron `reset_daily_lottery_limits()`

**Hook** : `useLotteryLimits()`

---

## 🎁 Super Loterie Mensuelle

### Tables
- `super_lottery_draws` : Tirages mensuels
- `super_lottery_entries` : Entrées utilisateurs

### Fonctionnement
1. Tirage le 1er de chaque mois
2. Coût : 500 Kwenda Points par entrée
3. Prix : 100 000 - 1 000 000 CDF

### Composant
`LotteryLeaderboard.tsx` (onglet "Super Loterie")

---

## 🔔 Système de Notifications

### Types de Notifications

**Table** : `lottery_notifications`

1. `new_ticket` : Nouveau ticket reçu
2. `scratch_win` : Gain révélé
3. `badge_earned` : Nouveau badge
4. `super_lottery_win` : Gain super loterie
5. `pity_trigger` : Garantie activée
6. `daily_limit_reached` : Limite atteinte

### Temps Réel

**Hook** : `useLotteryNotifications()`

**Subscription** : Supabase Realtime sur `lottery_notifications`

**Composant** : `NotificationCenter.tsx` (dans header)

---

## 📊 Composants Frontend

### Pages Principales
```
/lottery → LotteryDashboard.tsx
  ├── ScratchCardGallery.tsx
  │   └── ScratchCard.tsx (avec animations)
  ├── ProgressTracker.tsx (pity system)
  ├── BadgeDisplay.tsx
  └── WinsHistory.tsx
```

### Widgets
```
Header → NotificationCenter.tsx
Sidebar → PointsConversion.tsx
Stats → LotteryLeaderboard.tsx
```

---

## 🔐 Sécurité & RLS

### Policies Clés

**lottery_tickets** :
```sql
-- Utilisateur voit ses propres tickets
auth.uid() = user_id

-- Admin voit tout
is_current_user_admin()
```

**lottery_wins** :
```sql
-- Utilisateur voit ses propres gains
auth.uid() = user_id

-- Classements publics (anonymisés)
SELECT for leaderboard (display_name masqué)
```

**lottery_notifications** :
```sql
-- Notifications personnelles uniquement
auth.uid() = user_id
```

---

## 📈 Métriques & Analytics

### Tables de Suivi
- `scratch_card_pity_tracker` : Suivi des séquences
- `lottery_admin_actions` : Actions admin (logs)
- `lottery_special_events` : Événements temporaires

### Composant Admin
`LotteryLeaderboard.tsx` (onglet "Admin Stats")

---

## 🛠️ Edge Functions

### 1. instant-scratch-win
**Fichier** : `supabase/functions/instant-scratch-win/index.ts`

**Fonctionnalités** :
- Sélection aléatoire avec pity system
- Application des multiplicateurs
- Création `lottery_wins`
- Incrémentation compteurs pity
- Notifications automatiques

**Sécurité** : Vérifie ownership du ticket

---

### 2. award-lottery-ticket
**Fichier** : `supabase/functions/award-lottery-ticket/index.ts`

**Fonctionnalités** :
- Attribution tickets selon source
- Application multiplicateurs événements
- Vérification limites quotidiennes
- Notification utilisateur

**Sources supportées** :
- `transport`, `delivery`, `marketplace_buy`, `marketplace_sell`
- `referral`, `daily_login`, `challenge`, `rating`

---

## 🚀 Flux Utilisateur Complet

### 1. Attribution Ticket
```typescript
// Après une course
await awardTransportTickets(bookingId);
→ INSERT lottery_tickets (status: available)
→ Notification "Nouveau ticket reçu"
```

### 2. Ouverture Carte
```typescript
// Clic sur carte dans galerie
→ Navigation /lottery
→ Affichage ScratchCard non grattée
```

### 3. Grattage
```typescript
// Grattage progressif
scratch_percentage: 0% → 70%
→ À 70% : Appel instant-scratch-win
→ Révélation du prix avec animation
```

### 4. Réclamation
```typescript
// Clic "Réclamer"
→ UPDATE lottery_wins (claimed_at: now())
→ INSERT wallet_transactions (si cash)
→ Notification "Gain crédité"
```

### 5. Gamification
```typescript
// Automatique après grattage
→ Award Kwenda points (trigger)
→ Check badges eligibility (trigger)
→ Increment pity counters
→ Check daily limits
```

---

## 📝 Maintenance & Cron Jobs

### Tâches Programmées

**reset_daily_lottery_limits()** :
```sql
-- Exécution : Chaque jour à 00:00 UTC
-- Action : Reset cards_earned_today = 0
```

**super_lottery_monthly_draw()** :
```sql
-- Exécution : 1er du mois à 12:00 UTC
-- Action : Tirage gagnant + notifications
```

---

## 🧪 Tests Recommandés

### Scénarios de Test

1. **Attribution Ticket** ✅
   - Faire une course → Vérifier ticket reçu
   - Vérifier multiplicateur weekend

2. **Pity System** ✅
   - Gratter 10 communes → Rare garanti
   - Gratter 25 sans épique → Épique garanti

3. **Limites Quotidiennes** ✅
   - Atteindre limite (5 cartes)
   - Vérifier message d'erreur
   - Vérifier reset lendemain

4. **Notifications** ✅
   - Nouveau ticket → Cloche header
   - Gain révélé → Notification push
   - Badge gagné → Notification spéciale

5. **Conversion Points** ✅
   - Accumuler 100 points Kwenda
   - Convertir en crédits (500 CDF)
   - Vérifier wallet_transactions

---

## 🔄 Migrations Appliquées

1. **20251017205340** : Création tables principales
   - lottery_notifications
   - lottery_user_limits
   - super_lottery_draws/entries
   - user_lottery_badges
   - lottery_special_events
   - lottery_admin_actions
   - lottery_config

2. **20251017205529** : Ajout Kwenda points
   - kwenda_points dans user_wallets
   - Fonctions convert_points_to_credits()
   - Triggers award_kwenda_points_for_win

3. **[CURRENT]** : Correction probabilités
   - Common: 0.70, Rare: 0.20, Epic: 0.08, Legendary: 0.02

---

## 📚 Références Code

### Hooks Principaux
```typescript
useLottery()              // État général loterie
useLotteryTickets()       // Attribution tickets
useLotteryNotifications() // Notifications temps réel
useLotteryLimits()        // Limites quotidiennes
useKwendaPoints()         // Points fidélité
```

### Composants Clés
```typescript
LotteryDashboard          // Page principale
ScratchCard              // Carte interactive
NotificationCenter       // Centre notifications
BadgeDisplay            // Affichage badges
ProgressTracker         // Suivi pity system
WinsHistory             // Historique gains
```

### Tables Essentielles
```sql
lottery_tickets          // Tickets disponibles
lottery_wins            // Résultats grattage
lottery_prize_types     // Définition prix
scratch_card_pity_tracker // Compteurs garanties
user_wallets            // Solde + Kwenda points
```

---

## 🎯 Bonnes Pratiques

### Performance
- ✅ Indexes sur user_id, status, created_at
- ✅ Pagination des historiques (limit 20)
- ✅ Cache des limites quotidiennes

### Sécurité
- ✅ RLS activé sur toutes les tables
- ✅ Edge functions avec vérification ownership
- ✅ Logs des actions admin

### UX
- ✅ Animations fluides (Framer Motion)
- ✅ Feedback immédiat (toasts)
- ✅ États de chargement

---

## 🆘 Dépannage

### Problème : Cartes non révélées
**Solution** : Vérifier `scratch_percentage >= 70`

### Problème : Pity non déclenché
**Solution** : Vérifier incrémentation `commons_streak` dans tracker

### Problème : Limites non reset
**Solution** : Vérifier cron `reset_daily_lottery_limits()` actif

### Problème : Notifications non reçues
**Solution** : Vérifier Supabase Realtime activé + subscription active

---

**Dernière mise à jour** : 17 octobre 2025
**Version** : 1.0.0 (Production Ready)
