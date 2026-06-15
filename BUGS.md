# Chantiers Kwenda

Date : 29/04/2026
Refactor cleanup-dead-code mergé sur main. Bug A fixé en prod.

---

## P1 — Côté chauffeur

### Réception des courses
- [ ] Le chauffeur reçoit uniquement les commandes normales, pas le bidding
- [ ] Le chauffeur doit recevoir les courses bidding

### Bottom sheet acceptation
- [ ] Après les 15s, la course reste figée au lieu de disparaître

### Carte et marqueurs
- [ ] Tracé itinéraire pas pro
- [ ] Markers redondants
- [ ] Icône voiture à remplacer par autre SVG
- [ ] Markers retombent en boucle après acceptation

### Infos client manquantes côté chauffeur
- [ ] Photo client absente
- [ ] Nom client absent
- [ ] Contact (téléphone) client absent

### Navigation
- [ ] Ouverture du navigateur pas fluide
- [ ] Workflow attendu : pickup puis destination en flow Google Maps cohérent

### États de course
- [ ] Le chauffeur n'arrive pas à marquer "arrivé au pickup" — soit ça ne marche pas, soit ça coupe la commande

---

## P2 — Côté client

### Infos chauffeur après acceptation
- [ ] Infos chauffeur affichées pas toutes correctes
- [ ] Véhicule affiché incorrect
- [ ] Le client doit voir toutes les infos du chauffeur (nom, photo, plaque, modèle, couleur, rating)

### Suivi de course
- [ ] Suivi chauffeur incohérent
- [ ] Barre de progression pas fonctionnelle
- [ ] Étapes du suivi à respecter dans l'ordre

### États client
- [ ] Le client doit rester sur "recherche en cours" tant qu'aucun chauffeur n'a accepté
- [ ] Dès qu'un chauffeur accepte, bascule automatique vers l'écran de suivi

---

## P3 — Bug C non traité

- [ ] auto-retry-assignment reset driver_id=null après 5min sans driver_arrived_at
- [ ] Driver garde le bottom sheet quand sa course est ré-assignée à un autre
- [ ] Diagnostic fait pendant la session, fix prêt mais pas implémenté

---

## P4 — Décision produit en attente

### Bidding côté client
- [ ] useClientBidding restauré (commit 639347fa) mais pas branché à l'UI
- [ ] ModernTaxiInterface envoie biddingMode=true mais aucun panneau client n'affiche les contre-offres
- [ ] Décision : Option A (bidding bloquant timer + liste offres) ou Option B (1er driver qui accepte gagne)
- [ ] Bidding côté client : useClientBidding restauré mais pas branché à l'UI (ModernTaxiInterface envoie biddingMode=true mais aucun panneau client n'affiche les contre-offres reçues)
- [ ] Décision bidding : Option A bloquant (timer 5min + liste offres + accept/reject) ou Option B silent
- [ ] Bouton annuler course + signaler danger côté client après acceptation
- [ ] Adresses pickup/destination en texte lisible (pas "Position actuelle" générique)
- [ ] Cohérence "En route" / "Arrivée dans X min" entre les états

---

## Pour la session suivante

Priorité suggérée :
1. P0 trigger DB cassé (5 min, déblocage critique)
2. P0 toggle "En ligne" + is_active régression (~1h debug)
3. P1 course terminée stable (~30 min)
4. Décision bidding Option A vs B
5. Bidding Option A si choisi (~3-4h)
