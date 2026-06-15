// Configuration et initialisation globale des services
import { CountryService } from './countryConfig';
import { IPGeolocationService } from './ipGeolocation';
import { logger } from '@/utils/logger';

export class GlobalInitService {
  private static initialized = false;

  static async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      logger.info('🌍 Initialisation des services globaux...');

      this.initializeCountryDetectionSync();
      this.initialized = true;
      logger.info('✅ Services critiques initialisés');

      this.preloadIPLocationBackground();

    } catch (error) {
      logger.error('❌ Erreur initialisation services:', error);
      this.initialized = true;
    }
  }

  private static initializeCountryDetectionSync(): void {
    const cachedCountry = localStorage.getItem('kwenda_country');
    if (cachedCountry) {
      CountryService.setCurrentCountry(cachedCountry as 'CD' | 'CI');
      logger.debug(`📍 Pays chargé depuis cache: ${cachedCountry}`);
    } else {
      CountryService.setCurrentCountry('CD');
    }

    this.detectCountryBackground();
  }

  private static detectCountryBackground(): void {
    if (typeof window === 'undefined') return;

    const callback = async () => {
      try {
        const country = await IPGeolocationService.detectCountryFromIP();
        
        if (country) {
          let countryCode: 'CD' | 'CI' = 'CD';
          if (country.includes('Congo') || country.includes('RDC')) {
            countryCode = 'CD';
          } else if (country.includes('Ivoire') || country.includes('Côte')) {
            countryCode = 'CI';
          }
          
          CountryService.setCurrentCountry(countryCode);
          localStorage.setItem('kwenda_country', countryCode);
          logger.debug(`🌍 Pays détecté: ${countryCode}`);
        }
      } catch (error) {
        logger.warn('Détection pays en arrière-plan échouée:', error);
      }
    };

    if ('requestIdleCallback' in window) {
      requestIdleCallback(callback, { timeout: 5000 });
    } else {
      setTimeout(callback, 2000);
    }
  }

  private static preloadIPLocationBackground(): void {
    if (typeof window === 'undefined') return;

    // ✅ Migrer l'ancien cache vers le nouveau
    try {
      const oldCache = localStorage.getItem('kwenda_ip_location');
      if (oldCache) {
        localStorage.removeItem('kwenda_ip_location');
        logger.debug('🗑️ Ancien cache kwenda_ip_location supprimé');
      }
    } catch {}

    const CACHE_KEY = 'kwenda_ip_location_cache';
    const CACHE_DURATION = 60 * 60 * 1000;

    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      try {
        const data = JSON.parse(cached);
        const expiry = data.expiresAt || (data.timestamp + CACHE_DURATION);
        if (Date.now() < expiry) {
          logger.debug('📍 IP location chargée depuis cache');
          return;
        }
      } catch (e) {
        // Cache invalide
      }
    }

    const callback = async () => {
      try {
        const location = await IPGeolocationService.getLocationFromIP();
        if (location) {
          // IPGeolocationService.setLocalStorageCache écrit déjà dans kwenda_ip_location_cache
          logger.debug('📍 IP location mise en cache');
        }
      } catch (error) {
        logger.warn('Préchargement IP location échoué:', error);
      }
    };

    if ('requestIdleCallback' in window) {
      requestIdleCallback(callback, { timeout: 10000 });
    } else {
      setTimeout(callback, 5000);
    }
  }

  static async updateLocationContext(latitude: number, longitude: number): Promise<void> {
    try {
      CountryService.autoDetectAndSetCountry(latitude, longitude);
    } catch (error) {
      logger.warn('Failed to update location context:', error);
    }
  }

  static isInitialized(): boolean {
    return this.initialized;
  }
}

// Auto-initialisation
if (typeof window !== 'undefined') {
  GlobalInitService.initialize();
}
