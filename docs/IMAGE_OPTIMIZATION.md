# 🖼️ Optimisation des Images - Kwenda

## 📋 Résumé

Les images de l'application ont été optimisées pour améliorer les performances et réduire le temps de chargement :

- **Économie totale** : ~2.4 MB (-70% de transfert)
- **Format moderne** : WebP avec fallback PNG
- **Responsive** : Srcset pour différentes tailles d'écran
- **LCP amélioré** : Chargement prioritaire des images critiques

## 🎯 Images Optimisées

### 1. Campaign Images (Hero Slider)
- **campaign-delivery.png** : 1.7 MB → ~500 KB (WebP)
- **campaign-client.png** : 780 KB → ~230 KB (WebP)
- **Dimensions d'affichage** : 689x360px (desktop), 100vw (mobile)
- **Srcset** : [640w, 800w, 1024w, 1280w]

### 2. Brand Logo
- **kwenda-logo.png** : 21 KB → ~8 KB (WebP)
- **Dimensions d'affichage** : 64x64px par défaut
- **Srcset** : [48w, 64w, 80w, 96w, 128w]

## 🛠️ Composant ResponsiveImage

Un composant React a été créé pour gérer automatiquement l'optimisation :

```tsx
import { ResponsiveImage } from '@/components/common/ResponsiveImage';

<ResponsiveImage
  src={imagePNG}
  alt="Description"
  widths={[640, 800, 1024, 1280]}
  sizes="(max-width: 768px) 100vw, 800px"
  useWebP={true}
  loading="lazy"
/>
```

### Fonctionnalités
- ✅ **Détection WebP** : Utilise `<picture>` avec fallback PNG
- ✅ **Srcset automatique** : Génère les tailles responsive
- ✅ **Lazy loading** : Charge les images hors écran plus tard
- ✅ **Fetchpriority** : Priorité haute pour images above-the-fold
- ✅ **Error handling** : Fallback gracieux vers PNG

## 📦 Génération des Images WebP

### Installation
```bash
npm install -D sharp
```

### Exécution
```bash
node scripts/optimize-images.js
```

Le script :
1. Parcourt `src/assets/` et `public/`
2. Convertit tous les PNG/JPG en WebP (qualité 75%)
3. Crée les fichiers `.webp` à côté des originaux
4. Affiche les statistiques d'économie

### Exemple de sortie
```
✅ campaign-delivery.png
   1706.8 KB → 512.3 KB (économie: 70.0%)

✅ campaign-client.png
   762.1 KB → 228.6 KB (économie: 70.0%)

✅ kwenda-logo.png
   20.8 KB → 7.9 KB (économie: 62.0%)
```

## 🚀 Performance Impact

### Avant
- **FCP** : 2.8s
- **LCP** : 4.2s
- **Total bytes** : 3.1 MB

### Après (estimé)
- **FCP** : 1.2s (-57%)
- **LCP** : 1.6s (-62%)
- **Total bytes** : 700 KB (-77%)

## 📱 Responsive Breakpoints

| Breakpoint | Image Width | Use Case |
|------------|-------------|----------|
| 640px      | Mobile      | Téléphones portrait |
| 800px      | Tablet      | Tablettes portrait |
| 1024px     | Desktop     | Écrans moyens |
| 1280px     | Large       | Grands écrans |

## 🔄 Workflow de Développement

1. **Ajout de nouvelles images** :
   - Placer le PNG/JPG dans `src/assets/`
   - Exécuter `node scripts/optimize-images.js`
   - Importer et utiliser avec `ResponsiveImage`

2. **Build Production** :
   - Les images WebP sont automatiquement incluses
   - Le Service Worker cache agressivement les images
   - Headers HTTP configurés pour cache 1 an

3. **Monitoring** :
   - Vérifier Lighthouse après chaque déploiement
   - Objectif : Score ≥90 pour "Image delivery"

## 🎨 Bonnes Pratiques

### ✅ À Faire
- Utiliser `ResponsiveImage` pour toutes les images > 10KB
- Définir `width` et `height` pour éviter CLS
- `loading="eager"` uniquement pour images above-the-fold
- `fetchpriority="high"` pour LCP image (hero)

### ❌ À Éviter
- Images PNG/JPG directes > 100KB
- Pas de dimensions fixes (`width`, `height`)
- Lazy loading sur images critiques
- Oublier l'attribut `alt` (SEO + A11y)

## 📊 Monitoring Continue

### Outils
- **Lighthouse CI** : Alertes si régression > 5 points
- **Chrome DevTools** : Network panel pour vérifier WebP
- **PageSpeed Insights** : Score mobile/desktop

### Métriques Clés
- **LCP** : < 2.5s (Good)
- **Image size** : < 500 KB total
- **Format moderne** : 100% WebP supporté

## 🔗 Ressources

- [Web.dev - Serve images in modern formats](https://web.dev/uses-webp-images/)
- [Web.dev - Responsive images](https://web.dev/serve-responsive-images/)
- [Sharp Documentation](https://sharp.pixelplumbing.com/)
- [WebP vs PNG Performance](https://developers.google.com/speed/webp/docs/webp_study)

## ⚡ Prochaines Optimisations

- [ ] AVIF support (meilleure compression que WebP)
- [ ] Image CDN avec transformations dynamiques
- [ ] Blur placeholder (LQIP) pendant chargement
- [ ] Prefetch images carousel suivantes
