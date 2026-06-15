/**
 * 🎯 Hook pour géolocalisation réelle des chauffeurs
 * Architecture: WS primaire + polling conditionnel (mode Snapshot)
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { realLocationService, driverLocationAdapter } from '@/services/realLocationService';
import type { RealDriverLocation } from '@/types/realLocation';

/** Durée sans événement WS avant bascule polling (ms) */
const WS_SILENCE_THRESHOLD = 30_000;
/** Intervalle polling en mode Snapshot (ms) */
const SNAPSHOT_INTERVAL = 30_000;

interface UseRealDriverLocationProps {
  driverId: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

interface UseRealDriverLocationReturn {
  driverLocation: RealDriverLocation | null;
  loading: boolean;
  error: string | null;
  refreshLocation: () => Promise<void>;
  lastUpdate: string | null;
  googleAddress: string | null;
  isOnline: boolean;
  isAvailable: boolean;
  isSnapshotMode: boolean;
}

export const useRealDriverLocation = ({
  driverId,
  autoRefresh = true,
  refreshInterval = SNAPSHOT_INTERVAL,
}: UseRealDriverLocationProps): UseRealDriverLocationReturn => {
  const [driverLocation, setDriverLocation] = useState<RealDriverLocation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSnapshotMode, setIsSnapshotMode] = useState(false);

  const lastRealtimeUpdateRef = useRef<number>(Date.now());
  const snapshotIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadDriverLocation = useCallback(async () => {
    if (!driverId) {
      setError('ID chauffeur requis');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data: locationData, error: locationError } = await supabase
        .from('driver_locations')
        .select('*')
        .eq('driver_id', driverId)
        .maybeSingle();

      if (locationError) throw new Error(`Erreur Supabase: ${locationError.message}`);
      if (!locationData) throw new Error('Position du chauffeur non trouvée');

      const realLocation = await driverLocationAdapter.fromLegacy(locationData);
      setDriverLocation(realLocation);
    } catch (err: any) {
      console.error('useRealDriverLocation: Error:', err);
      setError(err.message || 'Erreur lors du chargement de la position');
    } finally {
      setLoading(false);
    }
  }, [driverId]);

  const refreshLocation = useCallback(async () => {
    await loadDriverLocation();
  }, [loadDriverLocation]);

  // Activer le polling conditionnel
  const startSnapshotMode = useCallback(() => {
    if (snapshotIntervalRef.current) return;
    setIsSnapshotMode(true);
    loadDriverLocation();
    snapshotIntervalRef.current = setInterval(loadDriverLocation, refreshInterval);
  }, [loadDriverLocation, refreshInterval]);

  const stopSnapshotMode = useCallback(() => {
    if (!snapshotIntervalRef.current) return;
    clearInterval(snapshotIntervalRef.current);
    snapshotIntervalRef.current = null;
    setIsSnapshotMode(false);
  }, []);

  // Chargement initial
  useEffect(() => {
    loadDriverLocation();
  }, [loadDriverLocation]);

  // Abonnement temps réel (source primaire)
  useEffect(() => {
    if (!driverId) return;

    lastRealtimeUpdateRef.current = Date.now();

    const channel = supabase
      .channel(`real-driver-location-${driverId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'driver_locations',
          filter: `driver_id=eq.${driverId}`,
        },
        async (payload) => {
          lastRealtimeUpdateRef.current = Date.now();
          stopSnapshotMode();
          try {
            const realLocation = await driverLocationAdapter.fromLegacy(payload.new);
            setDriverLocation(realLocation);
          } catch (err) {
            console.error('useRealDriverLocation: Error processing realtime update:', err);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [driverId, stopSnapshotMode]);

  // Watchdog: bascule en mode Snapshot si WS silencieux
  useEffect(() => {
    if (!autoRefresh || !driverId) return;

    const watchdog = setInterval(() => {
      const silence = Date.now() - lastRealtimeUpdateRef.current;
      if (silence > WS_SILENCE_THRESHOLD) {
        startSnapshotMode();
      }
    }, 15_000);

    return () => clearInterval(watchdog);
  }, [autoRefresh, driverId, startSnapshotMode]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (snapshotIntervalRef.current) clearInterval(snapshotIntervalRef.current);
    };
  }, []);

  // Nettoyage du cache expiré toutes les 5 minutes
  useEffect(() => {
    const cacheCleanup = setInterval(() => {
      realLocationService.clearExpiredCache();
    }, 5 * 60 * 1000);
    return () => clearInterval(cacheCleanup);
  }, []);

  return {
    driverLocation, loading, error, refreshLocation,
    lastUpdate: driverLocation?.lastUpdate || null,
    googleAddress: driverLocation?.googleAddress || null,
    isOnline: driverLocation?.status.isOnline || false,
    isAvailable: driverLocation?.status.isAvailable || false,
    isSnapshotMode,
  };
};

export const useDriverGoogleAddress = (driverId: string) => {
  const { driverLocation, loading, error } = useRealDriverLocation({
    driverId,
    autoRefresh: false,
  });

  return {
    googleAddress: driverLocation?.googleAddress || null,
    placeName: driverLocation?.googlePlaceName || null,
    loading,
    error,
  };
};

export const useMultipleDriverLocations = (driverIds: string[]) => {
  const [driversLocations, setDriversLocations] = useState<Map<string, RealDriverLocation>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (driverIds.length === 0) {
      setLoading(false);
      return;
    }

    const loadAllDrivers = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data: locationsData, error: locationsError } = await supabase
          .from('driver_locations')
          .select('*')
          .in('driver_id', driverIds);

        if (locationsError) throw new Error(`Erreur Supabase: ${locationsError.message}`);

        const locationsMap = new Map<string, RealDriverLocation>();
        for (const locationData of locationsData || []) {
          try {
            const realLocation = await driverLocationAdapter.fromLegacy(locationData);
            locationsMap.set(realLocation.driverId, realLocation);
          } catch (err) {
            console.warn('Failed to convert driver location:', err);
          }
        }
        setDriversLocations(locationsMap);
      } catch (err: any) {
        console.error('useMultipleDriverLocations: Error:', err);
        setError(err.message || 'Erreur lors du chargement des positions');
      } finally {
        setLoading(false);
      }
    };

    loadAllDrivers();
  }, [driverIds]);

  return { driversLocations, loading, error };
};
