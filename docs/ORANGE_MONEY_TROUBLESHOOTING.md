# 🔧 Orange Money - Guide de Dépannage

## 📋 Problèmes Courants et Solutions

### 1️⃣ **Paiement bloqué en statut 'processing'**

**Symptômes** :
- Transaction reste en "processing" pendant plus de 10 minutes
- L'utilisateur ne reçoit pas de notification de succès
- Le wallet n'est pas crédité

**Causes possibles** :
- Webhook Orange Money non reçu
- Problème de connectivité réseau
- Session de paiement expirée côté Orange

**Solutions** :
1. **Vérifier les logs webhook** :
   ```bash
   # Dans Supabase Dashboard
   Functions > orange-money-webhook > Logs
   ```
   - Rechercher le `transaction_id` de la transaction bloquée
   - Vérifier si le webhook a été reçu

2. **Vérifier le cron job de retry** :
   ```sql
   -- Vérifier que le cron est actif
   SELECT * FROM cron.job WHERE jobname = 'orange-money-retry-job';
   ```
   - Si inactif, suivre `ORANGE_MONEY_CRON_SETUP.md`

3. **Forcer la finalisation manuelle** :
   ```sql
   -- Si le paiement est confirmé côté Orange
   UPDATE payment_transactions
   SET status = 'completed',
       updated_at = NOW(),
       metadata = jsonb_set(
         COALESCE(metadata, '{}'::jsonb),
         '{manual_completion}',
         'true'::jsonb
       )
   WHERE transaction_id = 'TXN_ID_ICI';
   
   -- Puis créditer le wallet manuellement
   ```

---

### 2️⃣ **Erreur 401 Unauthorized**

**Symptômes** :
- Message "Unauthorized" lors du paiement
- Erreur 401 dans les logs

**Causes** :
- Secrets mal configurés
- Token OAuth expiré
- Credentials invalides

**Solutions** :
1. **Vérifier les secrets Supabase** :
   ```bash
   # Dans Supabase Dashboard
   Settings > Edge Functions > Secrets
   ```
   - `ORANGE_MONEY_CLIENT_ID` : Doit contenir le Client ID Orange
   - `ORANGE_MONEY_CLIENT_SECRET` : Doit contenir le Client Secret
   - `ORANGE_MONEY_BASIC_AUTH` : Doit être au format `Basic base64(client_id:client_secret)`

2. **Régénérer le token OAuth** :
   - Les tokens OAuth expirent après 1h
   - Le système utilise un cache de 55 minutes
   - En cas de problème, redémarrer l'edge function :
     ```bash
     # Dans Supabase Dashboard
     Functions > mobile-money-payment > Restart
     ```

3. **Contacter Orange Money** :
   - Vérifier que vos credentials de production sont actifs
   - Demander un nouveau `Client ID` / `Client Secret` si nécessaire

---

### 3️⃣ **Webhook non reçu**

**Symptômes** :
- Transaction complétée côté Orange mais pas dans Kwenda
- Aucun log dans `orange-money-webhook`

**Causes** :
- URL webhook incorrecte
- Firewall bloquant Orange Money
- Problème de configuration DNS

**Solutions** :
1. **Vérifier l'URL webhook** :
   ```
   URL correcte: https://wddlktajnhwhyquwcdgf.supabase.co/functions/v1/orange-money-webhook/notifications
   ```
   - Confirmer avec Orange que cette URL est bien configurée

2. **Tester l'accessibilité** :
   ```bash
   curl -X POST https://wddlktajnhwhyquwcdgf.supabase.co/functions/v1/orange-money-webhook/notifications \
     -H "Content-Type: application/json" \
     -d '{"test": true}'
   ```
   - Doit retourner HTTP 200

3. **Vérifier les logs Supabase** :
   ```bash
   Functions > orange-money-webhook > Logs
   ```
   - Rechercher les erreurs de parsing ou d'authentification

---

### 4️⃣ **Balance non créditée après paiement**

**Symptômes** :
- Transaction marquée "completed"
- Mais wallet toujours à 0

**Causes** :
- Erreur dans le webhook handler
- Mauvais mapping du `user_type`
- Problème de transaction SQL

**Solutions** :
1. **Vérifier la transaction** :
   ```sql
   SELECT * FROM payment_transactions 
   WHERE transaction_id = 'TXN_ID_ICI';
   ```
   - Noter le `user_type`, `order_type`, et `user_id`

2. **Vérifier le wallet correspondant** :
   ```sql
   -- Pour client
   SELECT * FROM user_wallets WHERE user_id = 'USER_ID_ICI';
   
   -- Pour partenaire
   SELECT * FROM partner_profiles WHERE user_id = 'USER_ID_ICI';
   
   -- Pour vendeur
   SELECT * FROM vendor_wallets WHERE vendor_id IN (
     SELECT id FROM marketplace_vendors WHERE user_id = 'USER_ID_ICI'
   );
   ```

