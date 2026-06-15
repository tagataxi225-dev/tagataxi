#!/usr/bin/env node

/**
 * Script pour convertir les images PNG/JPG en WebP
 * Usage: node scripts/optimize-images.js
 * 
 * Nécessite l'installation de sharp:
 * npm install -D sharp
 */

const fs = require('fs');
const path = require('path');

console.log('\n🖼️  Optimisation des images en WebP...\n');
console.log('⚠️  Ce script nécessite sharp. Installez-le avec: npm install -D sharp\n');

try {
  const sharp = require('sharp');
  
  const assetsDir = path.join(__dirname, '../src/assets');
  const publicDir = path.join(__dirname, '../public');
  
  const processImage = async (inputPath, outputPath) => {
    try {
      const stats = fs.statSync(inputPath);
      const inputSizeKB = (stats.size / 1024).toFixed(2);
      
      await sharp(inputPath)
        .webp({ quality: 75 })
        .toFile(outputPath);
      
      const outputStats = fs.statSync(outputPath);
      const outputSizeKB = (outputStats.size / 1024).toFixed(2);
      const saved = ((1 - outputStats.size / stats.size) * 100).toFixed(1);
      
      console.log(`✅ ${path.basename(inputPath)}`);
      console.log(`   ${inputSizeKB} KB → ${outputSizeKB} KB (économie: ${saved}%)\n`);
    } catch (error) {
      console.error(`❌ Erreur avec ${inputPath}:`, error.message);
    }
  };
  
  const processDirectory = async (dir) => {
    if (!fs.existsSync(dir)) {
      console.log(`⚠️  Répertoire ${dir} non trouvé, ignoré.\n`);
      return;
    }
    
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        await processDirectory(fullPath);
      } else if (/\.(png|jpg|jpeg)$/i.test(file)) {
        const webpPath = fullPath.replace(/\.(png|jpg|jpeg)$/i, '.webp');
        await processImage(fullPath, webpPath);
      }
    }
  };
  
  (async () => {
    console.log('📁 Traitement de src/assets/...\n');
    await processDirectory(assetsDir);
    
    console.log('📁 Traitement de public/...\n');
    await processDirectory(publicDir);
    
    console.log('✨ Optimisation terminée !\n');
    console.log('💡 Les images WebP ont été créées à côté des originales.');
    console.log('💡 Le composant ResponsiveImage utilisera automatiquement les versions WebP.\n');
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
