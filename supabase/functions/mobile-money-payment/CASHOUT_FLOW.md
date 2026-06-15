# 🔄 Flow Complet CASHOUT Orange Money - Recharge Wallet

## Vue d'ensemble

**CASHOUT = Paiement Marchand** : Le client paie Kwenda via Orange Money, puis Kwenda crédite automatiquement le wallet KwendaPay.

Orange Money B2B RDC **autorise UNIQUEMENT le CASHOUT** (paiements marchands).  
Les retraits (CASHIN) nécessitent une licence spéciale non disponible.

---

## 📊 Architecture du Flow

```
┌─────────────┐
│   Client    │
│  KwendaPay  │
└──────┬──────┘
       │
       │ 1. Demande recharge 5000 CDF
       │    (frontend → mobile-money-payment)
       ▼
┌─────────────────────────────────┐
│  Edge Function                  │
│  mobile-money-payment           │
│  - orderType: 'wallet_topup'    │
│  - isCashout = true             │
└──────┬──────────────────────────┘
       │
       │ 2. POST /transactions
       │    receiverMSISDN: "991234567" (9 chiffres)
       ▼
┌─────────────────────────────────┐
│  Orange Money B2B API           │
│  https://api.orange.com/...     │
└──────┬──────────────────────────┘
       │
       │ 3. Réponse immédiate
       │    transactionId: MP240123...
       │    transactionStatus: PENDING
       ▼
┌─────────────────────────────────┐
│  payment_transactions           │
│  - status: 'pending'            │
│  - transaction_id: KWENDA_xxx   │
└─────────────────────────────────┘
       │
       │ 4. Client reçoit notification push
       │    "Validez le paiement sur votre téléphone"
       │
       │ 5. Client confirme sur USSD Orange Money
       │
       │ 6. Orange envoie webhook (async)
       ▼
┌─────────────────────────────────┐
│  Edge Function                  │
│  orange-money-cashout-webhook   │
│  - transactionStatus: SUCCESS   │
└──────┬──────────────────────────┘
       │
       │ 7. Mise à jour DB atomique
       ├─► payment_transactions.status = 'completed'
       ├─► user_wallets.balance += 5000
       ├─► wallet_transactions (log)
       └─► activity_logs (historique)
       │
       ▼
┌─────────────────────────────────┐
│  Client KwendaPay               │
│  Wallet crédité automatiquement │
│  Nouveau solde: 10,000 CDF      │
└─────────────────────────────────┘
```

---

## 🔐 Secrets Supabase Requis

```bash
# OAuth 2-legged (pour obtenir le Bearer token)
ORANGE_MONEY_CLIENT_ID="votre_client_id"
ORANGE_MONEY_CLIENT_SECRET="votre_client_secret"

# API B2B RDC
ORANGE_MONEY_API_URL="https://api.orange.com/orange-money-b2b/v1/cd"
ORANGE_MONEY_POS_ID="GeQpqUI"

# Auth header (optionnel, auto-calculé si absent)
ORANGE_MONEY_AUTH_HEADER="Basic <base64(client_id:client_secret)>"
```

---

## 📝 Exemple Payload CASHOUT

### Request POST /transactions

```json
{
  "amount": 5000,
  "currency": "CDF",
  "partnerTransactionId": "KWENDA_1732360800000_ABC123",
  "receiverMSISDN": "991234567",
  "description": "Kwenda Cashout"
}
```

### Headers

```http
Authorization: Bearer <access_token>
Content-Type: application/json
X-Pos-Id: GeQpqUI
```

### Response Orange (Success immédiat)

```json
{
  "transactionId": "MP240123.1234.A12345",
  "transactionStatus": "PENDING",
  "partnerTransactionId": "KWENDA_1732360800000_ABC123",
  "amount": 5000,
  "currency": "CDF"
}
```

---

## 🔔 Webhook Orange Money

### URL à configurer chez Orange

```
https://wddlktajnhwhyquwcdgf.supabase.co/functions/v1/orange-money-cashout-webhook
```

### Payload Webhook (envoyé par Orange après confirmation client)

```json
{
  "transactionId": "MP240123.1234.A12345",
  "partnerTransactionId": "KWENDA_1732360800000_ABC123",
  "transactionStatus": "SUCCESS",
  "amount": 5000,
  "currency": "CDF",
  "timestamp": "2025-11-24T10:30:00Z"
}
```

