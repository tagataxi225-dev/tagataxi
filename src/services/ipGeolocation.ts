// Service de géolocalisation IP avec fallbacks multiples

interface IPLocationResult {
  latitude: number;
  longitude: number;
  city: string;
  country: string;
  accuracy: number;
  provider: string;
}

export class IPGeolocationService {
  private static instance: IPGeolocationService;
  private cache: IPLocationResult | null = null;
  private cacheExpiry: number = 0;

  static getInstance(): IPGeolocationService {
    if (!this.instance) {
      this.instance = new IPGeolocationService();
    }
    return this.instance;
  }

  async getCurrentLocation(): Promise<IPLocationResult> {
    // Cache réduit à 3 minutes pour permettre re-détection
    if (this.cache && Date.now() < this.cacheExpiry) {
      console.log('🏠 Using cached IP location:', this.cache);
      return this.cache;
    }

    console.log('🌍 Detecting IP location...');

    // D'abord essayer le cache local du navigateur
    const cachedData = this.getLocalStorageCache();
    if (cachedData) {
      console.log('📱 Using local storage cache:', cachedData);
      this.cache = cachedData;
      this.cacheExpiry = Date.now() + (3 * 60 * 1000);
      return cachedData;
    }

    try {
      // Essayer les services de géolocalisation IP avec retry
      const result = await this.tryMultipleProviders();
      console.log('✅ IP location detected:', result);
      
      this.cache = result;
      this.cacheExpiry = Date.now() + (3 * 60 * 1000); // 3 minutes
      this.setLocalStorageCache(result);
      return result;
    } catch (error) {
      console.warn('❌ All IP geolocation services failed:', error);
      const fallback = this.getFallbackLocation();
      this.setLocalStorageCache(fallback);
      return fallback;
    }
  }

  private async tryMultipleProviders(): Promise<IPLocationResult> {
    const providers = [
      () => this.getLocationFromIPInfo(), // Plus fiable avec clé API
      () => this.getLocationFromIPAPI(),
      () => this.getLocationFromGeoJS()
    ];

    let lastError: Error | null = null;

    for (const provider of providers) {
      try {
        const result = await this.timeoutPromise(provider(), 8000); // Timeout plus long pour l'Afrique
        return result;
      } catch (error) {
        lastError = error as Error;
        console.warn('Provider failed, trying next:', error);
        // Attendre un peu avant le prochain service
        await new Promise(resolve => setTimeout(resolve, 500));
        continue;
      }
    }

    throw lastError || new Error('All providers failed');
  }

  private getLocalStorageCache(): IPLocationResult | null {
    try {
      // ✅ Migrer l'ancien cache vers le nouveau si besoin
      const oldCached = localStorage.getItem('kwenda_ip_location');
      if (oldCached) {
        localStorage.removeItem('kwenda_ip_location');
        console.log('🗑️ Ancien cache kwenda_ip_location supprimé');
      }

      const cached = localStorage.getItem('kwenda_ip_location_cache');
      if (cached) {
        const data = JSON.parse(cached);
        // Cache valide si pas expiré (utilise expiresAt du IPGeolocationCache, ou 10 min)
        const expiry = data.expiresAt || (data.timestamp + 10 * 60 * 1000);
        if (Date.now() < expiry) {
          // Adapter le format : IPGeolocationCache stocke directement, pas dans .location
          if (data.latitude !== undefined) {
            return {
              latitude: data.latitude,
              longitude: data.longitude,
              city: data.city || 'Unknown',
              country: data.country || 'Unknown',
              accuracy: data.accuracy || 10000,
              provider: data.provider || 'cache'
            };
          }
          if (data.location) {
            return data.location;
          }
        }
      }
    } catch (error) {
      console.warn('Failed to read location cache:', error);
    }
    return null;
  }

  private setLocalStorageCache(location: IPLocationResult): void {
    try {
      // ✅ Utiliser le même format que IPGeolocationCache
      localStorage.setItem('kwenda_ip_location_cache', JSON.stringify({
        latitude: location.latitude,
        longitude: location.longitude,
        city: location.city,
        country: location.country,
        accuracy: location.accuracy,
        provider: location.provider,
        timestamp: Date.now(),
        expiresAt: Date.now() + 60 * 60 * 1000 // 1h comme IPGeolocationCache
      }));
    } catch (error) {
      console.warn('Failed to save location cache:', error);
    }
  }

