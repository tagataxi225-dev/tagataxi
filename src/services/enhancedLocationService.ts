/**
 * 🚀 SERVICE DE GÉOLOCALISATION AMÉLIORÉ AVEC CACHE INTELLIGENT
 * 
 * Performance optimisée pour l'Afrique avec multi-sources et cache
 */

import { supabase } from '@/integrations/supabase/client';
import type { LocationData, LocationSearchResult } from '@/hooks/useSmartGeolocation';

interface CacheEntry {
  results: LocationSearchResult[];
  timestamp: number;
  expiry: number;
  provider: string;
}

interface SearchCacheKey {
  query: string;
  region: string;
  userLat?: number;
  userLng?: number;
}

export class EnhancedLocationService {
  private static instance: EnhancedLocationService;
  private localCache = new Map<string, CacheEntry>();
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 heures
  private readonly LOCAL_CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

  static getInstance(): EnhancedLocationService {
    if (!this.instance) {
      this.instance = new EnhancedLocationService();
    }
    return this.instance;
  }

  // 🔑 GÉNÉRER CLÉ DE CACHE
  private generateCacheKey(params: SearchCacheKey): string {
    const { query, region, userLat, userLng } = params;
    const locationPart = userLat && userLng ? `_${userLat.toFixed(3)}_${userLng.toFixed(3)}` : '';
    return `${query.toLowerCase().trim()}_${region}${locationPart}`;
  }

  // 💾 VÉRIFIER CACHE LOCAL
  private getLocalCache(key: string): LocationSearchResult[] | null {
    const entry = this.localCache.get(key);
    if (entry && Date.now() < entry.expiry) {
      console.log('🏠 Cache local utilisé pour:', key);
      return entry.results;
    }
    
    if (entry) {
      this.localCache.delete(key);
    }
    return null;
  }

  // 💾 SAUVEGARDER CACHE LOCAL
  private setLocalCache(key: string, results: LocationSearchResult[], provider: string): void {
    this.localCache.set(key, {
      results,
      timestamp: Date.now(),
      expiry: Date.now() + this.LOCAL_CACHE_DURATION,
      provider
    });
    
    // Nettoyer le cache si trop volumineux
    if (this.localCache.size > 100) {
      const oldestKeys = Array.from(this.localCache.keys()).slice(0, 20);
      oldestKeys.forEach(k => this.localCache.delete(k));
    }
  }

  // 🗄️ VÉRIFIER CACHE SUPABASE
  private async getDatabaseCache(key: string): Promise<LocationSearchResult[] | null> {
    try {
      const { data, error } = await supabase
        .from('location_search_cache')
        .select('results, created_at, provider')
        .eq('search_key', key)
        .gte('expires_at', new Date().toISOString())
        .single();

      if (error || !data) return null;

      console.log('🏛️ Cache base de données utilisé:', key, 'Provider:', data.provider);
      return (data.results as any[])?.map((result: any) => result as LocationSearchResult) || [];
    } catch (error) {
      console.warn('Erreur lecture cache DB:', error);
      return null;
    }
  }

  // 🗄️ SAUVEGARDER CACHE SUPABASE
  private async setDatabaseCache(
    key: string,
    query: string,
    region: string,
    results: LocationSearchResult[],
    provider: string
  ): Promise<void> {
    try {
      await supabase
        .from('location_search_cache')
        .upsert({
          search_key: key,
          query,
          region,
          results: results as any,
          result_count: results.length,
          provider,
          expires_at: new Date(Date.now() + this.CACHE_DURATION).toISOString()
        });
    } catch (error) {
      console.warn('Erreur sauvegarde cache DB:', error);
    }
  }

  // 🔍 RECHERCHE MULTI-SOURCES INTELLIGENTE
  async searchLocations(
    query: string,
    region: string = 'cd',
    userLat?: number,
    userLng?: number,
    maxResults: number = 8
  ): Promise<LocationSearchResult[]> {
    if (!query.trim()) {
      return this.getPopularPlaces(region, userLat, userLng);
    }

    const cacheKey = this.generateCacheKey({ query, region, userLat, userLng });

    // 1. Vérifier cache local
    const localResults = this.getLocalCache(cacheKey);
    if (localResults) {
      return localResults.slice(0, maxResults);
    }

    // 2. Vérifier cache base de données
    const dbResults = await this.getDatabaseCache(cacheKey);
    if (dbResults) {
      this.setLocalCache(cacheKey, dbResults, 'database_cache');
      return dbResults.slice(0, maxResults);
    }

    // 3. Recherche fraîche multi-sources
    console.log('🔍 Recherche fraîche pour:', query);
    const results = await this.performFreshSearch(query, region, userLat, userLng, maxResults);

    // 4. Mettre en cache
    if (results.length > 0) {
      this.setLocalCache(cacheKey, results, 'fresh_search');
      await this.setDatabaseCache(cacheKey, query, region, results, 'multi_source');
    }

    return results;
  }

