/**
 * 🎯 SERVICE DE GÉOLOCALISATION INTELLIGENT
 * ✅ v4: watchId as string, no parseInt conversion
 */

export interface LocationData {
  address: string;
  lat: number;
  lng: number;
  type?: 'current' | 'geocoded' | 'popular' | 'recent' | 'ip' | 'fallback' | 'database' | 'default' | 'gps';
  placeId?: string;
  accuracy?: number;
  name?: string;
  subtitle?: string;
}

export interface LocationSearchResult extends LocationData {
  id: string;
  title?: string;
  subtitle?: string;
  isPopular?: boolean;
}

export interface GeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  fallbackToIP?: boolean;
  fallbackToDatabase?: boolean;
  fallbackToDefault?: boolean;
  interval?: number;
  distanceFilter?: number;
}

class IntelligentLocationService {
  private currentCity = 'Kinshasa';
  // ✅ v4: watchId stored as string (native format)
  private watchId: string | null = null;
  private cache = new Map<string, { data: any; timestamp: number }>();
  private readonly CACHE_DURATION = 5 * 60 * 1000;

  private cityData = {
    kinshasa: [
      { id: 'kinshasa-airport', name: 'Aéroport International de N\'djili', address: 'Aéroport International de N\'djili, Kinshasa, RDC', lat: -4.3857, lng: 15.4444, type: 'popular' as const, isPopular: true, title: 'Aéroport N\'djili', subtitle: 'Transport international' },
      { id: 'kinshasa-center', name: 'Centre-ville de Kinshasa', address: 'Gombe, Kinshasa, RDC', lat: -4.3217, lng: 15.3069, type: 'popular' as const, isPopular: true, title: 'Centre-ville Gombe', subtitle: 'Quartier des affaires' },
      { id: 'kinshasa-unikin', name: 'Université de Kinshasa', address: 'Mont-Amba, Kinshasa, RDC', lat: -4.4324, lng: 15.2973, type: 'popular' as const, isPopular: true, title: 'UNIKIN', subtitle: 'Université principale' },
      { id: 'kinshasa-marche-central', name: 'Marché Central', address: 'Marché Central, Kinshasa, RDC', lat: -4.3276, lng: 15.3086, type: 'popular' as const, isPopular: true, title: 'Marché Central', subtitle: 'Commerce principal' },
      { id: 'kinshasa-hopital-general', name: 'Hôpital Général de Kinshasa', address: 'Hôpital Général, Lingwala, Kinshasa, RDC', lat: -4.3398, lng: 15.2943, type: 'popular' as const, isPopular: true, title: 'Hôpital Général', subtitle: 'Centre de santé' },
      { id: 'kinshasa-stade-martyrs', name: 'Stade des Martyrs', address: 'Stade des Martyrs, Kalamu, Kinshasa, RDC', lat: -4.3789, lng: 15.3134, type: 'popular' as const, isPopular: true, title: 'Stade des Martyrs', subtitle: 'Complexe sportif' }
    ],
    lubumbashi: [
      { id: 'lubumbashi-airport', name: 'Aéroport International de Lubumbashi', address: 'Aéroport de Lubumbashi, RDC', lat: -11.5914, lng: 27.5309, type: 'popular' as const, isPopular: true, title: 'Aéroport Lubumbashi', subtitle: 'Transport aérien' },
      { id: 'lubumbashi-center', name: 'Centre-ville de Lubumbashi', address: 'Centre-ville, Lubumbashi, RDC', lat: -11.6559, lng: 27.4794, type: 'popular' as const, isPopular: true, title: 'Centre-ville', subtitle: 'Quartier central' }
    ]
  };

