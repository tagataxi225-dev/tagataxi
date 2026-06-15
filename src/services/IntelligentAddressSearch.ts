/**
 * Service de recherche d'adresses intelligent avec autocomplétion avancée
 * Similaire à l'expérience Yango avec scoring et gestion des erreurs robuste
 */

import { supabase } from '@/integrations/supabase/client';

// Interface pour les résultats de recherche enrichis
export interface IntelligentSearchResult {
  id: string;
  name: string;
  subtitle: string;
  lat: number;
  lng: number;
  type: 'database' | 'search' | 'google' | 'popular' | 'recent';
  city: string;
  commune: string;
  category: string;
  confidence: number;
  // Propriétés optionnelles pour compatibilité
  hierarchy_level?: number;
  popularity_score?: number;
  relevance_score?: number;
  badge?: string;
}

// Options de recherche avancées
export interface SearchOptions {
  city?: string;
  country_code?: string;
  user_lat?: number;
  user_lng?: number;
  max_results?: number;
  min_hierarchy_level?: number;
  include_google_fallback?: boolean;
}

class IntelligentAddressSearchService {

  private cache = new Map<string, { data: IntelligentSearchResult[], timestamp: number }>();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  private readonly MIN_QUERY_LENGTH = 2;

  // Configuration des villes disponibles
  private readonly CITIES_CONFIG = {
    'Kinshasa': {
      country_code: 'CD',
      center: { lat: -4.3317, lng: 15.3139 },
      communes: [
        'Bandalungwa', 'Barumbu', 'Gombe', 'Kalamu', 'Kasa-Vubu',
        'Kimbanseke', 'Kinshasa', 'Kintambo', 'Lemba', 'Limete',
        'Lingwala', 'Makala', 'Maluku', 'Masina', 'Matete', 'Mont-Ngafula',
        'Ndjili', 'Ngaba', 'Ngaliema', 'Ngiri-Ngiri', 'Nsele', 'Selembao'
      ]
    },
    'Lubumbashi': {
      country_code: 'CD',
      center: { lat: -11.6792, lng: 27.4716 },
      communes: ['Annexe', 'Kampemba', 'Katuba', 'Kenya', 'Lubumbashi', 'Ruashi', 'Rwashi']
    },
    'Kolwezi': {
      country_code: 'CD',
      center: { lat: -10.7147, lng: 25.4665 },
      communes: ['Dilala', 'Manika', 'Mutoshi']
    }
  };

