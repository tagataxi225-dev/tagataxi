/**
 * Utilitaires de validation et sécurisation des coordonnées
 * Prévient l'erreur "Cannot read properties of undefined (reading 'lat')"
 */

import type { LocationData } from '@/types/location';

export interface ValidatedLocation {
  address: string;
  lat: number;
  lng: number;
  type?: 'current' | 'geocoded' | 'popular' | 'recent' | 'ip' | 'fallback' | 'database';
  placeId?: string;
  name?: string;
  subtitle?: string;
  coordinates?: { lat: number; lng: number };
}

// Coordonnées par défaut sécurisées pour chaque ville (RDC uniquement)
export const DEFAULT_COORDINATES = {
  'Kinshasa': { lat: -4.3217, lng: 15.3069 },
  'Lubumbashi': { lat: -11.6708, lng: 27.4794 },
  'Kolwezi': { lat: -10.7158, lng: 25.4664 }
} as const;

/**
 * Vérifie si une location a des coordonnées valides
 */
export function isValidLocation(location: any): location is ValidatedLocation {
  if (!location) return false;
  
  // Vérifications strictes
  const hasLat = typeof location.lat === 'number' && !isNaN(location.lat);
  const hasLng = typeof location.lng === 'number' && !isNaN(location.lng);
  const hasAddress = typeof location.address === 'string' && location.address.length > 0;
  
  // Vérifier les ranges valides
  const validLatRange = hasLat && location.lat >= -90 && location.lat <= 90;
  const validLngRange = hasLng && location.lng >= -180 && location.lng <= 180;
  
  return hasAddress && validLatRange && validLngRange;
}

/**
 * Sécurise une location en préservant les coordonnées valides
 */
export function secureLocation(location: any, city: string = 'Kinshasa'): ValidatedLocation {
  console.log('🔧 secureLocation input:', JSON.stringify(location, null, 2));
  
  if (!location) {
    throw new Error(`Veuillez sélectionner une adresse valide sur la carte`);
  }

  // Si location déjà valide, retourner immédiatement sans modification
  if (isValidLocation(location)) {
    console.log('✅ Location déjà valide, retour direct');
    return {
      address: location.address,
      lat: location.lat,
      lng: location.lng,
      type: location.type || 'geocoded',
      placeId: location.placeId,
      name: location.name,
      subtitle: location.subtitle,
      coordinates: { lat: location.lat, lng: location.lng }
    };
  }

  // Extraction sécurisée des coordonnées (plusieurs formats possibles)
  const lat = location.lat ?? location.coordinates?.lat ?? location.latitude ?? location.location?.lat;
  const lng = location.lng ?? location.coordinates?.lng ?? location.longitude ?? location.location?.lng;
  
  // Extraction intelligente de l'adresse
  const address = location.address || 
                  location.location?.address || 
                  location.name || 
                  location.formatted_address ||
                  'Adresse sélectionnée sur la carte';

  console.log('📍 Extraction coordonnées/adresse:', { lat, lng, address });

  // Validation stricte des coordonnées
  if (typeof lat !== 'number' || typeof lng !== 'number' || 
      isNaN(lat) || isNaN(lng) || 
      lat < -90 || lat > 90 || 
      lng < -180 || lng > 180) {
    console.error('🚨 Coordonnées invalides:', { location, extractedLat: lat, extractedLng: lng });
    throw new Error(`Coordonnées invalides. Veuillez sélectionner une adresse sur la carte.`);
  }
  
  // Validation de l'adresse
  if (!address || address.trim() === '') {
    console.error('🚨 Adresse invalide:', { address, location });
    throw new Error(`Adresse manquante. Veuillez sélectionner une adresse valide.`);
  }

  // Construction d'une location valide avec données disponibles
  const securedLocation: ValidatedLocation = {
    address: address.trim(),
    lat: lat,
    lng: lng,
    type: location.type || 'geocoded',
    placeId: location.placeId || location.location?.placeId,
    name: location.name || location.location?.name,
    subtitle: location.subtitle || location.location?.subtitle,
    coordinates: { lat: lat, lng: lng }
  };

  console.log('🔒 Location sécurisée:', securedLocation);

  // Validation finale
  if (!isValidLocation(securedLocation)) {
    console.error('🚨 Échec sécurisation location:', securedLocation);
    throw new Error(`Impossible de sécuriser la location. Veuillez réessayer.`);
  }

  return securedLocation;
}

/**
 * Calcule la distance entre deux points en km (Haversine)
 */
export function calculateDistance(
  lat1: number, 
  lng1: number, 
  lat2: number, 
  lng2: number
): number {
  const R = 6371; // Rayon de la Terre en km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

/**
 * Valide et calcule le prix de base selon la distance
 */
export function calculateBasePrice(
  pickup: ValidatedLocation, 
  destination: ValidatedLocation, 
  serviceType: 'flash' | 'flex' | 'maxicharge'
): { price: number; distance: number; duration: number } {
  // Prix de base sécurisés
  const basePrices = {
    flash: 5000,
    flex: 7000,
    maxicharge: 12000
  };

  // Tarifs par km
  const kmRates = {
    flash: 500,
    flex: 400,
    maxicharge: 600
  };

  try {
    const distance = calculateDistance(pickup.lat, pickup.lng, destination.lat, destination.lng);
    const basePrice = basePrices[serviceType];
    const kmPrice = distance * kmRates[serviceType];
    const totalPrice = Math.round(basePrice + kmPrice);
    
    // Durée estimée : 2 km/min pour flash, 1.5 km/min pour autres
    const speed = serviceType === 'flash' ? 2 : 1.5;
    const duration = Math.max(10, Math.round(distance / speed * 60)); // minimum 10 min
    
    return {
      price: totalPrice,
      distance: Math.round(distance * 10) / 10, // 1 décimale
      duration
    };
  } catch (error) {
    console.error('Error calculating price:', error);
    return {
      price: basePrices[serviceType],
      distance: 0,
      duration: 30
    };
  }
}

/**
 * Conversion sécurisée UnifiedLocation vers LocationData avec validation préalable
 */
export function unifiedToLocationData(unified: any): LocationData {
  if (!unified) {
    throw new Error('Aucune location fournie pour la conversion');
  }

  // Préparation des données avec fallbacks intelligents
  const locationInput = {
    address: unified.address || unified.name || unified.formatted_address || '',
    lat: unified.lat ?? unified.coordinates?.lat ?? unified.geometry?.location?.lat,
    lng: unified.lng ?? unified.coordinates?.lng ?? unified.geometry?.location?.lng,
    type: unified.type || 'geocoded',
    placeId: unified.placeId || unified.place_id,
    name: unified.name,
    subtitle: unified.subtitle || unified.vicinity
  };

  // Validation préalable avant sécurisation
  if (!locationInput.address) {
    throw new Error('Adresse manquante dans la location');
  }

  const secured = secureLocation(locationInput);
  
  return {
    address: secured.address,
    lat: secured.lat,
    lng: secured.lng,
    type: secured.type,
    placeId: secured.placeId,
    accuracy: 1
  };
}