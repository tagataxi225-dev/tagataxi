/**
 * 📱 Utilitaire centralisé pour les URLs mobiles
 * Supprime toute dépendance à localhost pour Capacitor/Android/iOS
 */

const PRODUCTION_URL = 'https://tagago.app';

/**
 * Détecte si l'app tourne en mode Capacitor natif
 */
export const isCapacitorNative = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  // Détection Capacitor native
  const capacitor = (window as any).Capacitor;
  const isNative = capacitor?.isNativePlatform?.() ?? false;
  
  // Détection alternative via le protocole (capacitor:// ou ionic://)
  const isNativeProtocol = window.location.protocol === 'capacitor:' || 
                           window.location.protocol === 'ionic:';
  
  return isNative || isNativeProtocol;
};

/**
 * Retourne l'URL de base appropriée selon l'environnement
 * - Mobile natif (Capacitor) → PRODUCTION_URL
 * - Développement local → window.location.origin
 * - Production web → PRODUCTION_URL
 */
export const getBaseUrl = (): string => {
  if (typeof window === 'undefined') return PRODUCTION_URL;
  
  // Sur mobile natif, TOUJOURS utiliser l'URL de production
  if (isCapacitorNative()) {
    return PRODUCTION_URL;
  }
  
  // En développement web local, utiliser l'URL locale
  const hostname = window.location.hostname;
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return window.location.origin;
  }
  
  // Par défaut, URL de production
  return PRODUCTION_URL;
};

/**
 * Génère une URL de redirection pour l'authentification Supabase
 * Compatible mobile et web
 */
export const getAuthRedirectUrl = (path: string = '/'): string => {
  const baseUrl = getBaseUrl();
  // S'assurer que le path commence par /
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${normalizedPath}`;
};

/**
 * Log de diagnostic pour debug mobile
 */
export const logMobileUrlDiagnostic = (): void => {
  if (typeof window === 'undefined') return;
  
  console.log('🔗 [MobileUrl] Diagnostic:', {
    isCapacitor: isCapacitorNative(),
    protocol: window.location.protocol,
    hostname: window.location.hostname,
    origin: window.location.origin,
    baseUrl: getBaseUrl(),
    platform: (window as any).Capacitor?.getPlatform?.() || 'web'
  });
};
