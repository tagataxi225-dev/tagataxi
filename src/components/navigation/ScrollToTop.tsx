import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Batch all scroll operations in a single requestAnimationFrame to avoid forced reflow
    requestAnimationFrame(() => {
      // Use window.scrollTo which is more performant than direct scrollTop manipulation
      window.scrollTo(0, 0);
      
      // Check user's motion preference once
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      
      // Add smooth scroll after content is loaded if motion is allowed
      if (!prefersReducedMotion) {
        const timeoutId = setTimeout(() => {
          window.scrollTo({
            top: 0,
            left: 0,
            behavior: 'smooth'
          });
        }, 150);
        
        return () => clearTimeout(timeoutId);
      }
    });
  }, [pathname]);

  return null;
};