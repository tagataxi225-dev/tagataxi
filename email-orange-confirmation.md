# Email de Confirmation - Intégration Orange Money B2B RDC

**À** : support@orange.com  
**Objet** : ✅ Corrections effectuées - Intégration Orange Money B2B RDC  
**Priorité** : Normale

---

Bonjour,

Nous avons effectué les corrections demandées pour l'intégration Orange Money B2B RDC :

## ✅ Corrections apportées

### 1. Base URL corrigée
- **Ancienne** : `https://api.orange.com/orange-money-webpay/cd/v1`
- **Nouvelle** : `https://api.orange.com/orange-money-b2b/v1/cd`

### 2. Format PeerID corrigé
- **Format** : 9 chiffres sans code pays 243
- **Exemple** : `"999123456"` (et non `"243999123456"`)

### 3. API utilisée confirmée

---

## 📡 Endpoints de notre intégration

### Endpoint OAuth
```http
POST https://api.orange.com/oauth/v3/token
Authorization: Basic {base64(client_id:client_secret)}
Content-Type: application/x-www-form-urlencoded

grant_type=client_credentials
```

### Endpoint Paiement B2B
```http
POST https://api.orange.com/orange-money-b2b/v1/cd/transactions/omdcashin
Authorization: Bearer {access_token}
Content-Type: application/json
```

**Payload** :
```json
{
  "amount": 5000,
  "currency": "CDF",
  "partnerTransactionId": "KWENDA_1755901635480_abc123",
  "posId": "{notre_pos_id}",
  "peerId": "999123456",
  "peerIdType": "msisdn"
}
```

---

## 🔔 URL Webhook pour notifications

Pour recevoir les notifications de statut de paiement, veuillez configurer cette URL dans votre dashboard B2B :

```
POST https://wddlktajnhwhyquwcdgf.supabase.co/functions/v1/orange-money-webhook/notifications
Content-Type: application/json
```

### Format des notifications attendues

```json
{
  "partnerTransactionId": "KWENDA_xxx",
  "transactionStatus": "SUCCESS" | "FAILED" | "PENDING",
  "transactionId": "OM-xxx",
  "amount": 5000,
  "currency": "CDF",
  "peerId": "999123456",
  "errorCode": "xxx",
  "errorMessage": "xxx"
}
```

---

## 🔍 Informations techniques

**Application** : Kwenda VTC  
**Projet Supabase** : `wddlktajnhwhyquwcdgf`  
**Client ID Orange** : `{votre_client_id}`  
**POS ID** : `{votre_pos_id}`  

**Pays** : République Démocratique du Congo (RDC)  
**Devise** : Franc Congolais (CDF)  

---

## ✅ Actions demandées

Pouvez-vous confirmer :
1. ✅ La configuration de notre webhook dans votre système
2. ✅ L'activation de notre CLIENT_ID et POS_ID pour l'endpoint `/transactions/omdcashin`
3. ✅ Le délai moyen de traitement des paiements et notifications

---

## 📞 Contact

Pour toute question technique :
- **Email** : tech@kwenda-app.com
- **Téléphone** : +243 XXX XXX XXX

L'intégration est maintenant conforme à vos spécifications B2B.

Cordialement,  
**Équipe Technique Kwenda**

---

## 📎 Pièces jointes

- [Documentation technique webhook](supabase/functions/orange-money-webhook/README.md)
- [Script de validation](test-orange-api-url.sh)
- [Script de test webhook](test-orange-webhook.sh)
