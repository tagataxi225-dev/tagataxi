#!/usr/bin/env node
/**
 * 🚀 KWENDA - Script de Build Release Interactif
 * 
 * Usage: node scripts/build-release.js
 * 
 * Ce script guide l'utilisateur à travers:
 * 1. Choix de l'application (Client/Driver/Partner)
 * 2. Choix de la plateforme (Android/iOS/Les deux)
 * 3. Vérification des prérequis
 * 4. Build automatique
 * 5. Génération du bundle signé
 */

const readline = require('readline');
const { execSync, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration des apps
const APPS = {
  client: {
    name: 'Kwenda Client',
    id: 'cd.kwenda.client',
    config: 'capacitor.config.client.ts',
    color: '#DC2626',
    emoji: '👤'
  },
  driver: {
    name: 'Kwenda Driver',
    id: 'cd.kwenda.driver',
    config: 'capacitor.config.driver.ts',
    color: '#F59E0B',
    emoji: '🚗'
  },
  partner: {
    name: 'Kwenda Partner',
    id: 'cd.kwenda.partner',
    config: 'capacitor.config.partner.ts',
    color: '#10B981',
    emoji: '🏢'
  }
};

// Couleurs console
const c = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m'
};

// Interface readline
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function ask(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim().toLowerCase());
    });
  });
}

function log(message, color = 'reset') {
  console.log(`${c[color]}${message}${c.reset}`);
}

function logStep(step, total, message) {
  console.log(`\n${c.cyan}[${step}/${total}]${c.reset} ${c.bright}${message}${c.reset}`);
}

function logSuccess(message) {
  console.log(`${c.green}✅ ${message}${c.reset}`);
}

function logError(message) {
  console.log(`${c.red}❌ ${message}${c.reset}`);
}

function logWarning(message) {
  console.log(`${c.yellow}⚠️  ${message}${c.reset}`);
}

function logInfo(message) {
  console.log(`${c.blue}ℹ️  ${message}${c.reset}`);
}

function execCommand(command, options = {}) {
  try {
    execSync(command, { 
      stdio: options.silent ? 'pipe' : 'inherit',
      cwd: options.cwd || process.cwd()
    });
    return true;
  } catch (error) {
    if (!options.ignoreError) {
      logError(`Erreur lors de l'exécution: ${command}`);
      if (error.message) {
        console.log(`${c.dim}${error.message}${c.reset}`);
      }
    }
    return false;
  }
}

function checkCommand(command) {
  try {
    execSync(`which ${command}`, { stdio: 'pipe' });
    return true;
  } catch {
    // Windows fallback
    try {
      execSync(`where ${command}`, { stdio: 'pipe' });
      return true;
    } catch {
      return false;
    }
  }
}

function printHeader() {
  console.clear();
  console.log('');
  console.log(`${c.bright}${c.cyan}╔══════════════════════════════════════════════════════════════╗${c.reset}`);
  console.log(`${c.bright}${c.cyan}║${c.reset}                                                              ${c.bright}${c.cyan}║${c.reset}`);
  console.log(`${c.bright}${c.cyan}║${c.reset}   ${c.bright}🚀 KWENDA - Build Release pour App Stores${c.reset}                 ${c.bright}${c.cyan}║${c.reset}`);
  console.log(`${c.bright}${c.cyan}║${c.reset}                                                              ${c.bright}${c.cyan}║${c.reset}`);
  console.log(`${c.bright}${c.cyan}║${c.reset}   ${c.dim}Script automatisé pour générer les bundles${c.reset}                ${c.bright}${c.cyan}║${c.reset}`);
  console.log(`${c.bright}${c.cyan}║${c.reset}   ${c.dim}prêts à publier sur Google Play et App Store${c.reset}              ${c.bright}${c.cyan}║${c.reset}`);
  console.log(`${c.bright}${c.cyan}║${c.reset}                                                              ${c.bright}${c.cyan}║${c.reset}`);
  console.log(`${c.bright}${c.cyan}╚══════════════════════════════════════════════════════════════╝${c.reset}`);
  console.log('');
}

