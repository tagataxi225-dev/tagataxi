#!/usr/bin/env node

/**
 * 🔥 Firebase Setup Script - Kwenda Super App
 * 
 * Script simplifié pour configurer Firebase pour l'application unique
 * 
 * Usage:
 *   node scripts/setup-firebase.js           # Configuration interactive
 *   node scripts/setup-firebase.js --check   # Vérifier la configuration
 *   node scripts/setup-firebase.js --copy    # Copier vers les projets natifs
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const APP_CONFIG = {
  appId: 'cd.kwenda.app',
  appName: 'Kwenda'
};

const PATHS = {
  firebase: path.join(__dirname, '..', 'firebase'),
  android: path.join(__dirname, '..', 'android', 'app'),
  ios: path.join(__dirname, '..', 'ios', 'App', 'App')
};

const FILES = {
  android: {
    source: 'google-services.json',
    required: true
  },
  ios: {
    source: 'GoogleService-Info.plist',
    required: true
  }
};

// Couleurs console
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkFile(filePath) {
  return fs.existsSync(filePath);
}

function validateGoogleServices(filePath) {
  try {
    const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const packageName = content?.client?.[0]?.client_info?.android_client_info?.package_name;
    
    if (packageName !== APP_CONFIG.appId) {
      return { valid: false, error: `Package name incorrect: ${packageName} (attendu: ${APP_CONFIG.appId})` };
    }
    
    if (!content?.project_info?.project_id) {
      return { valid: false, error: 'project_id manquant' };
    }
    
    return { valid: true, projectId: content.project_info.project_id };
  } catch (e) {
    return { valid: false, error: `Erreur de parsing: ${e.message}` };
  }
}

function validateGoogleServiceInfo(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    const bundleIdMatch = content.match(/<key>BUNDLE_ID<\/key>\s*<string>([^<]+)<\/string>/);
    const bundleId = bundleIdMatch ? bundleIdMatch[1] : null;
    
    if (bundleId !== APP_CONFIG.appId) {
      return { valid: false, error: `Bundle ID incorrect: ${bundleId} (attendu: ${APP_CONFIG.appId})` };
    }
    
    const projectIdMatch = content.match(/<key>PROJECT_ID<\/key>\s*<string>([^<]+)<\/string>/);
    
    return { valid: true, projectId: projectIdMatch ? projectIdMatch[1] : 'unknown' };
  } catch (e) {
    return { valid: false, error: `Erreur de lecture: ${e.message}` };
  }
}

function checkConfiguration() {
  log('\n🔍 Vérification de la configuration Firebase...\n', 'cyan');
  
  let allValid = true;
  
  // Vérifier Android
  const androidPath = path.join(PATHS.firebase, FILES.android.source);
  if (checkFile(androidPath)) {
    const result = validateGoogleServices(androidPath);
    if (result.valid) {
      log(`✅ Android: ${FILES.android.source} valide (projet: ${result.projectId})`, 'green');
    } else {
      log(`❌ Android: ${result.error}`, 'red');
      allValid = false;
    }
  } else {
    log(`⚠️  Android: ${FILES.android.source} manquant`, 'yellow');
    allValid = false;
  }
  
  // Vérifier iOS
  const iosPath = path.join(PATHS.firebase, FILES.ios.source);
  if (checkFile(iosPath)) {
    const result = validateGoogleServiceInfo(iosPath);
    if (result.valid) {
      log(`✅ iOS: ${FILES.ios.source} valide (projet: ${result.projectId})`, 'green');
    } else {
      log(`❌ iOS: ${result.error}`, 'red');
      allValid = false;
    }
  } else {
    log(`⚠️  iOS: ${FILES.ios.source} manquant`, 'yellow');
    allValid = false;
  }
  
  console.log('');
  
  if (allValid) {
    log('✅ Configuration Firebase complète!', 'green');
  } else {
    log('⚠️  Configuration Firebase incomplète. Voir firebase/README.md', 'yellow');
  }
  
  return allValid;
}

function copyToNativeProjects() {
  log('\n📋 Copie des fichiers Firebase vers les projets natifs...\n', 'cyan');
  
  let success = true;
  
  // Copier Android
  const androidSource = path.join(PATHS.firebase, FILES.android.source);
  const androidDest = path.join(PATHS.android, FILES.android.source);
  
  if (checkFile(androidSource)) {
    if (checkFile(PATHS.android)) {
      fs.copyFileSync(androidSource, androidDest);
      log(`✅ Copié: ${FILES.android.source} → android/app/`, 'green');
    } else {
      log(`⚠️  Dossier android/app/ non trouvé (exécutez 'npx cap add android' d'abord)`, 'yellow');
    }
  } else {
    log(`❌ Fichier source manquant: ${FILES.android.source}`, 'red');
    success = false;
  }
  
  // Copier iOS
  const iosSource = path.join(PATHS.firebase, FILES.ios.source);
  const iosDest = path.join(PATHS.ios, FILES.ios.source);
  
  if (checkFile(iosSource)) {
    if (checkFile(PATHS.ios)) {
      fs.copyFileSync(iosSource, iosDest);
      log(`✅ Copié: ${FILES.ios.source} → ios/App/App/`, 'green');
    } else {
      log(`⚠️  Dossier ios/App/App/ non trouvé (exécutez 'npx cap add ios' d'abord)`, 'yellow');
    }
  } else {
    log(`❌ Fichier source manquant: ${FILES.ios.source}`, 'red');
    success = false;
  }
  
  console.log('');
  return success;
}

async function interactiveSetup() {
  log('\n🔥 Configuration Firebase - Kwenda Super App\n', 'cyan');
  log(`   App ID: ${APP_CONFIG.appId}`, 'blue');
  log(`   App Name: ${APP_CONFIG.appName}\n`, 'blue');
  
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  const question = (prompt) => new Promise(resolve => rl.question(prompt, resolve));
  
  log('📋 Étapes à suivre:', 'yellow');
  log('1. Créer un projet Firebase sur https://console.firebase.google.com/', 'reset');
  log('2. Ajouter une app Android avec package: cd.kwenda.app', 'reset');
  log('3. Ajouter une app iOS avec bundle ID: cd.kwenda.app', 'reset');
  log('4. Télécharger les fichiers de configuration', 'reset');
  log('5. Les placer dans le dossier firebase/', 'reset');
  console.log('');
  
  await question('Appuyez sur Entrée quand les fichiers sont en place...');
  
  rl.close();
  
  const isValid = checkConfiguration();
  
  if (isValid) {
    copyToNativeProjects();
  }
}

// Main
const args = process.argv.slice(2);

if (args.includes('--check')) {
  checkConfiguration();
} else if (args.includes('--copy')) {
  copyToNativeProjects();
} else {
  interactiveSetup();
}