  async getCurrentPosition(options?: GeolocationOptions): Promise<LocationData> {
    const cacheKey = 'current-position';
    const cached = this.getFromCache(cacheKey);
    if (cached && options?.maximumAge && Date.now() - cached.timestamp < options.maximumAge) return cached.data;

    try {
      const { nativeGeolocationService } = await import('@/services/nativeGeolocationService');
      const position = await nativeGeolocationService.getCurrentPosition({
        enableHighAccuracy: options?.enableHighAccuracy ?? true,
        timeout: options?.timeout ?? 15000,
        maximumAge: options?.maximumAge ?? 60000
      });

      let address = `${position.lat.toFixed(4)}, ${position.lng.toFixed(4)}`;
      try {
        const reversedAddress = await this.reverseGeocode(position.lat, position.lng);
        if (reversedAddress) address = reversedAddress;
      } catch { /* silent */ }

      const locationData: LocationData = {
        address, lat: position.lat, lng: position.lng,
        type: 'gps', accuracy: position.accuracy
      };
      this.setCache(cacheKey, locationData);
      return locationData;

    } catch (error: any) {
      if (options?.fallbackToIP !== false) {
        try { return await this.getIPLocation(); } catch { /* continue */ }
      }
      if (options?.fallbackToDefault !== false) return this.getDefaultLocation();
      throw new Error(`Erreur géolocalisation: ${error.message}`);
    }
  }

