import { useCallback } from 'react';

interface ViewTransitionOptions {
  preserveScroll?: boolean;
  behavior?: 'smooth' | 'auto';
}

export const useViewTransition = () => {
  const transitionToView = useCallback((
    viewSetter: (view: string) => void, 
    newView: string,
    options: ViewTransitionOptions = {}
  ) => {
    const { preserveScroll = false, behavior = 'smooth' } = options;
    
    // First set the new view
    viewSetter(newView);
    
    // Then handle scrolling unless explicitly preserving scroll
    if (!preserveScroll) {
      // Respect user's motion preferences
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const finalBehavior = prefersReducedMotion ? 'auto' : behavior;
      
      // Small delay to ensure new view is rendered
      requestAnimationFrame(() => {
        window.scrollTo({
          top: 0,
          left: 0,
          behavior: finalBehavior
        });
      });
    }
  }, []);

  return { transitionToView };
};