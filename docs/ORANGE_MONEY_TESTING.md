# 🧪 Orange Money - Guide de Test Complet

## 📋 Checklist Pré-Test

Avant de commencer les tests, vérifier que tout est configuré :

### **Configuration des Secrets**
- [ ] `ORANGE_MONEY_CLIENT_ID` configuré
- [ ] `ORANGE_MONEY_CLIENT_SECRET` configuré
- [ ] `ORANGE_MONEY_POS_ID` configuré
- [ ] `ORANGE_MONEY_MERCHANT_ID` configuré
- [ ] `ORANGE_MONEY_API_URL` configuré (URL de production Orange)
- [ ] `ORANGE_MONEY_BASIC_AUTH` ou `ORANGE_MONEY_AUTH_HEADER` configuré
- [ ] `FRONTEND_URL` configuré (URL de votre app)

**Vérification** :
```
Supabase Dashboard > Project Settings > Edge Functions > Secrets
```

---

### **Déploiement des Edge Functions**
- [ ] `mobile-money-payment` déployée
- [ ] `orange-money-webhook` déployée
- [ ] `orange-money-retry` déployée

**Vérification** :
```
Supabase Dashboard > Functions
```

---

### **Cron Job**
- [ ] Extensions `pg_cron` et `pg_net` activées
- [ ] Cron job `orange-money-retry-job` créé et actif

**Vérification** :
```sql
SELECT * FROM cron.job WHERE jobname = 'orange-money-retry-job';
```

---

### **URL Webhook**
- [ ] URL webhook communiquée à Orange Money
- [ ] URL accessible publiquement

**URL** : `https://wddlktajnhwhyquwcdgf.supabase.co/functions/v1/orange-money-webhook/notifications`

**Test d'accessibilité** :
```bash
curl -X POST https://wddlktajnhwhyquwcdgf.supabase.co/functions/v1/orange-money-webhook/notifications \
  -H "Content-Type: application/json" \
  -d '{"test": true}'
```
✅ Doit retourner HTTP 200

---

### **Monitoring**
- [ ] Dashboard Orange Money Monitoring accessible
- [ ] Alertes admin configurées

**Accès** : Admin Panel > Orange Money Monitoring

---

## 🧪 Scénarios de Test

### **TEST 1 : Top-up Client Standard** ⭐ (Priorité Haute)

**Objectif** : Vérifier le flux complet de paiement pour un client

**Étapes** :
1. Se connecter en tant que **client**
2. Aller sur l'onglet **Wallet**
3. Cliquer sur **"Recharger"** ou **"Top-up"**
4. Sélectionner **Orange Money**
5. Entrer un montant : **5 000 CDF**
6. Entrer un numéro de téléphone valide : **+243XXXXXXXXX**
7. Cliquer sur **"Confirmer"**
8. **Attendre redirection** vers Orange Money
9. Sur le téléphone Orange, **confirmer le paiement**
10. **Attendre notification** de succès

**Critères de Succès** :
- ✅ Redirection vers Orange Money en < 5 secondes
- ✅ Notification push reçue sur le téléphone
- ✅ Paiement confirmé côté Orange
- ✅ Redirection automatique vers l'app
- ✅ Balance client mise à jour (+5 000 CDF)
- ✅ Notification système reçue dans l'app
- ✅ Transaction visible dans l'historique
- ✅ Transaction marquée `completed` dans la DB

**Logs à vérifier** :
```
Functions > mobile-money-payment > Logs
Functions > orange-money-webhook > Logs
```

**Requête SQL de vérification** :
```sql
-- Vérifier la transaction
SELECT * FROM payment_transactions
WHERE user_id = '[USER_ID_CLIENT]'
  AND payment_provider = 'orange'
ORDER BY created_at DESC LIMIT 1;

-- Vérifier le wallet
SELECT balance FROM user_wallets
WHERE user_id = '[USER_ID_CLIENT]';
```

---

### **TEST 2 : Top-up Partenaire (Gros Montant)** 💼

**Objectif** : Vérifier le flux pour un partenaire avec un montant élevé

**Étapes** :
1. Se connecter en tant que **partenaire**
2. Aller sur **"Finances"** ou **"Wallet"**
3. Cliquer sur **"Recharger"**
4. Sélectionner **Orange Money**
5. Entrer un montant : **50 000 CDF**
6. Entrer un numéro : **+243XXXXXXXXX**
7. Confirmer et compléter le paiement

