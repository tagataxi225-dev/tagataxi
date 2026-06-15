# 📋 Guide de modification des tarifs véhicules taxi

## 🎯 Objectif
Ce guide explique comment modifier les tarifs des véhicules taxi dans l'interface admin de Kwenda.

---

## 🚗 Types de véhicules disponibles

| Type | Icône | Prix Base | Prix/km | Minimum |
|------|-------|-----------|---------|---------|
| **Moto-taxi** | 🏍️ | 1500 CDF | 500 CDF | 1000 CDF |
| **Éco** | 🚗 | 2500 CDF | 1500 CDF | 1500 CDF |
| **Confort** | 🚙 | 3200 CDF | 1800 CDF | 2000 CDF |
| **Premium** | 🚘 | 5000 CDF | 2000 CDF | 3000 CDF |

---

## 📝 Étapes de modification

### 1. Accéder à l'interface admin
- Connectez-vous avec un compte administrateur
- Allez dans **Admin > Configuration > Types de véhicules**

### 2. Modifier un type de véhicule
1. Cliquez sur le bouton **"Modifier"** du véhicule souhaité
2. Une fenêtre s'ouvre avec 3 champs de tarification :
   - **Prix de base** : Montant fixe au départ de la course
   - **Prix par km** : Montant ajouté par kilomètre parcouru
   - **Minimum** : Prix minimum garanti (même pour courte distance)

3. Ajustez les valeurs selon vos besoins
4. Cliquez sur **"Enregistrer"**

### 3. Activer/Désactiver un véhicule
- Utilisez le **toggle (switch)** à droite de chaque véhicule
- Un véhicule inactif n'apparaît plus pour les clients

---

## ⚠️ Règles de validation

Le système applique automatiquement ces règles :

| Règle | Valeur minimale | Raison |
|-------|----------------|--------|
| Prix de base | ≥ 500 CDF | Couvrir les coûts minimaux |
| Prix par km | ≥ 100 CDF | Rentabilité par distance |
| Prix minimum | ≥ Prix de base | Cohérence tarifaire |

**Exemple d'erreur :**
Si vous mettez `base_price = 2000` et `minimum_fare = 1500`, le système refusera car **Minimum < Base**.

---

## 🔄 Propagation des changements

**⚡ Les changements sont IMMÉDIATS !**

```
Admin modifie prix → Base de données mise à jour → Clients reçoivent changement
                           (< 1 seconde)
```

### Flux technique :
1. Admin clique "Enregistrer"
2. La table `pricing_rules` est mise à jour
3. Supabase Realtime notifie tous les clients connectés
4. Les clients rafraîchissent automatiquement les prix affichés

**Temps de propagation estimé :** < 5 secondes

---

## 📊 Logs d'audit

Chaque modification est automatiquement enregistrée dans `activity_logs` avec :

```json
{
  "vehicle_type": "taxi_moto",
  "vehicle_class": "moto",
  "old_base": 1500,
  "new_base": 1600,
  "old_per_km": 500,
  "new_per_km": 600,
  "old_minimum": 1000,
  "new_minimum": 1200,
  "changed_by": "admin@kwenda.app",
  "timestamp": "2025-10-07T14:30:00Z"
}
```

**Utilité :**
- Traçabilité des modifications
- Audit de sécurité
- Historique des changements de tarifs

---

## 🎨 Interface client après modification

Les clients verront immédiatement :
- Le **nouveau prix calculé** basé sur la distance
- Le **prix minimum garanti** affiché en bas
- Un **badge "Actif"** qui pulse pour les véhicules disponibles

**Exemple :**
```
┌─────────────────────────────────────┐
│ 🏍️ Moto-taxi       [Actif] 🟢     │
│ Transport rapide et économique      │
│                                     │
│ Base: 1500 CDF + 500 CDF/km       │
│ Prix calculé: 3500 CDF ───────────►│
│ (Minimum: 1000 CDF)                │
└─────────────────────────────────────┘
```

---

## 🚨 Cas d'usage courants

### Augmenter les tarifs en heure de pointe
1. Modifier le `price_per_km` de tous les véhicules (+20%)
2. Les clients verront les nouveaux prix immédiatement
3. Rétablir les tarifs normaux après la période de pointe

### Promouvoir un type de véhicule
1. Réduire temporairement le `base_price` du véhicule
2. Les clients verront le prix réduit
3. Suivre l'impact sur les commandes dans les analytics

### Désactiver un type temporairement
1. Désactiver le toggle du véhicule
2. Les clients ne le verront plus dans les options
3. Réactiver quand le service est à nouveau disponible

---

## 🔧 Résolution de problèmes

### Les clients ne voient pas les changements ?
✅ Vérifiez que le véhicule est **actif** (toggle ON)  
✅ Attendez 5 secondes maximum  
✅ Demandez aux clients de rafraîchir leur page  

### Erreur "Prix minimum invalide" ?
✅ Assurez-vous que `minimum_fare ≥ base_price`  
✅ Ajustez le prix de base si nécessaire  

### Plusieurs règles actives pour un véhicule ?
✅ Le système garde automatiquement UNE SEULE règle active par véhicule  
✅ En cas de conflit, la plus récente est conservée  

---

## 📞 Support

Pour toute question technique :
- 📧 Email : support@kwenda.app
- 💬 Slack : #admin-support
- 📱 WhatsApp : +243 XX XXX XXXX

---

**Dernière mise à jour :** 7 octobre 2025  
**Version :** 1.0
