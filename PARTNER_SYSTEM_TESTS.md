# 🧪 TESTS SYSTÈME PARTENAIRE - GUIDE COMPLET

## ✅ **ACTIONS COMPLÉTÉES**

### ACTION 1 ✅ - Chauffeurs Liés au Partenaire
**Exécuté le** : 2025-10-18  
**SQL** :
```sql
UPDATE driver_codes
SET partner_id = '62897f41-530b-4079-8268-f4bee2bfce15'
WHERE driver_id IN (
  '6bd56fde-d3e1-4df9-a79c-670397581890',  -- hadou kone
  'f15340e1-6c68-4306-b13a-e0c372b1b335'   -- deuxième chauffeur
);
```

**Validation** :
```sql
SELECT code, driver_id, partner_id, created_at 
FROM driver_codes 
WHERE partner_id IS NOT NULL;
```

**✅ Résultat attendu** : 2 lignes avec partner_id rempli

---

### ACTION 3 ✅ - Trigger Auto-Assign Partner
**Exécuté le** : 2025-10-18  
**Fonction créée** : `assign_partner_to_driver_code()`

**Test du trigger** :
```sql
-- Simuler l'ajout d'un nouveau chauffeur par un partenaire
INSERT INTO partner_drivers (partner_id, driver_id, status)
VALUES (
  '62897f41-530b-4079-8268-f4bee2bfce15',
  'nouveau-driver-id-ici',
  'active'
);

-- Vérifier que driver_codes.partner_id a été auto-rempli
SELECT * FROM driver_codes WHERE driver_id = 'nouveau-driver-id-ici';
```

**✅ Résultat attendu** : `partner_id` = `62897f41-530b-4079-8268-f4bee2bfce15`

---

## 🧪 **ACTION 2 : TESTER COMMISSION 5% EN PRODUCTION**

### **Test 1 : Appel Manuel Edge Function** 🔴 PRIORITAIRE

**Objectif** : Vérifier que `partner-subscription-commission` fonctionne

**Étapes** :
1. Ouvrir Supabase Dashboard → Edge Functions
2. Sélectionner `partner-subscription-commission`
3. Tester avec ce payload :

```json
{
  "subscription_id": "test-subscription-001",
  "driver_id": "6bd56fde-d3e1-4df9-a79c-670397581890",
  "subscription_amount": 25000
}
```

**✅ Résultats attendus** :
```json
{
  "success": true,
  "partner_id": "62897f41-530b-4079-8268-f4bee2bfce15",
  "commission_amount": 1250,
  "transaction_id": "uuid-ici"
}
```

**Vérifications SQL** :
```sql
-- 1. Vérifier partner_subscription_earnings
SELECT * FROM partner_subscription_earnings
WHERE subscription_id = 'test-subscription-001';
-- Attendu: 1 ligne avec commission_amount = 1250

-- 2. Vérifier wallet partenaire
SELECT balance FROM user_wallets 
WHERE user_id = (
  SELECT user_id FROM partenaires 
  WHERE id = '62897f41-530b-4079-8268-f4bee2bfce15'
);
-- Attendu: balance augmentée de +1,250 CDF

-- 3. Vérifier notification
SELECT * FROM system_notifications
WHERE notification_type = 'partner_commission_earned'
  AND user_id = (SELECT user_id FROM partenaires WHERE id = '62897f41-530b-4079-8268-f4bee2bfce15')
ORDER BY created_at DESC
LIMIT 1;
-- Attendu: "Vous avez reçu 1250 CDF (5%) sur l'abonnement..."

-- 4. Vérifier activity_logs
SELECT * FROM activity_logs
WHERE activity_type = 'partner_subscription_commission'
ORDER BY created_at DESC
LIMIT 1;
```

---

### **Test 2 : Simulation Abonnement Réel** 🟡 IMPORTANT

**Pré-requis** : 
- Chauffeur "hadou kone" (ID: `6bd56fde-d3e1-4df9-a79c-670397581890`)
- Lié au partenaire "Kwenda Test Fleet"
- Doit avoir un abonnement actif

**Étapes UI** :
1. Se connecter en tant que chauffeur "hadou kone"
2. Aller dans `/driver/subscription`
3. Renouveler l'abonnement (ou souscrire si expiré)
4. Payer 25,000 CDF