async function selectApp() {
  console.log(`${c.bright}📱 Quelle application voulez-vous compiler ?${c.reset}\n`);
  
  console.log(`  ${c.cyan}1${c.reset}) ${APPS.client.emoji} ${c.bright}Client${c.reset} - App pour les passagers`);
  console.log(`  ${c.cyan}2${c.reset}) ${APPS.driver.emoji} ${c.bright}Driver${c.reset} - App pour les chauffeurs`);
  console.log(`  ${c.cyan}3${c.reset}) ${APPS.partner.emoji} ${c.bright}Partner${c.reset} - App pour les partenaires`);
  console.log(`  ${c.cyan}4${c.reset}) 📦 ${c.bright}Toutes${c.reset} - Compiler les 3 applications`);
  console.log('');
  
  const answer = await ask(`${c.cyan}Votre choix (1-4): ${c.reset}`);
  
  switch (answer) {
    case '1': case 'client': return ['client'];
    case '2': case 'driver': return ['driver'];
    case '3': case 'partner': return ['partner'];
    case '4': case 'all': case 'toutes': return ['client', 'driver', 'partner'];
    default:
      logWarning('Choix invalide, sélection par défaut: Client');
      return ['client'];
  }
}

async function selectPlatform() {
  console.log(`\n${c.bright}📲 Pour quelle(s) plateforme(s) ?${c.reset}\n`);
  
  console.log(`  ${c.cyan}1${c.reset}) 🤖 ${c.bright}Android${c.reset} - Google Play Store`);
  console.log(`  ${c.cyan}2${c.reset}) 🍎 ${c.bright}iOS${c.reset} - Apple App Store (Mac requis)`);
  console.log(`  ${c.cyan}3${c.reset}) 📱 ${c.bright}Les deux${c.reset}`);
  console.log('');
  
  const answer = await ask(`${c.cyan}Votre choix (1-3): ${c.reset}`);
  
  switch (answer) {
    case '1': case 'android': return ['android'];
    case '2': case 'ios': return ['ios'];
    case '3': case 'both': case 'les deux': return ['android', 'ios'];
    default:
      logWarning('Choix invalide, sélection par défaut: Android');
      return ['android'];
  }
}

function checkPrerequisites(platforms) {
  logStep(1, 5, 'Vérification des prérequis...');
  
  let hasErrors = false;
  
  // Node.js
  if (checkCommand('node')) {
    const nodeVersion = execSync('node --version', { encoding: 'utf8' }).trim();
    logSuccess(`Node.js installé: ${nodeVersion}`);
  } else {
    logError('Node.js non trouvé');
    hasErrors = true;
  }
  
  // npm
  if (checkCommand('npm')) {
    logSuccess('npm installé');
  } else {
    logError('npm non trouvé');
    hasErrors = true;
  }
  
  // Capacitor
  if (fs.existsSync(path.join(process.cwd(), 'node_modules', '@capacitor', 'cli'))) {
    logSuccess('Capacitor CLI installé');
  } else {
    logWarning('Capacitor CLI non installé localement');
    logInfo('Exécutez: npm install');
  }
  
  // Android
  if (platforms.includes('android')) {
    console.log(`\n${c.dim}--- Android ---${c.reset}`);
    
    // Java
    if (checkCommand('java')) {
      logSuccess('Java installé');
    } else {
      logError('Java non trouvé (requis pour Android)');
      hasErrors = true;
    }
    
    // Android SDK
    if (process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT) {
      logSuccess('Android SDK configuré');
    } else {
      logWarning('ANDROID_HOME non configuré');
      logInfo('Installez Android Studio et configurez les variables d\'environnement');
    }
    
    // Dossier Android
    if (fs.existsSync(path.join(process.cwd(), 'android'))) {
      logSuccess('Projet Android initialisé');
    } else {
      logWarning('Dossier android/ non trouvé');
      logInfo('Exécutez: npx cap add android');
    }
    
    // Keystore
    const keystorePath = path.join(process.cwd(), 'android', 'kwenda-release-key.jks');
    if (fs.existsSync(keystorePath)) {
      logSuccess('Keystore de signature trouvé');
    } else {
      logWarning('Keystore non trouvé');
      console.log(`\n${c.yellow}Pour créer un keystore, exécutez:${c.reset}`);
      console.log(`${c.dim}keytool -genkey -v -keystore android/kwenda-release-key.jks \\`);
      console.log(`  -keyalg RSA -keysize 2048 -validity 10000 -alias kwenda${c.reset}\n`);
    }
  }
  
  // iOS
  if (platforms.includes('ios')) {
    console.log(`\n${c.dim}--- iOS ---${c.reset}`);
    
    if (process.platform !== 'darwin') {
      logError('iOS build nécessite un Mac');
      logInfo('Vous pouvez quand même préparer le projet');
    } else {
      // Xcode
      if (checkCommand('xcodebuild')) {
        logSuccess('Xcode installé');
      } else {
        logError('Xcode non trouvé');
        hasErrors = true;
      }
      
      // CocoaPods
      if (checkCommand('pod')) {
        logSuccess('CocoaPods installé');
      } else {
        logWarning('CocoaPods non trouvé');
        logInfo('Installez avec: sudo gem install cocoapods');
      }
    }
    
    // Dossier iOS
    if (fs.existsSync(path.join(process.cwd(), 'ios'))) {
      logSuccess('Projet iOS initialisé');
    } else {
      logWarning('Dossier ios/ non trouvé');
      logInfo('Exécutez: npx cap add ios');
    }
  }
  
  return !hasErrors;
}

