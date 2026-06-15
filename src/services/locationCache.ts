/**
 * Cache intelligent pour les données de géolocalisation
 * Optimise les performances et réduit les appels API
 */

import type { LocationData } from '@/types/location';

interface CacheEntry {
  data: LocationData;
  timestamp: number;
  accuracy?: number;
}

interface GeocodeCache {
  [key: string]: {
    address: string;
    timestamp: number;
  };
}

class LocationCache {
  private static readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  private static readonly GEOCODE_CACHE_DURATION = 30 * 60 * 1000; // 30 minutes
  private static readonly MAX_CACHE_SIZE = 100;
  
  private currentLocationKey = 'kwenda_current_location';
  private geocodeCacheKey = 'kwenda_geocode_cache';

  /**
   * Met en cache la position actuelle
   */
  setCurrentLocation(location: LocationData): void {
    try {
      const cacheEntry: CacheEntry = {
        data: location,
        timestamp: Date.now(),
        accuracy: location.accuracy
      };
      
      localStorage.setItem(this.currentLocationKey, JSON.stringify(cacheEntry));
      console.log('📦 Position mise en cache:', location.address);
    } catch (error) {
      console.warn('⚠️ Erreur mise en cache position:', error);
    }
  }

  /**
   * Récupère la position actuelle du cache si valide
   */
  getCurrentLocation(): LocationData | null {
    try {
      const cached = localStorage.getItem(this.currentLocationKey);
      if (!cached) return null;

      const entry: CacheEntry = JSON.parse(cached);
      const isValid = Date.now() - entry.timestamp < LocationCache.CACHE_DURATION;

      if (isValid) {
        console.log('🎯 Position récupérée du cache:', entry.data.address);
        return entry.data;
      } else {
        // Cache expiré
        this.clearCurrentLocation();
        return null;
      }
    } catch (error) {
      console.warn('⚠️ Erreur lecture cache position:', error);
      return null;
    }
  }

  /**
   * Met en cache un résultat de géocodage inverse
   */
  setGeocodeResult(lat: number, lng: number, address: string): void {
    try {
      const key = this.getGeocodeKey(lat, lng);
      const cache = this.getGeocodeCache();
      
      cache[key] = {
        address,
        timestamp: Date.now()
      };

      // Limite la taille du cache
      const entries = Object.entries(cache);
      if (entries.length > LocationCache.MAX_CACHE_SIZE) {
        // Supprime les entrées les plus anciennes
        entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
        const toKeep = entries.slice(-LocationCache.MAX_CACHE_SIZE);
        const newCache: GeocodeCache = {};
        toKeep.forEach(([k, v]) => newCache[k] = v);
        localStorage.setItem(this.geocodeCacheKey, JSON.stringify(newCache));
      } else {
        localStorage.setItem(this.geocodeCacheKey, JSON.stringify(cache));
      }

      console.log('📍 Géocodage mis en cache:', address);
    } catch (error) {
      console.warn('⚠️ Erreur mise en cache géocodage:', error);
    }
  }

  /**
   * Récupère un résultat de géocodage inverse du cache
   */
  getGeocodeResult(lat: number, lng: number): string | null {
    try {
      const key = this.getGeocodeKey(lat, lng);
      const cache = this.getGeocodeCache();
      const entry = cache[key];

      if (!entry) return null;

      const isValid = Date.now() - entry.timestamp < LocationCache.GEOCODE_CACHE_DURATION;
      if (isValid) {
        console.log('🏷️ Géocodage récupéré du cache:', entry.address);
        return entry.address;
      } else {
        // Supprime l'entrée expirée
        delete cache[key];
        localStorage.setItem(this.geocodeCacheKey, JSON.stringify(cache));
        return null;
      }
    } catch (error) {
      console.warn('⚠️ Erreur lecture cache géocodage:', error);
      return null;
    }
  }

  /**
   * Efface le cache de la position actuelle
   */
  clearCurrentLocation(): void {
    try {
      localStorage.removeItem(this.currentLocationKey);
      console.log('🗑️ Cache position effacé');
    } catch (error) {
      console.warn('⚠️ Erreur effacement cache:', error);
    }
  }

  /**
   * Efface tout le cache
   */
  clearAll(): void {
    try {
      localStorage.removeItem(this.currentLocationKey);
      localStorage.removeItem(this.geocodeCacheKey);
      console.log('🗑️ Tout le cache effacé');
    } catch (error) {
      console.warn('⚠️ Erreur effacement cache complet:', error);
    }
  }

  /**
   * Retourne les statistiques du cache
   */
  getCacheStats(): {
    hasCurrentLocation: boolean;
    geocodeCacheSize: number;
    currentLocationAge?: number;
  } {
    try {
      const currentLocation = localStorage.getItem(this.currentLocationKey);
      const geocodeCache = this.getGeocodeCache();

      let currentLocationAge: number | undefined;
      if (currentLocation) {
        const entry: CacheEntry = JSON.parse(currentLocation);
        currentLocationAge = Date.now() - entry.timestamp;
      }

      return {
        hasCurrentLocation: !!currentLocation,
        geocodeCacheSize: Object.keys(geocodeCache).length,
        currentLocationAge
      };
    } catch (error) {
      console.warn('⚠️ Erreur statistiques cache:', error);
      return {
        hasCurrentLocation: false,
        geocodeCacheSize: 0
      };
    }
  }

  /**
   * Génère une clé pour le cache de géocodage
   */
  private getGeocodeKey(lat: number, lng: number): string {
    // Arrondi à 4 décimales pour regrouper les positions proches
    const roundedLat = Math.round(lat * 10000) / 10000;
    const roundedLng = Math.round(lng * 10000) / 10000;
    return `${roundedLat},${roundedLng}`;
  }

  /**
   * Récupère le cache de géocodage
   */
  private getGeocodeCache(): GeocodeCache {
    try {
      const cached = localStorage.getItem(this.geocodeCacheKey);
      return cached ? JSON.parse(cached) : {};
    } catch (error) {
      console.warn('⚠️ Erreur lecture cache géocodage:', error);
      return {};
    }
  }
}

export const locationCache = new LocationCache();