import { supabase } from '@/integrations/supabase/client';
import { CountryService } from '@/services/countryConfig';
export interface GeocodeResult {
  place_name: string;
  center: [number, number];
  place_type?: string[];
  properties?: any;
}

interface MapboxResponse {
  features: {
    place_name: string;
    center: [number, number];
    place_type?: string[];
    properties?: any;
  }[];
}

export class GeocodingService {
  private static mapboxToken: string | null = null;

  private static async getMapboxToken(): Promise<string> {
    if (this.mapboxToken) return this.mapboxToken;
    // Use the same Mapbox token as OptimizedMapView for geocoding searches
    this.mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN;
    return this.mapboxToken;
  }

  // Helpers dynamiques basés sur le pays courant
  private static getDefaultProximity(proximity?: { lng: number; lat: number }): { lng: number; lat: number } {
    if (proximity) return proximity;
    try {
      const country = CountryService.getCurrentCountry();
      // Essayer de trouver la ville majeure la plus proche du centre de la bbox
      const candidateCity = country.defaultProximity
        ? null
        : CountryService.findNearestCity(
            (country.bbox[1] + country.bbox[3]) / 2,
            (country.bbox[0] + country.bbox[2]) / 2
          );
      if (country.defaultProximity) return { lng: country.defaultProximity.lng, lat: country.defaultProximity.lat };
      if (candidateCity) return { lng: candidateCity.coordinates.lng, lat: candidateCity.coordinates.lat };
      // Fallback: centre de la bbox
      return { lng: (country.bbox[0] + country.bbox[2]) / 2, lat: (country.bbox[1] + country.bbox[3]) / 2 };
    } catch {
      // Fallback Kinshasa
      return { lng: 15.2663, lat: -4.4419 };
    }
  }

  static async searchPlaces(query: string, proximity?: { lng: number; lat: number }): Promise<GeocodeResult[]> {
    if (!query || query.length < 1) return [];

    try {
      const token = await this.getMapboxToken();
      const country = CountryService.getCurrentCountry();
      
      // Enhanced multi-language support
      const browserLang = typeof navigator !== 'undefined' ? navigator.language.substring(0, 2) : 'en';
      const countryLang = country.language || 'en';
      const userLang = browserLang || countryLang || 'en';

      // Determine effective proximity with enhanced global fallback
      const defaultProximity = this.getDefaultProximity(proximity);

      const responses: GeocodeResult[] = [];
      const seenResults = new Set<string>(); // Prevent exact duplicates

      const fetchAndPush = async (url: URL, passName: string) => {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000);
          
          const res = await fetch(url, { signal: controller.signal });
          clearTimeout(timeoutId);
          if (!res.ok) return;
          
          const data: MapboxResponse = await res.json();
          const items = data.features.map(f => ({
            place_name: f.place_name,
            center: f.center,
            place_type: f.place_type,
            properties: f.properties,
          })).filter(item => {
            const key = `${item.center[0]},${item.center[1]}`;
            if (seenResults.has(key)) return false;
            seenResults.add(key);
            return true;
          });
          
          responses.push(...items);
          console.log(`Geocoding ${passName}: ${items.length} results`);
        } catch (error) {
          console.warn(`Geocoding ${passName} failed:`, error);
        }
      };

      // Enhanced fuzzy search with wider tolerance
      const enhancedQuery = query.trim().toLowerCase();
      const encodedQuery = encodeURIComponent(query);
      
