# 🔊 Sons de Notifications Kwenda

## 📥 Téléchargement des Sons

Pour obtenir des sons libres de droits de haute qualité, visitez ces sites :

### 🎵 Sources Recommandées

#### **Freesound.org** (Gratuit, CC0)
1. Créer un compte sur https://freesound.org/
2. Rechercher les sons suivants :
   - "notification chime" pour les notifications générales
   - "cash register ding" pour les paiements
   - "car horn short" pour les transports
   - "success" pour les confirmations
   - "alert beep" pour les alertes

#### **Zapsplat.com** (Gratuit, Standard License)
1. Créer un compte sur https://www.zapsplat.com/
2. Télécharger :
   - Cash register sounds pour `payment-received.mp3`
   - Notification sounds pour les sons génériques
   - Vehicle sounds pour `driver-assigned.mp3`

#### **Mixkit.co** (Gratuit, no attribution)
https://mixkit.co/free-sound-effects/notification/

---

## 📂 Structure des Fichiers

```
public/sounds/
├── marketplace/
│   ├── new-order.mp3          # Son "ka-ching" ou "ding"
│   ├── order-confirmed.mp3    # Son positif, ascendant
│   ├── payment-received.mp3   # Cash register sound
│   ├── product-approved.mp3   # Son de succès
│   ├── product-rejected.mp3   # Son négatif, descendant
│   ├── product-flagged.mp3    # Son d'alerte modérée
│   ├── low-stock.mp3          # Son d'avertissement
│   └── review-received.mp3    # Son doux et positif
│
├── transport/
│   ├── driver-assigned.mp3    # Son de voiture ou confirmation
│   ├── driver-arrived.mp3     # Ping ou ding
│   ├── ride-started.mp3       # Son de démarrage
│
├── delivery/
│   ├── delivery-picked.mp3    # Beep court
│   ├── delivery-completed.mp3 # Son de réussite
│
├── admin/
│   ├── urgent-alert.mp3       # Alarme urgente
│   ├── error.mp3              # Son d'erreur bas
│   ├── warning.mp3            # Son d'avertissement
│   └── success.mp3            # Son de succès général
│
├── chat/
│   └── message.mp3            # Pop ou ping doux
│
└── general/
    ├── notification.mp3       # Son générique
    └── info.mp3               # Son informatif
```

---

## 🎛️ Spécifications Techniques

- **Format** : MP3 (128kbps minimum)
- **Durée** : 0.2s à 1s maximum
- **Volume normalisé** : -6dB à -3dB
- **Taille recommandée** : < 50KB par fichier

---

## 🔧 Système de Fallback

Si les fichiers MP3 n'existent pas, le système génère automatiquement des **bips synthétiques distinctifs** avec des fréquences spécifiques :

| Catégorie | Fréquence | Type d'onde |
|-----------|-----------|-------------|
| Marketplace | 800-1200 Hz | Triangle (effet "ka-ching") |
| Transport | 600-800 Hz | Sinusoïdale (neutre) |
| Livraison | 700-900 Hz | Carrée (rythmé) |
| Admin/Alerte | 1000-1200 Hz | Dents de scie (urgent) |
| Chat | 800 Hz | Sinusoïdale (doux) |
| Général | 700 Hz | Sinusoïdale |

Les sons synthétiques sont **fonctionnels et reconnaissables** mais moins professionnels que des vrais sons.

---

## ✅ Étapes d'Installation

1. **Télécharger les sons** depuis les sources ci-dessus
2. **Renommer** selon la structure ci-dessus
3. **Placer** dans les dossiers correspondants
4. **Tester** sur `/test-sounds`
5. **Vérifier** la console : aucun 404

---

## 🧪 Page de Test

Accédez à **`/test-sounds`** pour tester tous les sons et vérifier qu'ils fonctionnent correctement.

---

## 📝 Notes

- Le volume par défaut est réglé à **90%**
- Les sons peuvent être **désactivés** dans les paramètres
- Sur mobile, les sons sont **couplés avec vibrations**
- Les sons sont **préchargés** au démarrage pour de meilleures performances
