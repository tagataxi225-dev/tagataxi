# Email pour Orange Money RDC - Demande d'activation API B2B

---

**À :** support technique Orange Money RDC / api-support@orange.com  
**Objet :** Demande d'activation API B2B Cash-In - Application Kwenda VTC  
**Priorité :** Haute

---

Bonjour,

Nous sommes l'équipe de développement de **Kwenda**, une application VTC multimodale opérant en République Démocratique du Congo (Kinshasa, Lubumbashi, Kolwezi).

Nous intégrons actuellement l'API Orange Money B2B pour permettre à nos utilisateurs de recharger leur portefeuille électronique KwendaPay via Orange Money.

## 🔴 Problème rencontré

Notre intégration rencontre une erreur **403 Access Denied** lors de l'appel à l'endpoint de paiement B2B, bien que l'authentification OAuth fonctionne correctement.

### Détails techniques

**Erreur reçue :**
```
HTTP 403 - Access denied
Message: "The application is not authorized to access this endpoint"
Endpoint: /transactions/omdcashin
```

**Informations de notre application :**
- **CLIENT_ID :** `[VOTRE_CLIENT_ID_ICI]`
- **POS_ID :** `[VOTRE_POS_ID_ICI]`
- **API Base URL :** `https://api.orange.com/orange-money-webpay/cd/v1`
- **Environnement :** Production RDC

**Ce qui fonctionne :**
- ✅ Authentification OAuth 2.0 (token obtenu avec succès)
- ✅ Requête correctement formatée selon la documentation
- ✅ Headers et body conformes aux spécifications

**Ce qui ne fonctionne pas :**
- ❌ Endpoint `/transactions/omdcashin` retourne 403
- ❌ Aucune transaction n'est créée
- ❌ Notre webhook ne reçoit aucune notification

### Statistiques d'échec

Au cours des derniers jours :
- **11 tentatives de paiement**
- **7 échecs (63%)** - tous dus à l'erreur 403
- **0 transaction réussie** depuis l'implémentation

### Logs d'erreur (exemple récent)

```
[2025-11-18 08:30:15] 🍊 Initiating Orange Money payment
[2025-11-18 08:30:15] 📞 Customer: +243XXXXXXXXX
[2025-11-18 08:30:15] 💰 Amount: 500 CDF
[2025-11-18 08:30:16] ✅ OAuth token obtained successfully
[2025-11-18 08:30:16] 📡 Calling /transactions/omdcashin
[2025-11-18 08:30:17] ❌ API Error: 403
[2025-11-18 08:30:17] ❌ Message: Access denied - The application is not authorized to access this endpoint
```

## 🎯 Demande d'assistance

Nous sollicitons votre aide pour :

1. **Vérifier que notre CLIENT_ID est autorisé** pour l'API B2B Cash-In (`/transactions/omdcashin`)
2. **Confirmer que notre POS_ID est valide** et associé à notre CLIENT_ID
3. **Valider l'environnement API** (Production RDC vs Sandbox)
4. **Activer les permissions nécessaires** pour notre application

## 📋 Informations complémentaires

**Notre implémentation respecte :**
- ✅ Format OAuth 2.0 avec grant_type=client_credentials
- ✅ Headers requis (Authorization Bearer, Accept, Content-Type)
- ✅ Structure du payload conforme à la documentation
- ✅ Webhook configuré pour recevoir les notifications

**Payload type envoyé :**
```json
{
  "partner_id": "[POS_ID]",
  "customer_id": "+243XXXXXXXXX",
  "amount": 500,
  "currency": "CDF",
  "reference": "KWENDA_1755901635480_xxxxx",
  "description": "Recharge KwendaPay"
}
```

## 🔐 Sécurité

Pour des raisons de sécurité, nous n'incluons pas nos credentials complets dans cet email. Nous pouvons les fournir via un canal sécurisé si nécessaire.

## ⏰ Urgence

Ce problème bloque actuellement nos utilisateurs congolais qui souhaitent recharger leur compte via Orange Money. Nous serions très reconnaissants d'une résolution rapide.

## 📞 Contact

Pour toute information complémentaire :
- **Email :** [votre-email@kwenda.app]
- **Téléphone :** [votre-numero-de-contact]
- **Disponibilité :** Du lundi au vendredi, 8h-18h (heure de Kinshasa)

Nous restons à votre disposition pour fournir toute information technique supplémentaire.

Cordialement,

**[Votre Nom]**  
Lead Developer - Kwenda VTC  
[votre-email@kwenda.app]

---

## 📎 Annexes (à joindre si possible)

1. Capture d'écran de l'erreur 403
2. Logs détaillés de la requête API
3. Notre contrat/accord commercial Orange Money (si applicable)

---

## ✅ Checklist avant envoi

- [ ] Remplacer `[VOTRE_CLIENT_ID_ICI]` par votre vrai CLIENT_ID
- [ ] Remplacer `[VOTRE_POS_ID_ICI]` par votre vrai POS_ID
- [ ] Remplacer `[votre-email@kwenda.app]` par votre email
- [ ] Remplacer `[votre-numero-de-contact]` par votre numéro
- [ ] Remplacer `[Votre Nom]` par votre nom
- [ ] Joindre les captures d'écran/logs si possible
- [ ] Vérifier que l'adresse email du destinataire est correcte
