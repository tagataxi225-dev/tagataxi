import { useState, useEffect } from 'react';

interface WindowSize {
  width: number;
  height: number;
}

export const useWindowSize = (): WindowSize => {
  const [windowSize, setWindowSize] = useState<WindowSize>({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  });

  useEffect(() => {
    let ticking = false;

    const updateSize = () => {
      // Batch DOM reads in requestAnimationFrame to avoid forced reflow
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
      ticking = false;
    };

    const handleResize = () => {
      // Throttle resize events using requestAnimationFrame
      if (!ticking) {
        requestAnimationFrame(updateSize);
        ticking = true;
      }
    };

    window.addEventListener('resize', handleResize, { passive: true });
    // Set initial size using batched read
    requestAnimationFrame(updateSize);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return windowSize;
};
