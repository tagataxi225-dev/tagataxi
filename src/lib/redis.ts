/**
 * REDIS CACHE LAYER - avec cache mémoire L0
 * Map en mémoire devant localStorage pour éviter les lectures synchrones
 */

export interface CacheStrategy {
  ttl: number;
  prefix: string;
}

export const cacheStrategies = {
  POPULAR_PRODUCTS: { ttl: 300, prefix: 'products:popular' } as CacheStrategy,
  PRODUCT_DETAILS: { ttl: 600, prefix: 'product' } as CacheStrategy,
  AVAILABLE_DRIVERS: { ttl: 30, prefix: 'drivers:available' } as CacheStrategy,
  DYNAMIC_PRICING: { ttl: 120, prefix: 'pricing' } as CacheStrategy,
  ACTIVE_PROMOS: { ttl: 600, prefix: 'promos:active' } as CacheStrategy,
  VENDOR_STATS: { ttl: 300, prefix: 'vendor:stats' } as CacheStrategy,
  SERVICE_ZONES: { ttl: 1800, prefix: 'zones' } as CacheStrategy,
  SERVICE_CONFIG: { ttl: 300, prefix: 'service:config' } as CacheStrategy,
  USER_PROFILE: { ttl: 600, prefix: 'user:profile' } as CacheStrategy,
  DASHBOARD_STATS: { ttl: 120, prefix: 'stats:dashboard' } as CacheStrategy
};

interface CacheEntry<T = any> {
  data: T;
  expiresAt: number | null;
}

const MAX_MEMORY_ENTRIES = 100;

export class RedisClient {
  private prefix = 'kwenda:cache:';
  private memoryCache = new Map<string, CacheEntry>();
  private metrics = { hits: 0, misses: 0, sets: 0 };

  private evictIfNeeded() {
    if (this.memoryCache.size >= MAX_MEMORY_ENTRIES) {
      // Supprimer la plus ancienne entrée (première insérée)
      const firstKey = this.memoryCache.keys().next().value;
      if (firstKey) this.memoryCache.delete(firstKey);
    }
  }

  async get<T>(key: string): Promise<T | null> {
    const fullKey = `${this.prefix}${key}`;
    
    // L0: Check memory cache first
    const memEntry = this.memoryCache.get(fullKey);
    if (memEntry) {
      if (memEntry.expiresAt && Date.now() > memEntry.expiresAt) {
        this.memoryCache.delete(fullKey);
        try { localStorage.removeItem(fullKey); } catch {}
        this.metrics.misses++;
        return null;
      }
      this.metrics.hits++;
      return memEntry.data as T;
    }

    // L1: Fall back to localStorage
    try {
      const value = localStorage.getItem(fullKey);
      if (!value) { this.metrics.misses++; return null; }

      const cached: CacheEntry = JSON.parse(value);
      if (cached.expiresAt && Date.now() > cached.expiresAt) {
        localStorage.removeItem(fullKey);
        this.metrics.misses++;
        return null;
      }

      // Promote to memory cache
      this.evictIfNeeded();
      this.memoryCache.set(fullKey, cached);
      this.metrics.hits++;
      return cached.data as T;
    } catch {
      this.metrics.misses++;
      return null;
    }
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    const fullKey = `${this.prefix}${key}`;
    const entry: CacheEntry = {
      data: value,
      expiresAt: ttl ? Date.now() + (ttl * 1000) : null
    };

    // Write to both L0 and L1
    this.evictIfNeeded();
    this.memoryCache.set(fullKey, entry);
    try { localStorage.setItem(fullKey, JSON.stringify(entry)); } catch {}
    this.metrics.sets++;
  }

  async del(key: string): Promise<void> {
    const fullKey = `${this.prefix}${key}`;
    this.memoryCache.delete(fullKey);
    try { localStorage.removeItem(fullKey); } catch {}
  }

  async invalidatePattern(pattern: string): Promise<void> {
    // Clear from memory
    for (const k of this.memoryCache.keys()) {
      if (k.startsWith(`${this.prefix}${pattern}`)) this.memoryCache.delete(k);
    }
    // Clear from localStorage
    try {
      const keys = Object.keys(localStorage);
      keys.filter(k => k.startsWith(`${this.prefix}${pattern}`))
        .forEach(k => localStorage.removeItem(k));
    } catch {}
  }

  getMetrics() {
    const total = this.metrics.hits + this.metrics.misses;
    return { ...this.metrics, hitRate: total > 0 ? (this.metrics.hits / total) * 100 : 0 };
  }

  clearMetrics() { this.metrics = { hits: 0, misses: 0, sets: 0 }; }
}

export const redis = new RedisClient();

export const cacheKey = {
  product: (id: string) => `product:${id}`,
  products: (filters: any) => `products:${JSON.stringify(filters)}`,
  driver: (id: string, city: string) => `driver:${city}:${id}`,
  drivers: (city: string, available: boolean) => `drivers:${city}:${available}`,
  pricing: (city: string, vehicleClass: string) => `pricing:${city}:${vehicleClass}`,
  promo: (code: string) => `promo:${code}`,
  vendor: (id: string) => `vendor:${id}`,
  zone: (id: string) => `zone:${id}`,
  userProfile: (userId: string) => `user:${userId}`,
  serviceConfig: (service: string) => `service:${service}`
};
