import { supabase } from '@/integrations/supabase/client';
import { CountryService } from '@/services/countryConfig';

export interface GeocodeResult {
  place_name: string;
  center: [number, number]; // [lng, lat]
  place_type?: string[];
  properties?: any;
}

interface GooglePlaceResult {
  formatted_address: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  name?: string;
  types: string[];
  place_id: string;
}

interface GooglePlacesResponse {
  results: GooglePlaceResult[];
  status: string;
}

interface GoogleGeocodingResponse {
  results: {
    formatted_address: string;
    geometry: {
      location: {
        lat: number;
        lng: number;
      };
    };
  }[];
  status: string;
}

export class GooglePlacesService {
  private static apiKey: string | null = null;

  private static async getApiKey(): Promise<string> {
    if (this.apiKey) return this.apiKey;

    try {
      const { data, error } = await supabase.functions.invoke('get-google-maps-key');
      
      if (error) throw error;
      if (!data?.apiKey) throw new Error('Clé API Google Maps non trouvée');
      
      this.apiKey = data.apiKey;
      return this.apiKey;
    } catch (error) {
      console.error('Erreur lors de la récupération de la clé API Google Maps:', error);
      throw new Error('Service de géocodage indisponible');
    }
  }

  // Get default proximity based on current country
  private static getDefaultProximity(proximity?: { lng: number; lat: number }): { lng: number; lat: number } {
    if (proximity) return proximity;
    try {
      const country = CountryService.getCurrentCountry();
      if (country.defaultProximity) return { lng: country.defaultProximity.lng, lat: country.defaultProximity.lat };
      
      const candidateCity = CountryService.findNearestCity(
        (country.bbox[1] + country.bbox[3]) / 2,
        (country.bbox[0] + country.bbox[2]) / 2
      );
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
      const apiKey = await this.getApiKey();
      const country = CountryService.getCurrentCountry();
      
      // Determine effective proximity
      const defaultProximity = this.getDefaultProximity(proximity);
      
      const responses: GeocodeResult[] = [];
      const seenResults = new Set<string>(); // Prevent exact duplicates

      const fetchAndPush = async (url: string, passName: string) => {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000);
          
          const res = await fetch(url, { signal: controller.signal });
          clearTimeout(timeoutId);
          if (!res.ok) return;
          
          const data: GooglePlacesResponse = await res.json();
          
          if (data.status === 'OK') {
            const items = data.results.map(place => ({
              place_name: place.formatted_address,
              center: [place.geometry.location.lng, place.geometry.location.lat] as [number, number],
              place_type: place.types,
              properties: {
                place_id: place.place_id,
                name: place.name
              }
            })).filter(item => {
              const key = `${item.center[0]},${item.center[1]}`;
              if (seenResults.has(key)) return false;
              seenResults.add(key);
              return true;
            });
            
            responses.push(...items);
            console.log(`Geocoding ${passName}: ${items.length} results`);
          }
        } catch (error) {
          console.warn(`Geocoding ${passName} failed:`, error);
        }
      };

      const encodedQuery = encodeURIComponent(query);
      
      // Pass 1: Local search with proximity and location bias
      if (country.code !== "*") {
        const localUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodedQuery}&location=${defaultProximity.lat},${defaultProximity.lng}&radius=50000&key=${apiKey}`;
        await fetchAndPush(localUrl, 'local-proximity');
      }

      // Pass 2: Broader search if not enough results
      if (responses.length < 5) {
        const broadUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodedQuery}&key=${apiKey}`;
        await fetchAndPush(broadUrl, 'global');
      }

      // Enhanced intelligent sorting algorithm
      let results = responses.sort((a, b) => {
        const queryLower = query.toLowerCase();
        const aName = a.place_name.toLowerCase();
        const bName = b.place_name.toLowerCase();

        // 1. Exact prefix match gets highest priority
        const aStartsWith = aName.startsWith(queryLower);
        const bStartsWith = bName.startsWith(queryLower);
        if (aStartsWith && !bStartsWith) return -1;
        if (!aStartsWith && bStartsWith) return 1;

        // 2. Contains match
        const aContains = aName.includes(queryLower);
        const bContains = bName.includes(queryLower);
        if (aContains && !bContains) return -1;
        if (!aContains && bContains) return 1;

        // 3. Place type priority
        const getTypeScore = (types: string[] = []) => {
          if (types.includes('point_of_interest') || types.includes('establishment')) return 4;
          if (types.includes('locality') || types.includes('sublocality')) return 3;
          if (types.includes('administrative_area_level_2')) return 2;
          return 1;
        };
        
        const aTypeScore = getTypeScore(a.place_type);
        const bTypeScore = getTypeScore(b.place_type);
        if (aTypeScore !== bTypeScore) return bTypeScore - aTypeScore;

        // 4. Proximity to user location
        const distanceA = Math.hypot(a.center[0] - defaultProximity.lng, a.center[1] - defaultProximity.lat);
        const distanceB = Math.hypot(b.center[0] - defaultProximity.lng, b.center[1] - defaultProximity.lat);
        
        return distanceA - distanceB;
      });

      // Limit final results
      results = results.slice(0, 15);

      return results;
    } catch (error) {
      console.error('Erreur lors de la recherche de lieux:', error);
      return this.getEnhancedFallbackPlaces(query);
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
        place_type: ['locality'],
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
              place_type: ['locality'],
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
      return [
        { place_name: 'Kinshasa, République Démocratique du Congo', center: [15.2663, -4.4419] },
        { place_name: 'Lubumbashi, République Démocratique du Congo', center: [27.4794, -11.6609] },
        { place_name: 'Kolwezi, République Démocratique du Congo', center: [25.4731, -10.7143] }
      ];
    }
  }

  static async reverseGeocode(lng: number, lat: number): Promise<string> {
    try {
      const { data, error } = await supabase.functions.invoke('geocode-reverse', {
        body: { lat, lng }
      });

      if (error) throw error;
      if (data?.address && data.success) {
        return data.address;
      }

      // Fallback lisible basé sur les coordonnées connues
      return this.getFallbackCityName(lat, lng);
    } catch (error) {
      console.error('Erreur lors du géocodage inverse:', error);
      return this.getFallbackCityName(lat, lng);
    }
  }

  private static getFallbackCityName(lat: number, lng: number): string {
    // Détection ville par coordonnées approximatives
    if (lat >= -5.0 && lat <= -4.0 && lng >= 15.0 && lng <= 16.0) return 'Kinshasa, RD Congo';
    if (lat >= -12.0 && lat <= -11.0 && lng >= 27.0 && lng <= 28.0) return 'Lubumbashi, RD Congo';
    if (lat >= -11.0 && lat <= -10.0 && lng >= 25.0 && lng <= 26.0) return 'Kolwezi, RD Congo';
    return 'Position détectée';
  }
}