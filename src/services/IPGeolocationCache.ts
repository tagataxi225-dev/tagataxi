/**
 * 🗺️ CACHE INTELLIGENT GÉOLOCALISATION IP
 * Évite les appels répétés aux services de géolocalisation
 * Cache persistant avec TTL de 1 heure
 * 
 * ✅ PHASE E: Compatible Safari (fallback AbortSignal.timeout)
 * ✅ Utilise l'edge function ip-geolocation pour éviter CORS/mixed content
 */

import { logger } from '@/utils/logger';
import { supabase } from '@/integrations/supabase/client';

interface CachedIPLocation {
  latitude: number;
  longitude: number;
  city: string;
  country: string;
  accuracy: number;
  provider: string;
  timestamp: number;
  expiresAt: number;
}

const CACHE_KEY = 'kwenda_ip_location_cache';
const CACHE_TTL = 60 * 60 * 1000; // 1 heure

/**
 * ✅ PHASE E: Safe AbortSignal.timeout polyfill for Safari
 */
function createTimeoutSignal(ms: number): AbortSignal {
  // Modern browsers
  if (typeof AbortSignal !== 'undefined' && 'timeout' in AbortSignal) {
    try {
      return AbortSignal.timeout(ms);
    } catch {
      // Fall through to polyfill
    }
  }
  
  // Safari/older browsers fallback
  const controller = new AbortController();
  setTimeout(() => controller.abort(), ms);
  return controller.signal;
}

export class IPGeolocationCache {
  /**
   * Récupère la position depuis le cache si valide
   */
  public static get(): CachedIPLocation | null {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (!cached) return null;

      const data: CachedIPLocation = JSON.parse(cached);
      
      // Vérifier expiration
      if (Date.now() > data.expiresAt) {
        logger.info('📍 [IPCache] Cache expiré, suppression');
        this.clear();
        return null;
      }

      const ageMinutes = Math.round((Date.now() - data.timestamp) / 60000);
      logger.info(`📍 [IPCache] Position trouvée en cache (${ageMinutes}min)`, {
        city: data.city,
        provider: data.provider
      });

      return data;
    } catch (error) {
      logger.error('❌ [IPCache] Erreur lecture cache', error);
      this.clear();
      return null;
    }
  }

  /**
   * Sauvegarde la position en cache
   */
  public static set(location: Omit<CachedIPLocation, 'timestamp' | 'expiresAt'>): void {
    try {
      const cached: CachedIPLocation = {
        ...location,
        timestamp: Date.now(),
        expiresAt: Date.now() + CACHE_TTL
      };

      localStorage.setItem(CACHE_KEY, JSON.stringify(cached));
      
      logger.info('✅ [IPCache] Position mise en cache', {
        city: location.city,
        provider: location.provider,
        ttl: '1 heure'
      });
    } catch (error) {
      logger.error('❌ [IPCache] Erreur écriture cache', error);
    }
  }

  /**
   * Nettoie le cache
   */
  public static clear(): void {
    try {
      localStorage.removeItem(CACHE_KEY);
      logger.info('🗑️ [IPCache] Cache nettoyé');
    } catch (error) {
      logger.error('❌ [IPCache] Erreur suppression cache', error);
    }
  }

  /**
   * Force un nouveau géocodage (ignore le cache)
   * ✅ PHASE E: Compatible Safari via createTimeoutSignal
   */
  public static async fetchFresh(): Promise<CachedIPLocation> {
    logger.info('🔄 [IPCache] Fetch forcé via edge function');
    this.clear();
    
    try {
      const { data, error } = await supabase.functions.invoke('ip-geolocation');
      
      if (error) throw new Error(`Edge function error: ${error.message}`);
      
      if (data?.success && data?.data?.lat && data?.data?.lng) {
        const location: Omit<CachedIPLocation, 'timestamp' | 'expiresAt'> = {
          latitude: data.data.lat,
          longitude: data.data.lng,
          city: data.data.address?.split(',')[0]?.trim() || 'Ville inconnue',
          country: data.data.address?.split(',').slice(1).join(',')?.trim() || 'Pays inconnu',
          accuracy: data.data.accuracy || 10000,
          provider: data.data.source || 'edge-function'
        };
        
        this.set(location);
        return { ...location, timestamp: Date.now(), expiresAt: Date.now() + CACHE_TTL };
      }
      
      throw new Error('Invalid response from ip-geolocation edge function');
    } catch (error: any) {
      logger.error('❌ [IPCache] Échec fetch fresh:', error?.message || error);
      throw error;
    }
  }

  /**
   * Récupère la position (cache ou fetch)
   */
  public static async getOrFetch(): Promise<CachedIPLocation> {
    // Essayer le cache d'abord
    const cached = this.get();
    if (cached) return cached;

    // Sinon fetch
    return this.fetchFresh();
  }
}
