/**
 * Configuration centralisée des URLs de l'application
 * Utilise le domaine de production par défaut pour les partages
 * Compatible Capacitor/Android/iOS
 */

// URL de production (domaine personnalisé)
const PRODUCTION_URL = 'https://tembea.app';

/**
 * Détecte si l'app tourne en mode Capacitor natif
 */
const isCapacitorNative = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  const capacitor = (window as any).Capacitor;
  const isNative = capacitor?.isNativePlatform?.() ?? false;
  const isNativeProtocol = window.location.protocol === 'capacitor:' || 
                           window.location.protocol === 'ionic:';
  
  return isNative || isNativeProtocol;
};

/**
 * Retourne l'URL de base à utiliser pour les partages et liens publics
 * @returns URL de base (production par défaut)
 */
export const getAppBaseUrl = (): string => {
  if (typeof window === 'undefined') return PRODUCTION_URL;
  
  // Sur mobile natif (Capacitor), TOUJOURS utiliser l'URL de production
  if (isCapacitorNative()) {
    return PRODUCTION_URL;
  }
  
  // En développement local, utiliser l'URL locale
  const currentHost = window.location.hostname;
  if (currentHost === 'localhost' || currentHost === '127.0.0.1') {
    return window.location.origin;
  }
  
  // Par défaut, toujours retourner l'URL de production
  return PRODUCTION_URL;
};

/**
 * Génère une URL complète pour le partage d'une boutique
 * TOUJOURS utilise l'URL de production pour les liens partagés
 * @param vendorId ID du vendeur
 * @returns URL complète de la boutique
 */
export const getVendorShopUrl = (vendorId: string): string => {
  return `${PRODUCTION_URL}/marketplace/shop/${vendorId}`;
};

/**
 * Génère une URL complète pour le partage d'un produit
 * @param productId ID du produit
 * @returns URL complète du produit
 */
export const getProductUrl = (productId: string): string => {
  return `${PRODUCTION_URL}/marketplace/product/${productId}`;
};

/**
 * Génère une URL complète pour le tracking d'une course
 * @param trackingType Type de tracking (transport/delivery)
 * @param trackingId ID de tracking
 * @returns URL complète de tracking
 */
export const getTrackingUrl = (trackingType: string, trackingId: string): string => {
  return `${PRODUCTION_URL}/tracking/${trackingType}/${trackingId}`;
};

/**
 * Génère une URL complète pour un partage de trajet
 * @param shareId ID de partage
 * @returns URL complète de partage de trajet
 */
export const getSharedTripUrl = (shareId: string): string => {
  return `${PRODUCTION_URL}/shared-trip/${shareId}`;
};

/**
 * Génère une URL complète pour le partage d'un restaurant
 * @param restaurantId ID du restaurant
 * @returns URL complète du restaurant
 */
export const getRestaurantUrl = (restaurantId: string): string => {
  return `${PRODUCTION_URL}/food/restaurant/${restaurantId}`;
};

/**
 * Génère une URL complète pour le partage d'une agence de location
 * @param partnerId ID du partenaire
 * @returns URL complète de l'agence
 */
export const getRentalPartnerUrl = (partnerId: string): string => {
  return `${PRODUCTION_URL}/rental/partner/${partnerId}/shop`;
};

/**
 * Génère une URL complète pour le parrainage
 * @param referralCode Code de parrainage
 * @returns URL complète d'inscription avec parrainage
 */
export const getReferralUrl = (referralCode: string): string => {
  return `${PRODUCTION_URL}/app/register?ref=${referralCode}`;
};
