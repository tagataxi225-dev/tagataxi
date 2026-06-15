/**
 * Service unifié de géolocalisation et recherche d'adresses
 * Remplace unifiedLocationService, ipGeolocation, locationCache et IntelligentAddressSearch
 */

import { supabase } from '@/integrations/supabase/client';
import type { LocationData, SearchResult, Coordinates } from '@/types/location';

export interface LocationSearchResult {
  id: string;
  address: string;
  lat: number;
  lng: number;
  type: 'current' | 'geocoded' | 'popular' | 'recent' | 'database' | 'ip' | 'fallback';
  title?: string;
  subtitle?: string;
  confidence?: number;
}

interface LocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  fallbackToIP?: boolean;
  fallbackToDatabase?: boolean;
  fallbackToDefault?: boolean;
}

interface SearchOptions {
  city?: string;
  countryCode?: string;
  maxResults?: number;
  userLat?: number;
  userLng?: number;
}

/**
 * Service de géolocalisation unifié avec fallbacks robustes
 */
class LocationServiceClass {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  // ==================== GÉOLOCALISATION ====================

  /**
   * Obtenir la position actuelle avec fallbacks automatiques
   * GPS → IP → Cache → Base de données → Défaut
   */
  async getCurrentPosition(options: LocationOptions = {}): Promise<LocationData> {
    const {
      enableHighAccuracy = true,
      timeout = 10000,
      maximumAge = 10000, // 10s max pour forcer des coordonnées fraîches
      fallbackToIP = true,
      fallbackToDatabase = true,
      fallbackToDefault = true
    } = options;

    // 1. Essayer GPS d'abord
    try {
      return await this.getGPSPosition({ enableHighAccuracy, timeout, maximumAge });
    } catch (gpsError) {
      console.log('GPS failed, trying fallbacks:', gpsError);
    }

    // 2. Fallback vers IP
    if (fallbackToIP) {
      try {
        return await this.getIPPosition();
      } catch (ipError) {
        console.log('IP geolocation failed:', ipError);
      }
    }

    // 3. Fallback vers cache
    const cachedPosition = this.getCachedPosition();
    if (cachedPosition) {
      return { ...cachedPosition, type: 'fallback' };
    }

    // 4. Fallback vers base de données
    if (fallbackToDatabase) {
      try {
        return await this.getDatabasePosition();
      } catch (dbError) {
        console.log('Database fallback failed:', dbError);
      }
    }

    // 5. Position par défaut (Kinshasa)
    if (fallbackToDefault) {
      return this.getDefaultPosition();
    }

    throw new Error('Aucune méthode de géolocalisation disponible');
  }

  /**
   * Géolocalisation GPS native via Capacitor/Browser
   */
  private async getGPSPosition(options: PositionOptions): Promise<LocationData> {
    try {
      const { nativeGeolocationService } = await import('@/services/nativeGeolocationService');
      
      const position = await nativeGeolocationService.getCurrentPosition({
        enableHighAccuracy: options.enableHighAccuracy ?? true,
        timeout: options.timeout ?? 10000,
        maximumAge: options.maximumAge ?? 10000
      });
      
      const address = await this.reverseGeocode(position.lat, position.lng);
      
      const locationData: LocationData = {
        address,
        lat: position.lat,
        lng: position.lng,
        type: 'current',
        accuracy: position.accuracy
      };

      this.setCachedPosition(locationData);
      return locationData;
    } catch (error: any) {
      const errorMessage = error.message || 'UNKNOWN_ERROR';
      if (errorMessage.includes('refusée') || errorMessage.includes('denied')) {
        throw new Error('PERMISSION_DENIED');
      } else if (errorMessage.includes('indisponible') || errorMessage.includes('unavailable')) {
        throw new Error('POSITION_UNAVAILABLE');
      } else if (errorMessage.includes('lent') || errorMessage.includes('timeout')) {
        throw new Error('TIMEOUT');
      }
      throw new Error(errorMessage);
    }
  }

  /**
   * Géolocalisation par IP
   */
  private async getIPPosition(): Promise<LocationData> {
    const cached = this.getFromCache('ip-position');
    if (cached) return cached;

    try {
      // Essayer plusieurs services IP
      const services = [
        () => this.getIPFromIPAPI(),
        () => this.getIPFromIPInfo(),
        () => this.getIPFromIPStack()
      ];

      for (const service of services) {
        try {
          const result = await service();
          this.setCache('ip-position', result);
          return result;
        } catch (error) {
          console.log('IP service failed, trying next:', error);
        }
      }

      throw new Error('All IP services failed');
    } catch (error) {
      throw new Error('IP geolocation failed');
    }
  }

