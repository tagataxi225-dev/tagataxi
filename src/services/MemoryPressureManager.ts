/**
 * 🧹 MEMORY PRESSURE MANAGER - LAYER 2: GESTION PROACTIVE DE LA MÉMOIRE
 * Nettoie automatiquement la mémoire avant saturation
 * Optimisé : polling 120s, désactivé si performance.memory non supporté
 */

import { clearRouteCache } from '@/utils/performanceUtils';

export class MemoryPressureManager {
  private cleanupInterval: NodeJS.Timeout | null = null;
  private lastCleanup = 0;
  private cleanupThreshold = 80;
  private criticalThreshold = 90;
  private supported = false;

  constructor() {
    // Ne démarrer que si performance.memory est supporté
    this.supported = 'memory' in performance && !!(performance as any).memory;
    if (this.supported) {
      this.startMonitoring();
    }
  }

  private startMonitoring() {
    // Polling toutes les 120s (au lieu de 30s) — suffisant pour détecter les fuites
    this.cleanupInterval = setInterval(() => {
      this.checkMemoryPressure();
    }, 120000);
  }

  private async checkMemoryPressure() {
    const usage = this.getMemoryUsage();
    if (usage === null) return;

    if (usage > this.criticalThreshold) {
      console.warn('🚨 [MemoryPressureManager] CRITIQUE:', usage.toFixed(1) + '%');
      await this.performAggressiveCleanup();
    } else if (usage > this.cleanupThreshold) {
      console.warn('⚠️ [MemoryPressureManager] Pression mémoire:', usage.toFixed(1) + '%');
      await this.performStandardCleanup();
    }
  }

  public getMemoryUsage(): number | null {
    if (!this.supported) return null;
    const mem = (performance as any).memory;
    return (mem.usedJSHeapSize / mem.jsHeapSizeLimit) * 100;
  }

  private async performStandardCleanup() {
    const now = Date.now();
    if (now - this.lastCleanup < 120000) return;
    
    clearRouteCache();
    this.cleanTemporaryStorage();
    this.lastCleanup = now;
  }

  private async performAggressiveCleanup() {
    await this.performStandardCleanup();
    
    if ('gc' in window && typeof (window as any).gc === 'function') {
      try { (window as any).gc(); } catch {}
    }
    
    window.dispatchEvent(new CustomEvent('memory-pressure', {
      detail: { level: 'high', action: 'cleanup' }
    }));
  }

  private cleanTemporaryStorage() {
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('temp_') || key.startsWith('cache_') || key.includes('_old_') || key.includes('_backup_'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => { try { localStorage.removeItem(key); } catch {} });
    } catch {}
  }

  public forceCleanup() {
    return this.performAggressiveCleanup();
  }

  public cleanup() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
}

export const memoryPressureManager = new MemoryPressureManager();
