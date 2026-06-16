/**
 * 🌍 SERVICE DE GÉOLOCALISATION UNIVERSELLE
 * Détection automatique de ville et recherche contextuelle
 */

import { supabase } from '@/integrations/supabase/client';
import { IPGeolocationService } from './ipGeolocation';
import { nativeGeolocationService } from './nativeGeolocationService';
import { isCityCovered, DEFAULT_CITY } from '@/config/coveredCities';

export interface CityConfig {
  name: string;
  code: string;
  countryCode: string;
  coordinates: { lat: number; lng: number };
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  communes?: string[];
  timezone: string;
  currency: string;
}

// Configuration des villes supportées - RDC + Côte d'Ivoire
export const SUPPORTED_CITIES: Record<string, CityConfig> = {
  kinshasa: {
    name: 'Kinshasa',
    code: 'KIN',
    countryCode: 'CD',
    coordinates: { lat: -4.3217, lng: 15.3069 },
    bounds: {
      north: -4.0,
      south: -4.8,
      east: 15.8,
      west: 14.8
    },
    communes: ['Gombe', 'Kalamu', 'Kasa-Vubu', 'Kinshasa', 'Kintambo', 'Lemba', 'Limete', 'Lingwala', 'Makala', 'Maluku', 'Masina', 'Matete', 'Mont-Ngafula', 'Ndjili', 'Ngaba', 'Ngiri-Ngiri', 'Barumbu', 'Bumbu', 'Bandalungwa', 'Kimbanseke', 'Kisenso', 'Nsele', 'Selembao', 'Mont-Amba'],
    timezone: 'Africa/Kinshasa',
    currency: 'XOF'
  },
  lubumbashi: {
    name: 'Lubumbashi',
    code: 'LBV',
    countryCode: 'CD',
    coordinates: { lat: -11.6792, lng: 27.4748 },
    bounds: {
      north: -11.4,
      south: -11.9,
      east: 27.8,
      west: 27.1
    },
    communes: ['Kampemba', 'Katuba', 'Kenya', 'Lubumbashi', 'Rwashi'],
    timezone: 'Africa/Lubumbashi',
    currency: 'XOF'
  },
  kolwezi: {
    name: 'Kolwezi',
    code: 'KWZ',
    countryCode: 'CD',
    coordinates: { lat: -10.7147, lng: 25.4764 },
    bounds: {
      north: -10.5,
      south: -10.9,
      east: 25.8,
      west: 25.1
    },
    communes: ['Kolwezi', 'Manika', 'Mutoshi'],
    timezone: 'Africa/Lubumbashi',
    currency: 'XOF'
  },
  abidjan: {
    name: 'Abidjan',
    code: 'ABJ',
    countryCode: 'CI',
    coordinates: { lat: 5.3600, lng: -4.0083 },
    bounds: {
      north: 5.6,
      south: 5.1,
      east: -3.7,
      west: -4.3
    },
    communes: ['Cocody', 'Plateau', 'Yopougon', 'Marcory', 'Treichville', 'Abobo', 'Adjamé', 'Koumassi', 'Port-Bouët', 'Attécoubé'],
    timezone: 'Africa/Abidjan',
    currency: 'XOF'
  }
};

export class UniversalGeolocationService {
  private static instance: UniversalGeolocationService;
  private currentCity: CityConfig | null = null;
  private cityDetectionCache: { city: CityConfig; timestamp: number } | null = null;
  private readonly CACHE_DURATION = 10 * 60 * 1000; // 10 minutes (optimisé de 30min)

  static getInstance(): UniversalGeolocationService {
    if (!this.instance) {
      this.instance = new UniversalGeolocationService();
    }
    return this.instance;
  }

  /**
   * 🎯 Détecter automatiquement la ville de l'utilisateur avec détection RÉELLE
   */
  // ✅ FIX PERF: Deduplicate concurrent detectUserCity calls
  private _detectCityPromise: Promise<CityConfig> | null = null;

  async detectUserCity(coordinates?: { lat: number; lng: number }): Promise<CityConfig> {
    console.log('🎯 Détection ville commencée...', coordinates);
    
    // Forcer une nouvelle détection si pas de cache ou coordonnées fournies
    const forceRefresh = coordinates || !this.cityDetectionCache || 
                        Date.now() - this.cityDetectionCache.timestamp > this.CACHE_DURATION;
    
    if (!forceRefresh && this.cityDetectionCache) {
      console.log('📱 Utilisation cache ville:', this.cityDetectionCache.city.name);
      this.currentCity = this.cityDetectionCache.city;
      return this.currentCity;
    }

    // ✅ If a detection is already in progress (without specific coords), reuse it
    if (!coordinates && this._detectCityPromise) {
      console.log('⏳ [detectUserCity] Reusing pending detection promise');
      return this._detectCityPromise;
    }

    const promise = this._detectUserCityInternal(coordinates);
    if (!coordinates) {
      this._detectCityPromise = promise;
      promise.finally(() => { this._detectCityPromise = null; });
    }
    return promise;
  }