  private async getIPFromIPAPI(): Promise<LocationData> {
    const { supabase } = await import('@/integrations/supabase/client');
    const { data, error } = await supabase.functions.invoke('ip-geolocation');
    
    if (error) throw new Error('IP geolocation edge function failed');
    if (!data?.success || !data?.data?.lat || !data?.data?.lng) throw new Error('Invalid IP geolocation response');
    
    return {
      address: data.data.address || 'Ville, Pays',
      lat: data.data.lat,
      lng: data.data.lng,
      type: 'ip',
      accuracy: data.data.accuracy || 10000
    };
  }

  private async getIPFromIPInfo(): Promise<LocationData> {
    // ✅ OPTIMISATION : Utiliser le cache localStorage
    const { IPGeolocationCache } = await import('./IPGeolocationCache');
    
    const cached = await IPGeolocationCache.getOrFetch();
    return {
      address: `${cached.city}, ${cached.country}`,
      lat: cached.latitude,
      lng: cached.longitude,
      type: 'ip',
      accuracy: cached.accuracy
    };
  }

  private async getIPFromIPStack(): Promise<LocationData> {
    // Version free sans clé API
    const response = await fetch('http://api.ipstack.com/check?access_key=demo');
    const data = await response.json();
    
    if (!data.latitude) throw new Error('IPStack failed');
    
    return {
      address: `${data.city || 'Unknown'}, ${data.region_name || 'Unknown'}, ${data.country_name || 'Unknown'}`,
      lat: data.latitude,
      lng: data.longitude,
      type: 'ip',
      accuracy: 10000
    };
  }

  /**
   * Position depuis la base de données locale
   */
   private async getDatabasePosition(): Promise<LocationData> {
    try {
      // Fallback position sans API call pour éviter la récursion
      return {
        address: 'Kinshasa Centre, Kinshasa, RDC',
        lat: -4.4419,
        lng: 15.2663,
        type: 'database'
      };
    } catch (error) {
      throw new Error('Database position failed');
    }
  }

  /**
   * Position par défaut
   */
  private getDefaultPosition(): LocationData {
    return {
      address: 'Kinshasa Centre, Kinshasa, RDC',
      lat: -4.4419,
      lng: 15.2663,
      type: 'fallback'
    };
  }

  // ==================== RECHERCHE D'ADRESSES ====================

  /**
   * Rechercher des lieux avec fallbacks database + Google API
   */
  async searchLocation(query: string, userLocation?: LocationData, options: SearchOptions = {}): Promise<LocationSearchResult[]> {
    if (!query.trim()) return [];

    const { city = 'Kinshasa', countryCode = 'CD', maxResults = 8 } = options;

    try {
      // 1. Recherche dans la base de données locale d'abord
      const localResults = await this.searchInDatabase(query, city, countryCode);
      
      // 2. Si pas assez de résultats, chercher via Google API
      if (localResults.length < maxResults) {
        const googleResults = await this.searchViaGoogle(query, userLocation);
        return [...localResults, ...googleResults].slice(0, maxResults);
      }
      
      return localResults.slice(0, maxResults);
    } catch (error) {
      console.error('Search location error:', error);
      return [];
    }
  }

  /**
   * Recherche dans la base de données Supabase
   */
  private async searchInDatabase(query: string, city: string, countryCode: string): Promise<LocationSearchResult[]> {
    try {
      const { data, error } = await supabase
        .rpc('intelligent_places_search', {
          search_query: query,
          search_city: city,
          user_latitude: null,
          user_longitude: null,
          max_results: 6
        });

      if (error) throw error;

      return data?.map((place: any) => ({
        id: place.id,
        address: place.name,
        lat: place.latitude,
        lng: place.longitude,
        type: 'database' as const,
        title: place.name,
        subtitle: place.subtitle || `${place.commune}, ${place.city}`,
        confidence: place.relevance_score / 100
      })) || [];
    } catch (error) {
      console.error('Database search error:', error);
      return [];
    }
  }

