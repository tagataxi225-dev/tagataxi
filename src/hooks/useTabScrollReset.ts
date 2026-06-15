import { useEffect, useRef } from 'react';

/**
 * Hook qui scroll automatiquement vers le haut quand un état change
 * Optimisé pour éviter les reflows et respecter les préférences utilisateur
 */
export const useTabScrollReset = (
  dependency: any, // L'état à surveiller (tab, activeTab, etc.)
  options?: {
    behavior?: 'smooth' | 'auto';
    delay?: number;
    enabled?: boolean;
    containerSelector?: string; // Nouveau: scroll un conteneur spécifique
  }
) => {
  const { 
    behavior = 'smooth', 
    delay = 0,
    enabled = true,
    containerSelector 
  } = options || {};

  const isFirstRender = useRef(true);

  useEffect(() => {
    // Ne pas scroll au premier rendu (montage initial)
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    // Si désactivé, ne rien faire
    if (!enabled) return;

    const scrollToTop = () => {
      // Respect des préférences motion de l'utilisateur
      const prefersReducedMotion = window.matchMedia(
        '(prefers-reduced-motion: reduce)'
      ).matches;

      const finalBehavior = prefersReducedMotion ? 'auto' : behavior;

      // Utiliser requestAnimationFrame pour optimiser le reflow
      requestAnimationFrame(() => {
        // Scroll la fenêtre principale
        window.scrollTo({
          top: 0,
          left: 0,
          behavior: finalBehavior
        });

        // Scroll aussi le conteneur si spécifié
        if (containerSelector) {
          const container = document.querySelector(containerSelector);
          if (container) {
            container.scrollTo({
              top: 0,
              left: 0,
              behavior: finalBehavior
            });
          }
        }
      });
    };

    if (delay > 0) {
      const timer = setTimeout(scrollToTop, delay);
      return () => clearTimeout(timer);
    } else {
      scrollToTop();
    }
  }, [dependency, behavior, delay, enabled, containerSelector]);
};