      // Pass 1: Ultra-precise local search (if not global fallback)
      if (country.code !== "*" && country.mapboxCountryCode) {
        const localBbox: [number, number, number, number] = [
          defaultProximity.lng - 0.2,
          defaultProximity.lat - 0.2,
          defaultProximity.lng + 0.2,
          defaultProximity.lat + 0.2,
        ];

        const pass1 = new URL(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedQuery}.json`);
        pass1.searchParams.set('access_token', token);
        pass1.searchParams.set('proximity', `${defaultProximity.lng},${defaultProximity.lat}`);
        pass1.searchParams.set('bbox', `${localBbox[0]},${localBbox[1]},${localBbox[2]},${localBbox[3]}`);
        pass1.searchParams.set('country', country.mapboxCountryCode);
        pass1.searchParams.set('limit', '10');
        pass1.searchParams.set('language', userLang);
        pass1.searchParams.set('types', 'poi,address,place,locality,neighborhood,district,region');
        pass1.searchParams.set('autocomplete', 'true');
        
        await fetchAndPush(pass1, 'local-precise');
      }

      // Pass 2: National search with proximity
      if (responses.length < 5 && country.code !== "*" && country.mapboxCountryCode) {
        const pass2 = new URL(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedQuery}.json`);
        pass2.searchParams.set('access_token', token);
        pass2.searchParams.set('proximity', `${defaultProximity.lng},${defaultProximity.lat}`);
        pass2.searchParams.set('country', country.mapboxCountryCode);
        pass2.searchParams.set('limit', '10');
        pass2.searchParams.set('language', userLang);
        pass2.searchParams.set('types', 'poi,address,place,locality,neighborhood,district,region');
        pass2.searchParams.set('autocomplete', 'true');
        
