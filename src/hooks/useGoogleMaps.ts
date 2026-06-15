import { useState, useEffect, useCallback, useRef } from 'react';
import { googleMapsLoader } from '@/services/googleMapsLoader';
import { logger } from '@/utils/logger';

export function useGoogleMaps() {
  const [isLoaded, setIsLoaded] = useState(() => {
    // Si le SDK est déjà chargé globalement, démarrer en loaded
    return typeof window !== 'undefined' && !!window.google?.maps?.Map;
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(() => {
    return !(typeof window !== 'undefined' && !!window.google?.maps?.Map);
  });
  const unmountedRef = useRef(false);
  const loadingRef = useRef(false);

  useEffect(() => {
    unmountedRef.current = false;
    return () => { unmountedRef.current = true; };
  }, []);

  const loadGoogleMaps = useCallback(async () => {
    // Si déjà disponible globalement, pas besoin de charger
    if (window.google?.maps?.Map) {
      setIsLoaded(true);
      setIsLoading(false);
      setError(null);
      return;
    }

    if (loadingRef.current) return;
    loadingRef.current = true;
    setIsLoading(true);
    setError(null);

    try {
      const loadPromise = googleMapsLoader.load(['places', 'marker', 'geometry']);
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Timeout Google Maps')), 10000)
      );

      await Promise.race([loadPromise, timeoutPromise]);

      if (!unmountedRef.current) {
        setIsLoaded(true);
        setIsLoading(false);
        setError(null);
      }
    } catch (err: any) {
      logger.error(`❌ [useGoogleMaps] Error: ${err.message}`);
      if (!unmountedRef.current) {
        setError(err.message || 'Impossible de charger Google Maps');
        setIsLoading(false);
      }
    } finally {
      loadingRef.current = false;
    }
  }, []);

  useEffect(() => {
    loadGoogleMaps();
  }, [loadGoogleMaps]);

  const retry = useCallback(() => {
    googleMapsLoader.reset();
    setIsLoaded(false);
    setError(null);
    loadingRef.current = false;
    loadGoogleMaps();
  }, [loadGoogleMaps]);

  return { isLoaded, error, isLoading, retry };
}