async function buildApp(appType, platforms) {
  const app = APPS[appType];
  
  console.log(`\n${c.bgBlue}${c.white} ${app.emoji} ${app.name} ${c.reset}\n`);
  
  // Étape 2: Préparation Capacitor
  logStep(2, 5, 'Préparation de la configuration Capacitor...');
  
  if (!execCommand(`node scripts/prepare-capacitor.js ${appType}`)) {
    logError('Échec de la préparation Capacitor');
    return false;
  }
  
  // Étape 3: Build Web
  logStep(3, 5, 'Compilation du projet web (Vite)...');
  
  // Définir la variable d'environnement pour le type d'app
  process.env.VITE_APP_TYPE = appType;
  
  if (!execCommand('npm run build')) {
    logError('Échec du build web');
    return false;
  }
  
  logSuccess('Build web terminé');
  
  // Étape 4: Sync Capacitor
  logStep(4, 5, 'Synchronisation Capacitor...');
  
  if (!execCommand('npx cap sync')) {
    logError('Échec de la synchronisation');
    return false;
  }
  
  logSuccess('Synchronisation terminée');
  
  // Étape 5: Build natif
  logStep(5, 5, 'Génération des bundles natifs...');
  
  const results = {
    android: null,
    ios: null
  };
  
  // Android
  if (platforms.includes('android')) {
    console.log(`\n${c.dim}--- Build Android ---${c.reset}`);
    
    const androidDir = path.join(process.cwd(), 'android');
    
    if (!fs.existsSync(androidDir)) {
      logWarning('Projet Android non initialisé');
      logInfo('Exécutez: npx cap add android');
      results.android = 'not_initialized';
    } else {
      // Vérifier le keystore
      const keystorePath = path.join(androidDir, 'kwenda-release-key.jks');
      
      if (!fs.existsSync(keystorePath)) {
        logWarning('Keystore non trouvé - Build debug uniquement');
        
        // Build debug APK
        const gradleCmd = process.platform === 'win32' ? 'gradlew.bat' : './gradlew';
        if (execCommand(`${gradleCmd} assembleDebug`, { cwd: androidDir })) {
          logSuccess('APK Debug généré');
          results.android = 'debug';
        } else {
          logError('Échec du build Android');
          results.android = 'failed';
        }
      } else {
        // Build release AAB
        const gradleCmd = process.platform === 'win32' ? 'gradlew.bat' : './gradlew';
        if (execCommand(`${gradleCmd} bundleRelease`, { cwd: androidDir })) {
          logSuccess('Bundle AAB Release généré');
          results.android = 'release';
        } else {
          logError('Échec du build Android Release');
          results.android = 'failed';
        }
      }
    }
  }
  
  // iOS
  if (platforms.includes('ios')) {
    console.log(`\n${c.dim}--- Build iOS ---${c.reset}`);
    
    const iosDir = path.join(process.cwd(), 'ios', 'App');
    
    if (!fs.existsSync(iosDir)) {
      logWarning('Projet iOS non initialisé');
      logInfo('Exécutez: npx cap add ios');
      results.ios = 'not_initialized';
    } else if (process.platform !== 'darwin') {
      logWarning('Build iOS impossible (Mac requis)');
      logInfo('Le projet est prêt, ouvrez-le sur un Mac avec Xcode');
      results.ios = 'mac_required';
    } else {
      // CocoaPods
      if (fs.existsSync(path.join(iosDir, 'Podfile'))) {
        execCommand('pod install', { cwd: iosDir, ignoreError: true });
      }
      
      // Archive
      const archiveCmd = `xcodebuild -workspace App.xcworkspace -scheme App -configuration Release -archivePath build/${appType}.xcarchive archive`;
      
      if (execCommand(archiveCmd, { cwd: iosDir })) {
        logSuccess('Archive iOS générée');
        results.ios = 'release';
      } else {
        logWarning('Build automatique échoué');
        logInfo('Ouvrez le projet dans Xcode: npx cap open ios');
        results.ios = 'manual';
      }
    }
  }
  
  return results;
}

