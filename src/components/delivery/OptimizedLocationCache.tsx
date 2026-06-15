/**
 * Cache ultra-performant pour les recherches de géolocalisation
 * Évite les appels répétés et améliore la réactivité
 */

import { useCallback, useRef } from 'react';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiry: number;
}

export class LocationCache {
  private cache = new Map<string, CacheEntry<any>>();
  private readonly DEFAULT_TTL = 10 * 60 * 1000; // 10 minutes

  set<T>(key: string, data: T, ttl?: number): void {
    const expiry = Date.now() + (ttl || this.DEFAULT_TTL);
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiry
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  clear(): void {
    this.cache.clear();
  }

  clearExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiry) {
        this.cache.delete(key);
      }
    }
  }

  size(): number {
    this.clearExpired();
    return this.cache.size;
  }
}

export class DebounceManager {
  private timers = new Map<string, NodeJS.Timeout>();

  debounce<T extends (...args: any[]) => any>(
    key: string,
    func: T,
    delay: number
  ): (...args: Parameters<T>) => Promise<ReturnType<T>> {
    return (...args: Parameters<T>): Promise<ReturnType<T>> => {
      return new Promise((resolve, reject) => {
        // Clear existing timer
        if (this.timers.has(key)) {
          clearTimeout(this.timers.get(key)!);
        }

        // Set new timer
        const timer = setTimeout(async () => {
          try {
            const result = await func(...args);
            resolve(result);
          } catch (error) {
            reject(error);
          } finally {
            this.timers.delete(key);
          }
        }, delay);

        this.timers.set(key, timer);
      });
    };
  }

  cancel(key: string): void {
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key)!);
      this.timers.delete(key);
    }
  }

  cancelAll(): void {
    for (const timer of this.timers.values()) {
      clearTimeout(timer);
    }
    this.timers.clear();
  }
}

export const useOptimizedLocationCache = () => {
  const cacheRef = useRef(new LocationCache());
  const debounceRef = useRef(new DebounceManager());

  const cache = useCallback(() => cacheRef.current, []);
  const debounce = useCallback(() => debounceRef.current, []);

  const clearCache = useCallback(() => {
    cacheRef.current.clear();
  }, []);

  const clearDebounce = useCallback(() => {
    debounceRef.current.cancelAll();
  }, []);

  return {
    cache: cache(),
    debounce: debounce(),
    clearCache,
    clearDebounce
  };
};