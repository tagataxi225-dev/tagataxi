import { useState, useEffect } from 'react';
import { useSmartGeolocation } from './useSmartGeolocation';

/**
 * Hook de géolocalisation temps réel avec état exposé
 * Wrapper autour de useSmartGeolocation pour compatibilité avec les composants
 * 
 * ✅ FIX: Supprimé le double appel getCurrentPosition au mount
 * Le composant appelant (ex: ModernHeader) déclenche explicitement la requête GPS
 */
export const useRealtimeGeolocation = () => {
  const smartGeo = useSmartGeolocation();
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [isRealGPS, setIsRealGPS] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ✅ FIX: Supprimé l'appel automatique getCurrentPosition ici
  // Le composant appelant (ex: ModernHeader) déclenche explicitement la requête GPS
  // Cela évite le double appel GPS concurrent au démarrage

  // Sync avec smartGeo si currentLocation change
  useEffect(() => {
    if (smartGeo.currentLocation) {
      setLatitude(smartGeo.currentLocation.lat);
      setLongitude(smartGeo.currentLocation.lng);
      setAccuracy(smartGeo.currentLocation.accuracy || null);
      setIsRealGPS(smartGeo.currentLocation.type === 'current' || smartGeo.currentLocation.type === 'gps');
      setLoading(false);
    }
  }, [smartGeo.currentLocation]);

  // Sync errors from smartGeo
  useEffect(() => {
    if (smartGeo.error) {
      setError(smartGeo.error);
      setLoading(false);
    }
  }, [smartGeo.error]);

  return {
    latitude,
    longitude,
    accuracy,
    isRealGPS,
    loading,
    error,
    getCurrentPosition: smartGeo.getCurrentPosition,
    ...smartGeo
  };
};
