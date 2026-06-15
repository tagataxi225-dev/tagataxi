#!/usr/bin/env node

/**
 * Script pour convertir les images critiques en WebP responsive
 * Génère plusieurs tailles pour optimiser le chargement selon le viewport
 * 
 * Usage: node scripts/convert-to-responsive-webp.js
 */

const fs = require('fs');
const path = require('path');

console.log('\n🖼️  Conversion des images en WebP responsive...\n');

try {
  const sharp = require('sharp');
  
  const assetsDir = path.join(__dirname, '../src/assets');
  const publicDir = path.join(__dirname, '../public');
  
  // Configuration des images à traiter avec leurs tailles responsive
  const imagesToProcess = [
    {
      input: 'campaign-delivery.png',
      dir: assetsDir,
      sizes: [
        { width: 640, quality: 85 },
        { width: 800, quality: 82 },
        { width: 1024, quality: 80 },
        { width: 1280, quality: 78 }
      ]
    },
    {
      input: 'campaign-client.png',
      dir: assetsDir,
      sizes: [
        { width: 640, quality: 85 },
        { width: 800, quality: 82 },
        { width: 1024, quality: 80 },
        { width: 1280, quality: 78 }
      ]
    },
    {
      input: 'kwenda-logo.png',
      dir: assetsDir,
      sizes: [
        { width: 48, quality: 90 },
        { width: 64, quality: 90 },
        { width: 80, quality: 90 },
        { width: 96, quality: 90 },
        { width: 128, quality: 90 }
      ]
    }
  ];
  
  const processImageWithSizes = async (config) => {
    const inputPath = path.join(config.dir, config.input);
    
    if (!fs.existsSync(inputPath)) {
      console.log(`⚠️  ${config.input} non trouvé, ignoré.\n`);
      return;
    }
    
    console.log(`📸 Traitement de ${config.input}...`);
    
    const inputStats = fs.statSync(inputPath);
    const inputSizeKB = (inputStats.size / 1024).toFixed(2);
    console.log(`   Taille originale: ${inputSizeKB} KB`);
    
    let totalSaved = 0;
    let totalOutputSize = 0;
    
    for (const size of config.sizes) {
      const baseName = path.basename(config.input, path.extname(config.input));
      const widthSuffix = `-${size.width}w`;
      const outputPath = path.join(config.dir, `${baseName}${widthSuffix}.webp`);
      
      try {
        await sharp(inputPath)
          .resize(size.width, null, {
            fit: 'inside',
            withoutEnlargement: true
          })
          .webp({ quality: size.quality })
          .toFile(outputPath);
        
        const outputStats = fs.statSync(outputPath);
        const outputSizeKB = (outputStats.size / 1024).toFixed(2);
        
        totalOutputSize += outputStats.size;
        
        console.log(`   ✓ ${baseName}${widthSuffix}.webp → ${outputSizeKB} KB (${size.width}px)`);
      } catch (error) {
        console.error(`   ❌ Erreur pour largeur ${size.width}px:`, error.message);
      }
    }
    
    const totalSavedKB = ((inputStats.size - totalOutputSize / config.sizes.length) / 1024).toFixed(2);
    const savedPercent = ((1 - (totalOutputSize / config.sizes.length) / inputStats.size) * 100).toFixed(1);
    
    console.log(`   💾 Économie moyenne: ${totalSavedKB} KB par taille (${savedPercent}%)\n`);
  };
  
  (async () => {
    for (const imageConfig of imagesToProcess) {
      await processImageWithSizes(imageConfig);
    }
    
    console.log('✨ Conversion terminée !\n');
    console.log('📊 Résumé des optimisations:');
    console.log('   • campaign-delivery: 4 tailles responsive (640px, 800px, 1024px, 1280px)');
    console.log('   • campaign-client: 4 tailles responsive (640px, 800px, 1024px, 1280px)');
    console.log('   • kwenda-logo: 5 tailles (48px, 64px, 80px, 96px, 128px)\n');
    console.log('💡 Les composants utilisent déjà ResponsiveImage avec useWebP={true}.');
    console.log('💡 Le navigateur choisira automatiquement la meilleure taille.\n');
  })();
  
} catch (error) {
  if (error.code === 'MODULE_NOT_FOUND') {
    console.error('❌ Sharp n\'est pas installé.');
    console.log('\n📦 Installez-le avec:');
    console.log('   npm install -D sharp');
    console.log('\nPuis relancez ce script.\n');
    process.exit(1);
  } else {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}
