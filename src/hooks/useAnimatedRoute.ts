import { useState, useEffect, useRef } from 'react';
import { DirectionsService, DirectionsResult } from '@/services/directionsService';
import { getCachedRoute, cacheRoute, measurePerformance, performanceMonitor } from '@/utils/performanceUtils';

interface Location {
  lat: number;
  lng: number;
  address: string;
}

export const useAnimatedRoute = (pickup: Location, destination: Location) => {
  const [route, setRoute] = useState<DirectionsResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    // Annuler la requête précédente si elle existe
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    if (!pickup || !destination) {
      setRoute(null);
      return;
    }

    const fetchRoute = async () => {
      setIsLoading(true);
      setError(null);

      // Créer un nouveau AbortController
      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      try {
        // 1. Vérifier le cache d'abord
        const cachedRoute = getCachedRoute(
          { lat: pickup.lat, lng: pickup.lng },
          { lat: destination.lat, lng: destination.lng }
        );

        if (cachedRoute && !abortController.signal.aborted) {
          setRoute(cachedRoute);
          setIsLoading(false);
          return;
        }

        // 2. Calculer la route avec mesure de performance
        const routeData = await measurePerformance(
          'Route Calculation',
          async () => {
            const start = performance.now();
            const result = await DirectionsService.getDirections(
              { lat: pickup.lat, lng: pickup.lng },
              { lat: destination.lat, lng: destination.lng }
            );
            const duration = performance.now() - start;
            
            // Enregistrer la métrique
            performanceMonitor.record('route_calculation', duration);
            
            return result;
          }
        );

        if (!abortController.signal.aborted) {
          // 3. Mettre en cache
          cacheRoute(
            { lat: pickup.lat, lng: pickup.lng },
            { lat: destination.lat, lng: destination.lng },
            routeData
          );

          setRoute(routeData);
        }
      } catch (err) {
        if (!abortController.signal.aborted) {
          console.error('Erreur calcul de route:', err);
          setError(err instanceof Error ? err.message : 'Erreur inconnue');
          setRoute(null);
        }
      } finally {
        if (!abortController.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    // Debounce de 300ms pour éviter trop de requêtes
    const timeoutId = setTimeout(fetchRoute, 300);

    return () => {
      clearTimeout(timeoutId);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [pickup?.lat, pickup?.lng, destination?.lat, destination?.lng]);

  return {
    route,
    isLoading,
    error
  };
};
