import { useState, useCallback, useRef, useEffect } from 'react';
import { LocationData, GeolocationOptions } from '@/types/location';
import { toast } from 'sonner';
import { nativeGeolocationService, NativeLocationData } from '@/services/nativeGeolocationService';

interface EnhancedLocationState {
  location: LocationData | null;
  loading: boolean;
  error: string | null;
  accuracy: number | null;
  source: 'gps' | 'ip' | 'cache' | 'manual' | null;
  lastUpdate: Date | null;
}

interface CachedLocation {
  data: LocationData;
  timestamp: number;
  accuracy: number;
}

export function useEnhancedGeolocation() {
  const [state, setState] = useState<EnhancedLocationState>({
    location: null, loading: false, error: null,
    accuracy: null, source: null, lastUpdate: null
  });

  const watchIdRef = useRef<string | null>(null);
  const cacheRef = useRef<Map<string, CachedLocation>>(new Map());

  const popularPlaces = useRef({
    'Kinshasa': [
      { name: 'Centre-ville de Kinshasa', lat: -4.3217, lng: 15.3069, accuracy: 100 },
      { name: 'Aéroport N\'djili', lat: -4.3856, lng: 15.4446, accuracy: 50 },
      { name: 'Université de Kinshasa', lat: -4.4043, lng: 15.2969, accuracy: 200 },
      { name: 'Marché Central', lat: -4.3190, lng: 15.3072, accuracy: 150 }
    ],
    'Lubumbashi': [
      { name: 'Centre-ville de Lubumbashi', lat: -11.6792, lng: 27.5294, accuracy: 100 },
      { name: 'Aéroport de Lubumbashi', lat: -11.5912, lng: 27.5308, accuracy: 50 }
    ],
    'Kolwezi': [
      { name: 'Centre-ville de Kolwezi', lat: -10.7147, lng: 25.4764, accuracy: 100 },
      { name: 'Aéroport de Kolwezi', lat: -10.7689, lng: 25.5067, accuracy: 50 }
    ]
  });

  const cleanCache = useCallback(() => {
    const now = Date.now();
    const expiry = 5 * 60 * 1000;
    for (const [key, cached] of cacheRef.current.entries()) {
      if (now - cached.timestamp > expiry) cacheRef.current.delete(key);
    }
  }, []);

  const getCurrentPosition = useCallback(async (options: GeolocationOptions = {}): Promise<LocationData | null> => {
    const cacheKey = 'current_position';
    cleanCache();
    const cached = cacheRef.current.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < 60000) {
      setState(prev => ({ ...prev, location: cached.data, accuracy: cached.accuracy, source: 'cache', lastUpdate: new Date(cached.timestamp) }));
      return cached.data;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const position = await nativeGeolocationService.getCurrentPosition({
        enableHighAccuracy: options.enableHighAccuracy ?? true,
        timeout: options.timeout || 10000,
        maximumAge: options.maximumAge || 30000
      });

      const locationData: LocationData = {
        lat: position.lat,
        lng: position.lng,
        address: 'Position actuelle',
        type: 'current',
        accuracy: position.accuracy
      };

      cacheRef.current.set(cacheKey, {
        data: locationData, timestamp: Date.now(), accuracy: position.accuracy || 0
      });

      try {
        const response = await fetch('/api/geocode-reverse', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lat: position.lat, lng: position.lng })
        });
        if (response.ok) {
          const geocodeData = await response.json();
          if (geocodeData.address) locationData.address = geocodeData.address;
        }
      } catch (geocodeError) {
        console.warn('Geocoding inverse échoué:', geocodeError);
      }

      setState(prev => ({
        ...prev, location: locationData, loading: false,
        accuracy: position.accuracy || null, source: 'gps', lastUpdate: new Date()
      }));

      return locationData;
    } catch (error) {
      console.error('Erreur géolocalisation:', error);
      
      if (options.fallbackToDatabase) {
        const fallbackLocation = await getFallbackLocation();
        if (fallbackLocation) {
          setState(prev => ({ ...prev, location: fallbackLocation, loading: false, source: 'cache', error: null, lastUpdate: new Date() }));
          return fallbackLocation;
        }
      }

      setState(prev => ({
        ...prev, loading: false,
        error: error instanceof Error ? error.message : 'Erreur de géolocalisation',
        source: null
      }));
      toast.error('Impossible d\'obtenir votre position actuelle');
      return null;
    }
  }, [cleanCache]);

  const getFallbackLocation = useCallback(async (): Promise<LocationData | null> => {
    try {
      const defaultCity = 'Kinshasa';
      const places = popularPlaces.current[defaultCity] || popularPlaces.current['Kinshasa'];
      if (places.length > 0) {
        const randomPlace = places[Math.floor(Math.random() * places.length)];
        return { lat: randomPlace.lat, lng: randomPlace.lng, address: randomPlace.name, type: 'fallback', accuracy: randomPlace.accuracy };
      }
    } catch (error) { console.error('Fallback location error:', error); }
    return null;
  }, []);

  const searchLocation = useCallback(async (query: string, city: string = 'Kinshasa'): Promise<LocationData[]> => {
    if (!query || query.length < 3) return [];
    const cacheKey = `search_${query}_${city}`;
    const cached = cacheRef.current.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < 300000) return [cached.data];

    try {
      const response = await fetch('/api/geocode-proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: `${query}, ${city}`, city })
      });
      if (!response.ok) throw new Error('Erreur de recherche');
      const data = await response.json();
      if (data.results && data.results.length > 0) {
        const results = data.results.slice(0, 5).map((result: any) => ({
          lat: result.geometry.location.lat, lng: result.geometry.location.lng,
          address: result.formatted_address, type: 'geocoded' as const, placeId: result.place_id
        }));
        if (results.length > 0) {
          cacheRef.current.set(cacheKey, { data: results[0], timestamp: Date.now(), accuracy: 50 });
        }
        return results;
      }
      return [];
    } catch (error) {
      console.error('Search location error:', error);
      toast.error('Erreur lors de la recherche d\'adresse');
      return [];
    }
  }, []);

  const startTracking = useCallback(async (callback: (location: LocationData) => void, interval: number = 10000) => {
    await stopTracking();

    try {
      watchIdRef.current = await nativeGeolocationService.watchPosition(
        (position: NativeLocationData) => {
          const locationData: LocationData = {
            lat: position.lat, lng: position.lng,
            address: 'Position en cours', type: 'current', accuracy: position.accuracy
          };
          callback(locationData);
          setState(prev => ({
            ...prev, location: locationData, accuracy: position.accuracy || null,
            source: 'gps', lastUpdate: new Date()
          }));
        },
        (error) => { console.error('Tracking error:', error); },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 5000 }
      );
    } catch (err) {
      console.error('❌ Impossible de démarrer le tracking:', err);
      toast.error('Impossible de démarrer le suivi GPS');
    }
  }, []);

  const stopTracking = useCallback(async () => {
    if (watchIdRef.current !== null) {
      await nativeGeolocationService.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }, []);

  const calculateDistance = useCallback((point1: { lat: number; lng: number }, point2: { lat: number; lng: number }): number => {
    const R = 6371;
    const dLat = (point2.lat - point1.lat) * Math.PI / 180;
    const dLng = (point2.lng - point1.lng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }, []);

  useEffect(() => {
    return () => { stopTracking(); cacheRef.current.clear(); };
  }, [stopTracking]);

  return {
    ...state, getCurrentPosition, searchLocation,
    startTracking, stopTracking, calculateDistance,
    clearError: () => setState(prev => ({ ...prev, error: null }))
  };
}
