# 🛠️ Scripts d'optimisation Kwenda

## 📸 convert-to-responsive-webp.js

### Description
Convertit les images critiques PNG en format WebP avec plusieurs tailles responsive pour optimiser les performances SEO et réduire le temps de chargement.

### Prérequis
```bash
npm install -D sharp
```

### Utilisation
```bash
node scripts/convert-to-responsive-webp.js
```

### Ce que fait le script
Le script traite automatiquement les images suivantes :

#### Images campagne (Hero Slider)
- **campaign-delivery.png** → 4 versions WebP :
  - `campaign-delivery-640w.webp` (mobile)
  - `campaign-delivery-800w.webp` (mobile large)
  - `campaign-delivery-1024w.webp` (tablet)
  - `campaign-delivery-1280w.webp` (desktop)

- **campaign-client.png** → 4 versions WebP :
  - `campaign-client-640w.webp`
  - `campaign-client-800w.webp`
  - `campaign-client-1024w.webp`
  - `campaign-client-1280w.webp`

#### Logo
- **kwenda-logo.png** → 5 versions WebP :
  - `kwenda-logo-48w.webp` (petit)
  - `kwenda-logo-64w.webp` (moyen)
  - `kwenda-logo-80w.webp` (grand)
  - `kwenda-logo-96w.webp` (très grand)
  - `kwenda-logo-128w.webp` (extra grand)

### Exemple de sortie
```
🖼️  Conversion des images en WebP responsive...

📸 Traitement de campaign-delivery.png...
   Taille originale: 1750.08 KB
   ✓ campaign-delivery-640w.webp → 145.3 KB (640px)
   ✓ campaign-delivery-800w.webp → 195.8 KB (800px)
   ✓ campaign-delivery-1024w.webp → 285.4 KB (1024px)
   ✓ campaign-delivery-1280w.webp → 398.2 KB (1280px)
   💾 Économie moyenne: 1493.4 KB par taille (85.6%)

📸 Traitement de campaign-client.png...
   Taille originale: 780.80 KB
   ✓ campaign-client-640w.webp → 89.2 KB (640px)
   ✓ campaign-client-800w.webp → 118.5 KB (800px)
   ✓ campaign-client-1024w.webp → 172.3 KB (1024px)
   ✓ campaign-client-1280w.webp → 238.6 KB (1280px)
   💾 Économie moyenne: 626.5 KB par taille (80.3%)

📸 Traitement de kwenda-logo.png...
   Taille originale: 21.34 KB
   ✓ kwenda-logo-48w.webp → 2.8 KB (48px)
   ✓ kwenda-logo-64w.webp → 4.1 KB (64px)
   ✓ kwenda-logo-80w.webp → 5.6 KB (80px)
   ✓ kwenda-logo-96w.webp → 7.2 KB (96px)
   ✓ kwenda-logo-128w.webp → 10.3 KB (128px)
   💾 Économie moyenne: 15.3 KB par taille (71.8%)

✨ Conversion terminée !

📊 Résumé des optimisations:
   • campaign-delivery: 4 tailles responsive (640px, 800px, 1024px, 1280px)
   • campaign-client: 4 tailles responsive (640px, 800px, 1024px, 1280px)
   • kwenda-logo: 5 tailles (48px, 64px, 80px, 96px, 128px)

💡 Les composants utilisent déjà ResponsiveImage avec useWebP={true}.
💡 Le navigateur choisira automatiquement la meilleure taille.
```

### Impact sur les performances

#### Avant la conversion
- **Total images** : ~2.5 MB
- **LCP** : ~4.2s
- **Score Image Delivery** : 0/100

#### Après la conversion
- **Total images** : ~600 KB (-76%)
- **LCP estimé** : ~1.4s (-67%)
- **Score Image Delivery estimé** : 90+/100

### Intégration automatique
Les composants React utilisent déjà le composant `ResponsiveImage` qui :
- Génère automatiquement les `srcset` avec les bonnes largeurs
- Utilise `<picture>` pour servir WebP aux navigateurs modernes
- Fallback automatique vers PNG pour navigateurs anciens
- Lazy loading et fetchPriority optimisés

Aucun changement de code n'est nécessaire après l'exécution du script !

### Ajouter de nouvelles images
Pour optimiser d'autres images critiques :

1. Éditer `scripts/convert-to-responsive-webp.js`
2. Ajouter la configuration dans `imagesToProcess` :
```js
{
  input: 'nouvelle-image.png',
  dir: assetsDir,
  sizes: [
    { width: 640, quality: 85 },
    { width: 800, quality: 82 },
    { width: 1024, quality: 80 },
    { width: 1280, quality: 78 }
  ]
}
```
3. Exécuter le script
4. Utiliser avec `<ResponsiveImage useWebP={true} />`

### Documentation complète
Voir `docs/WEBP_CONVERSION.md` pour la documentation technique détaillée.

---

## 🖼️ optimize-images.js

### Description
Script simple qui convertit tous les PNG/JPG en WebP dans `src/assets/` et `public/`.

### Utilisation
```bash
node scripts/optimize-images.js
```

⚠️ **Note** : Ce script crée une seule version WebP par image. Pour des optimisations responsive avancées, utilisez plutôt `convert-to-responsive-webp.js`.

---

## 🚀 Workflow recommandé

1. **Développement** : Ajouter les images PNG/JPG normalement
2. **Avant le commit** : Exécuter `node scripts/convert-to-responsive-webp.js`
3. **Build** : Vite bundle automatiquement les images WebP
4. **Production** : Service Worker cache les images pour 1 an

## 📊 Monitoring

### Vérifier les optimisations
```bash
# Build de production
npm run build

# Analyser avec Lighthouse
npx serve dist
# Ouvrir Chrome DevTools > Lighthouse
```

### Métriques à surveiller
- **Image Delivery** : Score ≥ 90
- **LCP** : < 2.5s
- **Total transfer** : < 1 MB

## 🔗 Ressources
- [Sharp Documentation](https://sharp.pixelplumbing.com/)
- [WebP Format Guide](https://developers.google.com/speed/webp)
- [Responsive Images MDN](https://developer.mozilla.org/en-US/docs/Learn/HTML/Multimedia_and_embedding/Responsive_images)
