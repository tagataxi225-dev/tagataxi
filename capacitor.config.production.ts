import type { CapacitorConfig } from '@capacitor/cli';

/**
 * Configuration Capacitor pour PRODUCTION (Play Store)
 * 
 * INSTRUCTIONS:
 * 1. Renommez ce fichier en `capacitor.config.ts` avant le build production
 * 2. OU copiez ce contenu dans `capacitor.config.ts`
 * 
 * DIFFÉRENCES avec config dev:
 * - Pas de server.url (utilise le build local)
 * - SplashScreen configuré
 * - PushNotifications avec toutes les options
 */

const config: CapacitorConfig = {
  appId: 'cd.kwenda.app',
  appName: 'Tembea',
  webDir: 'dist',
  
  // PAS de server.url en production !
  // L'app utilise le contenu buildé dans /dist
  
  plugins: {
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert']
    },
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#DC2626',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true
    },
    Geolocation: {
      // Permissions Android définies dans AndroidManifest.xml
    },
    LocalNotifications: {
      smallIcon: 'ic_stat_icon_config_sample',
      iconColor: '#DC2626',
      sound: 'beep.wav'
    }
  },
  
  android: {
    buildOptions: {
      keystorePath: 'kwenda-release-key.jks',
      keystoreAlias: 'kwenda',
      // keystorePassword et keystoreAliasPassword 
      // seront demandés lors du build
    }
  }
};

export default config;