        await fetchAndPush(pass2, 'national');
      }

      // Pass 3: Global search with proximity (always executed for global coverage)
      if (responses.length < 8) {
        const pass3 = new URL(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedQuery}.json`);
        pass3.searchParams.set('access_token', token);
        pass3.searchParams.set('proximity', `${defaultProximity.lng},${defaultProximity.lat}`);
        pass3.searchParams.set('limit', '12');
        pass3.searchParams.set('language', userLang);
        pass3.searchParams.set('types', 'poi,address,place,locality,neighborhood,district,region,country');
        pass3.searchParams.set('autocomplete', 'true');
        
        await fetchAndPush(pass3, 'global-proximity');
      }

      // Pass 4: Pure global search (no restrictions) for maximum coverage
      if (responses.length < 8) {
        const pass4 = new URL(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedQuery}.json`);
        pass4.searchParams.set('access_token', token);
        pass4.searchParams.set('limit', '15');
        pass4.searchParams.set('language', userLang);
        pass4.searchParams.set('types', 'poi,address,place,locality,neighborhood,district,region,country');
        pass4.searchParams.set('autocomplete', 'true');
        
        await fetchAndPush(pass4, 'global');
      }

      // Enhanced intelligent sorting algorithm
      let results = responses.sort((a, b) => {
        const queryLower = enhancedQuery;
        const aName = a.place_name.toLowerCase();
        const bName = b.place_name.toLowerCase();

        // 1. Exact prefix match gets highest priority
        const aStartsWith = aName.startsWith(queryLower);
        const bStartsWith = bName.startsWith(queryLower);
        if (aStartsWith && !bStartsWith) return -1;
        if (!aStartsWith && bStartsWith) return 1;

        // 2. Contains match (word boundary preferred)
        const aContains = aName.includes(queryLower);
        const bContains = bName.includes(queryLower);
        if (aContains && !bContains) return -1;
        if (!aContains && bContains) return 1;

        // 3. Place type priority (poi, address > place > locality > region)
        const getTypeScore = (types: string[] = []) => {
          if (types.includes('poi') || types.includes('address')) return 4;
          if (types.includes('place')) return 3;
          if (types.includes('locality') || types.includes('neighborhood')) return 2;
          return 1;
        };
        
        const aTypeScore = getTypeScore(a.place_type);
        const bTypeScore = getTypeScore(b.place_type);
        if (aTypeScore !== bTypeScore) return bTypeScore - aTypeScore;

        // 4. Proximity to user location/country
        const distanceA = Math.hypot(a.center[0] - defaultProximity.lng, a.center[1] - defaultProximity.lat);
        const distanceB = Math.hypot(b.center[0] - defaultProximity.lng, b.center[1] - defaultProximity.lat);
        
        // Boost results within the current country if not using global fallback
        if (country.code !== "*") {
          const isAInCountry = this.isPointInBbox(a.center[0], a.center[1], country.bbox);
          const isBInCountry = this.isPointInBbox(b.center[0], b.center[1], country.bbox);
          if (isAInCountry && !isBInCountry) return -1;
          if (!isAInCountry && isBInCountry) return 1;
        }

        return distanceA - distanceB;
      });

      // Limit final results but ensure diversity
      results = results.slice(0, 15);

      return results;
    } catch (error) {
      console.error('Erreur lors de la recherche de lieux:', error);

      // Enhanced fallback with fuzzy matching
      const fallbackPlaces = this.getEnhancedFallbackPlaces(query);
      return fallbackPlaces;
    }
  }

  private static isPointInBbox(lng: number, lat: number, bbox: [number, number, number, number]): boolean {
    return lng >= bbox[0] && lng <= bbox[2] && lat >= bbox[1] && lat <= bbox[3];
  }

  private static getFallbackPlaces() {
    try {
      const country = CountryService.getCurrentCountry();
      const places = country.majorCities.map(city => ({
        place_name: `${city.name}, ${country.name}`,
        center: [city.coordinates.lng, city.coordinates.lat]
      }));
      return places;
    } catch {
      // Fallback minimal si CountryService indisponible
      return [
        { place_name: 'Kinshasa, République Démocratique du Congo', center: [15.2663, -4.4419] },
        { place_name: 'Lubumbashi, République Démocratique du Congo', center: [27.4794, -11.6609] },
        { place_name: 'Kolwezi, République Démocratique du Congo', center: [25.4731, -10.7143] }
      ];
    }
  }

  private static getEnhancedFallbackPlaces(query: string): GeocodeResult[] {
    try {
      const country = CountryService.getCurrentCountry();
      const queryLower = query.toLowerCase();
      
      // Get current country cities
      let allPlaces = country.majorCities.map(city => ({
        place_name: `${city.name}, ${country.name}`,
        center: [city.coordinates.lng, city.coordinates.lat] as [number, number],
        place_type: ['place'],
        properties: { country: country.name }
      }));

      // If using global fallback or no matches, search all countries
      if (country.code === "*" || !allPlaces.some(p => p.place_name.toLowerCase().includes(queryLower))) {
        const allCountries = CountryService.getAllCountries();
        allPlaces = [];
        
        for (const countryConfig of allCountries) {
          if (countryConfig.code === "*") continue;
          
          for (const city of countryConfig.majorCities) {
            allPlaces.push({
              place_name: `${city.name}, ${countryConfig.name}`,
              center: [city.coordinates.lng, city.coordinates.lat] as [number, number],
              place_type: ['place'],
              properties: { country: countryConfig.name }
            });
          }
        }
      }

      // Filter and sort by relevance
      return allPlaces
        .filter(place => place.place_name.toLowerCase().includes(queryLower))
        .sort((a, b) => {
          const aStartsWith = a.place_name.toLowerCase().startsWith(queryLower);
          const bStartsWith = b.place_name.toLowerCase().startsWith(queryLower);
          if (aStartsWith && !bStartsWith) return -1;
          if (!aStartsWith && bStartsWith) return 1;
          return a.place_name.localeCompare(b.place_name);
        })
        .slice(0, 10);
    } catch (error) {
      console.error('Fallback places error:', error);
      return [];
    }
  }

  static async reverseGeocode(lng: number, lat: number): Promise<string> {
    try {
      // Use geocode-reverse edge function (Google-based) instead of Mapbox
      const { data, error } = await supabase.functions.invoke('geocode-reverse', {
        body: { lat, lng }
      });

      if (error) throw error;

      if (data?.address) {
        return data.address;
      }

      return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    } catch (error) {
      console.error('Erreur lors du géocodage inverse:', error);
      return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    }
  }
}
