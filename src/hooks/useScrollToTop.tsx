import { useCallback } from 'react';

interface ScrollToTopOptions {
  behavior?: 'smooth' | 'auto';
  top?: number;
  left?: number;
}

export const useScrollToTop = () => {
  const scrollToTop = useCallback((options: ScrollToTopOptions = {}) => {
    const {
      behavior = 'smooth',
      top = 0,
      left = 0
    } = options;

    // Respect user's motion preferences
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const finalBehavior = prefersReducedMotion ? 'auto' : behavior;

    window.scrollTo({
      top,
      left,
      behavior: finalBehavior
    });
  }, []);

  const scrollToElement = useCallback((elementId: string, offset: number = 0) => {
    const element = document.getElementById(elementId);
    if (element) {
      // Batch DOM read in requestAnimationFrame to avoid forced reflow
      requestAnimationFrame(() => {
        const elementPosition = element.offsetTop - offset;
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        
        window.scrollTo({
          top: elementPosition,
          behavior: prefersReducedMotion ? 'auto' : 'smooth'
        });
      });
    }
  }, []);

  return { scrollToTop, scrollToElement };
};