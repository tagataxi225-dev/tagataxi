/**
 * Wrapper pour le lazy loading des composants
 * Optimise les performances en chargeant les composants à la demande
 */

import React, { Suspense, lazy, ComponentType } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';

interface LazyComponentWrapperProps {
  height?: number;
  className?: string;
  fallbackComponent?: React.ComponentType;
}

// Composant de fallback par défaut
const DefaultFallback: React.FC<{ height?: number; className?: string }> = ({ 
  height = 200, 
  className 
}) => (
  <Card className={`p-4 ${className || ''}`}>
    <div className="space-y-3">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-32 w-full" />
    </div>
  </Card>
);

// HOC pour wrapper les composants en lazy loading
export function withLazyLoading<P extends {}>(
  importFunc: () => Promise<{ default: ComponentType<P> }>,
  fallbackProps?: LazyComponentWrapperProps
) {
  const LazyComponent = lazy(importFunc);
  
  return function LazyWrappedComponent(props: P) {
    return (
      <Suspense 
        fallback={
          <DefaultFallback 
            height={fallbackProps?.height}
            className={fallbackProps?.className}
          />
        }
      >
        <LazyComponent {...(props as any)} />
      </Suspense>
    );
  };
}

// Hook pour le lazy loading conditionnel
export function useLazyComponent<P extends object>(
  importFunc: () => Promise<{ default: ComponentType<P> }>,
  shouldLoad: boolean
) {
  const LazyComponent = React.useMemo(() => {
    if (!shouldLoad) return null;
    return lazy(importFunc);
  }, [shouldLoad, importFunc]);

  return LazyComponent;
}

export default withLazyLoading;