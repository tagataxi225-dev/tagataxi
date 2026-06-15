/**
 * 🧹 MEMORY UTILITIES - Utilitaires de nettoyage mémoire
 * Extensions pour performanceUtils.ts
 */

/**
 * Vider les caches d'images
 */
export function clearImageCache() {
  try {
    const images = document.querySelectorAll('img[src]');
    let cleared = 0;
    
    images.forEach((img: any) => {
      if (img.src && img.src.startsWith('data:')) {
        if (!img.dataset.critical) {
          img.src = '/placeholder.svg';
          cleared++;
        }
      }
    });
    
    console.log(`🖼️ ${cleared} images nettoyées`);
    return cleared;
  } catch (error) {
    console.error('Erreur clearImageCache:', error);
    return 0;
  }
}

/**
 * Nettoyer les iframes cachées
 */
export function clearHiddenIframes() {
  try {
    const iframes = document.querySelectorAll('iframe');
    let removed = 0;
    
    iframes.forEach(iframe => {
      if (!iframe.offsetParent) {
        iframe.remove();
        removed++;
      }
    });
    
    console.log(`🗑️ ${removed} iframes cachées supprimées`);
    return removed;
  } catch (error) {
    console.error('Erreur clearHiddenIframes:', error);
    return 0;
  }
}

/**
 * Activer virtualisation agressive pour les grandes listes
 */
export function enableAggressiveVirtualization() {
  try {
    // Émettre événement pour que les composants réagissent
    window.dispatchEvent(new CustomEvent('enable-virtualization', {
      detail: { mode: 'aggressive' }
    }));
    console.log('📊 Virtualisation agressive activée');
  } catch (error) {
    console.error('Erreur enableAggressiveVirtualization:', error);
  }
}

/**
 * Unmount des composants hors écran
 */
export function unmountOffscreenComponents() {
  try {
    window.dispatchEvent(new CustomEvent('unmount-offscreen'));
    console.log('🗂️ Unmount composants hors écran');
  } catch (error) {
    console.error('Erreur unmountOffscreenComponents:', error);
  }
}

/**
 * Obtenir l'usage mémoire actuel
 */
export function getMemoryUsage(): { used: number; total: number; percentage: number } | null {
  if ('memory' in performance && (performance as any).memory) {
    const mem = (performance as any).memory;
    const used = mem.usedJSHeapSize / 1048576; // MB
    const total = mem.jsHeapSizeLimit / 1048576; // MB
    const percentage = (used / total) * 100;
    
    return { used, total, percentage };
  }
  return null;
}

/**
 * Forcer garbage collection (si disponible)
 */
export function forceGarbageCollection(): boolean {
  if ('gc' in window && typeof (window as any).gc === 'function') {
    try {
      (window as any).gc();
      console.log('♻️ Garbage collection forcé');
      return true;
    } catch (error) {
      console.warn('GC non disponible:', error);
      return false;
    }
  }
  return false;
}
