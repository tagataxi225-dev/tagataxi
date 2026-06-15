/**
 * AnimationController - Gestionnaire global des animations
 * Détecte les préférences utilisateur et optimise les performances
 */

type AnimationMode = 'full' | 'reduced' | 'none';

export class AnimationController {
  private static mode: AnimationMode = 'full';
  private static prefersReducedMotion = false;
  private static performanceMode = false;

  /**
   * Initialise le controller
   */
  static initialize(): void {
    this.detectMotionPreference();
    this.detectPerformance();
    this.applyMode();
  }

  /**
   * Détecte la préférence de mouvement réduit
   */
  private static detectMotionPreference(): void {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    this.prefersReducedMotion = mediaQuery.matches;

    // Écouter les changements
    mediaQuery.addEventListener('change', (e) => {
      this.prefersReducedMotion = e.matches;
      this.updateMode();
    });
  }

  /**
   * Détecte la performance du device
   */
  private static detectPerformance(): void {
    if (typeof navigator === 'undefined') return;

    // Vérifier la connexion
    const connection = (navigator as any).connection;
    if (connection) {
      const slowConnection = connection.effectiveType === 'slow-2g' || 
                            connection.effectiveType === '2g' ||
                            connection.saveData;
      
      if (slowConnection) {
        this.performanceMode = true;
      }
    }

    // Vérifier la mémoire
    const memory = (performance as any).memory;
    if (memory) {
      const lowMemory = memory.jsHeapSizeLimit < 500000000; // < 500MB
      if (lowMemory) {
        this.performanceMode = true;
      }
    }
  }

  /**
   * Met à jour le mode d'animation
   */
  private static updateMode(): void {
    if (this.prefersReducedMotion) {
      this.mode = 'reduced';
    } else if (this.performanceMode) {
      this.mode = 'reduced';
    } else {
      this.mode = 'full';
    }

    this.applyMode();
  }

  /**
   * Applique le mode au document
   */
  private static applyMode(): void {
    if (typeof document === 'undefined') return;

    const root = document.documentElement;

    // Supprimer les classes existantes
    root.classList.remove('animations-full', 'animations-reduced', 'animations-none');

    // Ajouter la classe appropriée
    root.classList.add(`animations-${this.mode}`);

    // Appliquer des styles CSS variables
    root.style.setProperty('--animation-duration', this.getAnimationDuration());
    root.style.setProperty('--transition-duration', this.getTransitionDuration());
  }

  /**
   * Obtient la durée d'animation appropriée
   */
  private static getAnimationDuration(): string {
    switch (this.mode) {
      case 'full':
        return '250ms'; // Réduit de 400ms à 250ms
      case 'reduced':
        return '150ms';
      case 'none':
        return '0ms';
      default:
        return '250ms';
    }
  }

  /**
   * Obtient la durée de transition appropriée
   */
  private static getTransitionDuration(): string {
    switch (this.mode) {
      case 'full':
        return '200ms'; // Réduit de 300ms à 200ms
      case 'reduced':
        return '100ms'; // Réduit de 150ms à 100ms
      case 'none':
        return '0ms';
      default:
        return '200ms';
    }
  }

  /**
   * Vérifie si les animations sont activées
   */
  static areAnimationsEnabled(): boolean {
    return this.mode !== 'none';
  }

  /**
   * Vérifie si on est en mode réduit
   */
  static isReducedMode(): boolean {
    return this.mode === 'reduced' || this.prefersReducedMotion;
  }

  /**
   * Force un mode spécifique
   */
  static setMode(mode: AnimationMode): void {
    this.mode = mode;
    this.applyMode();
  }

  /**
   * Obtient le mode actuel
   */
  static getMode(): AnimationMode {
    return this.mode;
  }

  /**
   * Active le mode performance
   */
  static enablePerformanceMode(): void {
    this.performanceMode = true;
    this.updateMode();
  }

  /**
   * Désactive le mode performance
   */
  static disablePerformanceMode(): void {
    this.performanceMode = false;
    this.updateMode();
  }

  /**
   * Obtient les configurations d'animation recommandées
   */
  static getRecommendedConfig(): {
    duration: number;
    easing: string;
    stagger: number;
  } {
    switch (this.mode) {
      case 'full':
        return {
          duration: 250, // Réduit de 400ms à 250ms
          easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
          stagger: 30, // Réduit de 50ms à 30ms
        };
      case 'reduced':
        return {
          duration: 150,
          easing: 'ease-out',
          stagger: 15, // Réduit de 20ms à 15ms
        };
      case 'none':
        return {
          duration: 0,
          easing: 'linear',
          stagger: 0,
        };
      default:
        return {
          duration: 250,
          easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
          stagger: 30,
        };
    }
  }
}

// Auto-initialisation
if (typeof window !== 'undefined') {
  AnimationController.initialize();
}