**Critères de Succès** :
- ✅ Montant supérieur accepté (limite : 500 000 CDF)
- ✅ Balance partenaire mise à jour (`partner_profiles.balance`)
- ✅ Transaction enregistrée avec `order_type = 'partner_credit'`

**Requête SQL** :
```sql
SELECT balance FROM partner_profiles
WHERE user_id = '[USER_ID_PARTENAIRE]';
```

---

### **TEST 3 : Top-up Vendeur Marketplace** 🛍️

**Objectif** : Vérifier le flux pour un vendeur marketplace

**Étapes** :
1. Se connecter en tant que **vendeur**
2. Aller sur **"Mon Wallet"** (vendeur)
3. Cliquer sur **"Recharger"**
4. Sélectionner **Orange Money**
5. Entrer un montant : **25 000 CDF**
6. Confirmer et payer

**Critères de Succès** :
- ✅ Balance vendeur mise à jour (`vendor_wallets.balance`)
- ✅ Transaction enregistrée avec `order_type = 'vendor_credit'`

**Requête SQL** :
```sql
SELECT vw.balance 
FROM vendor_wallets vw
JOIN marketplace_vendors mv ON vw.vendor_id = mv.id
WHERE mv.user_id = '[USER_ID_VENDEUR]';
```

---

### **TEST 4 : Annulation de Paiement** ❌

**Objectif** : Vérifier le comportement si l'utilisateur annule

**Étapes** :
1. Initier un paiement de **5 000 CDF**
2. Sur Orange Money, **cliquer sur "Annuler"** ou **fermer la fenêtre**
3. Revenir à l'app

**Critères de Succès** :
- ✅ Redirection vers la page `/payment/cancelled`
- ✅ Message d'information affiché
- ✅ Balance **non modifiée**
- ✅ Transaction marquée `cancelled` ou `failed`

---

### **TEST 5 : Paiement Échoué (Solde Insuffisant)** 💸

**Objectif** : Tester le comportement si le solde Orange est insuffisant

**Étapes** :
1. Utiliser un compte Orange avec **solde < montant demandé**
2. Initier un paiement de **50 000 CDF**
3. Tenter de payer

**Critères de Succès** :
- ✅ Erreur côté Orange Money affichée
- ✅ Redirection vers `/payment/error`
- ✅ Message d'erreur explicite
- ✅ Bouton **"Réessayer"** présent
- ✅ Balance **non modifiée**
- ✅ Transaction marquée `failed` avec raison `INSUFFICIENT_BALANCE`

---

### **TEST 6 : Webhook Temps Réel** 📡 (Critique)

**Objectif** : Vérifier que le webhook fonctionne et crédite automatiquement

**Étapes** :
1. Initier un paiement de **10 000 CDF**
2. Confirmer côté Orange
3. **Chronométrer** le temps entre confirmation et crédit dans l'app

**Critères de Succès** :
- ✅ Webhook reçu dans les **5 secondes** après confirmation Orange
- ✅ Balance mise à jour automatiquement
- ✅ Notification système envoyée
- ✅ Log webhook visible dans Supabase

**Logs à vérifier** :
```
Functions > orange-money-webhook > Logs
```

**Rechercher** :
```json
{
  "event": "orange_webhook_received",
  "transaction_id": "..."
}
```

---

### **TEST 7 : Retry Automatique (Transaction Bloquée)** 🔄

**Objectif** : Vérifier que le cron job détecte et traite les transactions bloquées

**Étapes** :
1. Créer **manuellement** une transaction bloquée en `processing` depuis 15 minutes :
   ```sql
   INSERT INTO payment_transactions (
     transaction_id, user_id, amount, currency,
     payment_provider, status, created_at, order_type
   ) VALUES (
     'TEST_STUCK_TXN', '[USER_ID]', 5000, 'CDF',
     'orange', 'processing', NOW() - INTERVAL '15 minutes', 'wallet_topup'
   );
   ```

2. **Attendre 5 minutes** (prochaine exécution du cron)

3. Vérifier que la transaction est traitée

