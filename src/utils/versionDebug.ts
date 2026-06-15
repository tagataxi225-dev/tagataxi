/**
 * Utilitaires de debug pour le système de versions
 * Expose des fonctions globales pour le développement
 */

import { cacheWiper } from '@/services/CacheWiper';
import { autoUpdateService } from '@/services/AutoUpdateService';
import { logger } from '@/utils/logger';

// Interface pour les utilitaires globaux
interface TembeaDebugTools {
  version: string;
  buildDate: string;
  clearAllCaches: () => Promise<void>;
  checkUpdate: () => Promise<void>;
  forceReload: () => void;
  showCacheInfo: () => Promise<void>;
}

/**
 * Initialise les outils de debug globaux
 */
export function initVersionDebug(): void {
  const tools: TembeaDebugTools = {
    version: (() => {
      try {
        return (globalThis as any).__APP_VERSION__ || '1.0.0';
      } catch {
        return '1.0.0';
      }
    })(),
    buildDate: (() => {
      try {
        return (globalThis as any).__BUILD_DATE__ || new Date().toISOString();
      } catch {
        return new Date().toISOString();
      }
    })(),
    
    /**
     * Force le vidage de tous les caches
     */
    clearAllCaches: async () => {
      logger.info('🧹 Manual cache clear triggered');
      await cacheWiper.wipeAllCaches();
      logger.info('✅ Caches cleared. Reload the page to see changes.');
    },
    
    /**
     * Force la vérification de mise à jour
     */
    checkUpdate: async () => {
      logger.info('🔍 Manual update check triggered');
      await autoUpdateService.checkAndInstallIfNeeded();
    },
    
    /**
     * Force le rechargement de l'application
     */
    forceReload: () => {
      logger.info('🔄 Force reload triggered');
      window.location.reload();
    },
    
    /**
     * Affiche les informations sur les caches
     */
    showCacheInfo: async () => {
      if (!('caches' in window)) {
        logger.warn('Cache API not available');
        return;
      }

      const cacheNames = await caches.keys();
      logger.info('📦 Cache Information:');
      logger.info(`  Total caches: ${cacheNames.length}`);
      
      for (const cacheName of cacheNames) {
        const cache = await caches.open(cacheName);
        const keys = await cache.keys();
        logger.info(`  - ${cacheName}: ${keys.length} items`);
      }

      // IndexedDB info
      if ('indexedDB' in window) {
        const databases = await indexedDB.databases();
        logger.info(`  IndexedDB databases: ${databases.length}`);
        databases.forEach(db => {
          logger.info(`    - ${db.name} (v${db.version})`);
        });
      }

      // localStorage info
      logger.info(`  localStorage: ${Object.keys(localStorage).length} items`);
      logger.info(`  sessionStorage: ${sessionStorage.length} items`);
    }
  };

  // Exposer globalement
  (window as any).kwenda = {
    ...(window as any).kwenda,
    ...tools
  };

  logger.info('🔧 Version debug tools available via window.kwenda');
  logger.info('  - kwenda.version');
  logger.info('  - kwenda.buildDate');
  logger.info('  - kwenda.clearAllCaches()');
  logger.info('  - kwenda.checkUpdate()');
  logger.info('  - kwenda.forceReload()');
  logger.info('  - kwenda.showCacheInfo()');
}