function printResults(appType, platforms, results) {
  const app = APPS[appType];
  
  console.log(`\n${c.bright}═══════════════════════════════════════════════════════════════${c.reset}`);
  console.log(`${c.bright}📦 RÉSULTATS - ${app.emoji} ${app.name}${c.reset}`);
  console.log(`${c.bright}═══════════════════════════════════════════════════════════════${c.reset}\n`);
  
  if (platforms.includes('android')) {
    console.log(`${c.bright}🤖 Android:${c.reset}`);
    
    switch (results.android) {
      case 'release':
        logSuccess('Bundle AAB prêt pour Google Play');
        console.log(`   ${c.dim}Fichier: android/app/build/outputs/bundle/release/app-release.aab${c.reset}`);
        break;
      case 'debug':
        logWarning('APK Debug généré (créez un keystore pour le release)');
        console.log(`   ${c.dim}Fichier: android/app/build/outputs/apk/debug/app-debug.apk${c.reset}`);
        break;
      case 'not_initialized':
        logInfo('Exécutez: npx cap add android');
        break;
      case 'failed':
        logError('Échec - Vérifiez la configuration Android');
        break;
    }
    console.log('');
  }
  
  if (platforms.includes('ios')) {
    console.log(`${c.bright}🍎 iOS:${c.reset}`);
    
    switch (results.ios) {
      case 'release':
        logSuccess('Archive prête pour App Store Connect');
        console.log(`   ${c.dim}Fichier: ios/App/build/${appType}.xcarchive${c.reset}`);
        break;
      case 'mac_required':
        logWarning('Ouvrez le projet sur un Mac avec Xcode');
        break;
      case 'not_initialized':
        logInfo('Exécutez: npx cap add ios');
        break;
      case 'manual':
        logInfo('Ouvrez Xcode: npx cap open ios');
        break;
    }
    console.log('');
  }
}

function printFinalInstructions(platforms) {
  console.log(`\n${c.bright}📋 PROCHAINES ÉTAPES${c.reset}\n`);
  
  if (platforms.includes('android')) {
    console.log(`${c.cyan}Google Play Store:${c.reset}`);
    console.log(`  1. Allez sur ${c.blue}https://play.google.com/console${c.reset}`);
    console.log(`  2. Créez une nouvelle application`);
    console.log(`  3. Uploadez le fichier .aab dans "Production"`);
    console.log(`  4. Remplissez les informations de la fiche`);
    console.log(`  5. Soumettez pour examen\n`);
  }
  
  if (platforms.includes('ios')) {
    console.log(`${c.cyan}Apple App Store:${c.reset}`);
    console.log(`  1. Ouvrez Xcode et l'archive`);
    console.log(`  2. Cliquez "Distribute App"`);
    console.log(`  3. Choisissez "App Store Connect"`);
    console.log(`  4. Suivez les instructions`);
    console.log(`  5. Complétez sur ${c.blue}https://appstoreconnect.apple.com${c.reset}\n`);
  }
}

// Main
async function main() {
  printHeader();
  
  try {
    // Sélection de l'app
    const appTypes = await selectApp();
    
    // Sélection de la plateforme
    const platforms = await selectPlatform();
    
    console.log('\n');
    
    // Vérification des prérequis
    const prereqOk = checkPrerequisites(platforms);
    
    if (!prereqOk) {
      console.log(`\n${c.yellow}Des prérequis sont manquants. Continuer quand même ? (o/n)${c.reset}`);
      const answer = await ask('> ');
      if (answer !== 'o' && answer !== 'oui' && answer !== 'y' && answer !== 'yes') {
        logInfo('Build annulé. Installez les prérequis manquants.');
        rl.close();
        return;
      }
    }
    
    // Build de chaque app sélectionnée
    for (const appType of appTypes) {
      const results = await buildApp(appType, platforms);
      if (results) {
        printResults(appType, platforms, results);
      }
    }
    
    // Instructions finales
    printFinalInstructions(platforms);
    
    console.log(`${c.green}${c.bright}🎉 Processus terminé !${c.reset}\n`);
    
  } catch (error) {
    logError(`Erreur: ${error.message}`);
  } finally {
    rl.close();
  }
}

// Exécuter
main();
