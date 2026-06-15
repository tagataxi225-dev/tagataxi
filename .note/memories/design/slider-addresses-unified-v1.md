# Memory: design/slider-addresses-unified-v1
Updated: 2026-01-20

## Slider Professionnel et Vif

Le `PromoSliderOptimized` a été amélioré avec :
- **Transitions dynamiques** : `scale: 1.02 → 1 → 0.98` avec easing fluide `[0.25, 0.46, 0.45, 0.94]`
- **Barre de progression** : Animation fluide via `requestAnimationFrame` (pas d'interval)
- **Dots animés** : Motion spring (`stiffness: 400, damping: 25`) avec glow subtil
- **Feedback tactile** : Haptics sur swipe et changement de slide

## Cohérence "Mes adresses" avec Taxi

Le `DestinationSearchDialog` affiche maintenant une section "Mes adresses" qui liste les 3 premières adresses sauvegardées de l'utilisateur, avec icônes différenciées (Home/Building) et étoile pour les favoris. Cette section utilise le même hook `useSavedAddresses` que `MobileAddressManager`.

## Google Places dans MobileAddressManager

Le formulaire d'ajout d'adresse intègre désormais `useGooglePlacesAutocomplete` avec :
- Input de recherche avec icône et loader
- Dropdown de suggestions stylé
- Indicateur visuel "Coordonnées GPS enregistrées"
- Validation des coordonnées via `coordinateService.normalize()`

## Service de Coordonnées Centralisé

Nouveau `src/services/coordinateService.ts` avec :
- `normalize()` : Valide et normalise les coordonnées avec fallback par ville
- `distance()` : Calcul Haversine en mètres
- `areClose()` : Vérification de proximité
- `deduplicateByProximity()` : Dédoublonnage géographique
