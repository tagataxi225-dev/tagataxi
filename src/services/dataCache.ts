import { logger } from '@/utils/logger';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  userId: string;
}

export class DataCache {
  private readonly TTL = 3600000; // 1 heure

  set<T>(key: string, data: T, userId: string): void {
    try {
      const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        userId
      };
      localStorage.setItem(`kwenda_cache_${key}`, JSON.stringify(entry));
      logger.debug(`💾 [DataCache] Données sauvegardées: ${key}`);
    } catch (error) {
      logger.error('Erreur sauvegarde cache:', error);
    }
  }

  get<T>(key: string, userId: string): T | null {
    try {
      const cached = localStorage.getItem(`kwenda_cache_${key}`);
      if (!cached) return null;

      const entry: CacheEntry<T> = JSON.parse(cached);
      
      // Vérifier validité (bon userId + pas expiré)
      if (entry.userId !== userId) {
        logger.debug(`🗑️ [DataCache] Cache invalide (mauvais userId): ${key}`);
        localStorage.removeItem(`kwenda_cache_${key}`);
        return null;
      }

      const age = Date.now() - entry.timestamp;
      if (age > this.TTL) {
        logger.debug(`⏰ [DataCache] Cache expiré: ${key}`);
        localStorage.removeItem(`kwenda_cache_${key}`);
        return null;
      }

      logger.debug(`✅ [DataCache] Cache HIT: ${key}`);
      return entry.data;
    } catch (error) {
      logger.error('Erreur lecture cache:', error);
      return null;
    }
  }

  clear(key: string): void {
    localStorage.removeItem(`kwenda_cache_${key}`);
  }

  clearAll(): void {
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('kwenda_cache_')) {
        localStorage.removeItem(key);
      }
    });
  }
}

export const dataCache = new DataCache();