  /**
   * Recherche via Google API (à travers l'edge function)
   */
  private async searchViaGoogle(query: string, userLocation?: LocationData): Promise<LocationSearchResult[]> {
    try {
      const { data, error } = await supabase.functions.invoke('geocode-proxy', {
        body: { 
          query,
          userLocation: userLocation ? { lat: userLocation.lat, lng: userLocation.lng } : undefined
        }
      });

      if (error) throw error;

      return data?.results?.map((result: any, index: number) => ({
        id: `google-${index}`,
        address: result.formatted_address,
        lat: result.geometry.location.lat,
        lng: result.geometry.location.lng,
        type: 'geocoded' as const,
        title: result.formatted_address,
        subtitle: 'Via Google Maps',
        confidence: 0.9
      })) || [];
    } catch (error) {
      console.error('Google search error:', error);
      return [];
    }
  }

  /**
   * Rechercher des lieux à proximité
   */
  async getNearbyPlaces(lat: number, lng: number, radiusKm: number = 5): Promise<LocationSearchResult[]> {
    try {
      const { data, error } = await supabase
        .rpc('intelligent_places_search', {
          search_query: '',
          search_city: 'Kinshasa',
          user_latitude: lat,
          user_longitude: lng,
          max_results: 10
        });

      if (error) throw error;

      return data?.filter((place: any) => place.distance_meters <= radiusKm * 1000)
        .map((place: any) => ({
          id: place.id,
          address: place.name,
          lat: place.latitude,
          lng: place.longitude,
          type: 'database' as const,
          title: place.name,
          subtitle: `${Math.round(place.distance_meters / 1000 * 10) / 10}km • ${place.subtitle}`,
          confidence: place.relevance_score / 100
        })) || [];
    } catch (error) {
      console.error('Nearby places error:', error);
      return [];
    }
  }

  // ==================== GÉOCODAGE ====================

  /**
   * Géocodage inverse (coordonnées → adresse)
   */
  private async reverseGeocode(lat: number, lng: number): Promise<string> {
    const cacheKey = `reverse-${lat.toFixed(4)}-${lng.toFixed(4)}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const { data, error } = await supabase.functions.invoke('geocode-proxy', {
        body: { lat, lng, reverse: true }
      });

      if (error) throw error;

      const address = data?.results?.[0]?.formatted_address || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
      this.setCache(cacheKey, address);
      return address;
    } catch (error) {
      return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    }
  }

  // ==================== UTILITAIRES ====================

  /**
   * Calculer la distance entre deux points (en mètres)
   */
  calculateDistance(point1: { lat: number; lng: number }, point2: { lat: number; lng: number }): number {
    const R = 6371000; // Rayon de la Terre en mètres
    const dLat = this.toRadians(point2.lat - point1.lat);
    const dLng = this.toRadians(point2.lng - point1.lng);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRadians(point1.lat)) * Math.cos(this.toRadians(point2.lat)) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Formater une distance
   */
  formatDistance(meters: number): string {
    if (meters < 1000) {
      return `${Math.round(meters)}m`;
    }
    return `${(meters / 1000).toFixed(1)}km`;
  }

  /**
   * Formater une durée
   */
  formatDuration(seconds: number): string {
    if (seconds < 60) {
      return `${Math.round(seconds)}s`;
    } else if (seconds < 3600) {
      return `${Math.round(seconds / 60)}min`;
    }
    return `${Math.round(seconds / 3600)}h`;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  // ==================== CACHE ====================

  private getFromCache(key: string): any {
    const cached = this.cache.get(key);
    if (cached && (Date.now() - cached.timestamp) < this.CACHE_DURATION) {
      return cached.data;
    }
    return null;
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  private getCachedPosition(): LocationData | null {
    try {
      const cached = localStorage.getItem('last-known-position');
      if (cached) {
        const data = JSON.parse(cached);
        if (Date.now() - data.timestamp < this.CACHE_DURATION) {
          return data.position;
        }
      }
    } catch (error) {
      console.error('Cache read error:', error);
    }
    return null;
  }

  private setCachedPosition(position: LocationData): void {
    try {
      localStorage.setItem('last-known-position', JSON.stringify({
        position,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.error('Cache write error:', error);
    }
  }

  /**
   * Effacer tout le cache
   */
  clearCache(): void {
    this.cache.clear();
    try {
      localStorage.removeItem('last-known-position');
    } catch (error) {
      console.error('Cache clear error:', error);
    }
  }
}

// Export de l'instance singleton
export const LocationService = new LocationServiceClass();

// Export des types
export type { LocationData, Coordinates, LocationOptions, SearchOptions };