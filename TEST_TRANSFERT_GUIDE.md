# 🧪 Guide de Test - Système de Transfert

## 🎯 Objectif

Vérifier que le système de transfert fonctionne correctement après la correction de la policy RLS.

---

## ✅ Test 1 : Validation du destinataire

### **Scénario** : Rechercher l'utilisateur `iouantchi@gmail.com`

**Actions** :
1. Connectez-vous en tant que n'importe quel utilisateur (client, chauffeur, partenaire)
2. Accédez à la page **Wallet** ou **Transfert**
3. Dans le champ "Destinataire", tapez : `iouantchi@gmail.com`
4. Attendez la validation automatique (debounce 500ms)

**Résultat attendu** :
- ✅ Message : "Destinataire trouvé : [Nom de l'utilisateur]"
- ✅ Affichage du nom du destinataire
- ✅ Bouton "Transférer" devient actif

**Si ça échoue** :
- ❌ Message : "Destinataire introuvable"
- Vérifiez les logs Edge Function `validate-transfer-recipient`

---

## ✅ Test 2 : Transfert réel

### **Scénario** : Transférer 1000 CDF à `iouantchi@gmail.com`

**Pré-requis** :
- Solde émetteur ≥ 1000 CDF
- Les deux utilisateurs ont un wallet actif

**Actions** :
1. Entrez le destinataire : `iouantchi@gmail.com`
2. Entrez le montant : `1000`
3. Ajoutez une description (optionnel) : `Test transfert`
4. Cliquez sur **Confirmer le transfert**

**Résultat attendu** :
- ✅ Toast de succès : "Transfert réussi"
- ✅ Solde émetteur diminue de 1000 CDF
- ✅ Solde destinataire augmente de 1000 CDF
- ✅ Notification envoyée au destinataire
- ✅ Historique mis à jour dans les deux wallets

---

## ✅ Test 3 : Cas d'erreur - Solde insuffisant

**Actions** :
1. Destinataire : `iouantchi@gmail.com`
2. Montant : `999999999` (plus que le solde)
3. Cliquer sur **Confirmer**

**Résultat attendu** :
- ❌ Message d'erreur : "Solde insuffisant"
- ✅ Aucune modification des balances

---

## ✅ Test 4 : Cas d'erreur - Auto-transfert

**Actions** :
1. Utilisez votre propre email comme destinataire
2. Montant : `1000`
3. Cliquer sur **Confirmer**

**Résultat attendu** :
- ❌ Message : "Impossible de transférer de l'argent à soi-même"

---

## ✅ Test 5 : Transfert inter-rôles

### **Client → Chauffeur**
1. Connecté en tant que **client**
2. Transférer vers un **chauffeur** (par email)
3. Vérifier que ça fonctionne

### **Chauffeur → Client**
1. Connecté en tant que **chauffeur**
2. Transférer vers un **client**
3. Vérifier que ça fonctionne

### **Partenaire → Chauffeur**
1. Connecté en tant que **partenaire**
2. Transférer vers un **chauffeur** de sa flotte
3. Vérifier que ça fonctionne

**Résultat attendu** :
- ✅ Tous les transferts inter-rôles fonctionnent
- ✅ Pas de restriction basée sur le rôle

---

## 🔍 Débugger en cas d'échec

### **1. Vérifier que la policy RLS est active**

```sql
SELECT * FROM pg_policies 
WHERE tablename = 'clients' 
  AND policyname = 'allow_recipient_search_for_transfers';
```

Doit retourner 1 ligne.

### **2. Vérifier les logs Edge Functions**

**validate-transfer-recipient** :
```
🔍 [1/6] Validation démarrée pour: iouantchi@gmail.com
🔎 [4/6] Résultat recherche clients: Trouvé: [Nom]
✅ [6/6] Destinataire validé avec succès
```

**wallet-transfer** :
```
💸 Transfert initié: { sender: xxx, recipient: iouantchi@gmail.com, amount: 1000 }
🔄 Exécution du transfert atomique...
✅ Transfert réussi
```

### **3. Vérifier la base de données**

**Wallet de l'émetteur** :
```sql
SELECT balance FROM user_wallets WHERE user_id = '[votre_user_id]';
```

**Wallet du destinataire** :
```sql
SELECT w.balance 
FROM user_wallets w
JOIN clients c ON c.user_id = w.user_id
WHERE c.email = 'iouantchi@gmail.com';
```

**Historique des transferts** :
```sql
SELECT * FROM wallet_transfers 
WHERE sender_id = '[votre_user_id]' 
ORDER BY created_at DESC 
LIMIT 5;
```

---

## 📊 Checklist complète

- [ ] Test 1 : Validation destinataire (email) ✅
- [ ] Test 2 : Transfert réel réussi ✅
- [ ] Test 3 : Erreur solde insuffisant ✅
- [ ] Test 4 : Erreur auto-transfert ✅
- [ ] Test 5a : Client → Chauffeur ✅
- [ ] Test 5b : Chauffeur → Client ✅
- [ ] Test 5c : Partenaire → Chauffeur ✅
- [ ] Vérification balances mises à jour ✅
- [ ] Vérification notifications envoyées ✅
- [ ] Vérification historique mis à jour ✅

---

## 🎉 Si tous les tests passent

Le système de transfert est **100% fonctionnel** et prêt pour la production !

**Prochaines étapes** :
1. ✅ Activer Leaked Password Protection (voir `LEAKED_PASSWORD_PROTECTION_ACTIVATION.md`)
2. ✅ Tester les transferts par numéro de téléphone (en plus de l'email)
3. ✅ Implémenter Option B (fonction RPC sécurisée) pour une sécurité renforcée

---

## ⏱️ Durée totale des tests : 15 minutes

**Note** : Ces tests doivent être effectués depuis l'interface utilisateur réelle (pas de simulation possible via curl car authentification JWT requise).