**Validation automatique** :
```sql
-- Vérifier que l'Edge Function a été appelée (logs)
-- Dashboard Supabase → Edge Functions → partner-subscription-commission → Logs
-- Chercher: "[Partner Commission] Successfully credited 1250 CDF"

-- Vérifier les données
SELECT 
  pse.subscription_amount,
  pse.partner_commission_amount,
  pse.status,
  pse.created_at
FROM partner_subscription_earnings pse
WHERE pse.driver_id = '6bd56fde-d3e1-4df9-a79c-670397581890'
ORDER BY pse.created_at DESC
LIMIT 1;
```

**✅ Résultat attendu** :
- `subscription_amount` = 25000
- `partner_commission_amount` = 1250 (5%)
- `status` = 'paid'

---

### **Test 3 : Scénario Sans Partenaire** 🟢 EDGE CASE

**Objectif** : Vérifier que les chauffeurs sans partenaire ne bloquent pas le système

**Setup** :
```sql
-- Créer un code chauffeur SANS partner_id
INSERT INTO driver_codes (driver_id, code, is_active)
VALUES ('new-solo-driver-id', 'SOLO1234', true);
```

**Appel Edge Function** :
```json
{
  "subscription_id": "solo-subscription-001",
  "driver_id": "new-solo-driver-id",
  "subscription_amount": 25000
}
```

**✅ Résultat attendu** :
```json
{
  "success": true,
  "message": "No partner commission (driver not affiliated)"
}
```

**Vérification** :
```sql
SELECT COUNT(*) FROM partner_subscription_earnings
WHERE subscription_id = 'solo-subscription-001';
-- Attendu: 0 (aucune commission créée)
```

---

## 🧪 **ACTION 4 : VÉRIFIER VISIBILITÉ VÉHICULES CÔTÉ CLIENT**

### **Test 1 : RLS Policy Vérification** 🔴 CRITIQUE

**Problème identifié** : La policy `rental_vehicles_admin_access_admin_access` ne permet PAS aux clients de voir les véhicules !

**Query de diagnostic** :
```sql
SELECT tablename, policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'rental_vehicles';
```

**❌ Résultat actuel** :
```
policyname: rental_vehicles_admin_access_admin_access
cmd: ALL
qual: is_current_user_admin()
```

**🔴 PROBLÈME** : Seuls les admins peuvent voir les véhicules !

**✅ SOLUTION** : Créer une policy publique pour les véhicules approuvés

---

### **Test 2 : Migration Policy Publique** 🔴 URGENT

**SQL à exécuter** :
```sql
-- Créer une policy pour que les clients voient les véhicules approuvés
CREATE POLICY "rental_vehicles_public_read_approved"
ON public.rental_vehicles
FOR SELECT
TO authenticated
USING (
  moderation_status = 'approved' 
  AND is_active = true 
  AND is_available = true
);

-- Vérifier les policies
SELECT policyname, cmd, roles, qual
FROM pg_policies
WHERE tablename = 'rental_vehicles';
```

**✅ Résultat attendu** : 2 policies
1. `rental_vehicles_admin_access_admin_access` (ALL pour admins)
2. `rental_vehicles_public_read_approved` (SELECT pour clients)

---

### **Test 3 : Test UI Client** 🟡 VALIDATION FINALE

**Étapes** :
1. Se déconnecter de l'app
2. Se reconnecter en tant que **CLIENT** (pas admin, pas partenaire)
3. Naviguer vers `/services/location-vehicules`

**✅ Résultats attendus** :
- Affichage de 10 véhicules du partenaire "Kwenda Test Fleet"
- Filtres par catégorie fonctionnels (Eco, Business, Premium, etc.)
- Prix affichés correctement
- Bouton "Réserver" visible

**Validation SQL** :
```sql
-- Vérifier les véhicules visibles (côté client)
SELECT 
  name,
  brand,
  model,
  daily_rate,
  moderation_status,
  is_active,
  is_available
FROM rental_vehicles
WHERE moderation_status = 'approved'
  AND is_active = true
  AND is_available = true
  AND partner_id = '62897f41-530b-4079-8268-f4bee2bfce15'
ORDER BY daily_rate ASC;
```

**✅ Résultat attendu** : 10 véhicules