  // 🆕 RECHERCHE FRAÎCHE MULTI-SOURCES
  private async performFreshSearch(
    query: string,
    region: string,
    userLat?: number,
    userLng?: number,
    maxResults: number = 8
  ): Promise<LocationSearchResult[]> {
    const allResults: LocationSearchResult[] = [];

    try {
      // 1. Recherche dans la base de données locale (priorité)
      const dbResults = await this.searchInDatabase(query, region, userLat, userLng);
      allResults.push(...dbResults);

      // 2. Si pas assez de résultats, chercher via Google
      if (allResults.length < maxResults) {
        const googleResults = await this.searchViaGoogle(query, region);
        allResults.push(...googleResults);
      }

      // 3. Déduplication et scoring
      const uniqueResults = this.deduplicateAndScore(allResults, userLat, userLng);

      return uniqueResults.slice(0, maxResults);
    } catch (error) {
      console.error('Erreur recherche multi-sources:', error);
      return this.getFallbackResults(query, region);
    }
  }

  // 🏛️ RECHERCHE BASE DE DONNÉES
  private async searchInDatabase(
    query: string,
    region: string,
    userLat?: number,
    userLng?: number
  ): Promise<LocationSearchResult[]> {
    try {
      const { data, error } = await supabase.rpc('intelligent_places_search', {
        search_query: query,
        search_city: 'Kinshasa',
        user_latitude: userLat,
        user_longitude: userLng,
        max_results: 10
      });

      if (error || !data) return [];

      return data.map((place: any, index: number) => ({
        id: `db-${place.id}`,
        name: place.name,
        address: place.formatted_address,
        lat: place.latitude,
        lng: place.longitude,
        type: 'database' as const,
        title: place.name,
        subtitle: place.subtitle,
        relevanceScore: place.relevance_score || (90 - index * 5),
        distance: place.distance_meters,
        isPopular: place.badge === 'Populaire'
      }));
    } catch (error) {
      console.error('Erreur recherche DB:', error);
      return [];
    }
  }

  // 🌐 RECHERCHE GOOGLE PLACES
  private async searchViaGoogle(
    query: string,
    region: string
  ): Promise<LocationSearchResult[]> {
    try {
      const { data, error } = await supabase.functions.invoke('geocode-proxy', {
        body: { query, region }
      });

      if (error || !data?.results) return [];

      return data.results.map((place: any, index: number) => ({
        id: `google-${place.place_id}`,
        name: place.name,
        address: place.formatted_address,
        lat: place.geometry.location.lat,
        lng: place.geometry.location.lng,
        type: 'google',
        placeId: place.place_id,
        title: place.name,
        subtitle: place.formatted_address.split(',').slice(1, 3).join(',').trim(),
        relevanceScore: 70 - index * 5
      }));
    } catch (error) {
      console.error('Erreur recherche Google:', error);
      return [];
    }
  }

