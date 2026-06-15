/**
 * 🚀 UTILITAIRES DE PERFORMANCE
 * Throttling, debouncing, et mesures de performance
 */

// Cache globale pour les routes
interface RouteCache {
  [key: string]: {
    data: any;
    timestamp: number;
  };
}

const routeCache: RouteCache = {};
const CACHE_DURATION = 600000; // 10 minutes

/**
 * Throttle - Limite l'exécution d'une fonction
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  let lastResult: ReturnType<T>;

  return function(this: any, ...args: Parameters<T>): void {
    if (!inThrottle) {
      lastResult = func.apply(this, args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

/**
 * Debounce - Retarde l'exécution d'une fonction
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  immediate = false
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null;

  return function(this: any, ...args: Parameters<T>): void {
    const context = this;
    const later = () => {
      timeout = null;
      if (!immediate) func.apply(context, args);
    };

    const callNow = immediate && !timeout;
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);

    if (callNow) func.apply(context, args);
  };
}

/**
 * Cache de route avec clé basée sur les coordonnées
 */
export function getCachedRoute(
  pickup: { lat: number; lng: number },
  destination: { lat: number; lng: number }
): any | null {
  const key = generateRouteKey(pickup, destination);
  const cached = routeCache[key];

  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.log('📦 Route récupérée du cache');
    return cached.data;
  }

  return null;
}

/**
 * Sauvegarder une route dans le cache
 */
export function cacheRoute(
  pickup: { lat: number; lng: number },
  destination: { lat: number; lng: number },
  data: any
): void {
  const key = generateRouteKey(pickup, destination);
  routeCache[key] = {
    data,
    timestamp: Date.now()
  };
  
  // Nettoyer le cache périodiquement
  cleanExpiredCache();
}

/**
 * Générer une clé unique pour une route
 */
function generateRouteKey(
  pickup: { lat: number; lng: number },
  destination: { lat: number; lng: number }
): string {
  // Arrondir à 4 décimales pour regrouper les requêtes similaires
  const p = `${pickup.lat.toFixed(4)},${pickup.lng.toFixed(4)}`;
  const d = `${destination.lat.toFixed(4)},${destination.lng.toFixed(4)}`;
  return `${p}->${d}`;
}

/**
 * Nettoyer les entrées expirées du cache
 */
function cleanExpiredCache(): void {
  const now = Date.now();
  Object.keys(routeCache).forEach(key => {
    if (now - routeCache[key].timestamp > CACHE_DURATION) {
      delete routeCache[key];
    }
  });
}

/**
 * Vider tout le cache
 */
export function clearRouteCache(): void {
  Object.keys(routeCache).forEach(key => delete routeCache[key]);
  console.log('🗑️ Cache de routes vidé');
}

/**
 * Mesurer les performances d'une opération
 */
export async function measurePerformance<T>(
  name: string,
  operation: () => Promise<T>
): Promise<T> {
  const start = performance.now();
  
  try {
    const result = await operation();
    const duration = performance.now() - start;
    
    console.log(`⚡ ${name}: ${duration.toFixed(2)}ms`);
    
    // Alert si trop lent
    if (duration > 1000) {
      console.warn(`⚠️ ${name} est lent (${duration.toFixed(2)}ms)`);
    }
    
    return result;
  } catch (error) {
    const duration = performance.now() - start;
    console.error(`❌ ${name} a échoué après ${duration.toFixed(2)}ms`, error);
    throw error;
  }
}

/**
 * Lazy loading avec Intersection Observer
 */
export function createLazyLoader(
  callback: (element: Element) => void,
  options?: IntersectionObserverInit
): IntersectionObserver {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        callback(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, {
    rootMargin: '50px',
    threshold: 0.1,
    ...options
  });

  return observer;
}

/**
 * Optimiser les coordonnées pour réduire la précision excessive
 */
export function optimizeCoordinates(
  lat: number,
  lng: number,
  precision: number = 6
): { lat: number; lng: number } {
  return {
    lat: parseFloat(lat.toFixed(precision)),
    lng: parseFloat(lng.toFixed(precision))
  };
}

/**
 * Batch processing pour éviter de bloquer le thread principal
 */
export async function processBatch<T, R>(
  items: T[],
  processor: (item: T) => R,
  batchSize: number = 10
): Promise<R[]> {
  const results: R[] = [];
  
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = batch.map(processor);
    results.push(...batchResults);
    
    // Donner du temps au navigateur entre les batches
    if (i + batchSize < items.length) {
      await new Promise(resolve => setTimeout(resolve, 0));
    }
  }
  
  return results;
}

/**
 * Monitor de performance pour diagnostics
 */
export class PerformanceMonitor {
  private metrics: Map<string, number[]> = new Map();
  
  record(name: string, duration: number): void {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    this.metrics.get(name)!.push(duration);
  }
  
  getStats(name: string): { avg: number; min: number; max: number; count: number } | null {
    const durations = this.metrics.get(name);
    if (!durations || durations.length === 0) return null;
    
    return {
      avg: durations.reduce((a, b) => a + b, 0) / durations.length,
      min: Math.min(...durations),
      max: Math.max(...durations),
      count: durations.length
    };
  }
  
  getAllStats(): Record<string, any> {
    const stats: Record<string, any> = {};
    this.metrics.forEach((_, name) => {
      stats[name] = this.getStats(name);
    });
    return stats;
  }
  
  reset(): void {
    this.metrics.clear();
  }
}

// Instance globale du monitor
export const performanceMonitor = new PerformanceMonitor();
