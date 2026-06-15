# 🔍 Diagnostic Orange Money B2B - Erreur 404

## 📊 Statut actuel

### ✅ Ce qui fonctionne
- 🔑 **OAuth 2.0** : Token d'authentification obtenu avec succès
- 📱 **Format PeerID** : Normalisation correcte (9 chiffres sans 243)
- 💾 **Base de données** : Transactions créées correctement
- 🔐 **Sécurité** : Auth header calculé automatiquement

### ❌ Problème identifié
```
❌ B2B payment error: {"code":60,"message":"Resource not found","description":"The requested URI or the requested resource does not exist."}
```

**Code erreur Orange** : `60` = "Resource not found"  
**HTTP Status** : `404 Not Found`

---

## 🎯 Cause probable

L'endpoint B2B n'est **pas encore activé** dans l'environnement de production Orange Money :

```
POST https://api.orange.com/orange-money-b2b/v1/cd/transactions/omdcashin
```

### Hypothèses techniques

1. **Environnement sandbox vs production**
   - L'URL peut différer entre test et production
   - Vérifier avec Orange si un endpoint de **sandbox** existe

2. **Activation du service**
   - Le POS ID (`GeQpqUI`) n'est peut-être pas encore activé pour l'API B2B
   - Le compte Kwenda nécessite peut-être une activation manuelle

3. **Format d'URL alternatif**
   Tester ces variantes avec Orange :
   ```
   ❓ https://api.orange.com/orange-money-b2b/cd/v1/transactions/omdcashin
   ❓ https://api.orange.com/orange-money-rdc/v1/transactions/omdcashin
   ❓ https://sandbox-api.orange.com/orange-money-b2b/v1/cd/transactions/omdcashin
   ```

---

## 🔧 Actions correctives

### ÉTAPE 1 : Contacter Orange Money B2B RDC

**📧 Email technique** : [support B2B Orange Money]

**📋 Informations à fournir** :

```markdown
Objet : Activation API B2B - Erreur 404 endpoint /transactions/omdcashin

Bonjour,

Nous intégrons l'API Orange Money B2B RDC pour notre plateforme Kwenda (VTC/Livraison).

**Problème** : Erreur 404 sur l'endpoint de paiement B2B
**Endpoint testé** : POST https://api.orange.com/orange-money-b2b/v1/cd/transactions/omdcashin

**Détails techniques** :
- Client ID : [ORANGE_MONEY_CLIENT_ID]
- POS ID : GeQpqUI
- OAuth Token : ✅ Obtenu avec succès
- Payload envoyé : Conforme à la documentation API

**Questions** :
1. L'endpoint `/orange-money-b2b/v1/cd/transactions/omdcashin` est-il correct pour la RDC ?
2. Existe-t-il un environnement **sandbox** pour les tests ?
3. Le POS ID "GeQpqUI" est-il activé pour l'API B2B ?
4. Des whitelists IP ou configurations supplémentaires sont-elles requises ?

**Webhook configuré** :
https://wddlktajnhwhyquwcdgf.supabase.co/functions/v1/orange-money-webhook/notifications

Merci de votre support.

Cordialement,
Équipe Technique Kwenda
```

---

### ÉTAPE 2 : Vérifier les secrets Supabase

```bash
# Accéder au dashboard Supabase
https://supabase.com/dashboard/project/wddlktajnhwhyquwcdgf/settings/functions

# Vérifier ces secrets :
✅ ORANGE_MONEY_API_URL = https://api.orange.com/orange-money-b2b/v1/cd
✅ ORANGE_MONEY_CLIENT_ID = [valeur fournie par Orange]
✅ ORANGE_MONEY_CLIENT_SECRET = [valeur fournie par Orange]
✅ ORANGE_MONEY_POS_ID = GeQpqUI
```

---

### ÉTAPE 3 : Activer les logs détaillés (✅ Fait)

L'edge function `mobile-money-payment` affiche maintenant :

```json
{
  "event": "orange_money_b2b_payment_init",
  "api_url_base": "https://api.orange.com/orange-money-b2b/v1/cd",
  "full_endpoint": "https://api.orange.com/orange-money-b2b/v1/cd/transactions/omdcashin",
  "payload": {
    "amount": 1000,
    "currency": "CDF",
    "partnerTransactionId": "KWENDA_xxx",
    "posId": "GeQpqUI",
    "peerId": "999123456",
    "peerIdType": "msisdn"
  }
}
```

**Comment tester** :
1. Effectuez une nouvelle tentative de recharge Orange Money
2. Consultez les logs : `https://supabase.com/dashboard/project/wddlktajnhwhyquwcdgf/functions/mobile-money-payment/logs`
3. Copiez le payload complet affiché
4. Envoyez-le à Orange pour validation

---

### ÉTAPE 4 : Tester avec Postman/curl

Si Orange fournit des credentials de **sandbox**, tester directement :

```bash
# 1. Obtenir le token OAuth
curl -X POST https://api.orange.com/oauth/v3/token \
  -H "Authorization: Basic $(echo -n 'CLIENT_ID:CLIENT_SECRET' | base64)" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=client_credentials"

# 2. Tester le paiement B2B
curl -X POST https://api.orange.com/orange-money-b2b/v1/cd/transactions/omdcashin \
  -H "Authorization: Bearer {ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 1000,
    "currency": "CDF",
    "partnerTransactionId": "TEST_1234",
    "posId": "GeQpqUI",
    "peerId": "999123456",
    "peerIdType": "msisdn"
  }'
```

---

## 🛠️ Solutions de contournement temporaires

### Option A : Simuler le paiement Orange (dev uniquement)

Modifier `mobile-money-payment/index.ts` pour simuler le succès :

```typescript
// ⚠️ TEMPORAIRE - À RETIRER EN PRODUCTION
if (provider.toLowerCase() === 'orange') {
  console.log('⚠️ Using SIMULATED Orange Money response (404 workaround)');
  
  // Simuler une réponse réussie
  const simulatedResponse = {
    transactionId: `OM-SIMULATED-${Date.now()}`,
    transactionStatus: 'PENDING',
    partnerTransactionId: transactionId,
    amount: amount,
    currency: currency
  };

  await supabaseService
    .from('payment_transactions')
    .update({
      status: 'pending',
      metadata: { simulated: true, orange_transaction_id: simulatedResponse.transactionId },
      updated_at: new Date().toISOString()
    })
    .eq('id', transaction.id);

  return new Response(JSON.stringify({
    success: true,
    transactionId: transactionId,
    message: '⚠️ Paiement Orange simulé (en attente activation API)',
    status: 'pending'
  }), { headers: corsHeaders, status: 200 });
}
```

### Option B : Basculer temporairement sur Airtel/M-Pesa

Désactiver Orange Money dans le frontend jusqu'à résolution du 404.

---

## 📈 Prochaines étapes

1. ✅ **Logs améliorés** : Déployés avec payload complet
2. ⏳ **Contact Orange** : Email d'activation à envoyer
3. ⏳ **Tests sandbox** : Si Orange fournit un environnement de test
4. ⏳ **Validation POS ID** : Confirmer l'activation du compte

---

## 📞 Contacts Orange Money RDC

- **Support technique B2B** : [À obtenir auprès d'Orange]
- **Documentation** : https://api.orange.com/
- **Dashboard B2B** : [Accès commerçant Orange Money]

---

**Date du diagnostic** : 2025-11-21  
**Version API** : Orange Money B2B v1  
**Statut** : 🔴 Endpoint 404 - En attente activation Orange