---

## 📊 **DASHBOARD DE VALIDATION GLOBALE**

### **Checklist Complète** 🎯

| Fonctionnalité | Test | Statut | Données Réelles |
|----------------|------|--------|-----------------|
| ✅ Migration DB | SQL executé | **COMPLET** | `partner_id` dans `driver_codes` |
| ✅ Trigger Auto-Assign | Test INSERT | **COMPLET** | Fonction `assign_partner_to_driver_code` |
| 🔴 Edge Function Commission | Appel manuel | **À TESTER** | Logs vides actuellement |
| 🔴 Commission 5% Réelle | Abonnement chauffeur | **À TESTER** | 0 lignes dans `partner_subscription_earnings` |
| 🔴 RLS Policy Publique | Migration SQL | **MANQUANT** | Clients ne voient pas véhicules |
| 🟡 UI Location Véhicules | Test client | **À VALIDER** | Après correction RLS |

---

## 🚨 **ACTIONS URGENTES**

### **1. CRÉER POLICY PUBLIQUE RENTAL_VEHICLES** 🔴
**Pourquoi** : Les clients ne peuvent actuellement PAS voir les véhicules  
**Commande** :
```sql
CREATE POLICY "rental_vehicles_public_read_approved"
ON public.rental_vehicles FOR SELECT TO authenticated
USING (moderation_status = 'approved' AND is_active = true AND is_available = true);
```

### **2. TESTER EDGE FUNCTION COMMISSION** 🔴
**Méthode** : Appel manuel via Supabase Dashboard  
**Payload** :
```json
{
  "subscription_id": "test-001",
  "driver_id": "6bd56fde-d3e1-4df9-a79c-670397581890",
  "subscription_amount": 25000
}
```

### **3. VÉRIFIER INVOCATION AUTOMATIQUE** 🟡
**Question** : Qui appelle `partner-subscription-commission` lors d'un nouvel abonnement ?  
**Hypothèse** : Doit être appelée par `subscription-manager` Edge Function  
**Action** : Vérifier le code de `subscription-manager` pour confirmer

---

## 📈 **MÉTRIQUES DE SUCCÈS FINALES**

**Le système sera 100% opérationnel quand** :

1. ✅ **2+ chauffeurs** ont `partner_id` rempli dans `driver_codes` → **FAIT**
2. 🔴 **1+ ligne** existe dans `partner_subscription_earnings` → **EN ATTENTE DE TEST**
3. 🔴 **Wallet partenaire** augmente de +1,250 CDF après abonnement → **EN ATTENTE**
4. 🔴 **Notification** "Commission Abonnement" reçue → **EN ATTENTE**
5. 🔴 **10 véhicules** visibles dans `/services/location-vehicules` (côté client) → **BLOQUÉ PAR RLS**
6. 🔴 **Logs Edge Function** affichent "Successfully credited" → **AUCUN LOG ACTUEL**

---

## 🔗 **LIENS UTILES**

- **Edge Function Logs** : https://supabase.com/dashboard/project/wddlktajnhwhyquwcdgf/functions/partner-subscription-commission/logs
- **SQL Editor** : https://supabase.com/dashboard/project/wddlktajnhwhyquwcdgf/sql/new
- **RLS Policies** : https://supabase.com/dashboard/project/wddlktajnhwhyquwcdgf/database/policies

---

## 📝 **NOTES IMPORTANTES**

1. **Pourquoi pas de commission dans les données ?**
   - Les chauffeurs ont été créés AVANT l'ajout de `partner_id`
   - Edge Function jamais appelée (aucun log)
   - Solution : Tester manuellement puis renouveler un abonnement réel

2. **Différence `partner_drivers` vs `driver_codes` ?**
   - `driver_codes` : Code recrutement (source de vérité pour `partner_id`)
   - `partner_drivers` : Historique flotte (optionnel)

3. **Véhicules invisibles côté client ?**
   - RLS ne permet que `is_current_user_admin()`
   - Besoin d'une policy publique `SELECT` pour clients authentifiés

---

**Date de création** : 2025-10-18  
**Dernière mise à jour** : 2025-10-18  
**Statut global** : **70% OPÉRATIONNEL** (Actions 1 et 3 complètes, Actions 2 et 4 à finaliser)