  /**
   * Recherche intelligente avec autocomplétion
   */
  async search(query: string, options: SearchOptions = {}): Promise<IntelligentSearchResult[]> {
    if (!query || query.length < this.MIN_QUERY_LENGTH) {
      return this.getPopularPlaces(options);
    }

    const cacheKey = this.getCacheKey(query, options);
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const results = await this.performSearch(query, options);
      this.saveToCache(cacheKey, results);
      return results;
    } catch (error) {
      console.error('Intelligent search error:', error);
      return this.getPopularPlaces(options);
    }
  }

   /**
    * Recherche principale avec base de données et fallback Google - CORRECTION MULTI-VILLE
    */
   private async performSearch(query: string, options: SearchOptions): Promise<IntelligentSearchResult[]> {
     const {
       city = 'Kinshasa',
       country_code = 'CD',
       user_lat,
       user_lng,
       max_results = 10,
       min_hierarchy_level = 1,
       include_google_fallback = true
     } = options;

     // 1. PRIORITÉ À LA VILLE SÉLECTIONNÉE par l'utilisateur
     let allResults: IntelligentSearchResult[] = [];
     
     // Rechercher d'abord dans la ville sélectionnée (75% des résultats)
     const primaryCityResults = await this.searchInDatabase(
       query, city, country_code, user_lat, user_lng, 
       Math.ceil(max_results * 0.75), min_hierarchy_level
     );
     allResults = [...primaryCityResults];
     
     // Puis rechercher dans les autres villes (25% des résultats restants)
     const otherCities = ['Kinshasa', 'Lubumbashi', 'Kolwezi'].filter(c => c !== city);
     if (allResults.length < max_results && otherCities.length > 0) {
       const remainingSlots = max_results - allResults.length;
       for (const searchCity of otherCities) {
         if (allResults.length >= max_results) break;
         const cityResults = await this.searchInDatabase(
           query, searchCity, country_code, user_lat, user_lng, 
           Math.ceil(remainingSlots / otherCities.length), min_hierarchy_level
         );
         allResults = [...allResults, ...cityResults];
       }
     }

    // 2. Si pas assez de résultats et Google fallback activé
    if (allResults.length < max_results && include_google_fallback) {
      const googleResults = await this.searchWithGoogleFallback(query, city, max_results - allResults.length);
      allResults = [...allResults, ...googleResults];
    }

    // 3. Trier par pertinence et limiter
    return allResults
      .sort((a, b) => b.relevance_score - a.relevance_score)
      .slice(0, max_results);
  }

  /**
   * Recherche dans la base de données optimisée
   */
  private async searchInDatabase(
    query: string, city: string, country_code: string,
    user_lat?: number, user_lng?: number, max_results: number = 10, min_hierarchy_level: number = 1
  ): Promise<IntelligentSearchResult[]> {
    try {
      const { data, error } = await supabase
        .from('intelligent_places')
        .select('*')
        .eq('city', city)
        .eq('country_code', country_code)
        .gte('hierarchy_level', min_hierarchy_level)
        .or(`name.ilike.%${query}%,alt_names.ilike.%${query}%,commune.ilike.%${query}%`)
        .order('popularity_score', { ascending: false })
        .limit(max_results);

      if (error) {
        console.error('Database search error:', error);
        return [];
      }

      return (data || []).map(this.transformDatabaseResult);
    } catch (error) {
      console.error('Database search failed:', error);
      return [];
    }
  }

  /**
   * Recherche via Google API avec proxy Supabase
   */
  private async searchWithGoogleFallback(query: string, city: string, max_results: number): Promise<IntelligentSearchResult[]> {
    try {
      const { data, error } = await supabase.functions.invoke('geocode-proxy', {
        body: {
          address: `${query}, ${city}`,
          region: 'CD',
          language: 'fr'
        }
      });

      if (error || !data?.results) {
        console.error('Google geocoding error:', error);
        return [];
      }

      return data.results.slice(0, max_results).map((result: any, index: number) => ({
        id: `google_${result.place_id || index}`,
        name: result.formatted_address || query,
        category: 'location',
        city: city,
        lat: result.geometry?.location?.lat || 0,
        lng: result.geometry?.location?.lng || 0,
        hierarchy_level: 2,
        popularity_score: 40 - index * 5,
        relevance_score: 60 - index * 5,
        type: 'google' as const,
        subtitle: `Trouvé via Google Maps`,
        badge: 'Maps'
      }));
    } catch (error) {
      console.error('Google fallback failed:', error);
      return [];
    }
  }

  /**
   * Récupération des lieux populaires
   */
  async getPopularPlaces(options: SearchOptions = {}): Promise<IntelligentSearchResult[]> {
    const { city = 'Kinshasa', country_code = 'CD', max_results = 8 } = options;

    try {
      const { data, error } = await supabase
        .from('intelligent_places')
        .select('*')
        .eq('city', city)
        .eq('country_code', country_code)
        .gte('hierarchy_level', 2)
        .order('popularity_score', { ascending: false })
        .limit(max_results);

      if (error) {
        console.error('Popular places error:', error);
        return this.getFallbackPopularPlaces(city);
      }

      const results = (data || []).map(this.transformDatabaseResult);
      return results.length > 0 ? results : this.getFallbackPopularPlaces(city);
    } catch (error) {
      console.error('Popular places failed:', error);
      return this.getFallbackPopularPlaces(city);
    }
  }

  /**
   * Lieux populaires de fallback hardcodés pour toutes les villes
   */
  private getFallbackPopularPlaces(city: string): IntelligentSearchResult[] {
    const fallbackPlaces = {
      'Kinshasa': [
        { name: 'Aéroport International Ndjili', lat: -4.3851, lng: 15.4446, commune: 'Ndjili', category: 'transport' },
        { name: 'Centre-ville Gombe', lat: -4.3167, lng: 15.3167, commune: 'Gombe', category: 'center' },
        { name: 'Marché Central', lat: -4.3217, lng: 15.3069, commune: 'Kinshasa', category: 'shopping' },
        { name: 'Université de Kinshasa', lat: -4.4333, lng: 15.3000, commune: 'Lemba', category: 'education' },
        { name: 'Stade des Martyrs', lat: -4.3333, lng: 15.3167, commune: 'Lingwala', category: 'sports' },
        { name: 'Grand Marché', lat: -4.3250, lng: 15.3100, commune: 'Kinshasa', category: 'shopping' },
        { name: 'Hôpital Général', lat: -4.3200, lng: 15.3150, commune: 'Gombe', category: 'hospital' },
        { name: 'Bandalungwa', lat: -4.3833, lng: 15.3000, commune: 'Bandalungwa', category: 'residential' }
      ],
      'Lubumbashi': [
        { name: 'Aéroport International Luano', lat: -11.5913, lng: 27.5309, commune: 'Annexe', category: 'transport' },
        { name: 'Centre-ville Lubumbashi', lat: -11.6792, lng: 27.4716, commune: 'Lubumbashi', category: 'center' },
        { name: 'Université de Lubumbashi', lat: -11.6567, lng: 27.4794, commune: 'Lubumbashi', category: 'education' },
        { name: 'Marché Kasumbalesa', lat: -11.6850, lng: 27.4800, commune: 'Kampemba', category: 'shopping' },
        { name: 'Hôpital Sendwe', lat: -11.6700, lng: 27.4750, commune: 'Kenya', category: 'hospital' },
        { name: 'Stade TP Mazembe', lat: -11.6900, lng: 27.4650, commune: 'Kamalondo', category: 'sports' },
        { name: 'Gecamines', lat: -11.6600, lng: 27.4900, commune: 'Katuba', category: 'business' },
        { name: 'Ruashi', lat: -11.6200, lng: 27.3900, commune: 'Ruashi', category: 'residential' }
      ],
      'Kolwezi': [
        { name: 'Aéroport de Kolwezi', lat: -10.7680, lng: 25.5053, commune: 'Dilala', category: 'transport' },
        { name: 'Centre-ville Kolwezi', lat: -10.7147, lng: 25.4665, commune: 'Kolwezi', category: 'center' },
        { name: 'Hôpital Général Kolwezi', lat: -10.7200, lng: 25.4700, commune: 'Kolwezi', category: 'hospital' },
        { name: 'Marché Central Kolwezi', lat: -10.7100, lng: 25.4600, commune: 'Kolwezi', category: 'shopping' },
        { name: 'Mutoshi Mining', lat: -10.7500, lng: 25.4200, commune: 'Mutoshi', category: 'business' },
        { name: 'Manika', lat: -10.6800, lng: 25.5000, commune: 'Manika', category: 'residential' },
        { name: 'Stade de Kolwezi', lat: -10.7180, lng: 25.4620, commune: 'Kolwezi', category: 'sports' },
        { name: 'Dilala', lat: -10.7300, lng: 25.4800, commune: 'Dilala', category: 'residential' }
      ]
    };

    const fallbackAbidjan = [
      { name: 'Plateau', lat: 5.3197, lng: -4.0166, commune: 'Plateau', category: 'center' },
      { name: 'Aéroport Félix Houphouët-Boigny', lat: 5.2614, lng: -3.9262, commune: 'Port-Bouët', category: 'transport' },
      { name: 'Cocody', lat: 5.3490, lng: -3.9817, commune: 'Cocody', category: 'residential' },
      { name: 'Yopougon', lat: 5.3364, lng: -4.0717, commune: 'Yopougon', category: 'residential' },
      { name: 'Treichville', lat: 5.3020, lng: -3.9972, commune: 'Treichville', category: 'center' },
      { name: 'Marcory', lat: 5.3000, lng: -3.9800, commune: 'Marcory', category: 'residential' },
      { name: 'Université FHB', lat: 5.3450, lng: -3.9900, commune: 'Cocody', category: 'education' },
      { name: 'Adjamé', lat: 5.3500, lng: -4.0200, commune: 'Adjamé', category: 'shopping' }
    ];

    const allFallbacks = { ...fallbackPlaces, 'Abidjan': fallbackAbidjan };
    const places = allFallbacks[city as keyof typeof allFallbacks] || fallbackPlaces['Kinshasa'];
    
    return places.map((place, index) => ({
      id: `fallback_${index}`,
      name: place.name,
      subtitle: `${place.commune}, ${city}`,
      lat: place.lat,
      lng: place.lng,
      type: 'popular' as const,
      city: city,
      commune: place.commune,
      category: place.category,
      confidence: (90 - index * 5) / 100,
      hierarchy_level: 3,
      popularity_score: 90 - index * 5,
      relevance_score: 90 - index * 5,
      badge: 'Populaire'
    }));
  }

  /**
   * Transformation des résultats de base de données
   */
  private transformDatabaseResult = (item: any): IntelligentSearchResult => {
    return {
      id: item.id || item.place_id || `db_${Date.now()}_${Math.random()}`,
      name: item.name || 'Lieu sans nom',
      subtitle: `${item.commune || ''}, ${item.city || 'Kinshasa'}`.replace(/^,\s*/, ''),
      lat: item.latitude || item.lat || 0,
      lng: item.longitude || item.lng || 0,
      type: 'database' as const,
      city: item.city || 'Kinshasa',
      commune: item.commune || '',
      category: item.category || 'location',
      confidence: (item.relevance_score || 50) / 100,
      hierarchy_level: item.hierarchy_level || 1,
      popularity_score: item.popularity_score || 0,
      relevance_score: item.relevance_score || 50,
      badge: this.getBadgeForHierarchy(item.hierarchy_level || 1)
    };
  };

  /**
   * Badge selon niveau hiérarchique
   */
  private getBadgeForHierarchy(level: number): string {
    const badges = {
      1: 'Quartier',
      2: 'Zone',
      3: 'Important',
      4: 'Majeur',
      5: 'Emblématique'
    };
    return badges[level as keyof typeof badges] || 'Lieu';
  }

  /**
   * Gestion du cache
   */
  private getCacheKey(query: string, options: SearchOptions): string {
    return `${query}_${options.city || 'Kinshasa'}_${options.max_results || 10}`;
  }

  private getFromCache(key: string): IntelligentSearchResult[] | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }
    return null;
  }

  private saveToCache(key: string, data: IntelligentSearchResult[]): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  public clearCache(): void {
    this.cache.clear();
  }

  /**
   * Historique de recherche (placeholder pour implémentation future)
   */
  async getRecentSearches(): Promise<IntelligentSearchResult[]> {
    return [];
  }

  async saveSearchToHistory(result: IntelligentSearchResult): Promise<void> {
    // À implémenter : sauvegarde en localStorage ou base de données
  }
}

// Instance exportée
export const intelligentAddressSearch = new IntelligentAddressSearchService();