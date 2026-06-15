import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { nativeGeolocationService, NativeLocationData } from '@/services/nativeGeolocationService';

interface TrackingState {
  isTracking: boolean;
  currentLocation: { lat: number; lng: number } | null;
  error: string | null;
  lastUpdate: Date | null;
  accuracy: number | null;
}

interface TrackingOptions {
  updateInterval?: number;
  highAccuracy?: boolean;
  maxAge?: number;
  timeout?: number;
}

export function useRealtimeTracking() {
  const [state, setState] = useState<TrackingState>({
    isTracking: false,
    currentLocation: null,
    error: null,
    lastUpdate: null,
    accuracy: null
  });

  const watchIdRef = useRef<string | null>(null);
  const channelRef = useRef<any>(null);
  const optionsRef = useRef<TrackingOptions>({});
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const positionBufferRef = useRef<Array<{ lat: number; lng: number; timestamp: number; accuracy: number }>>([]);

  const [adaptiveInterval, setAdaptiveInterval] = useState(10000);
  const lastPositionRef = useRef<{ lat: number; lng: number; timestamp: number } | null>(null);

  const calculateSpeed = useCallback((newPos: { lat: number; lng: number }, timestamp: number) => {
    if (!lastPositionRef.current) {
      lastPositionRef.current = { ...newPos, timestamp };
      return 0;
    }

    const last = lastPositionRef.current;
    const timeDiff = (timestamp - last.timestamp) / 1000;
    if (timeDiff < 1) return 0;

    const R = 6371000;
    const dLat = (newPos.lat - last.lat) * Math.PI / 180;
    const dLng = (newPos.lng - last.lng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(last.lat * Math.PI / 180) * Math.cos(newPos.lat * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    const speed = distance / timeDiff;
    lastPositionRef.current = { ...newPos, timestamp };
    return speed;
  }, []);

  const updateTrackingInterval = useCallback((speed: number) => {
    let newInterval;
    if (speed < 1) newInterval = 30000;
    else if (speed < 5) newInterval = 15000;
    else if (speed < 15) newInterval = 5000;
    else newInterval = 2000;

    if (newInterval !== adaptiveInterval) {
      setAdaptiveInterval(newInterval);
      console.log(`📱 Interval adapté: ${newInterval}ms (vitesse: ${(speed * 3.6).toFixed(1)} km/h)`);
    }
  }, [adaptiveInterval]);

  const updatePosition = useCallback(async (position: NativeLocationData) => {
    const newLocation = {
      lat: position.lat,
      lng: position.lng,
      accuracy: position.accuracy || 0,
      timestamp: Date.now()
    };

    const speed = calculateSpeed(newLocation, newLocation.timestamp);
    updateTrackingInterval(speed);

    positionBufferRef.current.push(newLocation);
    if (positionBufferRef.current.length > 20) {
      positionBufferRef.current = positionBufferRef.current.slice(-10);
    }

    setState(prev => ({
      ...prev,
      currentLocation: { lat: newLocation.lat, lng: newLocation.lng },
      lastUpdate: new Date(),
      accuracy: newLocation.accuracy,
      error: null
    }));

    const shouldUpdate = !lastPositionRef.current || 
                        speed > 0.5 ||
                        Date.now() - (lastPositionRef.current?.timestamp || 0) > 60000;

    if (shouldUpdate) {
      if (newLocation.lat === 0 && newLocation.lng === 0) return;
      try {
        const { error } = await supabase
          .from('driver_locations')
          .upsert({
            driver_id: (await supabase.auth.getUser()).data.user?.id,
            latitude: newLocation.lat,
            longitude: newLocation.lng,
            accuracy: newLocation.accuracy,
            last_ping: new Date().toISOString(),
            is_online: true
          });

        if (error) {
          console.error('❌ Erreur mise à jour position:', error);
        } else {
          console.log('📍 Position mise à jour:', { lat: newLocation.lat, lng: newLocation.lng, accuracy: newLocation.accuracy });
        }
      } catch (updateError) {
        console.error('❌ Erreur réseau position:', updateError);
      }
    }
  }, [calculateSpeed, updateTrackingInterval]);

  const setupReconnection = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    reconnectTimeoutRef.current = setTimeout(() => {
      console.log('🔄 Tentative de reconnexion au tracking...');
      if (state.isTracking) {
        stopTracking();
        setTimeout(() => startTracking(optionsRef.current), 1000);
      }
    }, 30000);
  }, [state.isTracking]);

  const startTracking = useCallback(async (options: TrackingOptions = {}) => {
    console.log('🚀 Démarrage du tracking temps réel via nativeGeolocationService');
    optionsRef.current = options;

    setState(prev => ({ ...prev, isTracking: true, error: null }));

    try {
      watchIdRef.current = await nativeGeolocationService.watchPosition(
        updatePosition,
        (error) => {
          console.error('❌ Erreur tracking GPS:', error);
          if (error.message.includes('Timeout') || error.message.includes('lent')) {
            setupReconnection();
            return;
          }
          setState(prev => ({ ...prev, error: error.message }));
        },
        {
          enableHighAccuracy: options.highAccuracy ?? true,
          timeout: options.timeout || 15000,
          maximumAge: options.maxAge || 10000
        }
      );
    } catch (err: any) {
      console.error('❌ Impossible de démarrer le tracking:', err);
      setState(prev => ({ ...prev, error: err.message, isTracking: false }));
      toast.error(err.message);
      return;
    }

    setupRealtimeConnection();
  }, [updatePosition, setupReconnection]);

  const setupRealtimeConnection = useCallback(() => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }
    channelRef.current = supabase
      .channel('driver-tracking')
      .on('presence', { event: 'sync' }, () => {
        console.log('📡 Connexion temps réel synchronisée');
      })
      .on('presence', { event: 'join' }, ({ key }) => {
        console.log('👋 Nouveau chauffeur connecté:', key);
      })
      .on('presence', { event: 'leave' }, ({ key }) => {
        console.log('👋 Chauffeur déconnecté:', key);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          const user = (await supabase.auth.getUser()).data.user;
          if (user) {
            await channelRef.current?.track({
              driver_id: user.id,
              online_at: new Date().toISOString(),
              status: 'tracking'
            });
            console.log('📡 Connecté au canal temps réel');
          }
        } else if (status === 'CHANNEL_ERROR') {
          console.warn('⚠️ Erreur canal temps réel, reconnexion...');
          setupReconnection();
        }
      });
  }, [setupReconnection]);

  const stopTracking = useCallback(async () => {
    console.log('🛑 Arrêt du tracking temps réel');
    setState(prev => ({ ...prev, isTracking: false }));

    if (watchIdRef.current !== null) {
      await nativeGeolocationService.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (channelRef.current) {
      await channelRef.current.untrack();
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (user) {
        await supabase
          .from('driver_locations')
          .update({ is_online: false, last_ping: new Date().toISOString() })
          .eq('driver_id', user.id);
      }
    } catch (error) {
      console.error('❌ Erreur lors de la mise hors ligne:', error);
    }

    positionBufferRef.current = [];
    lastPositionRef.current = null;
  }, []);

  const getNearbyDrivers = useCallback(async (radius: number = 5): Promise<any[]> => {
    if (!state.currentLocation) return [];
    try {
      // ✅ Corrected RPC parameters: p_lat, p_lng, p_max_distance_km
      const { data, error } = await supabase.rpc('find_nearby_drivers', {
        p_lat: state.currentLocation.lat,
        p_lng: state.currentLocation.lng,
        p_max_distance_km: radius
      });
      if (error) { console.error('❌ Erreur recherche chauffeurs proches:', error); return []; }
      return data || [];
    } catch (error) { console.error('❌ Erreur réseau chauffeurs proches:', error); return []; }
  }, [state.currentLocation]);

  useEffect(() => {
    return () => { stopTracking(); };
  }, [stopTracking]);

  return {
    ...state,
    startTracking,
    stopTracking,
    getNearbyDrivers,
    adaptiveInterval,
    positionBuffer: positionBufferRef.current
  };
}
