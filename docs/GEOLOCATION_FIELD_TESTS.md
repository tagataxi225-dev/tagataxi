# 📍 Plan de Tests Géolocalisation Terrain - Kwenda

## 🎯 Objectifs des Tests

Valider la précision et la fiabilité de la géolocalisation GPS dans les conditions réelles d'utilisation à travers l'Afrique francophone (RDC et Côte d'Ivoire).

---

## 🗺️ Zones de Test Prioritaires

### 🇨🇩 **République Démocratique du Congo**

#### **1. Kinshasa**
- ✅ **Zones urbaines denses**
  - Gombe (centre-ville) - coordonnées: -4.3276, 15.3136
  - Commune de la Gombe (buildings élevés)
  - Marché Central (forte densité)
  
- ✅ **Zones semi-urbaines**
  - Ngaliema (zones résidentielles)
  - Lemba (quartiers mixtes)
  
- ✅ **Zones périphériques**
  - N'djili (zones aéroportuaires)
  - Kimbanseke (périphérie éloignée)
  - Mont Ngafula (zones en pente)

#### **2. Lubumbashi**
- Zone minière (Ruashi, Kamalondo)
- Centre-ville (Kenya, Lubumbashi)
- Zones résidentielles (Golf, Kampemba)

#### **3. Kolwezi**
- Cité minière
- Quartiers résidentiels
- Axes routiers principaux

### 🇨🇮 **Côte d'Ivoire**

#### **4. Abidjan**
- ✅ **Plateau** (centre d'affaires)
- ✅ **Yopougon** (commune populaire)
- ✅ **Cocody** (quartiers résidentiels)
- ✅ **Treichville** (zone portuaire)
- ✅ **Abobo** (densité élevée)

---

## 📋 Scénarios de Tests par Catégorie

### **A. Tests de Précision GPS (Niveau 1 - Critique)**

| ID | Scénario | Conditions | Résultat Attendu | Méthode de Validation |
|----|----------|-----------|------------------|----------------------|
| GPS-001 | Démarrage application | App fraîchement ouverte, GPS activé | Position acquise < 10s, précision < 20m | Chronomètre + mesure terrain |
| GPS-002 | Démarrage à froid | GPS désactivé puis activé | Position acquise < 30s, précision < 30m | Chronomètre + mesure terrain |
| GPS-003 | Démarrage sous bâtiment | À l'intérieur d'un bâtiment | Fallback au dernier point connu + message utilisateur | Vérifier message d'erreur |
| GPS-004 | Déplacement à pied | Marcher 500m en ligne droite | Trajet affiché correspond au chemin réel ±15m | Comparer trajet affiché vs Google Maps |
| GPS-005 | Déplacement en voiture | Trajet 5km en ville | Suivi fluide, pas de sauts > 50m | Observer carte en temps réel |
| GPS-006 | Déplacement rapide | Trajet voiture 80 km/h | Suivi continue sans décalage > 3s | Observer fluidité |
| GPS-007 | Arrêt prolongé | Voiture arrêtée 5 minutes | Position stable (pas de drift > 10m) | Observer stabilité position |
| GPS-008 | Tunnel/pont | Passage sous tunnel ou pont | Suivi reprend < 5s après sortie | Chronomètre |

### **B. Tests de Connectivité Réseau (Niveau 1 - Critique)**

| ID | Scénario | Conditions | Résultat Attendu | Méthode de Validation |
|----|----------|-----------|------------------|----------------------|
| NET-001 | 4G stable | Connexion 4G forte | Mise à jour position < 3s | Observer latence |
| NET-002 | 3G/Edge | Connexion 3G/Edge | Mise à jour position < 10s | Observer latence |
| NET-003 | Connexion instable | 4G ↔ 3G oscillant | Pas de perte de position | Observer continuité |
| NET-004 | Mode avion activé | Activer mode avion en course | App utilise dernière position + message d'alerte | Vérifier message |
| NET-005 | Perte réseau totale | Aucune connexion 2 minutes | Cache local fonctionne, données envoyées au retour | Vérifier sync |
| NET-006 | WiFi → 4G transition | Passer du WiFi à la 4G | Pas d'interruption du tracking | Observer continuité |

### **C. Tests de Performance Batterie (Niveau 2 - Important)**

| ID | Scénario | Durée | Résultat Attendu | Méthode de Validation |
|----|----------|-------|------------------|----------------------|
| BAT-001 | Tracking continu 1h | 1 heure | Consommation < 15% batterie | Paramètres téléphone |
| BAT-002 | Tracking continu 3h | 3 heures | Consommation < 40% batterie | Paramètres téléphone |
| BAT-003 | Background tracking | App en arrière-plan 30 min | Consommation < 5% batterie | Paramètres téléphone |
| BAT-004 | Optimisation adaptative | Batterie < 20% | Intervalle de mise à jour augmente automatiquement | Logs application |

### **D. Tests Multi-Utilisateurs (Niveau 2 - Important)**

| ID | Scénario | Conditions | Résultat Attendu | Méthode de Validation |
|----|----------|-----------|------------------|----------------------|
| MULTI-001 | 10 clients simultanés | 10 téléphones cherchent un chauffeur | Tous reçoivent des propositions < 30s | Chronomètre |
| MULTI-002 | 10 chauffeurs actifs | 10 chauffeurs en ligne même zone | Positions mises à jour sur carte admin | Dashboard admin |
| MULTI-003 | Matching concurrent | 5 courses simultanées même zone | Chaque client reçoit un chauffeur différent | Vérifier assignations |
| MULTI-004 | Tracking multiple | 5 courses actives simultanées | Tous les trackings fonctionnent sans lag | Observer fluidité |

### **E. Tests de Calcul d'Itinéraires (Niveau 1 - Critique)**

| ID | Scénario | Conditions | Résultat Attendu | Méthode de Validation |
|----|----------|-----------|------------------|----------------------|
| ROUTE-001 | Trajet court < 3km | Centre-ville | Prix cohérent ±10% vs Google Maps | Comparer estimations |
| ROUTE-002 | Trajet moyen 5-10km | Inter-quartiers | Prix cohérent ±15% vs Google Maps | Comparer estimations |
| ROUTE-003 | Trajet long > 15km | Périphérie | Prix cohérent ±20% vs Google Maps | Comparer estimations |
| ROUTE-004 | Embouteillage | Trafic dense | Route alternative proposée | Vérifier suggestion |
| ROUTE-005 | Route bloquée | Route fermée/travaux | Recalcul automatique | Observer recalcul |
| ROUTE-006 | Déviation chauffeur | Chauffeur prend autre route | Mise à jour prix si écart > 20% | Vérifier recalcul prix |

### **F. Tests Conditions Extrêmes (Niveau 3 - Optionnel)**

| ID | Scénario | Conditions | Résultat Attendu | Méthode de Validation |
|----|----------|-----------|------------------|----------------------|
| EXT-001 | Pluie intense | Conditions météo difficiles | GPS continue de fonctionner | Observer performance |
| EXT-002 | Zone rurale isolée | Faible couverture réseau | Mode dégradé activé | Vérifier fallback |
| EXT-003 | Téléphone bas de gamme | RAM < 2GB, Android 8 | App fonctionne sans crash | Tests de stabilité |
| EXT-004 | Multitâche intensif | 10+ apps ouvertes | Tracking continue | Observer stabilité |

---

## 🛠️ Équipement Requis

### **Matériel de Test**
- [ ] **10 smartphones minimum** :
  - 5 Android (différentes marques: Samsung, Tecno, Infinix, Xiaomi)
  - 3 iOS (iPhone 8 minimum)
  - 2 appareils bas de gamme (< 2GB RAM)
  
- [ ] **Accessoires** :
  - 10 cartes SIM avec forfait data
  - Powerbanks pour tests longue durée
  - Support voiture pour téléphones
  - Chronomètres / montres GPS

### **Logiciels de Référence**
- [ ] Google Maps (comparaison itinéraires)
- [ ] Waze (comparaison trafic)
- [ ] GPS Test (validation précision GPS)
- [ ] Network Cell Info (vérifier type réseau)

### **Outils de Mesure**
- [ ] Mètre ruban laser (validation distances)
- [ ] Tableau de bord admin Kwenda
- [ ] Logs serveur Supabase
- [ ] Console développeur navigateur

---

## 📊 Méthodologie de Test

### **Phase 1 : Tests Statiques (Jour 1)**
**Durée estimée : 4 heures**

1. **Installation et configuration** (30 min)
   - Installer l'app sur tous les appareils
   - Créer comptes de test (5 clients, 5 chauffeurs)
   - Vérifier permissions GPS activées

2. **Tests de démarrage** (1h)
   - Exécuter GPS-001 à GPS-003 sur chaque appareil
   - Noter temps d'acquisition GPS
   - Mesurer précision avec GPS Test

3. **Tests de stabilité** (1h)
   - Exécuter GPS-007 (position stable)
   - Vérifier drift GPS sur 10 minutes
   - Tester en intérieur vs extérieur

4. **Tests réseau** (1h30)
   - Exécuter NET-001 à NET-006
   - Simuler pertes réseau
   - Vérifier reconnexions automatiques

### **Phase 2 : Tests Dynamiques Urbains (Jour 2)**
**Durée estimée : 8 heures**

**Matin (4h) - Zone urbaine dense**
1. Trajet test 1 : Gombe → Kinshasa (5 km)
   - 2 clients + 2 chauffeurs
   - Exécuter ROUTE-001, GPS-004, GPS-005
   
2. Trajet test 2 : Yopougon → Plateau (8 km)
   - 3 clients + 3 chauffeurs
   - Exécuter ROUTE-002, NET-003, MULTI-003

**Après-midi (4h) - Zones variées**
3. Trajet longue distance : Périphérie → Centre (15 km)
   - Exécuter ROUTE-003, GPS-006, BAT-002
   
4. Tests simultanés : 10 utilisateurs actifs
   - Exécuter MULTI-001 à MULTI-004
   - Observer dashboard admin

### **Phase 3 : Tests Endurance et Extrêmes (Jour 3)**
**Durée estimée : 6 heures**

1. **Test batterie longue durée** (3h)
   - 5 chauffeurs en ligne continue
   - Mesurer consommation batterie toutes les 30 min
   - Exécuter BAT-001, BAT-002, BAT-003

2. **Tests conditions difficiles** (2h)
   - Zones à faible réseau
   - Tunnels et ponts
   - Exécuter EXT-001, EXT-002, GPS-008

3. **Tests bas de gamme** (1h)
   - App sur téléphones < 2GB RAM
   - Multitâche intensif
   - Exécuter EXT-003, EXT-004

---

## 📝 Grille de Validation (Checklist)

### **Critères de Succès Minimum (MVP)**

#### **GPS & Localisation**
- [ ] **95%** des acquisitions GPS < 15 secondes
- [ ] **90%** précision < 30 mètres en zone urbaine
- [ ] **85%** précision < 50 mètres en zone semi-urbaine
- [ ] Pas de drift > 10m sur position stationnaire

#### **Performance Réseau**
- [ ] **95%** mises à jour position < 5 secondes en 4G
- [ ] **85%** mises à jour position < 15 secondes en 3G
- [ ] Reconnexion automatique après perte réseau < 10s
- [ ] Cache local fonctionne hors-ligne

#### **Calcul d'Itinéraires**
- [ ] **90%** estimations prix ±15% vs distance réelle
- [ ] Recalcul automatique si déviation > 500m
- [ ] Routes alternatives proposées en cas d'embouteillage

#### **Performance Batterie**
- [ ] **< 15%** consommation batterie par heure de tracking
- [ ] **< 5%** consommation en arrière-plan (30 min)
- [ ] Mode économie d'énergie activé automatiquement < 20% batterie

#### **Stabilité Multi-Utilisateurs**
- [ ] **10 utilisateurs simultanés** sans dégradation performance
- [ ] **0 crash** sur tests de 3 heures continues
- [ ] Tous les chauffeurs visibles sur carte admin < 10s

---

## 🐛 Bugs Critiques à Remonter Immédiatement

| Niveau | Critère | Action |
|--------|---------|--------|
| **P0 - BLOQUANT** | GPS ne s'active pas après 30s | Arrêter tests, remonter immédiatement |
| **P0 - BLOQUANT** | Crash de l'app en tracking actif | Arrêter tests, remonter immédiatement |
| **P0 - BLOQUANT** | Prix calculé > 50% différent de distance réelle | Arrêter tests, remonter immédiatement |
| **P1 - CRITIQUE** | Perte position > 2 minutes en 4G | Terminer session, remonter en fin de journée |
| **P1 - CRITIQUE** | Consommation batterie > 25% par heure | Terminer session, remonter en fin de journée |
| **P2 - IMPORTANT** | Drift GPS > 20m en stationnaire | Noter et continuer, remonter en fin de tests |
| **P2 - IMPORTANT** | Latence mise à jour position > 10s en 4G | Noter et continuer, remonter en fin de tests |
| **P3 - MINEUR** | Interface ralentie en multitâche | Noter dans rapport, pas d'urgence |

---

## 📈 Template de Rapport de Tests

### **Rapport Quotidien (à remplir chaque soir)**

```markdown
# Rapport Tests Géolocalisation - [DATE]

## Équipe
- **Testeurs** : [Noms]
- **Localisation** : [Ville, Quartiers testés]
- **Appareils** : [Liste marques/modèles]

## Résumé Exécutif
- ✅ **Tests réussis** : X/Y
- ⚠️ **Tests échoués** : X/Y
- 🐛 **Bugs critiques** : X

## Tests Exécutés
| ID Test | Résultat | Précision GPS | Latence | Observations |
|---------|----------|---------------|---------|--------------|
| GPS-001 | ✅/❌    | Xm            | Xs      | [Notes]      |
| ...     | ...      | ...           | ...     | ...          |

## Bugs Identifiés
| ID Bug | Priorité | Description | Reproductibilité | Appareil |
|--------|----------|-------------|------------------|----------|
| BUG-001| P0/P1/P2 | [Desc]      | XX%              | [Model]  |

## Métriques Clés
- **Temps moyen acquisition GPS** : X secondes
- **Précision moyenne** : X mètres
- **Consommation batterie/heure** : X%
- **Erreurs de calcul prix** : X%

## Recommandations
1. [Action 1]
2. [Action 2]

## Photos/Vidéos
[Liens vers captures d'écran ou vidéos des bugs]
```

---

## 🎯 Objectifs de Performance par Ville

### **Kinshasa** (Priorité 1)
- ✅ Précision GPS < 20m (zones urbaines)
- ✅ Acquisition < 10s
- ✅ 100 courses tests minimum
- ✅ Tous quartiers couverts

### **Lubumbashi** (Priorité 2)
- ✅ Précision GPS < 25m
- ✅ Acquisition < 12s
- ✅ 50 courses tests minimum
- ✅ Zones minières validées

### **Kolwezi** (Priorité 3)
- ✅ Précision GPS < 30m
- ✅ 30 courses tests minimum

### **Abidjan** (Test pilote)
- ✅ Précision GPS < 20m
- ✅ 50 courses tests minimum
- ✅ Validation wôrô-wôrô

---

## 📞 Contacts Urgents

| Rôle | Contact | Disponibilité |
|------|---------|---------------|
| **Chef de projet** | [Nom] | 24/7 |
| **Développeur backend** | [Nom] | Lun-Ven 8h-18h |
| **Développeur mobile** | [Nom] | Lun-Ven 8h-18h |
| **Support technique** | support@kwenda.app | 24/7 |

---

## 🔄 Versioning

| Version | Date | Auteur | Modifications |
|---------|------|--------|---------------|
| 1.0 | 2025-10-08 | ICON SARL | Création initiale |

---

**📌 Notes importantes :**
- Toujours tester avec un mélange d'appareils Android et iOS
- Documenter chaque anomalie avec screenshots/vidéos
- Comparer systématiquement avec Google Maps pour validation
- Prioriser les zones à forte densité d'utilisateurs (Gombe, Plateau)
- Tester aux heures de pointe (7h-9h, 17h-19h) pour conditions réelles