### Statuts possibles

| Statut | Description | Action Kwenda |
|--------|-------------|---------------|
| `SUCCESS` / `COMPLETED` | Paiement confirmé par client | ✅ Créditer wallet |
| `FAILED` | Paiement refusé (solde insuffisant, annulation) | ❌ Marquer transaction failed |
| `CANCELLED` | Client a annulé | ❌ Marquer transaction failed |
| `PENDING` | En attente de confirmation | ⏳ Attendre webhook final |

---

## 🔒 CASHOUT vs CASHIN

| Type | Description | Cas d'usage | Supporté Orange |
|------|-------------|-------------|------------------|
| **CASHOUT** | Client → Kwenda (paiement marchand) | Recharge wallet, achats marketplace, paiements services | ✅ OUI |
| **CASHIN** | Kwenda → Client (retrait réglementé) | Retraits vendeurs, remboursements | ❌ NON (nécessite licence) |

**Pour les retraits** : Utiliser Airtel Money ou le retrait bancaire.

---

## ✅ Tests de Validation

### Test #1 : Recharge Wallet Client
1. Ouvrir modal de recharge KwendaPay
2. Sélectionner Orange Money
3. Saisir montant : `5000 CDF`
4. Saisir numéro : `0991234567`
5. Confirmer

**Résultats attendus** :
- ✅ Edge function appelée avec `orderType: 'wallet_topup'`
- ✅ Détection `isCashout = true`
- ✅ Payload envoyé avec `receiverMSISDN: "991234567"` (9 chiffres, sans 243)
- ✅ Orange retourne `transactionId` et `transactionStatus: PENDING`
- ✅ Transaction enregistrée dans `payment_transactions` (status: 'pending')

### Test #2 : Vérifier Logs Edge Function
```sql
SELECT * FROM edge_function_logs 
WHERE function_name = 'mobile-money-payment' 
ORDER BY timestamp DESC 
LIMIT 10;
```

**Vérifier** :
- ✅ `receiver_msisdn: "991234567"` (9 chiffres, sans 243)
- ✅ `msisdn_format: "local_9_digits"`
- ✅ `event: "orange_money_b2b_cashout_init"`

### Test #3 : Simulation Webhook (Dev)
```bash
curl -X POST 'https://wddlktajnhwhyquwcdgf.supabase.co/functions/v1/orange-money-cashout-webhook' \
  -H 'Content-Type: application/json' \
  -d '{
    "transactionId": "MP240123.1234.A12345",
    "partnerTransactionId": "KWENDA_1732360800000_ABC123",
    "transactionStatus": "SUCCESS",
    "amount": 5000,
    "currency": "CDF"
  }'
```

**Résultats attendus** :
- ✅ Transaction marquée `completed`
- ✅ Wallet crédité de 5000 CDF
- ✅ Entry dans `wallet_transactions`
- ✅ Entry dans `activity_logs`

### Test #4 : Vérifier Crédit Wallet
```sql
-- Wallet du client
SELECT balance, updated_at 
FROM user_wallets 
WHERE user_id = 'uuid-du-client';

-- Historique des transactions
SELECT * FROM wallet_transactions 
WHERE user_id = 'uuid-du-client' 
ORDER BY created_at DESC 
LIMIT 5;
```

---

## 🛠️ Debugging

### Logs Edge Functions
```bash
# mobile-money-payment
https://supabase.com/dashboard/project/wddlktajnhwhyquwcdgf/functions/mobile-money-payment/logs

# orange-money-cashout-webhook
https://supabase.com/dashboard/project/wddlktajnhwhyquwcdgf/functions/orange-money-cashout-webhook/logs
```

### Vérifier transactions en attente
```sql
SELECT * FROM payment_transactions 
WHERE payment_provider = 'orange' 
AND status = 'pending'
AND created_at > NOW() - INTERVAL '1 hour';
```

---

## 📞 Support Orange Money

**En cas de problème avec l'API** :
- Vérifier les logs edge function
- Contacter support Orange Developer : support@developer.orange.com
- Documentation : https://developer.orange.com/apis/orange-money-b2b-cd