3. **Créditer manuellement si nécessaire** :
   ```sql
   -- Client
   UPDATE user_wallets
   SET balance = balance + MONTANT
   WHERE user_id = 'USER_ID_ICI';
   
   -- Partenaire
   UPDATE partner_profiles
   SET balance = balance + MONTANT
   WHERE user_id = 'USER_ID_ICI';
   
   -- Vendeur
   UPDATE vendor_wallets
   SET balance = balance + MONTANT
   WHERE vendor_id IN (SELECT id FROM marketplace_vendors WHERE user_id = 'USER_ID_ICI');
   ```

---

## 🚨 Codes d'Erreur Orange Money

| Code | Signification | Action |
|------|---------------|--------|
| `INSUFFICIENT_BALANCE` | Solde Orange Money insuffisant | Demander à l'utilisateur de recharger son compte Orange |
| `INVALID_PHONE` | Numéro de téléphone invalide | Vérifier le format : `+243XXXXXXXXX` |
| `TRANSACTION_EXPIRED` | Session de paiement expirée | Réessayer le paiement |
| `MERCHANT_ERROR` | Problème avec le Merchant ID | Contacter Orange Money Support |
| `NETWORK_ERROR` | Problème réseau temporaire | Réessayer dans quelques minutes |
| `UNAUTHORIZED` | Credentials invalides | Vérifier `CLIENT_ID` et `CLIENT_SECRET` |
| `DUPLICATE_TRANSACTION` | Transaction déjà traitée | Vérifier l'historique des transactions |

---

## 🔄 Procédure d'Escalade

### **Niveau 1 : Support Technique Kwenda** (1h de SLA)
**Contact** : `support@kwenda.app`

**Informations à fournir** :
- `transaction_id` de la transaction problématique
- Logs de l'edge function (`mobile-money-payment` ou `orange-money-webhook`)
- Captures d'écran de l'erreur côté utilisateur
- Numéro de téléphone Orange Money concerné

---

### **Niveau 2 : Équipe Orange Money** (4h de SLA)
**Contact** : `support-b2b@orange-money-africa.com`

**Informations à fournir** :
- `Merchant ID` : Votre ID marchand
- `POS ID` : Votre Point Of Sale ID
- `Transaction Reference` : Le `transaction_id` Kwenda
- Date et heure exacte de la transaction
- Montant et numéro de téléphone
- Description du problème

---

### **Contact d'Urgence** (Production Down)
**Téléphone** : `+225 XX XX XX XX XX` (À confirmer avec Orange)

**Critères d'urgence** :
- Taux de succès < 50% pendant plus de 30 minutes
- Plus de 50 transactions bloquées simultanément
- Aucune transaction ne passe depuis plus de 2 heures

---

## 📊 Checklist de Diagnostic Rapide

Avant d'escalader, vérifier :
- [ ] Secrets Supabase configurés correctement
- [ ] Edge functions déployées et actives
- [ ] Cron job de retry opérationnel
- [ ] URL webhook accessible publiquement
- [ ] Logs consultés (sans erreur système)
- [ ] Test de paiement avec petit montant (500 CDF)
- [ ] Dashboard de monitoring consulté

---

## 🛠️ Outils de Diagnostic

### **1. Logs Supabase**
- **mobile-money-payment** : https://supabase.com/dashboard/project/wddlktajnhwhyquwcdgf/functions/mobile-money-payment/logs
- **orange-money-webhook** : https://supabase.com/dashboard/project/wddlktajnhwhyquwcdgf/functions/orange-money-webhook/logs
- **orange-money-retry** : https://supabase.com/dashboard/project/wddlktajnhwhyquwcdgf/functions/orange-money-retry/logs

### **2. Dashboard de Monitoring**
- Accéder depuis Admin Panel > Orange Money Monitoring
- Vérifier taux de succès, transactions bloquées, graphiques

### **3. Requêtes SQL de Debug**
```sql
-- Transactions récentes
SELECT * FROM payment_transactions
WHERE payment_provider = 'orange'
ORDER BY created_at DESC
LIMIT 20;

-- Transactions bloquées
SELECT * FROM payment_transactions
WHERE payment_provider = 'orange'
  AND status = 'processing'
  AND created_at < NOW() - INTERVAL '10 minutes';

-- Historique d'exécution du cron
SELECT * FROM cron.job_run_details
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'orange-money-retry-job')
ORDER BY start_time DESC
LIMIT 10;
```

---

## 📝 Notes Importantes

⚠️ **Ne jamais exposer** :
- Les secrets Supabase (`CLIENT_ID`, `CLIENT_SECRET`)
- Les tokens OAuth en logs
- Les numéros de téléphone complets (masquer les 5 premiers chiffres)

✅ **Bonnes pratiques** :
- Toujours vérifier les logs avant de contacter Orange
- Documenter chaque incident avec captures d'écran
- Garder un historique des escalades et résolutions
- Mettre à jour ce guide si nouveau problème rencontré