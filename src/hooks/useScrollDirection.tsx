import { useState, useEffect } from 'react';

/**
 * Hook pour détecter la direction du scroll et masquer/afficher intelligemment le footer
 */
export const useScrollDirection = () => {
  const [scrollDirection, setScrollDirection] = useState<'up' | 'down' | null>(null);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY < 50) {
        // Toujours visible en haut de page
        setScrollDirection(null);
      } else if (currentScrollY > lastScrollY && currentScrollY > 100) {
        // Scroll down → Masquer footer
        setScrollDirection('down');
      } else if (currentScrollY < lastScrollY) {
        // Scroll up → Afficher footer
        setScrollDirection('up');
      }
      
      setLastScrollY(currentScrollY);
    };

    // Throttle pour performance
    let ticking = false;
    const throttledScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', throttledScroll, { passive: true });
    return () => window.removeEventListener('scroll', throttledScroll);
  }, [lastScrollY]);

  return scrollDirection;
};