  async searchLocations(query: string): Promise<LocationSearchResult[]> {
    if (!query || query.length < 2) return this.getPopularPlaces();
    const cacheKey = `search-${query.toLowerCase()}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached.data;

    try {
      const localResults = this.searchInPopularPlaces(query);
      let googleResults: LocationSearchResult[] = [];
      try { googleResults = await this.searchWithGooglePlaces(query); } catch { /* silent */ }
      const combinedResults = this.mergeSearchResults(localResults, googleResults);
      this.setCache(cacheKey, combinedResults);
      return combinedResults;
    } catch {
      return this.getPopularPlaces();
    }
  }

  private async searchWithGooglePlaces(query: string): Promise<LocationSearchResult[]> {
    const response = await fetch('/api/supabase/functions/v1/places-search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query,
        ...(this.currentCity === 'Kinshasa' && { lat: -4.3217, lng: 15.3069, radius: 50000 })
      })
    });
    if (!response.ok) throw new Error(`Places API error: ${response.status}`);
    const data = await response.json();
    return data.results?.map((place: any, index: number) => ({
      id: `google-${index}`, name: place.name,
      address: place.formatted_address || place.name,
      lat: place.geometry.location.lat, lng: place.geometry.location.lng,
      type: 'geocoded' as const, placeId: place.place_id,
      title: place.name, subtitle: place.formatted_address?.split(',')[1]?.trim() || this.currentCity
    })) || [];
  }

  private searchInPopularPlaces(query: string): LocationSearchResult[] {
    const cityPlaces = this.cityData[this.currentCity.toLowerCase() as keyof typeof this.cityData] || this.cityData.kinshasa;
    return cityPlaces.filter(place =>
      place.name.toLowerCase().includes(query.toLowerCase()) ||
      place.address.toLowerCase().includes(query.toLowerCase()) ||
      place.title.toLowerCase().includes(query.toLowerCase())
    );
  }

  private async reverseGeocode(lat: number, lng: number): Promise<string | null> {
    try {
      const response = await fetch('/api/supabase/functions/v1/geocode-reverse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lat, lng })
      });
      if (response.ok) {
        const data = await response.json();
        return data.address;
      }
    } catch { /* silent */ }
    return null;
  }

  private async getIPLocation(): Promise<LocationData> {
    const response = await fetch('/api/supabase/functions/v1/ip-geolocation');
    const data = await response.json();
    return { address: `${data.city}, ${data.country}`, lat: data.latitude, lng: data.longitude, type: 'ip', name: data.city };
  }

  private getDefaultLocation(): LocationData {
    const defaults: Record<string, { lat: number; lng: number; address: string }> = {
      kinshasa: { lat: -4.3217, lng: 15.3069, address: 'Kinshasa Centre, RDC' },
      lubumbashi: { lat: -11.6559, lng: 27.4794, address: 'Lubumbashi Centre, RDC' },
      kolwezi: { lat: -10.7158, lng: 25.4734, address: 'Kolwezi Centre, RDC' }
    };
    const cityKey = this.currentCity.toLowerCase();
    const defaultData = defaults[cityKey] || defaults.kinshasa;
    return { ...defaultData, type: 'default' };
  }

  private mergeSearchResults(local: LocationSearchResult[], google: LocationSearchResult[]): LocationSearchResult[] {
    const combined = [...local];
    google.forEach(googleResult => {
      const isDuplicate = combined.some(localResult => 
        this.calculateDistance(localResult, googleResult) < 100
      );
      if (!isDuplicate) combined.push(googleResult);
    });
    return combined.sort((a, b) => {
      if (a.isPopular && !b.isPopular) return -1;
      if (!a.isPopular && b.isPopular) return 1;
      return 0;
    }).slice(0, 8);
  }

  getPopularPlaces(): LocationSearchResult[] {
    const cityKey = this.currentCity.toLowerCase() as keyof typeof this.cityData;
    return [...(this.cityData[cityKey] || this.cityData.kinshasa)];
  }

  calculateDistance(point1: { lat: number; lng: number }, point2: { lat: number; lng: number }): number {
    const R = 6371000;
    const dLat = (point2.lat - point1.lat) * Math.PI / 180;
    const dLng = (point2.lng - point1.lng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    return 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)) * R;
  }

  formatDistance(meters: number): string {
    return meters < 1000 ? `${Math.round(meters)}m` : `${(meters / 1000).toFixed(1)}km`;
  }

  // ✅ v4: watchId stored as native string
  async startTracking(
    callback: (position: LocationData) => void,
    options?: GeolocationOptions & { interval?: number; distanceFilter?: number }
  ): Promise<void> {
    const { nativeGeolocationService } = await import('@/services/nativeGeolocationService');
    let lastPosition: { lat: number; lng: number } | null = null;
    const distanceFilter = options?.distanceFilter ?? 10;

    const watchIdStr = await nativeGeolocationService.watchPosition(
      async (position) => {
        if (lastPosition && distanceFilter > 0) {
          const distance = this.calculateDistance(lastPosition, { lat: position.lat, lng: position.lng });
          if (distance < distanceFilter) return;
        }
        lastPosition = { lat: position.lat, lng: position.lng };
        let address = `${position.lat.toFixed(4)}, ${position.lng.toFixed(4)}`;
        try {
          const reversedAddress = await this.reverseGeocode(position.lat, position.lng);
          if (reversedAddress) address = reversedAddress;
        } catch { /* silent */ }
        callback({ address, lat: position.lat, lng: position.lng, type: 'gps', accuracy: position.accuracy });
      },
      (error) => console.error('Erreur tracking:', error),
      {
        enableHighAccuracy: options?.enableHighAccuracy ?? true,
        timeout: options?.timeout ?? 15000,
        maximumAge: options?.maximumAge ?? 5000
      }
    );
    
    // ✅ v4: Store as string directly — no parseInt
    this.watchId = watchIdStr;
  }

  async stopTracking(): Promise<void> {
    if (this.watchId !== null) {
      try {
        const { nativeGeolocationService } = await import('@/services/nativeGeolocationService');
        await nativeGeolocationService.clearWatch(this.watchId);
      } catch {
        // No fallback needed — watchId is already a string
      }
      this.watchId = null;
    }
  }

  setCurrentCity(city: string): void {
    this.currentCity = city;
    this.cache.clear();
  }

  getCurrentCity(): string {
    return this.currentCity;
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  private getFromCache(key: string): { data: any; timestamp: number } | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) return cached;
    this.cache.delete(key);
    return null;
  }

  reset(): void {
    this.stopTracking();
    this.cache.clear();
  }
}

export const intelligentLocationService = new IntelligentLocationService();
