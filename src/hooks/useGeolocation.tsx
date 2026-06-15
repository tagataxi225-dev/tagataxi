import { useState, useEffect, useCallback } from 'react';
import { Geolocation, Position } from '@capacitor/geolocation';
import { useToast } from '@/hooks/use-toast';
import { CountryService } from '@/services/countryConfig';

interface LocationState {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  loading: boolean;
  error: string | null;
  lastKnownPosition: { latitude: number; longitude: number } | null;
  isRealGPS: boolean; // Indique si c'est une vraie position GPS
}

interface UseGeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  watchPosition?: boolean;
}

// Check if Capacitor is available
const isCapacitorAvailable = () => {
  return typeof window !== 'undefined' && 
         (window as any).Capacitor && 
         (window as any).Capacitor.isNativePlatform &&
         (window as any).Capacitor.isNativePlatform();
};

// Fallback using browser geolocation API
const getBrowserLocation = (options: PositionOptions): Promise<GeolocationPosition> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Géolocalisation non supportée par le navigateur'));
      return;
    }
    
    navigator.geolocation.getCurrentPosition(resolve, reject, options);
  });
};

export const useGeolocation = (options: UseGeolocationOptions = {}) => {
  const [location, setLocation] = useState<LocationState>({
    latitude: null,
    longitude: null,
    accuracy: null,
    loading: false,
    error: null,
    lastKnownPosition: null,
    isRealGPS: false,
  });
  
  const { toast } = useToast();

  const {
    enableHighAccuracy = true,
    timeout = 20000, // Increased timeout for slow connections
    maximumAge = 300000, // 5 minutes
    watchPosition = false,
  } = options;

  // Load cached position on init with timestamp validation
  useEffect(() => {
    const cached = localStorage.getItem('lastKnownPosition');
    const cacheTimestamp = localStorage.getItem('lastKnownPositionTime');
    
    if (cached && cacheTimestamp) {
      try {
        const position = JSON.parse(cached);
        const timestamp = parseInt(cacheTimestamp);
        const now = Date.now();
        const isRealGPS = localStorage.getItem('lastPositionWasRealGPS') === 'true';
        
        // Only use cache if it's less than 1 hour old for real GPS, or 5 minutes for fallback
        const maxAge = isRealGPS ? 3600000 : 300000; // 1 hour vs 5 minutes
        
        if (now - timestamp < maxAge) {
          setLocation(prev => ({ 
            ...prev, 
            lastKnownPosition: position,
            isRealGPS 
          }));
        } else {
          // Clear old cache
          localStorage.removeItem('lastKnownPosition');
          localStorage.removeItem('lastKnownPositionTime');
          localStorage.removeItem('lastPositionWasRealGPS');
        }
      } catch (error) {
        console.error('Error loading cached position:', error);
      }
    }
  }, []);

  const requestPermissions = useCallback(async (): Promise<boolean> => {
    try {
      if (isCapacitorAvailable()) {
        const permissions = await Geolocation.requestPermissions();
        if (permissions.location !== 'granted') {
          throw new Error('Permission de géolocalisation refusée');
        }
        return true;
      } else {
        // For browser, check if geolocation is supported
        if (!navigator.geolocation) {
          throw new Error('Géolocalisation non supportée par le navigateur');
        }
        // Browser permission is requested automatically when getting position
        return true;
      }
    } catch (error) {
      console.error('Error requesting permissions:', error);
      return false;
    }
  }, []);

  const getCurrentPosition = useCallback(async (retryCount = 0, forceRefresh = false) => {
    setLocation(prev => ({ ...prev, loading: true, error: null }));

    try {
      let position: Position | GeolocationPosition;
      
      if (isCapacitorAvailable()) {
        // Use Capacitor geolocation for mobile apps
        const hasPermission = await requestPermissions();
        if (!hasPermission) {
          throw new Error('PERMISSION_DENIED');
        }

        position = await Geolocation.getCurrentPosition({
          enableHighAccuracy: true, // Force high accuracy for real GPS
          timeout: 30000, // Increased timeout for better GPS lock
          maximumAge: forceRefresh ? 0 : 60000, // Force fresh position if requested
        });
      } else {
        // Check HTTPS requirement
        if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
          throw new Error('HTTPS_REQUIRED');
        }
        
        // Fallback to browser geolocation API
        const browserPosition = await getBrowserLocation({
          enableHighAccuracy: true, // Force high accuracy
          timeout: 30000, // Increased timeout
          maximumAge: forceRefresh ? 0 : 60000, // Force fresh if requested
        });
        position = {
          coords: browserPosition.coords,
          timestamp: browserPosition.timestamp,
        } as Position;
      }

      // Validate that we got a real GPS position (accuracy < 100m for real GPS)
      const isRealGPS = position.coords.accuracy !== null && position.coords.accuracy < 100;
      
      const newPosition = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };
      
      // Cache the position with metadata
      localStorage.setItem('lastKnownPosition', JSON.stringify(newPosition));
      localStorage.setItem('lastKnownPositionTime', Date.now().toString());
      localStorage.setItem('lastPositionWasRealGPS', isRealGPS.toString());
      
      setLocation(prev => ({
        ...prev,
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        loading: false,
        error: null,
        lastKnownPosition: newPosition,
        isRealGPS,
      }));

      return position;
    } catch (error) {
      const errorCode = error instanceof Error ? error.message : 'UNKNOWN_ERROR';
      
      // Retry logic for network errors - more aggressive retries for real GPS
      if (retryCount < 3 && ['TIMEOUT', 'POSITION_UNAVAILABLE'].includes(errorCode)) {
        const delay = Math.pow(2, retryCount) * 2000; // Longer delays for GPS
        setTimeout(() => getCurrentPosition(retryCount + 1, forceRefresh), delay);
        return;
      }
      
      // Use cached position only if it's recent and was real GPS
      const cached = localStorage.getItem('lastKnownPosition');
      const cacheTimestamp = localStorage.getItem('lastKnownPositionTime');
      const wasRealGPS = localStorage.getItem('lastPositionWasRealGPS') === 'true';
      
      if (cached && cacheTimestamp && wasRealGPS) {
        try {
          const cachedPosition = JSON.parse(cached);
          const timestamp = parseInt(cacheTimestamp);
          const now = Date.now();
          
          // Only use cache if it's less than 30 minutes old for real GPS positions
          if (now - timestamp < 1800000) { // 30 minutes
            setLocation(prev => ({
              ...prev,
              latitude: cachedPosition.latitude,
              longitude: cachedPosition.longitude,
              accuracy: null,
              loading: false,
              error: getErrorMessage(errorCode),
              lastKnownPosition: cachedPosition,
              isRealGPS: true, // Cached real GPS position
            }));
            
            toast({
              title: "Position GPS récente",
              description: "Utilisation de votre dernière position GPS connue",
              variant: "default",
            });
            
            return {
              coords: cachedPosition,
              timestamp: Date.now(),
            } as Position;
          }
        } catch (e) {
          console.error('Error parsing cached position:', e);
        }
      }
      
      // Final error - no valid cached position or GPS unavailable
      setLocation(prev => ({
        ...prev,
        latitude: null,
        longitude: null,
        accuracy: null,
        loading: false,
        error: getErrorMessage(errorCode),
        lastKnownPosition: null,
        isRealGPS: false,
      }));
      
      toast({
        title: getErrorTitle(errorCode),
        description: getErrorMessage(errorCode) + " - Localisation manuelle disponible",
        variant: "destructive",
      });
      
      throw error; // Let the caller handle the error
    }
  }, [enableHighAccuracy, timeout, maximumAge, toast, requestPermissions]);

  const getErrorMessage = (errorCode: string): string => {
    switch (errorCode) {
      case 'PERMISSION_DENIED':
        return 'Veuillez autoriser la géolocalisation dans les paramètres de votre navigateur';
      case 'POSITION_UNAVAILABLE':
        return 'Position indisponible. Vérifiez votre connexion GPS';
      case 'TIMEOUT':
        return 'Délai d\'attente dépassé. Connexion lente détectée';
      case 'HTTPS_REQUIRED':
        return 'HTTPS requis pour la géolocalisation';
      default:
        return 'Erreur de géolocalisation. Mode manuel disponible';
    }
  };

  const getErrorTitle = (errorCode: string): string => {
    switch (errorCode) {
      case 'PERMISSION_DENIED':
        return 'Permission refusée';
      case 'POSITION_UNAVAILABLE':
        return 'Position indisponible';
      case 'TIMEOUT':
        return 'Connexion lente';
      case 'HTTPS_REQUIRED':
        return 'Connexion sécurisée requise';
      default:
        return 'Erreur de localisation';
    }
  };

  const watchCurrentPosition = useCallback(() => {
    let watchId: string | number | null = null;

    const startWatching = async () => {
      try {
        const hasPermission = await requestPermissions();
        if (!hasPermission) {
          throw new Error('Permissions de géolocalisation requises');
        }

        if (isCapacitorAvailable()) {
          // Use Capacitor watch position
          watchId = await Geolocation.watchPosition(
            {
              enableHighAccuracy,
              timeout,
              maximumAge,
            },
            (position: Position | null, err) => {
              if (err) {
                const errorMessage = err.message || 'Erreur de géolocalisation';
                setLocation(prev => ({
                  ...prev,
                  loading: false,
                  error: errorMessage,
                }));
                return;
              }

              if (position) {
                const newPosition = {
                  latitude: position.coords.latitude,
                  longitude: position.coords.longitude,
                };
                
                const isRealGPS = position.coords.accuracy !== null && position.coords.accuracy < 100;
                
                // Update cache with new position
                localStorage.setItem('lastKnownPosition', JSON.stringify(newPosition));
                localStorage.setItem('lastKnownPositionTime', Date.now().toString());
                localStorage.setItem('lastPositionWasRealGPS', isRealGPS.toString());
                
                setLocation(prev => ({
                  ...prev,
                  latitude: position.coords.latitude,
                  longitude: position.coords.longitude,
                  accuracy: position.coords.accuracy,
                  loading: false,
                  error: null,
                  lastKnownPosition: newPosition,
                  isRealGPS,
                }));
              }
            }
          );
        } else {
          // Use browser watch position
          watchId = navigator.geolocation.watchPosition(
            (position: GeolocationPosition) => {
              const newPosition = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
              };
              
              const isRealGPS = position.coords.accuracy !== null && position.coords.accuracy < 100;
              
              // Update cache with new position
              localStorage.setItem('lastKnownPosition', JSON.stringify(newPosition));
              localStorage.setItem('lastKnownPositionTime', Date.now().toString());
              localStorage.setItem('lastPositionWasRealGPS', isRealGPS.toString());
              
              setLocation(prev => ({
                ...prev,
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                accuracy: position.coords.accuracy,
                loading: false,
                error: null,
                lastKnownPosition: newPosition,
                isRealGPS,
              }));
            },
            (error: GeolocationPositionError) => {
              const errorMessage = error.message || 'Erreur de géolocalisation';
              setLocation(prev => ({
                ...prev,
                loading: false,
                error: errorMessage,
              }));
            },
            {
              enableHighAccuracy,
              timeout,
              maximumAge,
            }
          );
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erreur de géolocalisation';
        setLocation(prev => ({
          ...prev,
          loading: false,
          error: errorMessage,
        }));
      }
    };

    startWatching();

    return () => {
      if (watchId) {
        if (isCapacitorAvailable()) {
          Geolocation.clearWatch({ id: watchId as string });
        } else {
          navigator.geolocation.clearWatch(watchId as number);
        }
      }
    };
  }, [enableHighAccuracy, timeout, maximumAge, requestPermissions]);

  useEffect(() => {
    if (watchPosition) {
      return watchCurrentPosition();
    }
  }, [watchPosition, watchCurrentPosition]);

  // Get current country's main city coordinates
  const getCurrentCountryMainCity = () => {
    const currentCountry = CountryService.getCurrentCountry();
    return currentCountry.majorCities[0].coordinates;
  };

  const detectCurrentCity = () => {
    if (!location.latitude || !location.longitude) {
      return CountryService.getCurrentCountry().majorCities[0].name;
    }
    
    const currentCountry = CountryService.getCurrentCountry();
    const cities = currentCountry.majorCities;
    
    const distances = cities.map(city => ({
      name: city.name,
      distance: calculateDistance(location.latitude!, location.longitude!, city.coordinates.lat, city.coordinates.lng)
    }));
    
    return distances.sort((a, b) => a.distance - b.distance)[0].name;
  };

  // Auto-detect country when position changes
  useEffect(() => {
    if (location.latitude && location.longitude) {
      CountryService.autoDetectAndSetCountry(location.latitude, location.longitude);
    }
  }, [location.latitude, location.longitude]);

  const calculateDistance = useCallback((
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }, []);

  const getDistanceToMainCity = useCallback(() => {
    if (!location.latitude || !location.longitude) return null;
    
    const mainCityCoords = getCurrentCountryMainCity();
    return calculateDistance(
      location.latitude,
      location.longitude,
      mainCityCoords.lat,
      mainCityCoords.lng
    );
  }, [location.latitude, location.longitude, calculateDistance]);

  // Force refresh GPS position
  const forceRefreshPosition = useCallback(() => {
    getCurrentPosition(0, true);
  }, [getCurrentPosition]);

  return {
    ...location,
    getCurrentPosition,
    forceRefreshPosition,
    watchCurrentPosition,
    calculateDistance,
    getDistanceToMainCity,
    getCurrentCountryMainCity,
    detectCurrentCity,
    isInMainCity: getDistanceToMainCity() ? getDistanceToMainCity()! < 50 : null, // Within 50km
    currentCity: detectCurrentCity(),
    currentCountry: CountryService.getCurrentCountry()
  };
};