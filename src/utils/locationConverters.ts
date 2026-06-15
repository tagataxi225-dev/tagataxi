/**
 * Utilitaires de conversion entre les différents types de location
 * Pour assurer la compatibilité lors des migrations
 */

import type { UnifiedLocation } from '@/types/unifiedLocation';
import type { LocationData } from '@/types/location';

/**
 * Convertit UnifiedLocation vers LocationData
 */
export const unifiedToLocationData = (unified: UnifiedLocation): LocationData => {
  return {
    address: unified.address,
    lat: unified.coordinates.lat,
    lng: unified.coordinates.lng,
    type: unified.type || 'google',
    placeId: unified.placeId,
    name: unified.name,
    subtitle: unified.subtitle,
    accuracy: unified.accuracy
  };
};

/**
 * Convertit LocationData vers UnifiedLocation
 */
export const locationDataToUnified = (location: LocationData): UnifiedLocation => {
  return {
    id: location.placeId || `loc-${Date.now()}`,
    name: location.name || location.address,
    address: location.address,
    coordinates: {
      lat: location.lat,
      lng: location.lng
    },
    placeId: location.placeId,
    type: (location.type as any) || 'google',
    subtitle: location.subtitle,
    accuracy: location.accuracy,
    verified: false
  };
};

/**
 * Valide qu'une location a toutes les propriétés requises
 */
export const validateLocation = (location: any): boolean => {
  return !!(
    location &&
    location.address &&
    typeof location.lat === 'number' &&
    typeof location.lng === 'number' &&
    !isNaN(location.lat) &&
    !isNaN(location.lng) &&
    Math.abs(location.lat) <= 90 &&
    Math.abs(location.lng) <= 180
  );
};