  private async _detectUserCityInternal(coordinates?: { lat: number; lng: number }): Promise<CityConfig> {

    try {
      let userCoordinates = coordinates;

      // Si pas de coordonnées fournies, utiliser IP uniquement (PAS de GPS)
      // ⚠️ Fix iOS: ne PAS appeler GPS ici — l'utilisateur n'a peut-être pas encore accordé la permission
      if (!userCoordinates) {
        console.log('🔍 Détection ville par IP uniquement (pas de GPS avant permission)...');
        try {
          const ipLocation = await IPGeolocationService.getInstance().getCurrentLocation();
          userCoordinates = {
            lat: ipLocation.latitude,
            lng: ipLocation.longitude
          };
          console.log('✅ IP réussi:', userCoordinates);
        } catch (ipError) {
          console.log('❌ IP échoué, utilisation Kinshasa par défaut', ipError);
          this.currentCity = SUPPORTED_CITIES.kinshasa;
          this.cityDetectionCache = {
            city: this.currentCity,
            timestamp: Date.now() - (this.CACHE_DURATION * 0.5)
          };
          return this.currentCity;
        }
      }

      // Déterminer la ville RÉELLE la plus proche
      let detectedCity = this.findNearestSupportedCity(userCoordinates);

      // Fallback silencieux vers Kinshasa si ville hors couverture RDC
      if (!isCityCovered(detectedCity.name)) {
        detectedCity = SUPPORTED_CITIES[DEFAULT_CITY.toLowerCase()] || SUPPORTED_CITIES.kinshasa;
      }

      this.currentCity = detectedCity;
      this.cacheDetection(detectedCity);

      console.log(`🌍 Ville RÉELLEMENT détectée: ${detectedCity.name} (${detectedCity.code})`, userCoordinates);
      return detectedCity;

    } catch (error) {
      console.error('❌ Erreur détection ville complète:', error);
      // Fallback temporaire sur Kinshasa
      this.currentCity = SUPPORTED_CITIES.kinshasa;
      // Cache court pour permettre de nouvelles tentatives rapides
      this.cityDetectionCache = {
        city: this.currentCity,
        timestamp: Date.now() - (this.CACHE_DURATION * 0.7) // Cache de 9min pour retry plus rapide
      };
      return this.currentCity;
    }
  }

  /**
   * 🎯 Trouver la ville supportée la plus proche avec logs détaillés
   */
  private findNearestSupportedCity(coordinates: { lat: number; lng: number }): CityConfig {
    const MAX_SUPPORTED_DISTANCE_KM = 200;
    let nearestCity = SUPPORTED_CITIES.kinshasa;
    let minDistance = Infinity;
    
    console.log('🔍 Recherche ville la plus proche pour:', coordinates);

    for (const [cityKey, city] of Object.entries(SUPPORTED_CITIES)) {
      // Vérifier si dans les limites de la ville d'abord
      const withinBounds = this.isWithinCityBounds(coordinates, city);
      
      if (withinBounds) {
        console.log(`✅ Position dans les limites de ${city.name}!`);
        return city;
      }

      // Calculer la distance sinon
      const distance = this.calculateDistance(coordinates, city.coordinates);
      console.log(`📍 Distance vers ${city.name}: ${distance.toFixed(2)}km`);

      if (distance < minDistance) {
        minDistance = distance;
        nearestCity = city;
      }
    }

    // Si trop loin de toute ville supportée, fallback vers Kinshasa
    if (minDistance > MAX_SUPPORTED_DISTANCE_KM) {
      console.log(`🌍 Hors zone couverte (${minDistance.toFixed(0)}km > ${MAX_SUPPORTED_DISTANCE_KM}km). Fallback vers Kinshasa.`);
      return SUPPORTED_CITIES.kinshasa;
    }

    console.log(`🎯 Ville la plus proche: ${nearestCity.name} (${minDistance.toFixed(2)}km)`);
    return nearestCity;
  }

  /**
   * 🎯 Vérifier si les coordonnées sont dans les limites d'une ville (méthode publique)
   */
  isWithinCityBounds(coordinates: { lat: number; lng: number }, city: CityConfig): boolean {
    const { lat, lng } = coordinates;
    const { bounds } = city;

    return lat <= bounds.north && 
           lat >= bounds.south && 
           lng <= bounds.east && 
           lng >= bounds.west;
  }

  /**
   * 🎯 Calculer la distance entre deux points (formule Haversine)
   */
  private calculateDistance(
    point1: { lat: number; lng: number },
    point2: { lat: number; lng: number }
  ): number {
    const R = 6371; // Rayon de la Terre en km
    const dLat = this.toRad(point2.lat - point1.lat);
    const dLng = this.toRad(point2.lng - point1.lng);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRad(point1.lat)) * Math.cos(this.toRad(point2.lat)) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  /**
   * 🎯 Mettre en cache la détection de ville
   */
  private cacheDetection(city: CityConfig): void {
    this.cityDetectionCache = {
      city,
      timestamp: Date.now()
    };
  }