  private timeoutPromise<T>(promise: Promise<T>, timeout: number): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), timeout)
      )
    ]);
  }

  private async getLocationFromIPAPI(): Promise<IPLocationResult> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);
    
    try {
      const response = await fetch('https://ipapi.co/json/', {
        signal: controller.signal,
        headers: {
          'User-Agent': 'kwenda-App/1.0'
        }
      });
      
      if (!response.ok) throw new Error(`IPAPI HTTP ${response.status}`);
      
      const data = await response.json();
      
      if (data.latitude && data.longitude && !data.error) {
        return {
          latitude: data.latitude,
          longitude: data.longitude,
          city: data.city || 'Unknown',
          country: data.country_name || 'Unknown',
          accuracy: 8000, // Amélioré pour l'Afrique
          provider: 'ipapi.co'
        };
      }
      
      throw new Error('Invalid response from ipapi.co');
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private async getLocationFromIPInfo(): Promise<IPLocationResult> {
    // ✅ OPTIMISATION : Utiliser le cache localStorage
    const { IPGeolocationCache } = await import('./IPGeolocationCache');
    
    try {
      const cached = await IPGeolocationCache.getOrFetch();
      return {
        latitude: cached.latitude,
        longitude: cached.longitude,
        city: cached.city,
        country: cached.country,
        accuracy: cached.accuracy,
        provider: cached.provider
      };
    } catch (error) {
      throw new Error('IPInfo failed with cache');
    }
  }

  private async getLocationFromIPStack(): Promise<IPLocationResult> {
    // Note: Nécessite une clé API pour IPStack
    const response = await fetch('http://api.ipstack.com/check?access_key=demo', {
      timeout: 5000
    } as any);
    
    if (!response.ok) throw new Error('IPStack failed');
    
    const data = await response.json();
    
    return {
      latitude: data.latitude,
      longitude: data.longitude,
      city: data.city || 'Unknown',
      country: data.country_name || 'Unknown',
      accuracy: 12000,
      provider: 'ipstack.com'
    };
  }

  private async getLocationFromGeoJS(): Promise<IPLocationResult> {
    try {
      const response = await fetch('https://get.geojs.io/v1/ip/geo.json');
      const data = await response.json();
      
      if (data.latitude && data.longitude) {
        return {
          latitude: parseFloat(data.latitude),
          longitude: parseFloat(data.longitude),
          city: data.city || 'Unknown',
          country: data.country || 'Unknown',
          accuracy: 30000,
          provider: 'geojs'
        };
      }
      throw new Error('Invalid response from GeoJS');
    } catch (error) {
      console.error('GeoJS geolocation failed:', error);
      throw error;
    }
  }

  private getFallbackLocation(): IPLocationResult {
    // Fallback Kinshasa pour RDC
    return {
      latitude: -4.3217,
      longitude: 15.3069,
      city: 'Kinshasa',
      country: 'République Démocratique du Congo',
      accuracy: 50000,
      provider: 'fallback'
    };
  }

  clearCache(): void {
    this.cache = null;
    this.cacheExpiry = 0;
    // Nettoyer tous les caches localStorage
    try {
      localStorage.removeItem('kwenda_ip_location');
      localStorage.removeItem('kwenda_ip_location_cache');
    } catch {}
  }

  getCachedLocation(): IPLocationResult | null {
    if (this.cache && Date.now() < this.cacheExpiry) {
      return this.cache;
    }
    return null;
  }

  // Méthodes pour compatibilité
  static async getLocationFromIP(): Promise<IPLocationResult> {
    return this.getInstance().getCurrentLocation();
  }

  static async detectCountryFromIP(): Promise<string> {
    const location = await this.getInstance().getCurrentLocation();
    return location.country;
  }
}

export const ipGeolocation = IPGeolocationService.getInstance();