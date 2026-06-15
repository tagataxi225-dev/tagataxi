# 🍊 Mobile Money Payment - Orange Money B2B RDC

## Configuration Orange Money B2B RDC Officielle

### Base URL
```
ORANGE_MONEY_API_URL=https://api.orange.com/orange-money-b2b/v1/cd
```

### Endpoints avec serviceName
```http
POST https://api.orange.com/orange-money-b2b/v1/cd/transactions/{serviceName}
```

**Services disponibles** :
- ✅ `cashout` : Client paie Kwenda (paiement marchand)
- ✅ `cashin` : Kwenda paie client (retrait - licence requise)

**⚠️ IMPORTANT** : Le `{serviceName}` est OBLIGATOIRE dans l'URL

### Headers Requis
```http
Authorization: Bearer <access_token>
Accept: application/json
Content-Type: application/json
```

### Body Request (Cashout)
```json
{
  "peerId": "855354014",
  "peerIdType": "msisdn",
  "amount": 10000,
  "currency": "CDF",
  "posId": "GeQpqUI",
  "transactionId": "123e4567-e89b-12d3-a456-426614174000"
}
```

### Champs Obligatoires

| Champ | Type | Description | Exemple |
|-------|------|-------------|---------|
| `peerId` | string | Numéro local 9 chiffres (SANS 243) | `"855354014"` |
| `peerIdType` | string | Type d'identifiant (toujours "msisdn") | `"msisdn"` |
| `amount` | number | Montant en CDF (500-500000) | `10000` |
| `currency` | string | Devise (toujours "CDF") | `"CDF"` |
| `posId` | string | POS ID (dans le BODY, pas header) | `"GeQpqUI"` |
| `transactionId` | string | UUID RFC 4122 (format obligatoire) | `"123e4567-e89b-12d3-a456-426614174000"` |

### Format Numéro de Téléphone

**⚠️ IMPORTANT : Orange Money B2B RDC utilise le format local (9 chiffres SANS 243)**

**peerId** doit être au format local (9 chiffres uniquement) :

| Input Client | Normalisation | peerId |
|--------------|---------------|--------|
| `0855354014` | Retirer `0` | `855354014` |
| `+243855354014` | Retirer `+243` | `855354014` |
| `243855354014` | Retirer `243` | `855354014` |

**Règles** :
- ✅ **9 chiffres uniquement** (sans préfixe)
- ✅ Format : `XXXXXXXXX`
- ❌ **Pas de code pays "243"**
- ❌ Pas d'espaces, tirets ou parenthèses

### Position du posId

Le `POS_ID` (`GeQpqUI`) doit être dans le **BODY**, **PAS dans un header X-Pos-Id**.

```typescript
// ✅ CORRECT (selon documentation officielle)
body: {
  peerId: "855354014",
  peerIdType: "msisdn",
  amount: 10000,
  currency: "CDF",
  posId: "GeQpqUI", // ✅ Dans le body
  transactionId: "KWENDA_123"
}

headers: {
  'Authorization': `Bearer ${token}`,
  'Accept': 'application/json',
  'Content-Type': 'application/json'
  // ❌ Pas de X-Pos-Id header
}
```

### Response Success (202 Accepted - Mode Asynchrone)

```json
{
  "status": "PENDING",
  "message": "<optional message>",
  "transactionData": {
    "type": "cashout",
    "peerId": "855354014",
    "peerIdType": "msisdn",
    "amount": 10000,
    "currency": "CDF",
    "posId": "GeQpqUI",
    "transactionId": "KWENDA_1234567890_ABC123",
    "txnId": "MP240123.1234.A12345"
  }
}
```

**⚠️ IMPORTANT** : L'API retourne `202 Accepted` avec `status: "PENDING"` car le traitement est **asynchrone**.
Le statut final sera notifié via le `callbackURL` configuré lors de la souscription à l'API.

### Response Error (400/401/404/500)

```json
{
  "error": {
    "code": "INVALID_REQUEST",
    "message": "Invalid receiver MSISDN format",
    "details": "Expected format: 243XXXXXXXXX"
  }
}
```

## Secrets Supabase Requis

```bash
# OAuth 2-legged
ORANGE_MONEY_CLIENT_ID="votre_client_id"
ORANGE_MONEY_CLIENT_SECRET="votre_client_secret"

# API B2B RDC
ORANGE_MONEY_API_URL="https://api.orange.com/orange-money-b2b/v1/cd"
ORANGE_MONEY_POS_ID="GeQpqUI"

# Auth header (optionnel, calculé automatiquement si absent)
ORANGE_MONEY_AUTH_HEADER="Basic <base64(client_id:client_secret)>"
```

## Limites Orange Money RDC

- **Montant minimum** : 500 CDF
- **Montant maximum** : 500,000 CDF
- **Rate limit** : 5 requêtes/minute par utilisateur
- **Timeout requête** : 30 secondes

## Logs de Debug

Tous les logs sont au format JSON structuré pour faciliter le monitoring :

```json
{
  "timestamp": "2025-11-21T19:45:00.000Z",
  "event": "orange_money_b2b_cashout_init",
  "user_id": "uuid-user",
  "amount": 10000,
  "currency": "CDF",
  "transaction_id": "KWENDA_1234567890_ABC123",
  "receiver_msisdn": "243855354014",
  "msisdn_format": "international_with_243",
  "full_endpoint": "https://api.orange.com/orange-money-b2b/v1/cd/transactions",
  "payload": { /* ... */ },
  "headers": {
    "has_auth": true,
    "has_pos_id": true
  }
}
```

## Références

- [Documentation Orange Money B2B RDC](https://developer.orange.com/apis/orange-money-b2b-cd/getting-started)
- Endpoint Token OAuth : `https://api.orange.com/oauth/v3/token`
- Endpoint Transactions : `https://api.orange.com/orange-money-b2b/v1/cd/transactions`

## Support

En cas de problème avec l'API Orange Money :
- Vérifier les logs edge function : [Supabase Logs](https://supabase.com/dashboard/project/wddlktajnhwhyquwcdgf/functions/mobile-money-payment/logs)
- Contacter le support Orange Developer : support@developer.orange.com
- Documentation complète : https://developer.orange.com/apis/orange-money-b2b-cd
