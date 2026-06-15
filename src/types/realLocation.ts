/**
 * 🎯 TYPES UNIFIÉ POUR POSITIONS RÉELLES GOOGLE MAPS
 * 
 * Remplace les types DriverLocation dispersés par un système unifié
 * qui utilise des adresses Google Maps réelles au lieu de coordonnées brutes
 */

import type { LocationData } from './location';

export interface RealDriverLocation {
  /** ID du chauffeur */
  driverId: string;
  /** Position géographique */
  coordinates: {
    lat: number;
    lng: number;
  };
  /** Adresse Google Maps réelle (automatiquement géocodée) */
  googleAddress: string;
  /** Nom du lieu Google Maps si disponible */
  googlePlaceName?: string;
  /** ID du lieu Google si disponible */
  googlePlaceId?: string;
  /** Données de mouvement */
  movement?: {
    speed?: number;
    heading?: number;
    accuracy?: number;
  };
  /** Horodatage */
  lastUpdate: string;
  /** Statuts */
  status: {
    isOnline: boolean;
    isAvailable: boolean;
    isVerified: boolean;
  };
  /** Cache Google Maps */
  cache?: {
    lastGeocodedAt: string;
    geocodeSource: 'google' | 'cache' | 'fallback';
  };
}

export interface RealLocationUpdate {
  coordinates: { lat: number; lng: number };
  movement?: {
    speed?: number;
    heading?: number;
    accuracy?: number;
  };
  timestamp: string;
}

export interface GoogleGeocodeResult {
  address: string;
  placeName?: string;
  placeId?: string;
  accuracy: 'high' | 'medium' | 'low';
  source: 'google' | 'cache' | 'fallback';
}

/**
 * Configuration du service de géolocalisation réelle
 */
export interface RealLocationConfig {
  /** Cache des adresses Google (en minutes) */
  googleCacheTTL: number;
  /** Distance minimale pour nouveau géocodage (en mètres) */
  geocodeThreshold: number;
  /** Fallback si Google indisponible */
  fallbackEnabled: boolean;
  /** Débounce pour réduire les appels API */
  debounceMs: number;
}

export const DEFAULT_REAL_LOCATION_CONFIG = {
  googleCacheTTL: 30, // 30 minutes
  geocodeThreshold: 100, // 100 mètres
  fallbackEnabled: true,
  debounceMs: 2000, // 2 secondes
};

/**
 * Adaptateur pour convertir les anciens types vers le nouveau système
 */
export interface DriverLocationAdapter {
  /** Convertit l'ancien DriverLocation vers RealDriverLocation */
  fromLegacy(legacy: any): Promise<RealDriverLocation>;
  /** Convertit RealDriverLocation vers un format compatible */
  toLegacy(real: RealDriverLocation): any;
  /** Convertit vers LocationData pour compatibilité */
  toLocationData(real: RealDriverLocation): LocationData;
}

/**
 * Cache des adresses Google Maps
 */
export interface GoogleAddressCache {
  coordinates: string; // "lat,lng"
  address: string;
  placeName?: string;
  placeId?: string;
  cachedAt: string;
  expiresAt: string;
}

/**
 * Erreur de géolocalisation
 */
export interface RealLocationError {
  code: 'GOOGLE_API_ERROR' | 'COORDINATES_INVALID' | 'CACHE_ERROR' | 'NETWORK_ERROR';
  message: string;
  details?: any;
  fallbackUsed: boolean;
}