import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'cd.kwenda.driver',
  appName: 'Kwenda Driver',
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
      requestLocationWhenInUse: true,
      allowsBackgroundLocationUpdates: true,
      showsBackgroundLocationIndicator: true
    },
    BackgroundGeolocation: {
      notificationTitle: "Kwenda Driver - En service",
      notificationText: "Position suivie en arrière-plan",
      notificationIcon: "ic_stat_icon_config_sample",
      notificationColor: "#F59E0B",
      distanceFilter: 10
    },
    Camera: {
      permissions: ["camera", "photos"]
    },
    LocalNotifications: {
      smallIcon: "ic_stat_icon_config_sample",
      iconColor: "#F59E0B",
      sound: "default"
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"]
    },
    SplashScreen: {
      launchAutoHide: true,
      launchShowDuration: 2000,
      launchFadeOutDuration: 500,
      backgroundColor: "#F59E0B",
      androidScaleType: "CENTER_CROP"
    },
    BackgroundMode: {
      enabled: true,
      title: "Kwenda Driver - En service",
      text: "Position suivie en arrière-plan",
      silent: false
    }
  },
  bundledWebRuntime: false,
  android: {
    allowMixedContent: true,
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
    scrollEnabled: true,
    overrideUserAgent: "Kwenda Driver Congo Mobile App",
    backgroundModes: ["location", "background-fetch", "background-processing"]
  }
};

export default config;
