#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const appType = process.env.VITE_APP_TYPE || 'client';
const sourceDir = path.join(__dirname, '../public/icons', appType);
const destDir = path.join(__dirname, '../public');

console.log(`📦 Copie des assets pour l'app ${appType}...`);

// Vérifier que le dossier source existe
if (!fs.existsSync(sourceDir)) {
  console.error(`❌ Erreur: Le dossier ${sourceDir} n'existe pas`);
  process.exit(1);
}

// Copier les icônes spécifiques
const filesToCopy = [
  { source: 'icon-192.png', dest: 'android-chrome-192x192.png' },
  { source: 'icon-512.png', dest: 'android-chrome-512x512.png' },
  { source: 'icon-1024.png', dest: 'app-icon-1024.png' },
  { source: 'splash.png', dest: 'splash-screen.png' }
];

filesToCopy.forEach(({ source, dest }) => {
  const sourcePath = path.join(sourceDir, source);
  const destPath = path.join(destDir, dest);
  
  if (fs.existsSync(sourcePath)) {
    fs.copyFileSync(sourcePath, destPath);
    console.log(`  ✓ ${source} → ${dest}`);
  } else {
    console.warn(`  ⚠ ${source} non trouvé, ignoré`);
  }
});

console.log(`✅ Assets copiés avec succès pour l'app ${appType}`);
