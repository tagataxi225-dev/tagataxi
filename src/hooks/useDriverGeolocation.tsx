/**
 * Hook géolocalisation chauffeur — web-only via navigator.geolocation.
 * Aucune dépendance Capacitor. Fallback ville synchrone, watchPosition au mount.
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface DriverLocation {
  latitude: number;
  longitude: number;
  accuracy: number;
  heading?: number | null;
  speed?: number | null;
  timestamp: number;
}

interface UseDriverGeolocationOptions {
  autoSync?: boolean;
  syncInterval?: number;
}

function getCityFallbackLocation(): DriverLocation {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const fallback =
    tz === 'Africa/Abidjan' || tz === 'Africa/Dakar' || tz === 'Africa/Bamako' || tz === 'Africa/Lome'
      ? { latitude: 5.36, longitude: -4.01 }
      : tz === 'Africa/Lubumbashi'
      ? { latitude: -11.66, longitude: 27.47 }
      : { latitude: -4.32, longitude: 15.31 };
  return { ...fallback, accuracy: 5000, heading: null, speed: null, timestamp: Date.now() };
}

function positionToDriverLocation(position: GeolocationPosition): DriverLocation {
  return {
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
    accuracy: position.coords.accuracy,
    heading: position.coords.heading,
    speed: position.coords.speed,
    timestamp: position.timestamp,
  };
}

export const useDriverGeolocation = (options: UseDriverGeolocationOptions = {}) => {
  const { autoSync = false, syncInterval = 10000 } = options;
  const { user } = useAuth();

  // Fallback ville synchrone dès le premier rendu — évite tout overlay "En attente"
  const [location, setLocation] = useState<DriverLocation | null>(() => getCityFallbackLocation());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const watchIdRef = useRef<number | null>(null);

  // ─── Sync DB ────────────────────────────────────────────────────────────────

  const syncLocationToDB = useCallback(async (loc: DriverLocation): Promise<void> => {
    if (!user) return;
    if (loc.latitude === 0 && loc.longitude === 0) return;
    if (loc.accuracy > 200) return;

    try {
      // ⚠️ is_online/is_available retirés — gérés par useDriverStatus.goOnline/goOffline
      const { error: dbError } = await supabase
        .from('driver_locations')
        .upsert(
          {
            driver_id: user.id,
            latitude: loc.latitude,
            longitude: loc.longitude,
            heading: loc.heading ?? null,
            speed: loc.speed ?? null,
            accuracy: loc.accuracy,
            last_ping: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'driver_id' }
        );
      if (dbError) console.error('[GPS DB] Sync échouée:', dbError.message);
    } catch (err) {
      console.error('[GPS DB] Exception:', err);
    }
  }, [user]);

  // ─── getCurrentPosition one-shot ────────────────────────────────────────────

  const getCurrentPosition = useCallback(async (): Promise<DriverLocation | null> => {
    setLoading(true);
    setError(null);

    return new Promise<DriverLocation | null>((resolve) => {
      if (!navigator.geolocation) {
        setError('Geolocation API non disponible dans ce navigateur');
        setLoading(false);
        resolve(null);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const loc = positionToDriverLocation(position);
          setLocation(loc);
          if (autoSync && user) syncLocationToDB(loc);
          setLoading(false);
          resolve(loc);
        },
        (err) => {
          const msg = `${err.code}: ${err.message}`;
          setError(msg);
          console.warn('[GPS getCurrentPosition error]', msg);
          setLocation(prev => prev ?? getCityFallbackLocation());
          setLoading(false);
          resolve(null);
        },
        { enableHighAccuracy: true, timeout: 30000, maximumAge: 5000 }
      );
    });
  }, [autoSync, user, syncLocationToDB]);

  // ─── watchPosition au mount, clearWatch au unmount ──────────────────────────

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolocation API non supportée par ce navigateur');
      return;
    }

    const id = navigator.geolocation.watchPosition(
      (position) => {
        const loc = positionToDriverLocation(position);
        setLocation(prev => {
          if (!prev) return loc;
          const dLat = Math.abs(prev.latitude - loc.latitude);
          const dLng = Math.abs(prev.longitude - loc.longitude);
          if (dLat < 0.00005 && dLng < 0.00005) return prev;
          return loc;
        });
        setError(null);
        if (autoSync && user) syncLocationToDB(loc);
      },
      (err) => {
        const msg = `${err.code}: ${err.message}`;
        setError(msg);
        console.warn('[GPS watchPosition error]', msg);
        // On garde la dernière `location` connue (fallback ville si rien d'autre)
      },
      { enableHighAccuracy: true, timeout: 30000, maximumAge: 5000 }
    );

    watchIdRef.current = id;

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // ─── Sync périodique ────────────────────────────────────────────────────────

  useEffect(() => {
    if (!autoSync || !location || !user) return;
    const interval = setInterval(() => {
      syncLocationToDB(location);
    }, syncInterval);
    return () => clearInterval(interval);
  }, [autoSync, location, user, syncInterval, syncLocationToDB]);

  // ─── API compat (no-op : le watch démarre auto au mount) ────────────────────

  const startWatching = useCallback(async () => {
    /* no-op: watchPosition démarre déjà au mount */
  }, []);

  const stopWatching = useCallback(async () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }, []);

  return {
    location,
    loading,
    error,
    getCurrentPosition,
    startWatching,
    stopWatching,
    isWatching: watchIdRef.current !== null,
  };
};
