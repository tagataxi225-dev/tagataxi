/**
 * 📱 Service de détection de plateforme d'exécution
 * Permet de différencier entre web, PWA et Capacitor
 */

// Détection si c'est un appareil mobile (basé sur user agent)
export const isMobileDevice = (): boolean => {
  if (typeof window === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

/**
 * Détection si l'app tourne en mode Capacitor natif
 * Utilisé pour bypass la landing page marketing
 */
export const isMobileApp = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  // Détection Capacitor native
  // @ts-ignore - Capacitor injecte cette propriété
  const isCapacitor = window.Capacitor?.isNativePlatform() ?? false;
  
  // Détection alternative via le protocole (capacitor:// ou ionic://)
  const isNativeProtocol = window.location.protocol === 'capacitor:' || 
                           window.location.protocol === 'ionic:';
  
  return isCapacitor || isNativeProtocol;
};

export const isPWA = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    // @ts-ignore - iOS Safari
    (window.navigator as any).standalone === true ||
    document.referrer.includes('android-app://')
  );
};

// Desktop web (pas mobile app, pas PWA, pas mobile device)
export const isDesktopWeb = (): boolean => {
  return !isMobileApp() && !isPWA() && !isMobileDevice();
};

export const isWebBrowser = (): boolean => {
  return !isMobileApp() && !isPWA();
};

export const getPlatformType = (): 'capacitor' | 'pwa' | 'web' => {
  if (isMobileApp()) return 'capacitor';
  if (isPWA()) return 'pwa';
  return 'web';
};

// Détection spécifique du système d'exploitation
export const getOS = (): 'ios' | 'android' | 'other' => {
  if (typeof window === 'undefined') return 'other';
  
  const userAgent = window.navigator.userAgent.toLowerCase();
  
  if (/iphone|ipad|ipod/.test(userAgent)) return 'ios';
  if (/android/.test(userAgent)) return 'android';
  
  return 'other';
};

/**
 * Vérifie si les éléments marketing doivent être affichés
 * Masqués dans les apps natives et PWA
 */
export const shouldShowMarketingUI = (): boolean => {
  return !isMobileApp() && !isPWA();
};

// Log de diagnostic
export const logPlatformInfo = () => {
  const platform = getPlatformType();
  const os = getOS();
  
  console.log('🌐 Platform Detection:', {
    platform,
    os,
    isMobile: isMobileApp(),
    isPWA: isPWA(),
    shouldShowMarketing: shouldShowMarketingUI(),
    protocol: window.location.protocol,
    userAgent: window.navigator.userAgent.substring(0, 100)
  });
};

/**
 * Log de diagnostic détaillé pour les URLs mobiles
 * Utile pour débugger les problèmes d'authentification sur Android/iOS
 */
export const logMobileUrlInfo = () => {
  if (typeof window === 'undefined') return;
  
  const isCapacitor = isMobileApp();
  const baseUrl = isCapacitor ? 'https://tagago.app' : window.location.origin;
  
  console.log('🔗 [MobileUrl] Diagnostic:', {
    isCapacitor,
    isNativeProtocol: window.location.protocol === 'capacitor:' || window.location.protocol === 'ionic:',
    protocol: window.location.protocol,
    hostname: window.location.hostname,
    origin: window.location.origin,
    baseUrl,
    platform: getPlatformType(),
    os: getOS()
  });
};
