/**
 * 📍 Hook de Géolocalisation Chauffeur Temps Réel
 * ✅ v4: watchId as string (native), no Number conversion
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface DriverLocation {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

interface UseDriverLocationReturn {
  isTracking: boolean;
  currentLocation: DriverLocation | null;
  error: string | null;
  startTracking: () => Promise<void>;
  stopTracking: () => Promise<void>;
  updateLocationNow: () => Promise<void>;
}

const SYNC_INTERVAL = 10000;
const MAX_ACCURACY = 100;

export const useDriverLocation = (): UseDriverLocationReturn => {
  const { user } = useAuth();
  
  const [isTracking, setIsTracking] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<DriverLocation | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // ✅ v4: watchId as string (native Capacitor returns string)
  const watchIdRef = useRef<string | null>(null);
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastSyncRef = useRef<number>(0);
  const currentLocationRef = useRef<DriverLocation | null>(null);

  const syncLocationToBackend = useCallback(async (location: DriverLocation) => {
    if (!user) return;

    const { data: partner } = await supabase
      .from('partner_drivers')
      .select('id')
      .eq('driver_id', user.id)
      .eq('status', 'active')
      .maybeSingle();

    if (!partner) {
      console.warn('Chauffeur sans partenaire, sync ignoré');
      return;
    }

    if (location.latitude === 0 && location.longitude === 0) return;

    try {
      // ⚠️ is_online/is_available retirés — gérés par useDriverStatus.goOnline/goOffline
      const { error: updateError } = await supabase
        .from('driver_locations')
        .upsert({
          driver_id: user.id,
          latitude: location.latitude, longitude: location.longitude,
          accuracy: location.accuracy,
          last_ping: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, { onConflict: 'driver_id' });

      if (updateError) throw updateError;
      lastSyncRef.current = Date.now();
    } catch (err) {
      console.error('Sync error:', err);
      setError('Erreur de synchronisation GPS');
    }
  }, [user]);

  const handlePositionUpdate = useCallback((position: { lat: number; lng: number; accuracy: number; timestamp: number }) => {
    const newLocation: DriverLocation = {
      latitude: position.lat, longitude: position.lng,
      accuracy: position.accuracy, timestamp: position.timestamp
    };

    if (position.accuracy <= MAX_ACCURACY) {
      setCurrentLocation(newLocation);
      currentLocationRef.current = newLocation;
      setError(null);
      if (Date.now() - lastSyncRef.current >= SYNC_INTERVAL) {
        syncLocationToBackend(newLocation);
      }
    } else {
      console.warn('⚠️ Position ignorée (accuracy trop faible):', position.accuracy.toFixed(0), 'm');
    }
  }, [syncLocationToBackend]);

  const startTracking = useCallback(async () => {
    if (!user) {
      toast.error('Vous devez être connecté pour activer le tracking GPS');
      return;
    }

    try {
      const { nativeGeolocationService } = await import('@/services/nativeGeolocationService');
      
      const nativePosition = await nativeGeolocationService.getCurrentPosition({
        enableHighAccuracy: true, timeout: 10000, maximumAge: 0
      });
      
      handlePositionUpdate(nativePosition);
      console.log(`📍 Tracking démarré (${nativePosition.source})`);

      // ✅ v4: Store watchId as string directly (no Number conversion)
      const watchId = await nativeGeolocationService.watchPosition(
        (pos) => handlePositionUpdate(pos),
        (err) => {
          console.error('Watch error:', err);
          setError(err.message);
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
      watchIdRef.current = watchId;

      syncIntervalRef.current = setInterval(() => {
        if (currentLocationRef.current) syncLocationToBackend(currentLocationRef.current);
      }, SYNC_INTERVAL);

      setIsTracking(true);
      toast.success(`📍 Localisation activée (${nativePosition.source === 'capacitor' ? 'GPS natif' : 'GPS'})`);
      
    } catch (err: any) {
      console.error('❌ Erreur startTracking:', err);
      setError(err.message || 'Erreur GPS');
      toast.error(err.message || 'Erreur de géolocalisation');
    }
  }, [user, handlePositionUpdate, syncLocationToBackend]);

  const stopTracking = useCallback(async () => {
    // ✅ v4: clearWatch with string watchId directly
    if (watchIdRef.current !== null) {
      try {
        const { nativeGeolocationService } = await import('@/services/nativeGeolocationService');
        await nativeGeolocationService.clearWatch(watchIdRef.current);
      } catch (e) {
        console.warn('clearWatch fallback:', e);
      }
      watchIdRef.current = null;
    }

    if (syncIntervalRef.current) {
      clearInterval(syncIntervalRef.current);
      syncIntervalRef.current = null;
    }

    if (user) {
      await supabase.from('driver_locations').update({
        is_online: false, is_available: false,
        last_ping: new Date().toISOString()
      }).eq('driver_id', user.id);
    }

    setIsTracking(false);
    setCurrentLocation(null);
    toast.info('📍 Localisation désactivée');
  }, [user]);

  const updateLocationNow = useCallback(async () => {
    if (!isTracking) {
      toast.error('Le tracking GPS n\'est pas actif');
      return;
    }
    try {
      const { nativeGeolocationService } = await import('@/services/nativeGeolocationService');
      const nativePosition = await nativeGeolocationService.getCurrentPosition({
        enableHighAccuracy: true, timeout: 10000, maximumAge: 0
      });
      handlePositionUpdate(nativePosition);
      await syncLocationToBackend({
        latitude: nativePosition.lat, longitude: nativePosition.lng,
        accuracy: nativePosition.accuracy, timestamp: nativePosition.timestamp
      });
      toast.success(`📍 Position mise à jour`);
    } catch (err: any) {
      setError(err.message || 'Erreur GPS');
      toast.error(err.message || 'Erreur de mise à jour position');
    }
  }, [isTracking, handlePositionUpdate, syncLocationToBackend]);

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        import('@/services/nativeGeolocationService').then(({ nativeGeolocationService }) => {
          nativeGeolocationService.clearWatch(watchIdRef.current!).catch(() => {});
        }).catch(() => {});
      }
      if (syncIntervalRef.current) clearInterval(syncIntervalRef.current);
    };
  }, []);

  return { isTracking, currentLocation, error, startTracking, stopTracking, updateLocationNow };
};
