/**
 * 📍 Hook de Tracking Temps Réel du Chauffeur
 * Architecture: WS primaire + HTTP fallback conditionnel (mode Snapshot)
 * 
 * - En conditions normales: 0 requête HTTP (WS uniquement)
 * - Si WS silencieux >30s: bascule polling HTTP toutes les 15s
 * - Dès que WS reprend: arrêt immédiat du polling
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeTrackingData, DriverLocationUpdate } from '@/types/map';
import { toast } from 'sonner';

interface UseRealtimeDriverTrackingOptions {
  bookingId: string;
  clientPosition: { lat: number; lng: number };
  autoCenter?: boolean;
}

/** Durée sans événement WS avant bascule en mode Snapshot (ms) */
const WS_SILENCE_THRESHOLD = 30_000;
/** Intervalle du polling HTTP en mode Snapshot (ms) */
const SNAPSHOT_INTERVAL = 15_000;
/** Intervalle du watchdog qui vérifie la santé du WS (ms) */
const WATCHDOG_INTERVAL = 15_000;

export const useRealtimeDriverTracking = ({
  bookingId,
  clientPosition,
  autoCenter = true
}: UseRealtimeDriverTrackingOptions) => {
  const [trackingData, setTrackingData] = useState<RealtimeTrackingData>({
    driverLocation: null,
    eta: null,
    distance: null,
    isMoving: false,
    lastUpdate: null
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [driverId, setDriverId] = useState<string | null>(null);
  const [isSnapshotMode, setIsSnapshotMode] = useState(false);

  // Refs pour le système de fallback
  const lastRealtimeUpdateRef = useRef<number>(Date.now());
  const snapshotIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Calculer la distance Haversine entre deux points
  const calculateDistance = useCallback((
    lat1: number, lng1: number, lat2: number, lng2: number
  ): number => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) *
      Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }, []);

  const calculateETA = useCallback((distanceKm: number, averageSpeedKmh: number = 30): number => {
    return Math.round((distanceKm / averageSpeedKmh) * 60);
  }, []);

  // Récupérer le driver_id depuis la réservation
  const fetchDriverId = useCallback(async () => {
    try {
      const { data, error: bookingError } = await supabase
        .from('transport_bookings')
        .select('driver_id')
        .eq('id', bookingId)
        .single();

      if (bookingError) throw bookingError;
      if (data?.driver_id) {
        setDriverId(data.driver_id);
      } else {
        console.warn('⚠️ Aucun chauffeur assigné pour cette réservation');
      }
    } catch (err) {
      console.error('❌ Erreur récupération driver_id:', err);
      setError('Impossible de trouver le chauffeur');
    }
  }, [bookingId]);

  // Récupérer la position du chauffeur (HTTP snapshot)
  const fetchDriverLocation = useCallback(async () => {
    if (!driverId) return;

    try {
      const { data, error: locationError } = await supabase
        .from('driver_locations')
        .select('*')
        .eq('driver_id', driverId)
        .single();

      if (locationError) {
        console.error('❌ Erreur location chauffeur:', locationError);
        return;
      }

      if (data && data.latitude && data.longitude) {
        const driverLocation: DriverLocationUpdate = {
          lat: data.latitude,
          lng: data.longitude,
          heading: data.heading,
          speed: data.speed,
          timestamp: data.updated_at,
          is_online: data.is_online,
          is_available: data.is_available
        };

        const distance = calculateDistance(
          clientPosition.lat, clientPosition.lng,
          driverLocation.lat, driverLocation.lng
        );
        const eta = calculateETA(distance, driverLocation.speed || 30);
        const isMoving = (driverLocation.speed || 0) > 0.5;

        setTrackingData({
          driverLocation, eta, distance, isMoving,
          lastUpdate: new Date()
        });

        setIsLoading(false);
        setError(null);
      }
    } catch (err) {
      console.error('❌ Erreur tracking:', err);
      setError('Erreur lors du suivi du chauffeur');
    }
  }, [driverId, clientPosition, calculateDistance, calculateETA]);

  // Activer le mode Snapshot (polling HTTP conditionnel)
  const startSnapshotMode = useCallback(() => {
    if (snapshotIntervalRef.current) return; // déjà actif
    console.log('📡 Mode Snapshot activé — polling HTTP toutes les 15s');
    setIsSnapshotMode(true);
    fetchDriverLocation(); // snapshot immédiat
    snapshotIntervalRef.current = setInterval(fetchDriverLocation, SNAPSHOT_INTERVAL);
  }, [fetchDriverLocation]);

  // Désactiver le mode Snapshot
  const stopSnapshotMode = useCallback(() => {
    if (!snapshotIntervalRef.current) return;
    console.log('🔌 Mode Snapshot désactivé — retour WS');
    clearInterval(snapshotIntervalRef.current);
    snapshotIntervalRef.current = null;
    setIsSnapshotMode(false);
  }, []);

  // Marquer une réception WS réussie
  const markRealtimeReceived = useCallback(() => {
    lastRealtimeUpdateRef.current = Date.now();
    stopSnapshotMode();
  }, [stopSnapshotMode]);

  // Initialisation: récupérer le driver_id
  useEffect(() => {
    fetchDriverId();
  }, [fetchDriverId]);

  // Fetch initial unique (pas de polling permanent)
  useEffect(() => {
    if (!driverId) return;
    fetchDriverLocation();
  }, [driverId, fetchDriverLocation]);

  // Abonnement temps réel Supabase (source primaire)
  useEffect(() => {
    if (!driverId) return;

    console.log('🔔 Abonnement temps réel activé pour driver:', driverId);
    lastRealtimeUpdateRef.current = Date.now();

    const channel = supabase
      .channel(`driver-location-${driverId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'driver_locations',
          filter: `driver_id=eq.${driverId}`
        },
        (payload) => {
          markRealtimeReceived();
          fetchDriverLocation();

          if (trackingData.distance && trackingData.distance < 0.5) {
            toast.info('Votre chauffeur arrive dans moins de 500m !', {
              duration: 5000
            });
          }
        }
      )
      .subscribe();

    return () => {
      console.log('🔕 Désabonnement du tracking temps réel');
      supabase.removeChannel(channel);
    };
  }, [driverId, fetchDriverLocation, markRealtimeReceived, trackingData.distance]);

  // Watchdog: vérifie la santé du WS toutes les 15s
  useEffect(() => {
    if (!driverId) return;

    const watchdog = setInterval(() => {
      const silenceDuration = Date.now() - lastRealtimeUpdateRef.current;
      if (silenceDuration > WS_SILENCE_THRESHOLD) {
        startSnapshotMode();
      }
    }, WATCHDOG_INTERVAL);

    return () => clearInterval(watchdog);
  }, [driverId, startSnapshotMode]);

  // Cleanup du snapshot interval au démontage
  useEffect(() => {
    return () => {
      if (snapshotIntervalRef.current) {
        clearInterval(snapshotIntervalRef.current);
      }
    };
  }, []);

  // Notification quand le chauffeur arrive
  useEffect(() => {
    if (trackingData.distance && trackingData.distance < 0.1) {
      toast.success('Votre chauffeur est arrivé ! 🎉', {
        duration: 10000
      });
    }
  }, [trackingData.distance]);

  return {
    ...trackingData,
    isLoading,
    error,
    isSnapshotMode,
    refresh: fetchDriverLocation
  };
};