**Critères de Succès** :
- ✅ Transaction détectée par le cron job
- ✅ Log dans `orange-money-retry` visible
- ✅ Si vraiment bloquée : Marquée `failed` après 24h
- ✅ Notification envoyée à l'utilisateur

**Logs à vérifier** :
```
Functions > orange-money-retry > Logs
```

---

### **TEST 8 : Validations Côté Frontend** ✅

**Objectif** : Vérifier les validations client-side

**Cas à tester** :

| Cas | Input | Résultat Attendu |
|-----|-------|-------------------|
| **Montant trop faible** | 100 CDF | ❌ Erreur : "Montant minimum : 500 CDF" |
| **Montant trop élevé** | 600 000 CDF | ❌ Erreur : "Montant maximum : 500 000 CDF" |
| **Numéro invalide** | `081234567` | ❌ Erreur : "Format : +243XXXXXXXXX" |
| **Numéro valide** | `+243812345678` | ✅ Accepté |
| **Opérateur non sélectionné** | (vide) | ❌ Erreur : "Sélectionnez un opérateur" |

---

## 📊 Critères de Validation Globaux

### **Performance**
- ⏱️ Temps de réponse initiation paiement : **< 3 secondes**
- ⏱️ Temps de traitement webhook : **< 5 secondes**
- ⏱️ Temps de mise à jour balance : **< 2 secondes après webhook**

### **Fiabilité**
- 📈 Taux de succès : **> 95%**
- 🔄 Webhooks reçus : **100%**
- 🔁 Retry automatique : **Actif et fonctionnel**

### **Sécurité**
- 🔐 Secrets jamais exposés dans les logs
- 🔐 Numéros de téléphone masqués (afficher seulement les 4 derniers chiffres)
- 🔐 RLS activé sur `payment_transactions`

---

## 🚨 Procédure de Rollback

Si les tests révèlent des problèmes critiques :

### **1. Désactiver le Cron Job**
```sql
SELECT cron.unschedule('orange-money-retry-job');
```

### **2. Désactiver Orange Money dans l'App**
```typescript
// Dans le code frontend
const ORANGE_MONEY_ENABLED = false;
```

### **3. Afficher un Message Maintenance**
```typescript
// Dans UnifiedTopUpModal.tsx
if (provider === 'orange') {
  toast.error('Orange Money temporairement indisponible. Utilisez Airtel ou M-Pesa.');
  return;
}
```

### **4. Notifier les Utilisateurs**
- Créer une notification système
- Envoyer un email aux partenaires

### **5. Analyser les Logs**
- Identifier la cause racine
- Corriger le problème
- Retester en environnement de dev

### **6. Réactiver Progressivement**
- D'abord pour 10 utilisateurs test
- Puis 10% des utilisateurs
- Puis 100% si stable

---

## 📝 Rapport de Test (Template)

À remplir après chaque série de tests :

```markdown
## 📋 Rapport de Test Orange Money

**Date** : YYYY-MM-DD
**Testeur** : [Nom]
**Environnement** : Production / Test

### Tests Réussis ✅
- [ ] Test 1 : Top-up Client Standard
- [ ] Test 2 : Top-up Partenaire
- [ ] Test 3 : Top-up Vendeur
- [ ] Test 4 : Annulation
- [ ] Test 5 : Paiement Échoué
- [ ] Test 6 : Webhook
- [ ] Test 7 : Retry Automatique
- [ ] Test 8 : Validations Frontend

### Problèmes Rencontrés ⚠️
- [Description du problème 1]
- [Description du problème 2]

### Métriques
- Taux de succès : XX%
- Temps moyen de traitement : XX secondes
- Webhooks reçus : XX/XX (XX%)

### Recommandations
- [Recommandation 1]
- [Recommandation 2]

### Décision Finale
- [ ] ✅ Déploiement en production approuvé
- [ ] ⚠️ Corrections nécessaires avant déploiement
- [ ] ❌ Rollback recommandé
```

---

## 🔗 Liens Utiles

- **Logs Supabase** : https://supabase.com/dashboard/project/wddlktajnhwhyquwcdgf/functions
- **Dashboard Monitoring** : Admin Panel > Orange Money Monitoring
- **Guide de Troubleshooting** : `ORANGE_MONEY_TROUBLESHOOTING.md`
- **Setup Cron** : `ORANGE_MONEY_CRON_SETUP.md`