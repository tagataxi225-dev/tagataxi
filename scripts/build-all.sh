#!/bin/bash

# Script de build pour les 3 applications mobiles Kwenda

echo "🚀 Kwenda Multi-App Build Script"
echo "================================="
echo ""

# Couleurs pour les logs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Fonction de build
build_app() {
  APP_TYPE=$1
  APP_NAME=$2
  COLOR=$3
  
  echo -e "${COLOR}📱 Building ${APP_NAME}...${NC}"
  
  # Copier la config Capacitor appropriée
  cp "capacitor.config.${APP_TYPE}.ts" capacitor.config.ts
  
  # Build avec le mode approprié
  npm run build -- --mode ${APP_TYPE}
  
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ ${APP_NAME} build successful${NC}"
  else
    echo -e "${RED}❌ ${APP_NAME} build failed${NC}"
    exit 1
  fi
  
  # Sync Capacitor
  npx cap sync
  
  echo ""
}

# Build des 3 applications
build_app "client" "Kwenda Client" "${RED}"
build_app "driver" "Kwenda Driver" "${YELLOW}"
build_app "partner" "Kwenda Partner" "${GREEN}"

echo "================================="
echo -e "${GREEN}🎉 All apps built successfully!${NC}"
echo ""
echo "Next steps:"
echo "1. Open Android Studio: npx cap open android"
echo "2. Open Xcode: npx cap open ios"
echo "3. Build and sign your apps for release"
echo ""
