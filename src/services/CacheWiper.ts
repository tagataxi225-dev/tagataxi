/**
 * Service de vidage complet du cache
 * Nettoie tous les caches pour forcer une mise à jour propre
 */

import { logger } from '@/utils/logger';

class CacheWiper {
  /**
   * Vide TOUS les caches de l'application
   * - Service Worker caches
   * - localStorage (sauf auth)
   * - sessionStorage
   * - IndexedDB
   */
  async wipeAllCaches(): Promise<void> {
    logger.info('🗑️ Starting complete cache wipe...');
    
    try {
      // 1. Service Worker caches
      await this.clearServiceWorkerCaches();
      
      // 2. localStorage (préserver auth)
      this.clearLocalStorage();
      
      // 3. sessionStorage (tout vider)
      this.clearSessionStorage();
      
      // 4. IndexedDB
      await this.clearIndexedDB();
      
      logger.info('✅ All caches cleared successfully');
    } catch (error) {
      logger.error('❌ Cache wipe failed', error);
      throw error;
    }
  }

  /**
   * Vide tous les caches du Service Worker
   */
  private async clearServiceWorkerCaches(): Promise<void> {
    if (!('caches' in window)) {
      logger.warn('Cache API not available');
      return;
    }

    try {
      const cacheNames = await caches.keys();
      logger.info(`🗑️ Deleting ${cacheNames.length} Service Worker caches`);
      
      await Promise.all(
        cacheNames.map(cacheName => {
          logger.info(`  Deleting cache: ${cacheName}`);
          return caches.delete(cacheName);
        })
      );
      
      logger.info('✅ Service Worker caches cleared');
    } catch (error) {
      logger.error('Failed to clear Service Worker caches', error);
    }
  }

  /**
   * Vide localStorage sauf les tokens d'authentification
   */
  private clearLocalStorage(): void {
    try {
      const authKeys = [
        'supabase.auth.token',
        'sb-',
        'kwenda_user_session',
        'kwenda_auth_token',
        'app_version',           // Préserver la version pour éviter boucles
        'app_version_last_check', // Préserver timestamp
        'app_version_attempted'  // Préserver tentatives
      ];

      // ✅ Nettoyer les flags temporaires d'onboarding
      const temporaryFlags = ['onboarding_just_completed'];
      temporaryFlags.forEach(flag => {
        if (localStorage.getItem(flag)) {
          localStorage.removeItem(flag);
          logger.info(`🗑️ Temporary flag removed: ${flag}`);
        }
      });

      const allKeys = Object.keys(localStorage);
      let clearedCount = 0;

      allKeys.forEach(key => {
        // Préserver les clés d'authentification et de version
        const isAuthKey = authKeys.some(authKey => key.includes(authKey));
        
        if (!isAuthKey) {
          localStorage.removeItem(key);
          clearedCount++;
        }
      });

      logger.info(`✅ localStorage cleared (${clearedCount} items, auth & version preserved)`);
    } catch (error) {
      logger.error('Failed to clear localStorage', error);
    }
  }

  /**
   * Vide complètement sessionStorage
   */
  private clearSessionStorage(): void {
    try {
      const count = sessionStorage.length;
      sessionStorage.clear();
      logger.info(`✅ sessionStorage cleared (${count} items)`);
    } catch (error) {
      logger.error('Failed to clear sessionStorage', error);
    }
  }

  /**
   * Supprime toutes les bases IndexedDB
   */
  private async clearIndexedDB(): Promise<void> {
    if (!('indexedDB' in window)) {
      logger.warn('IndexedDB not available');
      return;
    }

    try {
      const databases = await indexedDB.databases();
      logger.info(`🗑️ Deleting ${databases.length} IndexedDB databases`);

      await Promise.all(
        databases.map(db => {
          if (db.name) {
            logger.info(`  Deleting database: ${db.name}`);
            return new Promise<void>((resolve, reject) => {
              const request = indexedDB.deleteDatabase(db.name!);
              request.onsuccess = () => resolve();
              request.onerror = () => reject(request.error);
              request.onblocked = () => {
                logger.warn(`Database ${db.name} is blocked`);
                resolve(); // Continue anyway
              };
            });
          }
          return Promise.resolve();
        })
      );

      logger.info('✅ IndexedDB cleared');
    } catch (error) {
      logger.error('Failed to clear IndexedDB', error);
    }
  }

  /**
   * Nettoie uniquement les caches obsolètes (version ancienne)
   */
  async cleanupOutdatedCaches(currentVersion: string): Promise<void> {
    if (!('caches' in window)) return;

    try {
      const cacheNames = await caches.keys();
      const outdatedCaches = cacheNames.filter(
        name => !name.includes(currentVersion)
      );

      if (outdatedCaches.length > 0) {
        logger.info(`🗑️ Cleaning ${outdatedCaches.length} outdated caches`);
        await Promise.all(
          outdatedCaches.map(name => caches.delete(name))
        );
      }
    } catch (error) {
      logger.error('Failed to cleanup outdated caches', error);
    }
  }
}

export const cacheWiper = new CacheWiper();