  // 🔄 DÉDUPLICATION ET SCORING
  private deduplicateAndScore(
    results: LocationSearchResult[],
    userLat?: number,
    userLng?: number
  ): LocationSearchResult[] {
    const uniqueMap = new Map<string, LocationSearchResult>();

    results.forEach(result => {
      const key = `${result.lat.toFixed(4)}_${result.lng.toFixed(4)}`;
      const existing = uniqueMap.get(key);

      if (!existing || result.relevanceScore! > existing.relevanceScore!) {
        // Calculer distance si coordonnées utilisateur disponibles
        if (userLat && userLng) {
          result.distance = this.calculateDistance(userLat, userLng, result.lat, result.lng);
          
          // Bonus proximité
          const proximityBonus = Math.max(0, (10000 - result.distance) / 10000 * 20);
          result.relevanceScore = (result.relevanceScore || 0) + proximityBonus;
        }

        uniqueMap.set(key, result);
      }
    });

    return Array.from(uniqueMap.values())
      .sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));
  }

  // 📍 CALCULER DISTANCE (PUBLIC)
  calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371000; // Rayon Terre en mètres
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  // 📏 FORMATER DISTANCE (PUBLIC)
  formatDistance(meters: number): string {
    if (meters < 1000) {
      return `${Math.round(meters)}m`;
    }
    return `${(meters / 1000).toFixed(1)}km`;
  }

  // 🏆 LIEUX POPULAIRES (PUBLIC)
  async getPopularLocations(
    region: string,
    maxResults: number = 8
  ): Promise<LocationSearchResult[]> {
    return this.getPopularPlaces(region, undefined, undefined);
  }

  // 🏆 LIEUX POPULAIRES
  private async getPopularPlaces(
    region: string,
    userLat?: number,
    userLng?: number
  ): Promise<LocationSearchResult[]> {
    try {
      const { data } = await supabase.rpc('intelligent_places_search', {
        search_query: '',
        search_city: 'Kinshasa',
        user_latitude: userLat,
        user_longitude: userLng,
        max_results: 8
      });

      if (!data) return this.getFallbackResults('', region);

      return data.map((place: any) => ({
        id: `popular-${place.id}`,
        name: place.name,
        address: place.formatted_address,
        lat: place.latitude,
        lng: place.longitude,
        type: 'popular' as const,
        title: place.name,
        subtitle: place.subtitle,
        relevanceScore: place.popularity_score || 100,
        isPopular: true
      }));
    } catch (error) {
      console.error('Erreur lieux populaires:', error);
      return this.getFallbackResults('', region);
    }
  }

  // 🆘 RÉSULTATS FALLBACK
  private getFallbackResults(query: string, region: string): LocationSearchResult[] {
    const cityCenter = { lat: -4.3217, lng: 15.3069, city: 'Kinshasa', country: 'RDC' };

    if (query) {
      return [{
        id: 'fallback-search',
        name: query,
        address: `${query}, ${cityCenter.city}, ${cityCenter.country}`,
        lat: cityCenter.lat + (Math.random() - 0.5) * 0.01,
        lng: cityCenter.lng + (Math.random() - 0.5) * 0.01,
        type: 'fallback',
        title: query,
        subtitle: `Résultat approximatif à ${cityCenter.city}`,
        relevanceScore: 50
      }];
    }

    return [{
      id: 'fallback-center',
      name: `Centre-ville de ${cityCenter.city}`,
      address: `${cityCenter.city}, ${cityCenter.country}`,
      lat: cityCenter.lat,
      lng: cityCenter.lng,
      type: 'fallback',
      title: `Centre-ville`,
      subtitle: cityCenter.city,
      relevanceScore: 100,
      isPopular: true
    }];
  }

  // 📍 POSITION ACTUELLE (PUBLIC) - Utilise GPS natif
  async getCurrentPosition(options: any = {}): Promise<LocationSearchResult> {
    try {
      const { nativeGeolocationService } = await import('@/services/nativeGeolocationService');
      
      const position = await nativeGeolocationService.getCurrentPosition({
        enableHighAccuracy: options.enableHighAccuracy ?? true,
        timeout: options.timeout ?? 15000,
        maximumAge: options.maximumAge ?? 300000
      });

      return {
        id: 'current-location',
        name: 'Ma position',
        address: 'Position actuelle',
        lat: position.lat,
        lng: position.lng,
        type: 'current',
        title: 'Ma position actuelle',
        subtitle: `GPS ${position.source}`,
        relevanceScore: 100,
        accuracy: position.accuracy
      };
    } catch (error) {
      throw new Error('Impossible d\'obtenir la position GPS');
    }
  }

  // 🏙️ VILLE ACTUELLE (PUBLIC)
  setCurrentCity(city: string): void {
    // Méthode pour définir la ville actuelle
    console.log('Ville sélectionnée:', city);
  }

  // 🧹 NETTOYER CACHE
  clearCache(): void {
    this.localCache.clear();
    console.log('🧹 Cache local nettoyé');
  }

  // 📊 STATS CACHE
  getCacheStats() {
    return {
      localCacheSize: this.localCache.size,
      localCacheEntries: Array.from(this.localCache.entries()).map(([key, entry]) => ({
        key,
        provider: entry.provider,
        timestamp: new Date(entry.timestamp).toLocaleString(),
        resultsCount: entry.results.length
      }))
    };
  }
}

export const enhancedLocationService = EnhancedLocationService.getInstance();