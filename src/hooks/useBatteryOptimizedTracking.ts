/**
 * Hook optimisé pour le tracking de localisation mobile avec gestion de batterie
 * Utilise les APIs natives Capacitor pour un tracking longue durée
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { Geolocation, Position, PositionOptions } from '@capacitor/geolocation';
import { Device } from '@capacitor/device';
import { LocalNotifications } from '@capacitor/local-notifications';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

export interface BatteryOptimizedTrackingOptions {
  enableBackgroundMode?: boolean;
  accuracyLevel?: 'high' | 'balanced' | 'low_power';
  updateIntervalMs?: number;
  distanceFilterMeters?: number;
  enableBatteryOptimization?: boolean;
  showNotification?: boolean;
  maxLocationAge?: number;
}

export interface LocationUpdate {
  latitude: number;
  longitude: number;
  accuracy: number;
  speed?: number;
  heading?: number;
  timestamp: number;
}

export interface TrackingStats {
  totalUpdates: number;
  batteryUsage: number;
  activeTimeMs: number;
  lastUpdate?: Date;
}

export function useBatteryOptimizedTracking(options: BatteryOptimizedTrackingOptions = {}) {
  const [isTracking, setIsTracking] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<LocationUpdate | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<TrackingStats>({
    totalUpdates: 0,
    batteryUsage: 0,
    activeTimeMs: 0
  });
  const [batteryLevel, setBatteryLevel] = useState<number>(100);
  const [networkStatus, setNetworkStatus] = useState<'online' | 'offline'>('online');

  const watchIdRef = useRef<string | null>(null);
  const lastLocationRef = useRef<LocationUpdate | null>(null);
  const startTimeRef = useRef<number>(0);
  const updateCountRef = useRef<number>(0);
  const offlineQueueRef = useRef<LocationUpdate[]>([]);
  const batteryIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const networkCleanupRef = useRef<(() => void) | null>(null);

  // Configuration par défaut selon le niveau d'accuracy
  const getTrackingOptions = useCallback((): PositionOptions => {
    const { accuracyLevel = 'balanced' } = options;
    
    const configs = {
      high: { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 },
      balanced: { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 },
      low_power: { enableHighAccuracy: false, timeout: 20000, maximumAge: 60000 }
    };

    return configs[accuracyLevel];
  }, [options.accuracyLevel]);

  // Initialiser les permissions et la surveillance de batterie
  useEffect(() => {
    initializeBatteryMonitoring();
    const networkCleanup = initializeNetworkMonitoring();
    networkCleanupRef.current = networkCleanup;

    return () => {
      if (watchIdRef.current) {
        stopTracking();
      }
      // Clear battery interval
      if (batteryIntervalRef.current) {
        clearInterval(batteryIntervalRef.current);
        batteryIntervalRef.current = null;
      }
      // Clear network listeners
      if (networkCleanupRef.current) {
        networkCleanupRef.current();
        networkCleanupRef.current = null;
      }
      offlineQueueRef.current = [];
    };
  }, []);

  const initializeBatteryMonitoring = async () => {
    try {
      if (Capacitor.isNativePlatform()) {
        const info = await Device.getBatteryInfo();
        setBatteryLevel(info.batteryLevel || 100);
        
        batteryIntervalRef.current = setInterval(async () => {
          try {
            const info = await Device.getBatteryInfo();
            setBatteryLevel(info.batteryLevel || 100);
          } catch (error) {
            logger.warn('Erreur lecture batterie:', error);
          }
        }, 60000);
      }
    } catch (error) {
      logger.warn('Impossible de surveiller la batterie:', error);
    }
  };

  const initializeNetworkMonitoring = (): (() => void) => {
    const updateNetworkStatus = () => {
      setNetworkStatus(navigator.onLine ? 'online' : 'offline');
    };

    window.addEventListener('online', updateNetworkStatus);
    window.addEventListener('offline', updateNetworkStatus);
    updateNetworkStatus();

    return () => {
      window.removeEventListener('online', updateNetworkStatus);
      window.removeEventListener('offline', updateNetworkStatus);
    };
  };

  const requestPermissions = async (): Promise<boolean> => {
    try {
      const { nativeGeolocationService } = await import('@/services/nativeGeolocationService');
      const hasPermission = await nativeGeolocationService.ensurePermissions();
      
      if (!hasPermission) {
        setError('Permission de géolocalisation refusée');
        return false;
      }

      if (options.enableBackgroundMode && Capacitor.isNativePlatform()) {
        try {
          if (options.showNotification) {
            await LocalNotifications.requestPermissions();
          }
        } catch (bgError) {
          logger.warn('Permissions arrière-plan non disponibles:', bgError);
        }
      }

      return true;
    } catch (error) {
      setError(`Erreur permissions: ${error}`);
      return false;
    }
  };

  const shouldUpdateLocation = (newLocation: LocationUpdate): boolean => {
    if (!lastLocationRef.current) return true;
    const { distanceFilterMeters = 10 } = options;
    const lastLoc = lastLocationRef.current;
    const distance = calculateDistance(lastLoc.latitude, lastLoc.longitude, newLocation.latitude, newLocation.longitude);
    return distance >= distanceFilterMeters;
  };

  const optimizeForBattery = (location: LocationUpdate): boolean => {
    if (!options.enableBatteryOptimization) return true;
    if (batteryLevel < 20) {
      const timeSinceLastUpdate = Date.now() - (lastLocationRef.current?.timestamp || 0);
      return timeSinceLastUpdate >= (options.updateIntervalMs || 30000) * 3;
    }
    if (batteryLevel < 50) {
      const timeSinceLastUpdate = Date.now() - (lastLocationRef.current?.timestamp || 0);
      return timeSinceLastUpdate >= (options.updateIntervalMs || 30000) * 1.5;
    }
    return true;
  };

  const handleLocationUpdate = useCallback(async (position: Position) => {
    const locationUpdate: LocationUpdate = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      speed: position.coords.speed || undefined,
      heading: position.coords.heading || undefined,
      timestamp: position.timestamp
    };

    if (!shouldUpdateLocation(locationUpdate) || !optimizeForBattery(locationUpdate)) {
      return;
    }

    setCurrentLocation(locationUpdate);
    lastLocationRef.current = locationUpdate;
    updateCountRef.current += 1;

    setStats(prev => ({
      ...prev,
      totalUpdates: updateCountRef.current,
      activeTimeMs: Date.now() - startTimeRef.current,
      lastUpdate: new Date(),
      batteryUsage: Math.max(0, 100 - batteryLevel)
    }));

    if (networkStatus === 'online') {
      if (locationUpdate.latitude === 0 && locationUpdate.longitude === 0) return;
      try {
        const { data: user } = await supabase.auth.getUser();
        if (user.user) {
          await processOfflineQueue();
          await supabase
            .from('driver_locations')
            .upsert({
              driver_id: user.user.id,
              latitude: locationUpdate.latitude,
              longitude: locationUpdate.longitude,
              accuracy: locationUpdate.accuracy,
              speed: locationUpdate.speed,
              heading: locationUpdate.heading,
              last_ping: new Date().toISOString(),
              is_online: true,
              is_available: true,
              updated_at: new Date().toISOString()
            });
        }
      } catch (error) {
        logger.error('Erreur sauvegarde position:', error);
        offlineQueueRef.current.push(locationUpdate);
        setError('Connexion instable - données en attente');
      }
    } else {
      offlineQueueRef.current.push(locationUpdate);
      setError('Mode hors ligne - données en attente de synchronisation');
    }

    setError(null);
  }, [options, batteryLevel]);

  const processOfflineQueue = async () => {
    if (offlineQueueRef.current.length === 0) return;
    try {
      const { data: user } = await supabase.auth.getUser();
      if (user.user) {
        const batchSize = 10;
        const batches = [];
        for (let i = 0; i < offlineQueueRef.current.length; i += batchSize) {
          batches.push(offlineQueueRef.current.slice(i, i + batchSize));
        }
        for (const batch of batches) {
          const locationUpdates = batch
            .filter(loc => loc.latitude !== 0 || loc.longitude !== 0)
            .map(loc => ({
              driver_id: user.user.id,
              latitude: loc.latitude,
              longitude: loc.longitude,
              accuracy: loc.accuracy,
              speed: loc.speed,
              heading: loc.heading,
              last_ping: new Date(loc.timestamp).toISOString(),
              is_online: true,
              is_available: true,
              updated_at: new Date().toISOString()
            }));
          if (locationUpdates.length > 0) await supabase.from('driver_locations').upsert(locationUpdates);
        }
        offlineQueueRef.current = [];
        logger.debug('Queue offline synchronisée avec succès');
      }
    } catch (error) {
      logger.error('Erreur synchronisation queue offline:', error);
    }
  };

  const handleLocationError = useCallback((error: any) => {
    logger.error('Erreur géolocalisation:', error);
    setError(`Erreur localisation: ${error.message}`);
  }, []);

  const startTracking = async (): Promise<boolean> => {
    try {
      const hasPermissions = await requestPermissions();
      if (!hasPermissions) return false;

      if (options.enableBackgroundMode && Capacitor.isNativePlatform()) {
        if (options.showNotification) {
          await LocalNotifications.schedule({
            notifications: [{ title: 'TAGA - Tracking actif', body: 'Votre position est suivie en arrière-plan', id: 1 }]
          });
        }
      }

      startTimeRef.current = Date.now();
      updateCountRef.current = 0;

      const watchId = await Geolocation.watchPosition(getTrackingOptions(), handleLocationUpdate);
      watchIdRef.current = watchId;
      setIsTracking(true);
      setError(null);
      return true;
    } catch (error) {
      setError(`Erreur démarrage tracking: ${error}`);
      return false;
    }
  };

  const stopTracking = async () => {
    try {
      if (watchIdRef.current) {
        await Geolocation.clearWatch({ id: watchIdRef.current });
        watchIdRef.current = null;
      }

      if (options.enableBackgroundMode && Capacitor.isNativePlatform()) {
        if (options.showNotification) {
          await LocalNotifications.cancel({ notifications: [{ id: 1 }] });
        }
      }

      setIsTracking(false);
      
      try {
        const { data: user } = await supabase.auth.getUser();
        if (user.user) {
          await supabase
            .from('driver_locations')
            .update({ is_online: false, last_ping: new Date().toISOString() })
            .eq('driver_id', user.user.id);
        }
      } catch (error) {
        logger.error('Erreur mise à jour statut offline:', error);
      }
    } catch (error) {
      setError(`Erreur arrêt tracking: ${error}`);
    }
  };

  const getCurrentPosition = async (): Promise<LocationUpdate | null> => {
    try {
      const { nativeGeolocationService } = await import('@/services/nativeGeolocationService');
      const pos = await nativeGeolocationService.getCurrentPosition({
        enableHighAccuracy: options.accuracyLevel === 'high',
        timeout: 10000,
        maximumAge: 5000
      });
      
      const locationUpdate: LocationUpdate = {
        latitude: pos.lat,
        longitude: pos.lng,
        accuracy: pos.accuracy,
        timestamp: pos.timestamp
      };

      setCurrentLocation(locationUpdate);
      return locationUpdate;
    } catch (error) {
      setError(`Erreur position actuelle: ${error}`);
      return null;
    }
  };

  useEffect(() => {
    if (networkStatus === 'online' && offlineQueueRef.current.length > 0) {
      processOfflineQueue();
    }
  }, [networkStatus]);

  return {
    isTracking,
    currentLocation,
    error,
    stats,
    batteryLevel,
    networkStatus,
    offlineQueueSize: offlineQueueRef.current.length,
    startTracking,
    stopTracking,
    getCurrentPosition,
    clearError: () => setError(null)
  };
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
