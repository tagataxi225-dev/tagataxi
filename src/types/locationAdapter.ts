/**
 * Adaptateur d'interface pour harmoniser les types de localisation
 * Unifie IntelligentSearchResult, LocationData et autres interfaces Location
 */

import type { IntelligentSearchResult } from '@/services/IntelligentAddressSearch';
import { LocationData } from '@/types/location';

// Interface commune pour tous les types de localisation
export interface UnifiedLocation {
  address: string;
  lat: number;
  lng: number;
  type?: 'current' | 'geocoded' | 'popular' | 'recent' | 'database' | 'google' | 'manual' | 'ip' | 'fallback' | 'default' | 'gps';
  placeId?: string;
  name?: string;
  subtitle?: string;
  category?: string;
  coordinates?: { lat: number; lng: number };
}

// Interface pour les callbacks de sélection
export interface LocationSelectCallback {
  (location: UnifiedLocation): void;
}

/**
 * Convertit IntelligentSearchResult vers UnifiedLocation
 */
export const intelligentToUnified = (result: IntelligentSearchResult): UnifiedLocation => {
  return {
    address: result.name,
    lat: result.lat,
    lng: result.lng,
    type: result.type === 'google' ? 'geocoded' : result.type === 'database' ? 'database' : 'geocoded',
    placeId: result.id,
    name: result.name,
    subtitle: result.subtitle || `${result.commune || ''}, ${result.city}`.trim().replace(/^,\s*/, ''),
    category: result.category,
    coordinates: { lat: result.lat, lng: result.lng }
  };
};

/**
 * Convertit LocationData vers UnifiedLocation
 */
export const locationDataToUnified = (data: LocationData): UnifiedLocation => {
  return {
    address: data.address,
    lat: data.lat,
    lng: data.lng,
    type: data.type,
    placeId: data.placeId,
    coordinates: { lat: data.lat, lng: data.lng }
  };
};

/**
 * Convertit UnifiedLocation vers l'interface Location simple (transport)
 */
export const unifiedToSimpleLocation = (unified: UnifiedLocation) => {
  return {
    address: unified.address,
    lat: unified.lat,
    lng: unified.lng,
    coordinates: { lat: unified.lat, lng: unified.lng }
  };
};

/**
 * Convertit UnifiedLocation vers LocationData
 */
export const unifiedToLocationData = (unified: UnifiedLocation): LocationData => {
  return {
    address: unified.address,
    lat: unified.lat,
    lng: unified.lng,
    type: unified.type,
    placeId: unified.placeId
  };
};

/**
 * Adaptateur pour les callbacks onLocationSelect
 */
export const createLocationSelectAdapter = <T>(
  originalCallback: (location: T) => void,
  converter: (unified: UnifiedLocation) => T
): LocationSelectCallback => {
  return (unified: UnifiedLocation) => {
    const converted = converter(unified);
    originalCallback(converted);
  };
};