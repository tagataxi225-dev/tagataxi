/**
 * Types unifiés pour la géolocalisation dans Tembea
 */

// Interface unifiée pour toutes les locations - compatible avec tous les services
export interface LocationData {
  address: string;
  lat: number;
  lng: number;
  type?: 'current' | 'geocoded' | 'popular' | 'recent' | 'database' | 'google' | 'manual' | 'ip' | 'fallback' | 'default' | 'gps';
  placeId?: string;
  accuracy?: number;
  name?: string;
  subtitle?: string;
  contact?: {
    name?: string;
    phone?: string;
  };
}

// Format de retour unifié pour les résultats de recherche
export interface LocationSearchResult extends LocationData {
  id: string;
  title?: string;
  subtitle?: string;
  isPopular?: boolean;
  relevanceScore?: number;
  distance?: number;
}

// Alias pour compatibilité
export interface SearchResult extends LocationSearchResult {}

export interface GeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  fallbackToIP?: boolean;
  fallbackToDatabase?: boolean;
  fallbackToDefault?: boolean;
}

export interface LocationState {
  location: LocationData | null;
  loading: boolean;
  error: string | null;
  accuracy: number | null;
  source: 'gps' | 'ip' | 'fallback' | 'manual' | null;
}

// Interface pour les coordonnées simples
export interface Coordinates {
  lat: number;
  lng: number;
}

// Interface pour les prix de livraison
export interface DeliveryPricing {
  price: number;
  distance: number;
  duration: number;
  mode: 'flash' | 'flex' | 'maxicharge';
}