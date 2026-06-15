import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'cd.kwenda.client',
  appName: 'Kwenda Client',
  webDir: 'dist',
  server: {
    url: "capacitor://localhost",
    cleartext: false
  },
  appUrlScheme: "kwenda",
  plugins: {
    AppUpdate: {
      country: 'cd'
    },
    Geolocation: {
      permissions: ["location", "coarseLocation"],
      accuracy: "high",
      requestLocationWhenInUse: true
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
      launchAutoHide: true,
      launchShowDuration: 2000,
      launchFadeOutDuration: 500,
      backgroundColor: "#DC2626",
      androidScaleType: "CENTER_CROP"
    }
  },
  bundledWebRuntime: false,
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: false,
    permissions: [
      "android.permission.ACCESS_FINE_LOCATION",
      "android.permission.ACCESS_COARSE_LOCATION"
    ]
  },
  ios: {
    contentInset: "automatic",
    scrollEnabled: true,
    overrideUserAgent: "Kwenda Client Congo Mobile App"
  }
};

export default config;
