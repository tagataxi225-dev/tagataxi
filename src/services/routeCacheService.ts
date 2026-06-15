/**
 * 🚀 ROUTE CACHE SERVICE - Phase 2
 * Cache intelligent des routes calculées avec TTL de 5 minutes
 * Arrondi des coordonnées pour maximiser les cache hits
 */
import { logger } from '@/utils/logger';

interface CachedRoute {
  route: any;
  timestamp: number;
}

export class RouteCacheService {
  private cache = new Map<string, CachedRoute>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly COORDINATE_PRECISION = 3; // Arrondi à ~100m

  private getCacheKey(
    pickup: { lat: number; lng: number },
    dest: { lat: number; lng: number }
  ): string {
    const pLat = Math.round(pickup.lat * 1000) / 1000;
    const pLng = Math.round(pickup.lng * 1000) / 1000;
    const dLat = Math.round(dest.lat * 1000) / 1000;
    const dLng = Math.round(dest.lng * 1000) / 1000;
    return `${pLat},${pLng}-${dLat},${dLng}`;
  }

  async getOrCalculate(
    pickup: { lat: number; lng: number },
    dest: { lat: number; lng: number },
    calculator: () => Promise<any>
  ): Promise<any> {
    const key = this.getCacheKey(pickup, dest);
    const cached = this.cache.get(key);
    
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      logger.debug('✅ [RouteCache] Cache hit:', key);
      return cached.route;
    }
    
    logger.debug('🔄 [RouteCache] Cache miss, calculating route:', key);
    const route = await calculator();
    
    this.cache.set(key, {
      route,
      timestamp: Date.now()
    });
    
    this.cleanup();
    return route;
  }

  private cleanup() {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > this.CACHE_TTL) {
        this.cache.delete(key);
      }
    }
  }

  clear() {
    this.cache.clear();
    logger.debug('🗑️ [RouteCache] Cache cleared');
  }

  getStats() {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys())
    };
  }
}

// Instance singleton
export const routeCache = new RouteCacheService();
