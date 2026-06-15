import { CapacitorConfig } from '@capacitor/cli';

/**
 * Configuration Capacitor - Kwenda Super App
 * 
 * Application multi-rôles : Client, Chauffeur, Partenaire
 * L'utilisateur bascule entre les espaces depuis l'app
 * 
 * En production, le bundle local (dist/) est utilisé
 */
const config: CapacitorConfig = {
  appId: 'cd.kwenda.app',
  appName: 'Tembea',
  webDir: 'dist',
  
  // Pour le développement avec hot-reload, configurer l'IP locale
  // server: {
  //   url: "http://192.168.x.x:8080",
  //   cleartext: true
  // },
  
  appUrlScheme: "kwenda",
  
  plugins: {
    AppUpdate: {
      country: 'cd'
    },
    Geolocation: {
      permissions: ['location', 'location-always'],
      accuracy: "high",
      requestLocationWhenInUse: true,
      allowsBackgroundLocationUpdates: true,
      showsBackgroundLocationIndicator: true
    },
    Camera: {
      permissions: ["camera", "photos"]
    },
    LocalNotifications: {
      smallIcon: "ic_stat_icon_config_sample",
      iconColor: "#DC2626",
      sound: "default"
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"]
    },
    SplashScreen: {
      launchAutoHide: false,
      launchShowDuration: 0,
      backgroundColor: "#DC2626",
      androidScaleType: "CENTER_CROP",
      showSpinner: false
    },
    BackgroundMode: {
      enabled: true,
      title: "Kwenda - Suivi GPS",
      text: "Position suivie en arrière-plan",
      silent: false
    },
    Keyboard: {
      resize: "body",
      resizeOnFullScreen: true
    }
  },
  
  
  android: {
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false,
    permissions: [
      "android.permission.ACCESS_FINE_LOCATION",
      "android.permission.ACCESS_COARSE_LOCATION", 
      "android.permission.ACCESS_BACKGROUND_LOCATION",
      "android.permission.WAKE_LOCK",
      "android.permission.FOREGROUND_SERVICE",
      "android.permission.RECEIVE_BOOT_COMPLETED"
    ]
  },
  
  ios: {
    contentInset: "automatic",
    scrollEnabled: false,
    appendUserAgent: "Kwenda/1.0",
    backgroundModes: ["location", "background-fetch", "background-processing"]
  }
};

export default config;
