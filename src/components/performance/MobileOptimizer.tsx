import React, { useEffect, useState } from 'react';
import { usePerformanceMonitor } from '@/hooks/usePerformanceMonitor';

interface MobileOptimizerProps {
  children: React.ReactNode;
}

export const MobileOptimizer: React.FC<MobileOptimizerProps> = ({ children }) => {
  const { isSlowConnection, isLowBattery } = usePerformanceMonitor();
  const [isOptimized, setIsOptimized] = useState(false);

  useEffect(() => {
    if (isSlowConnection || isLowBattery) {
      // Apply mobile optimizations
      document.documentElement.style.setProperty('--animation-duration', '0.1s');
      document.documentElement.classList.add('performance-mode');
      setIsOptimized(true);
    } else {
      // Remove optimizations
      document.documentElement.style.removeProperty('--animation-duration');
      document.documentElement.classList.remove('performance-mode');
      setIsOptimized(false);
    }
  }, [isSlowConnection, isLowBattery]);

  // Preload critical resources for mobile
  useEffect(() => {
    const preloadCriticalCSS = () => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'style';
      link.href = '/src/styles/performance.css';
      document.head.appendChild(link);
    };

    const optimizeImages = () => {
      const images = document.querySelectorAll('img[data-optimize]');
      images.forEach((img) => {
        if (isSlowConnection) {
          img.setAttribute('loading', 'lazy');
          img.setAttribute('decoding', 'async');
        }
      });
    };

    preloadCriticalCSS();
    optimizeImages();
  }, [isSlowConnection]);

  return (
    <div className={`mobile-optimizer ${isOptimized ? 'optimized' : ''}`}>
      {children}
    </div>
  );
};

export default MobileOptimizer;