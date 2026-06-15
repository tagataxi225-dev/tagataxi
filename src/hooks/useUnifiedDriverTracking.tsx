import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { nativeGeolocationService, NativeLocationData } from '@/services/nativeGeolocationService';

interface DriverStatus {
  isOnline: boolean;
  isAvailable: boolean;
  latitude: number | null;
  longitude: number | null;
  serviceTypes: string[];
  vehicleClass: string | null;
  lastUpdate: Date | null;
}

interface UseUnifiedDriverTrackingOptions {
  enableBackgroundTracking?: boolean;
  updateInterval?: number;
  accuracyThreshold?: number;
  batteryOptimized?: boolean;
}

export const useUnifiedDriverTracking = (options: UseUnifiedDriverTrackingOptions = {}) => {
  const {
    enableBackgroundTracking = true,
    updateInterval = 30000,
    accuracyThreshold = 50,
    batteryOptimized = true
  } = options;

  const [status, setStatus] = useState<DriverStatus>({
    isOnline: false, isAvailable: false,
    latitude: null, longitude: null,
    serviceTypes: [], vehicleClass: null, lastUpdate: null
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trackingEnabled, setTrackingEnabled] = useState(false);
  
  const locationWatcherRef = useRef<string | null>(null);
  const updateTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastLocationRef = useRef<{ lat: number; lng: number } | null>(null);

  const updateDriverLocation = useCallback(async (latitude: number, longitude: number, forceUpdate = false) => {
    if (latitude === 0 && longitude === 0) return false;

    try {
      if (!forceUpdate && lastLocationRef.current && batteryOptimized) {
        const distance = calculateDistance(lastLocationRef.current.lat, lastLocationRef.current.lng, latitude, longitude);
        if (distance < accuracyThreshold) return true;
      }

      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Utilisateur non connecté');

      // ⚠️ is_online/is_available/vehicle_class retirés — gérés ailleurs (useDriverStatus + profil)
      const { error: updateError } = await supabase
        .from('driver_locations')
        .upsert({
          driver_id: user.user.id, latitude, longitude,
          last_ping: new Date().toISOString(), updated_at: new Date().toISOString()
        });

      if (updateError) throw updateError;

      lastLocationRef.current = { lat: latitude, lng: longitude };
      setStatus(prev => ({ ...prev, latitude, longitude, lastUpdate: new Date() }));
      return true;
    } catch (err) {
      console.error('❌ Erreur mise à jour position:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      return false;
    }
  }, [status.isOnline, status.isAvailable, status.vehicleClass, accuracyThreshold, batteryOptimized]);

  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371000;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    return 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)) * R;
  };

  const startLocationTracking = useCallback(async () => {
    try {
      locationWatcherRef.current = await nativeGeolocationService.watchPosition(
        (position: NativeLocationData) => {
          updateDriverLocation(position.lat, position.lng);
          setError(null);
        },
        (err: Error) => {
          console.warn('⚠️ Erreur GPS:', err);
          setError(`Erreur GPS: ${err.message}`);
        },
        {
          enableHighAccuracy: !batteryOptimized,
          timeout: batteryOptimized ? 15000 : 10000,
          maximumAge: batteryOptimized ? 60000 : 30000
        }
      );
      setTrackingEnabled(true);
      return true;
    } catch (err: any) {
      console.error('❌ Impossible de démarrer le tracking:', err);
      setError(err.message);
      return false;
    }
  }, [updateDriverLocation, batteryOptimized]);

  const stopLocationTracking = useCallback(async () => {
    if (locationWatcherRef.current) {
      await nativeGeolocationService.clearWatch(locationWatcherRef.current);
      locationWatcherRef.current = null;
    }
    if (updateTimerRef.current) {
      clearInterval(updateTimerRef.current);
      updateTimerRef.current = null;
    }
    setTrackingEnabled(false);
  }, []);

  // ✅ v4: updateStatus — NO Kinshasa fallback, require real GPS position
  const updateStatus = useCallback(async (newStatus: Partial<DriverStatus>) => {
    setLoading(true);
    setError(null);
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Utilisateur non connecté');

      const updatedStatus = { ...status, ...newStatus };

      const lat = updatedStatus.latitude ?? 0;
      const lng = updatedStatus.longitude ?? 0;

      if (lat === 0 && lng === 0) {
        setError('GPS invalide (0,0)');
        return false;
      }

      // ⚠️ is_online/is_available/vehicle_class retirés — gérés ailleurs (useDriverStatus + profil)
      const { error: updateError } = await supabase
        .from('driver_locations')
        .upsert({
          driver_id: user.user.id,
          latitude: lat, longitude: lng,
          last_ping: new Date().toISOString(), updated_at: new Date().toISOString()
        });

      if (updateError) throw updateError;
      setStatus({ ...updatedStatus, lastUpdate: new Date() });

      if (updatedStatus.isOnline && enableBackgroundTracking && !trackingEnabled) {
        startLocationTracking();
      } else if (!updatedStatus.isOnline && trackingEnabled) {
        stopLocationTracking();
      }

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [status, enableBackgroundTracking, trackingEnabled, startLocationTracking, stopLocationTracking]);

  const goOnline = useCallback(async () => {
    let lat = status.latitude;
    let lng = status.longitude;

    if (!lat || !lng) {
      try {
        const pos = await nativeGeolocationService.getCurrentPosition({ enableHighAccuracy: true, timeout: 10000 });
        if (!pos || (pos.lat === 0 && pos.lng === 0)) {
          return false;
        }
        lat = pos.lat;
        lng = pos.lng;
      } catch {
        return false;
      }
    }

    return updateStatus({ isOnline: true, isAvailable: true, latitude: lat, longitude: lng });
  }, [updateStatus, status.latitude, status.longitude]);
  const goOffline = useCallback(() => updateStatus({ isOnline: false, isAvailable: false }), [updateStatus]);
  const setAvailable = useCallback((isAvailable: boolean) => {
    if (!status.isOnline && isAvailable) return Promise.resolve(false);
    return updateStatus({ isAvailable });
  }, [status.isOnline, updateStatus]);

  useEffect(() => {
    const loadInitialStatus = async () => {
      setLoading(true);
      try {
        const { data: user } = await supabase.auth.getUser();
        if (!user.user) return;
        const { data: driverLocation, error } = await supabase
          .from('driver_locations').select('*').eq('driver_id', user.user.id).single();
        if (error && error.code !== 'PGRST116') throw error;
        if (driverLocation) {
          setStatus({
            isOnline: driverLocation.is_online || false,
            isAvailable: driverLocation.is_available || false,
            latitude: driverLocation.latitude, longitude: driverLocation.longitude,
            serviceTypes: ['transport'],
            vehicleClass: driverLocation.vehicle_class || 'standard',
            lastUpdate: driverLocation.updated_at ? new Date(driverLocation.updated_at) : null
          });
          if (driverLocation.is_online && enableBackgroundTracking) startLocationTracking();
        }
      } catch (err) {
        console.error('❌ Erreur chargement statut:', err);
        setError(err instanceof Error ? err.message : 'Erreur');
      } finally { setLoading(false); }
    };
    loadInitialStatus();
  }, [enableBackgroundTracking, startLocationTracking]);

  useEffect(() => { return () => { stopLocationTracking(); }; }, [stopLocationTracking]);

  return {
    status, loading, error, trackingEnabled,
    updateStatus, updateDriverLocation,
    goOnline, goOffline, setAvailable,
    startLocationTracking, stopLocationTracking
  };
};
