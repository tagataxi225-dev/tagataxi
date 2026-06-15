/**
 * PreloadManager - Gestionnaire de préchargement des ressources critiques
 * Optimise le chargement initial en priorisant les ressources essentielles
 */

type PreloadResource = {
  href: string;
  as: 'font' | 'image' | 'style' | 'script';
  type?: string;
  crossOrigin?: 'anonymous' | 'use-credentials';
};

export class PreloadManager {
  private static preloadedResources = new Set<string>();
  private static observer: PerformanceObserver | null = null;

  /**
   * Précharge les ressources critiques avec priorité
   */
  static preloadCriticalResources(): void {
    const criticalResources: PreloadResource[] = [
      // Polices critiques
      {
        href: 'https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700&display=swap',
        as: 'style',
      },
      // Logo splash
      {
        href: '/kwenda-splash-logo.png',
        as: 'image',
        type: 'image/png',
      },
    ];

    criticalResources.forEach(resource => {
      this.preloadResource(resource);
    });
  }

  /**
   * Précharge une ressource individuelle
   */
  private static preloadResource(resource: PreloadResource): void {
    if (this.preloadedResources.has(resource.href)) return;

    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = resource.href;
    link.as = resource.as;
    
    if (resource.type) link.type = resource.type;
    if (resource.crossOrigin) link.crossOrigin = resource.crossOrigin;

    document.head.appendChild(link);
    this.preloadedResources.add(resource.href);
  }

  /**
   * Vérifie si les polices sont chargées
   */
  static async areFontsLoaded(): Promise<boolean> {
    if (!document.fonts) return true;

    try {
      await document.fonts.ready;
      return true;
    } catch {
      return true; // Fallback si erreur
    }
  }

  /**
   * Vérifie si le DOM est prêt
   */
  static isDOMReady(): boolean {
    return document.readyState === 'complete' || document.readyState === 'interactive';
  }

  /**
   * Attend que toutes les ressources critiques soient prêtes
   */
  static async waitForCriticalResources(): Promise<void> {
    const promises: Promise<any>[] = [];

    // Attendre les polices
    promises.push(this.areFontsLoaded());

    // Attendre le DOM
    if (!this.isDOMReady()) {
      promises.push(
        new Promise(resolve => {
          if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', resolve, { once: true });
          } else {
            resolve(true);
          }
        })
      );
    }

    await Promise.all(promises);
  }

  /**
   * Initialise le monitoring des performances
   */
  static initPerformanceMonitoring(): void {
    if (!window.PerformanceObserver) return;

    try {
      this.observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'resource') {
            const resourceEntry = entry as PerformanceResourceTiming;
            
            // Logger les ressources lentes (>2s)
            if (resourceEntry.duration > 2000) {
              console.warn(`⚠️ Ressource lente: ${resourceEntry.name} (${Math.round(resourceEntry.duration)}ms)`);
            }
          }
        }
      });

      this.observer.observe({ entryTypes: ['resource', 'navigation'] });
    } catch (error) {
      console.warn('Performance monitoring non disponible:', error);
    }
  }

  /**
   * Nettoie les ressources
   */
  static cleanup(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }

  /**
   * Obtient les métriques de performance
   */
  static getPerformanceMetrics(): {
    fcp?: number;
    lcp?: number;
    ttfb?: number;
  } {
    const metrics: any = {};

    try {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navigation) {
        metrics.ttfb = navigation.responseStart - navigation.requestStart;
      }

      // FCP
      const fcpEntry = performance.getEntriesByName('first-contentful-paint')[0];
      if (fcpEntry) {
        metrics.fcp = fcpEntry.startTime;
      }

      // LCP (si disponible)
      const lcpEntries = performance.getEntriesByType('largest-contentful-paint');
      if (lcpEntries.length > 0) {
        metrics.lcp = lcpEntries[lcpEntries.length - 1].startTime;
      }
    } catch (error) {
      console.warn('Impossible de récupérer les métriques:', error);
    }

    return metrics;
  }

  /**
   * 🚀 PRÉCHARGE LES ROUTES CRITIQUES
   * Charge les composants lazy en avance pendant le splash
   */
  static async preloadCriticalRoutes(userRole: string | null): Promise<void> {
    const routeImports: Record<string, () => Promise<any>> = {
      client: () => import('@/pages/ClientApp'),
      driver: () => import('@/pages/DriverApp'),
      partner: () => import('@/pages/PartnerApp'),
      admin: () => import('@/pages/AdminApp'),
      restaurant: () => import('@/pages/RestaurantApp'),
    };

    if (userRole && routeImports[userRole]) {
      try {
        console.log(`⚡ Préchargement route: ${userRole}`);
        await routeImports[userRole]();
      } catch (error) {
        console.warn(`Erreur préchargement route ${userRole}:`, error);
      }
    }
  }
}

// Auto-initialisation
if (typeof window !== 'undefined') {
  PreloadManager.preloadCriticalResources();
  // PerformanceObserver désactivé — spam console sans valeur ajoutée
}
