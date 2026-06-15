/**
 * AppReadySignal - Service de synchronisation du chargement de l'application
 * Émet un signal quand tous les composants critiques sont prêts
 */

type ReadyState = {
  dom: boolean;
  fonts: boolean;
  auth: boolean;
  route: boolean;
};

type ReadyCallback = () => void;

export class AppReadySignal {
  private static state: ReadyState = {
    dom: false,
    fonts: false,
    auth: false,
    route: false,
  };

  private static callbacks: ReadyCallback[] = [];
  private static isReady = false;
  private static startTime = Date.now();

  /**
   * Marque un composant comme prêt
   */
  static markReady(component: keyof ReadyState): void {
    if (this.state[component]) return;

    this.state[component] = true;
    console.log(`✅ ${component} prêt`);

    this.checkIfAllReady();
  }

  /**
   * Vérifie si tous les composants sont prêts
   */
  private static checkIfAllReady(): void {
    if (this.isReady) return;

    const allReady = Object.values(this.state).every(ready => ready);

    if (allReady) {
      this.isReady = true;
      const duration = Date.now() - this.startTime;
      console.log(`🚀 Application prête en ${duration}ms`);

      // Émettre l'événement
      this.emitReadyEvent();

      // Exécuter les callbacks
      this.callbacks.forEach(callback => callback());
      this.callbacks = [];
    }
  }

  /**
   * Émet l'événement app:ready
   */
  private static emitReadyEvent(): void {
    if (typeof window !== 'undefined') {
      const event = new CustomEvent('app:ready', {
        detail: {
          duration: Date.now() - this.startTime,
          timestamp: new Date().toISOString(),
        },
      });
      window.dispatchEvent(event);
    }
  }

  /**
   * Enregistre un callback à exécuter quand l'app est prête
   */
  static onReady(callback: ReadyCallback): void {
    if (this.isReady) {
      callback();
    } else {
      this.callbacks.push(callback);
    }
  }

  /**
   * Vérifie si l'app est prête
   */
  static getIsReady(): boolean {
    return this.isReady;
  }

  /**
   * Obtient l'état actuel
   */
  static getState(): ReadyState {
    return { ...this.state };
  }

  /**
   * Réinitialise (pour tests)
   */
  static reset(): void {
    this.state = {
      dom: false,
      fonts: false,
      auth: false,
      route: false,
    };
    this.isReady = false;
    this.callbacks = [];
    this.startTime = Date.now();
  }

  /**
   * Initialise le tracking automatique
   */
  static initAutoTracking(): void {
    // DOM Ready
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
      this.markReady('dom');
    } else {
      document.addEventListener('DOMContentLoaded', () => this.markReady('dom'), { once: true });
    }

    // Fonts Ready
    if (document.fonts) {
      document.fonts.ready.then(() => this.markReady('fonts')).catch(() => this.markReady('fonts'));
    } else {
      // Fallback si document.fonts non disponible
      setTimeout(() => this.markReady('fonts'), 1000);
    }
  }

  /**
   * Obtient la durée de chargement
   */
  static getLoadingDuration(): number {
    return Date.now() - this.startTime;
  }
}

// Auto-initialisation
if (typeof window !== 'undefined') {
  AppReadySignal.initAutoTracking();
}
