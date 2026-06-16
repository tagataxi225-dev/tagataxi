/**
 * Types unifiés pour la géolocalisation - Interface standard pour toute l'application Tembea
 * Résout les inconsistances entre LocationData, IntelligentSearchResult et autres types
 */

// Interface unifiée pour TOUTES les coordonnées dans l'application
export interface UnifiedCoordinates {
  lat: number;
  lng: number;
}

// Interface unifiée pour TOUS les lieux dans l'application
export interface UnifiedLocation {
  id: string;
  name: string;
  address: string;
  coordinates: UnifiedCoordinates;
  
  // Métadonnées optionnelles
  subtitle?: string;
  type?: 'current' | 'geocoded' | 'popular' | 'recent' | 'database' | 'google' | 'manual';
  placeId?: string;
  city?: string;
  commune?: string;
  category?: string;
  
  // Propriétés de qualité
  accuracy?: number;
  confidence?: number;
  verified?: boolean;
  
  // Badge et affichage
  badge?: string;
  icon?: string;
}

// Types pour les résultats de recherche avec scoring
export interface LocationSearchResult extends UnifiedLocation {
  relevanceScore: number;
  popularityScore: number;
  distanceFromUser?: number;
}

// Options de géolocalisation standards
export interface GeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  fallbackToIP?: boolean;
  fallbackToDatabase?: boolean;
  fallbackToDefault?: boolean;
}

// État global de géolocalisation
export interface LocationState {
  currentLocation: UnifiedLocation | null;
  lastKnownLocation: UnifiedLocation | null;
  loading: boolean;
  error: string | null;
  accuracy: number | null;
  source: 'gps' | 'ip' | 'manual' | 'cache' | null;
  timestamp: Date | null;
}

// Configuration par ville
export interface CityConfig {
  name: string;
  code: string;
  countryCode: string;
  defaultCoordinates: UnifiedCoordinates;
  bounds?: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  communes?: string[];
  timezone: string;
  currency: string;
}

// Fonctions utilitaires types-safe
export const createUnifiedLocation = (
  id: string,
  name: string,
  coordinates: UnifiedCoordinates,
  address?: string
): UnifiedLocation => ({
  id,
  name,
  address: address || name,
  coordinates,
  type: 'manual'
});

export const validateCoordinates = (coords: any): coords is UnifiedCoordinates => {
  return (
    coords &&
    typeof coords.lat === 'number' &&
    typeof coords.lng === 'number' &&
    coords.lat >= -90 && coords.lat <= 90 &&
    coords.lng >= -180 && coords.lng <= 180 &&
    !isNaN(coords.lat) && !isNaN(coords.lng)
  );
};

export const coordinatesEqual = (a: UnifiedCoordinates, b: UnifiedCoordinates, tolerance = 0.0001): boolean => {
  return Math.abs(a.lat - b.lat) < tolerance && Math.abs(a.lng - b.lng) < tolerance;
};

// Villes supportées par Tembea (RDC + Côte d'Ivoire)
export const SUPPORTED_CITIES: Record<string, CityConfig> = {
  abidjan: {
    name: 'Abidjan',
    code: 'ABJ',
    countryCode: 'CI',
    defaultCoordinates: { lat: 5.3600, lng: -4.0083 },
    bounds: { north: 5.6, south: 5.1, east: -3.7, west: -4.3 },
    communes: ['Cocody', 'Plateau', 'Yopougon', 'Marcory', 'Treichville', 'Abobo', 'Adjamé', 'Koumassi', 'Port-Bouët', 'Attécoubé'],
    timezone: 'Africa/Abidjan',
    currency: 'XOF'
  }
};

// Variable module-level pour stocker la ville courante détectée
let _currentCity: CityConfig = SUPPORTED_CITIES.abidjan;

export const setCurrentCity = (city: CityConfig): void => {
  _currentCity = city;
  console.log('🌍 [unifiedLocation] Ville courante mise à jour:', city.name, city.countryCode);
};

export const getCurrentCity = (): CityConfig => {
  return _currentCity;
};

export const getCityConfigFromName = (name: string): CityConfig | null => {
  const normalized = name.toLowerCase().trim();
  for (const city of Object.values(SUPPORTED_CITIES)) {
    if (city.name.toLowerCase() === normalized) return city;
  }
  return null;
};

export const getCityByCoordinates = (coords: UnifiedCoordinates): CityConfig => {
  for (const city of Object.values(SUPPORTED_CITIES)) {
    if (city.bounds) {
      const { north, south, east, west } = city.bounds;
      if (coords.lat <= north && coords.lat >= south && 
          coords.lng <= east && coords.lng >= west) {
        return city;
      }
    }
  }
  return SUPPORTED_CITIES.abidjan; // Fallback (TAGA mono-ville)
};