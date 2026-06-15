/**
 * 🎯 SYNCHRONISATION AUTOMATIQUE POSITION CHAUFFEUR
 * Utilise nativeGeolocationService pour Android/iOS/Web
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { nativeGeolocationService, NativeLocationData } from '@/services/nativeGeolocationService';

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  speed?: number;
  heading?: number;
  timestamp: number;
}

interface UseDriverLocationSyncOptions {
  enabled?: boolean;
  updateInterval?: number;
  highAccuracy?: boolean;
  minDistance?: number;
}

export function useDriverLocationSync({
  enabled = true,
  updateInterval = 10000,
  highAccuracy = true,
  minDistance = 20
}: UseDriverLocationSyncOptions = {}) {
  const { user } = useAuth();
  const { userRole } = useUserRole();
  
  const [isTracking, setIsTracking] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [syncCount, setSyncCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  const watchIdRef = useRef<string | null>(null);
  const lastLocationRef = useRef<LocationData | null>(null);
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const syncLocationToDatabase = useCallback(async (location: LocationData) => {
    if (!user || userRole !== 'chauffeur') return false;

    try {
      const shouldSync = !lastLocationRef.current || 
        calculateDistance(lastLocationRef.current, location) >= minDistance;

      if (!shouldSync) {
        console.log('🎯 Position inchangée, pas de sync nécessaire');
        return true;
      }

      console.log('📍 Synchronisation position chauffeur:', {
        lat: location.latitude.toFixed(6),
        lng: location.longitude.toFixed(6),
        accuracy: Math.round(location.accuracy),
        speed: location.speed ? Math.round(location.speed * 3.6) + ' km/h' : 'N/A'
      });

      let googleAddress = null;
      let googlePlaceName = null;
      let googlePlaceId = null;

      try {
        const { data: geocodeData } = await supabase.functions.invoke('geocode-proxy', {
          body: { lat: location.latitude, lng: location.longitude, language: 'fr' }
        });
        if (geocodeData?.results?.[0]) {
          const result = geocodeData.results[0];
          googleAddress = result.formatted_address;
          googlePlaceId = result.place_id;
          const nameComponent = result.address_components?.find((comp: any) => 
            comp.types.includes('point_of_interest') || 
            comp.types.includes('establishment') ||
            comp.types.includes('sublocality')
          );
          googlePlaceName = nameComponent?.long_name || null;
        }
      } catch (geocodeError) {
        console.warn('⚠️ Géocodage échoué, position brute enregistrée');
      }

      // ✅ PHASE 3: Only update position data — NOT is_online/is_available
      // useDriverStatus is the single source of truth for availability state
      const { error: upsertError } = await supabase
        .from('driver_locations')
        .update({
          latitude: location.latitude,
          longitude: location.longitude,
          accuracy: location.accuracy,
          speed: location.speed || null,
          heading: location.heading || null,
          google_address: googleAddress,
          google_place_name: googlePlaceName,
          google_place_id: googlePlaceId,
          google_geocoded_at: googleAddress ? new Date().toISOString() : null,
          geocode_source: googleAddress ? 'google' : 'none',
          last_ping: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('driver_id', user.id);

      if (upsertError) throw upsertError;

      lastLocationRef.current = location;
      setCurrentLocation(location);
      setLastSyncTime(new Date());
      setSyncCount(prev => prev + 1);
      setError(null);
      return true;
    } catch (err) {
      console.error('❌ Erreur sync position:', err);
      setError(err instanceof Error ? err.message : 'Erreur de synchronisation');
      return false;
    }
  }, [user, userRole, minDistance]);

  const startLocationTracking = useCallback(async () => {
    if (!enabled || !user || userRole !== 'chauffeur') return false;

    console.log('🚀 Démarrage tracking position chauffeur via nativeGeolocationService');

    try {
      watchIdRef.current = await nativeGeolocationService.watchPosition(
        (position: NativeLocationData) => {
          const location: LocationData = {
            latitude: position.lat,
            longitude: position.lng,
            accuracy: position.accuracy,
            timestamp: position.timestamp
          };
          syncLocationToDatabase(location);
        },
        (err: Error) => {
          console.error('❌ Erreur géolocalisation:', err);
          setError(err.message);
        },
        {
          enableHighAccuracy: highAccuracy,
          timeout: 15000,
          maximumAge: 5000
        }
      );

      setIsTracking(true);
      setError(null);
      return true;
    } catch (err: any) {
      console.error('❌ Impossible de démarrer le tracking:', err);
      setError(err.message);
      return false;
    }
  }, [enabled, user, userRole, highAccuracy, syncLocationToDatabase]);

  const stopLocationTracking = useCallback(async () => {
    console.log('🛑 Arrêt tracking position chauffeur');

    if (watchIdRef.current !== null) {
      await nativeGeolocationService.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    if (syncIntervalRef.current) {
      clearInterval(syncIntervalRef.current);
      syncIntervalRef.current = null;
    }

    setIsTracking(false);
    
    // ✅ PHASE 3: Don't force offline here. 
    // useDriverStatus handles the online/offline state.
    // This hook only manages the GPS stream.
  }, []);

  const calculateDistance = useCallback((pos1: LocationData, pos2: LocationData): number => {
    const R = 6371000;
    const dLat = (pos2.latitude - pos1.latitude) * Math.PI / 180;
    const dLng = (pos2.longitude - pos1.longitude) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(pos1.latitude * Math.PI / 180) * Math.cos(pos2.latitude * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }, []);

  const getTrackingStatus = useCallback(() => {
    if (!enabled) return 'disabled';
    if (error) return 'error';
    if (isTracking) return 'active';
    return 'inactive';
  }, [enabled, error, isTracking]);

  const getLastUpdateText = useCallback(() => {
    if (!lastSyncTime) return 'Jamais synchronisé';
    const now = new Date();
    const diffMs = now.getTime() - lastSyncTime.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 60) return `il y a ${diffSec}s`;
    if (diffSec < 3600) return `il y a ${Math.floor(diffSec / 60)}min`;
    return `il y a ${Math.floor(diffSec / 3600)}h`;
  }, [lastSyncTime]);

  useEffect(() => {
    if (enabled && user && userRole === 'chauffeur' && !isTracking) {
      startLocationTracking();
    } else if ((!enabled || userRole !== 'chauffeur') && isTracking) {
      stopLocationTracking();
    }
    return () => { if (isTracking) stopLocationTracking(); };
  }, [enabled, user, userRole, isTracking, startLocationTracking, stopLocationTracking]);

  useEffect(() => {
    if (isTracking && updateInterval > 0) {
      syncIntervalRef.current = setInterval(() => {
        if (currentLocation) {
          console.log('🔄 Sync périodique de sauvegarde');
          syncLocationToDatabase(currentLocation);
        }
      }, updateInterval);
      return () => { if (syncIntervalRef.current) clearInterval(syncIntervalRef.current); };
    }
  }, [isTracking, updateInterval, currentLocation, syncLocationToDatabase]);

  useEffect(() => {
    return () => { stopLocationTracking(); };
  }, [stopLocationTracking]);

  return {
    isTracking, currentLocation, lastSyncTime, syncCount, error,
    status: getTrackingStatus(), lastUpdateText: getLastUpdateText(),
    startTracking: startLocationTracking, stopTracking: stopLocationTracking,
    calculateDistance
  };
}
