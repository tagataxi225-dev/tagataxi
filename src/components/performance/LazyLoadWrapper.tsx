import React, { useState, useRef, useEffect } from 'react';
import { ProgressiveLoader } from '../optimization/SlowConnectionComponents';

interface LazyLoadWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  threshold?: number;
  rootMargin?: string;
  className?: string;
  immediate?: boolean;
}

export const LazyLoadWrapper: React.FC<LazyLoadWrapperProps> = ({
  children,
  fallback,
  threshold = 0.1,
  rootMargin = '50px',
  className = '',
  immediate = false
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

useEffect(() => {
    if (immediate) {
      setIsVisible(true);
      setIsLoaded(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          setIsLoaded(true);
          observer.disconnect();
        }
      },
      { threshold, rootMargin }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [threshold, rootMargin, immediate]);

  return (
    <div ref={ref} className={className}>
      {isVisible && isLoaded ? (
        children
      ) : isVisible ? (
        fallback || <ProgressiveLoader message="Chargement du contenu..." />
      ) : (
        <div className="h-32 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-muted border-t-primary rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
};

export default LazyLoadWrapper;