  /**
   * 🎯 Obtenir la ville actuelle (détectée ou par défaut)
   */
  getCurrentCity(): CityConfig {
    return this.currentCity || SUPPORTED_CITIES.kinshasa;
  }

  /**
   * 🎯 Changer manuellement de ville
   */
  setCity(cityCode: string): CityConfig {
    const city = SUPPORTED_CITIES[cityCode.toLowerCase()];
    if (city) {
      this.currentCity = city;
      this.cacheDetection(city);
      return city;
    }
    return this.getCurrentCity();
  }

  /**
   * 🎯 Rechercher dans la base de données selon la ville détectée
   */
  async searchInCurrentCity(
    query: string,
    maxResults: number = 8
  ): Promise<any[]> {
    const currentCity = this.getCurrentCity();
    
    // If outside supported zones or uncertain detection, search all cities
    const isUncertain = currentCity.code === 'GPS' || currentCity.countryCode === 'XX';
    const searchCity = isUncertain ? '' : currentCity.name;
    
    try {
      const { data, error } = await supabase.rpc('intelligent_places_search', {
        search_query: query,
        search_city: searchCity,
        max_results: maxResults,
        user_latitude: currentCity.coordinates.lat,
        user_longitude: currentCity.coordinates.lng
      });

      if (error) {
        console.error('Erreur recherche base de données:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Erreur recherche:', error);
      return [];
    }
  }

  /**
   * 🎯 Obtenir les lieux populaires de la ville actuelle
   */
  async getPopularPlacesForCurrentCity(): Promise<any[]> {
    const currentCity = this.getCurrentCity();
    
    // If outside supported zones or uncertain detection, skip city filter
    const isUncertain = currentCity.code === 'GPS' || currentCity.countryCode === 'XX';
    const searchCity = isUncertain ? '' : currentCity.name;
    
    try {
      const { data, error } = await supabase.rpc('intelligent_places_search', {
        search_query: '',
        search_city: searchCity,
        max_results: 10,
        user_latitude: currentCity.coordinates.lat,
        user_longitude: currentCity.coordinates.lng
      });

      if (error) {
        console.error('Erreur lieux populaires:', error);
        return this.getFallbackPopularPlaces(currentCity);
      }

      return data || this.getFallbackPopularPlaces(currentCity);
    } catch (error) {
      console.error('Erreur lieux populaires:', error);
      return this.getFallbackPopularPlaces(currentCity);
    }
  }

  /**
   * 🎯 Lieux populaires de fallback par ville (RDC uniquement)
   */
  private getFallbackPopularPlaces(city: CityConfig): any[] {
    const fallbacks: Record<string, any[]> = {
      kin: [
        { name: 'Centre-ville', commune: 'Gombe', lat: -4.3217, lng: 15.3069 },
        { name: 'Aéroport de Ndjili', commune: 'Ndjili', lat: -4.3856, lng: 15.4446 },
        { name: 'Université de Kinshasa', commune: 'Lemba', lat: -4.4325, lng: 15.2796 }
      ],
      lbv: [
        { name: 'Centre-ville', commune: 'Lubumbashi', lat: -11.6792, lng: 27.4748 },
        { name: 'Aéroport de Luano', commune: 'Lubumbashi', lat: -11.5913, lng: 27.5309 },
        { name: 'Université de Lubumbashi', commune: 'Lubumbashi', lat: -11.6556, lng: 27.4539 }
      ],
      kwz: [
        { name: 'Centre-ville', commune: 'Kolwezi', lat: -10.7147, lng: 25.4764 },
        { name: 'Aéroport de Kolwezi', commune: 'Kolwezi', lat: -10.7689, lng: 25.5067 }
      ],
      abj: [
        { name: 'Plateau', commune: 'Plateau', lat: 5.3197, lng: -4.0166 },
        { name: 'Aéroport FHB', commune: 'Port-Bouët', lat: 5.2614, lng: -3.9262 },
        { name: 'Cocody', commune: 'Cocody', lat: 5.3490, lng: -3.9817 },
        { name: 'Yopougon', commune: 'Yopougon', lat: 5.3364, lng: -4.0717 },
        { name: 'Treichville', commune: 'Treichville', lat: 5.3020, lng: -3.9972 }
      ],
    };

    return fallbacks[city.code.toLowerCase()] || fallbacks.kin;
  }

  /**
   * 🎯 Vider le cache
   */
  clearCache(): void {
    this.cityDetectionCache = null;
    this.currentCity = null;
  }

  /**
   * 🎯 Obtenir toutes les villes supportées
   */
  getSupportedCities(): CityConfig[] {
    return Object.values(SUPPORTED_CITIES);
  }
}

// Instance singleton
export const universalGeolocation = UniversalGeolocationService.getInstance();