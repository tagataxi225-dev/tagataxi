#!/bin/bash
#
# 🚀 KWENDA - Script de Build Mobile (Bash)
#
# Usage: ./scripts/build-mobile.sh [client|driver|partner] [android|ios|both]
#
# Exemples:
#   ./scripts/build-mobile.sh client android    # Build Android de l'app Client
#   ./scripts/build-mobile.sh driver ios        # Build iOS de l'app Driver
#   ./scripts/build-mobile.sh partner both      # Build Android + iOS de l'app Partner
#

set -e

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# Arguments
APP_TYPE=${1:-client}
PLATFORM=${2:-android}

# Configuration des apps
declare -A APP_NAMES
APP_NAMES[client]="Kwenda Client"
APP_NAMES[driver]="Kwenda Driver"
APP_NAMES[partner]="Kwenda Partner"

declare -A APP_IDS
APP_IDS[client]="cd.kwenda.client"
APP_IDS[driver]="cd.kwenda.driver"
APP_IDS[partner]="cd.kwenda.partner"

# Fonctions d'affichage
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

log_step() {
    echo -e "\n${CYAN}[$1/$2]${NC} ${BOLD}$3${NC}"
}

# Vérifier les arguments
if [[ ! " client driver partner " =~ " ${APP_TYPE} " ]]; then
    log_error "Type d'app invalide: ${APP_TYPE}"
    echo "Usage: $0 [client|driver|partner] [android|ios|both]"
    exit 1
fi

if [[ ! " android ios both " =~ " ${PLATFORM} " ]]; then
    log_error "Plateforme invalide: ${PLATFORM}"
    echo "Usage: $0 [client|driver|partner] [android|ios|both]"
    exit 1
fi

# Header
echo ""
echo -e "${BOLD}${CYAN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BOLD}${CYAN}║${NC}                                                              ${BOLD}${CYAN}║${NC}"
echo -e "${BOLD}${CYAN}║${NC}   ${BOLD}🚀 KWENDA - Build Mobile Automatisé${NC}                        ${BOLD}${CYAN}║${NC}"
echo -e "${BOLD}${CYAN}║${NC}                                                              ${BOLD}${CYAN}║${NC}"
echo -e "${BOLD}${CYAN}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

echo -e "Application: ${CYAN}${APP_NAMES[$APP_TYPE]}${NC}"
echo -e "Bundle ID:   ${YELLOW}${APP_IDS[$APP_TYPE]}${NC}"
echo -e "Plateforme:  ${BOLD}${PLATFORM}${NC}"
echo ""

# Étape 1: Vérifications
log_step 1 5 "Vérification des prérequis..."

# Vérifier Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    log_success "Node.js installé: ${NODE_VERSION}"
else
    log_error "Node.js non trouvé"
    exit 1
fi

# Vérifier npm
if command -v npm &> /dev/null; then
    log_success "npm installé"
else
    log_error "npm non trouvé"
    exit 1
fi

# Vérifier les dépendances
if [ ! -d "node_modules" ]; then
    log_warning "node_modules non trouvé, installation..."
    npm install
fi

# Étape 2: Préparation Capacitor
log_step 2 5 "Préparation de la configuration Capacitor..."

node scripts/prepare-capacitor.js ${APP_TYPE}

# Étape 3: Build Web
log_step 3 5 "Compilation du projet web..."

export VITE_APP_TYPE=${APP_TYPE}
npm run build

log_success "Build web terminé"

# Étape 4: Sync Capacitor
log_step 4 5 "Synchronisation Capacitor..."

npx cap sync

log_success "Synchronisation terminée"

# Étape 5: Build natif
log_step 5 5 "Génération des bundles natifs..."

# Android
if [[ "${PLATFORM}" == "android" || "${PLATFORM}" == "both" ]]; then
    echo ""
    echo -e "${BOLD}🤖 Build Android...${NC}"
    
    if [ ! -d "android" ]; then
        log_warning "Projet Android non initialisé"
        log_info "Exécutez: npx cap add android"
    else
        cd android
        
        # Vérifier le keystore
        if [ -f "kwenda-release-key.jks" ]; then
            log_info "Keystore trouvé, build Release..."
            ./gradlew bundleRelease
            log_success "Bundle AAB généré"
            echo -e "   Fichier: ${CYAN}android/app/build/outputs/bundle/release/app-release.aab${NC}"
        else
            log_warning "Keystore non trouvé, build Debug..."
            ./gradlew assembleDebug
            log_success "APK Debug généré"
            echo -e "   Fichier: ${CYAN}android/app/build/outputs/apk/debug/app-debug.apk${NC}"
        fi
        
        cd ..
    fi
fi

# iOS
if [[ "${PLATFORM}" == "ios" || "${PLATFORM}" == "both" ]]; then
    echo ""
    echo -e "${BOLD}🍎 Build iOS...${NC}"
    
    if [ ! -d "ios" ]; then
        log_warning "Projet iOS non initialisé"
        log_info "Exécutez: npx cap add ios"
    elif [[ "$(uname)" != "Darwin" ]]; then
        log_warning "Build iOS nécessite un Mac"
        log_info "Le projet est prêt, ouvrez-le sur un Mac avec Xcode"
    else
        cd ios/App
        
        # CocoaPods
        if [ -f "Podfile" ]; then
            log_info "Installation des pods..."
            pod install || true
        fi
        
        # Archive
        log_info "Création de l'archive..."
        xcodebuild -workspace App.xcworkspace \
            -scheme App \
            -configuration Release \
            -archivePath "build/${APP_TYPE}.xcarchive" \
            archive || {
                log_warning "Build automatique échoué"
                log_info "Ouvrez le projet dans Xcode: npx cap open ios"
            }
        
        if [ -d "build/${APP_TYPE}.xcarchive" ]; then
            log_success "Archive iOS générée"
            echo -e "   Fichier: ${CYAN}ios/App/build/${APP_TYPE}.xcarchive${NC}"
        fi
        
        cd ../..
    fi
fi

# Résumé
echo ""
echo -e "${BOLD}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}${BOLD}🎉 Build terminé pour ${APP_NAMES[$APP_TYPE]}${NC}"
echo -e "${BOLD}═══════════════════════════════════════════════════════════════${NC}"
echo ""

# Instructions
echo -e "${BOLD}📋 Prochaines étapes:${NC}"
echo ""

if [[ "${PLATFORM}" == "android" || "${PLATFORM}" == "both" ]]; then
    echo -e "${CYAN}Google Play Store:${NC}"
    echo "  1. Allez sur https://play.google.com/console"
    echo "  2. Uploadez le fichier .aab"
    echo ""
fi

if [[ "${PLATFORM}" == "ios" || "${PLATFORM}" == "both" ]]; then
    echo -e "${CYAN}Apple App Store:${NC}"
    echo "  1. Ouvrez l'archive dans Xcode"
    echo "  2. Cliquez 'Distribute App'"
    echo ""
fi
