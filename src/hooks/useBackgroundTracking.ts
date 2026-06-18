import { useCallback, useEffect, useRef, useState } from 'react';
import { Capacitor, registerPlugin } from '@capacitor/core';
import { Geolocation, Position } from '@capacitor/geolocation';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useDriverStatus } from './useDriverStatus';

const DISCLOSURE_KEY = 'kwenda_bg_location_disclosure_accepted';
const SESSION_DECLINED_KEY = 'kwenda_bg_disclosure_declined';

const hasDisclosureConsent = (): boolean => {
  try { return localStorage.getItem(DISCLOSURE_KEY) === 'true'; } catch { return false; }
};

const storeDisclosureConsent = () => {
  try { localStorage.setItem(DISCLOSURE_KEY, 'true'); } catch {}
};

const hasSessionDeclined = (): boolean => {
  try { return sessionStorage.getItem(SESSION_DECLINED_KEY) === 'true'; } catch { return false; }
};

const storeSessionDeclined = () => {
  try { sessionStorage.setItem(SESSION_DECLINED_KEY, 'true'); } catch {}
};

export interface BackgroundTrackingOptions {
  distanceFilterMeters?: number;
  minIntervalMs?: number;
}

interface LastLocation {
  latitude: number;
  longitude: number;
  speed?: number | null;
  heading?: number | null;
  accuracy?: number | null;
  timestamp: number;
}

function haversineMeters(a: { lat: number; lon: number }, b: { lat: number; lon: number }) {
  const R = 6371000;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLon = ((b.lon - a.lon) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
  return R * c;
}

export const useBackgroundTracking = (opts: BackgroundTrackingOptions = {}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { status } = useDriverStatus();

  const [isTracking, setIsTracking] = useState(false);
  const [supported, setSupported] = useState(false);
  const [lastLocation, setLastLocation] = useState<LastLocation | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);
  const [needsDisclosure, setNeedsDisclosure] = useState(false);

  const watcherIdRef = useRef<string | number | null>(null);
  const lastSentAtRef = useRef<number>(0);
  const lastSentLocRef = useRef<{ lat: number; lon: number } | null>(null);

  const distanceFilter = opts.distanceFilterMeters ?? 25;
  const minInterval = opts.minIntervalMs ?? 10_000;

  const bgPluginRef = useRef<any>(null);
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      try {
        bgPluginRef.current = registerPlugin<any>('BackgroundGeolocation');
        setSupported(true);
      } catch (e) {
        console.warn('BackgroundGeolocation register failed', e);
        setSupported(false);
      }
    } else {
      setSupported(false);
    }
  }, []);

  const stop = useCallback(async () => {
    try {
      if (watcherIdRef.current != null) {
        if (supported && bgPluginRef.current?.removeWatcher) {
          await bgPluginRef.current.removeWatcher({ id: watcherIdRef.current });
        } else {
          await Geolocation.clearWatch({ id: watcherIdRef.current as string });
        }
      }
    } catch (e) {
      console.error('Error stopping background tracking', e);
    } finally {
      watcherIdRef.current = null;
      setIsTracking(false);
    }
  }, [supported]);

  const upsertDriverLocation = useCallback(
    async (loc: LastLocation) => {
      if (!user?.id) return;

      const now = Date.now();
      const prev = lastSentLocRef.current;
      const shouldSendByTime = now - lastSentAtRef.current >= minInterval;
      const shouldSendByDistance = !prev || haversineMeters({ lat: prev.lat, lon: prev.lon }, { lat: loc.latitude, lon: loc.longitude }) >= distanceFilter;

      if (!shouldSendByTime && !shouldSendByDistance) return;

      lastSentAtRef.current = now;
      lastSentLocRef.current = { lat: loc.latitude, lon: loc.longitude };

      const payload = {
        driver_id: user.id,
        latitude: loc.latitude,
        longitude: loc.longitude,
        heading: loc.heading ?? null,
        speed: loc.speed ?? null,
        accuracy: loc.accuracy ?? null,
        is_online: true,
        is_available: true,
        last_ping: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as const;

      try {
        const { data: updated, error: updateError } = await supabase
          .from('driver_locations')
          .update(payload)
          .eq('driver_id', user.id)
          .select('id');

        if (updateError) throw updateError;

        if (!updated || updated.length === 0) {
          const { error: insertError } = await supabase.from('driver_locations').insert(payload);
          if (insertError) throw insertError;
        }
      } catch (e: any) {
        console.error('Failed to persist driver location', e);
        setLastError(e?.message || 'Erreur de sauvegarde de position');
      }
    },
    [user?.id, distanceFilter, minInterval]
  );

  const start = useCallback(async () => {
    if (!user?.id) {
      toast({ title: 'Non connecté', description: 'Veuillez vous connecter pour activer le suivi.' });
      return;
    }

    try {
      setLastError(null);

      if (supported && bgPluginRef.current?.addWatcher) {
        const id = await bgPluginRef.current.addWatcher(
          {
            backgroundMessage: 'Le suivi TAGA Taxi est actif en arrière-plan.',
            backgroundTitle: 'Suivi en cours',
            requestPermissions: false, // ← Permissions gérées séparément après divulgation
            stale: false,
            distanceFilter: distanceFilter,
          },
          async (location: any, err: any) => {
            if (err) {
              console.error('BG location error', err);
              setLastError(err?.message || 'Erreur de localisation');
              return;
            }
            if (!location) return;

            const loc: LastLocation = {
              latitude: location.latitude,
              longitude: location.longitude,
              speed: location.speed ?? null,
              heading: location.bearing ?? location.heading ?? null,
              accuracy: location.accuracy ?? null,
              timestamp: Date.now(),
            };
            setLastLocation(loc);
            await upsertDriverLocation(loc);
          }
        );
        watcherIdRef.current = id;
      } else {
        const id = await Geolocation.watchPosition(
          {
            enableHighAccuracy: true,
            maximumAge: 5_000,
            timeout: 20_000,
          },
          async (pos: Position | null, err) => {
            if (err) {
              console.error('watchPosition error', err);
              setLastError((err as any)?.message || 'Erreur de localisation');
              return;
            }
            if (!pos?.coords) return;
            const { latitude, longitude, speed, heading, accuracy } = pos.coords;
            const loc: LastLocation = {
              latitude,
              longitude,
              speed: speed ?? null,
              heading: heading ?? null,
              accuracy: accuracy ?? null,
              timestamp: Date.now(),
            };
            setLastLocation(loc);
            await upsertDriverLocation(loc);
          }
        );
        watcherIdRef.current = id as any;
      }

      setIsTracking(true);
      toast({ title: 'Suivi activé', description: "Votre position est partagée en arrière-plan." });
    } catch (e: any) {
      console.error('Error starting background tracking', e);
      setIsTracking(false);
      setLastError(e?.message || 'Impossible de démarrer le suivi');
      toast({ title: 'Erreur', description: 'Impossible d\'activer le suivi', variant: 'destructive' });
    }
  }, [supported, toast, upsertDriverLocation, user?.id]);

  // ========== Disclosure logic ==========

  /**
   * Quand le chauffeur passe en ligne, vérifier le consentement
   */
  useEffect(() => {
    if (!user) return;

    if (status.isOnline && !isTracking) {
      if (hasSessionDeclined()) {
        // Refusé cette session — pas de tracking, pas de redemande
      } else if (hasDisclosureConsent()) {
        requestForegroundThenStart();
      } else {
        setNeedsDisclosure(true);
      }
    } else if (!status.isOnline && isTracking) {
      stop();
    }
  }, [status.isOnline, user]);

  const requestForegroundThenStart = useCallback(async () => {
    try {
      // Étape 1 : foreground permission
      const perm = await Geolocation.requestPermissions({ permissions: ['location'] as any });
      if ((perm as any).location === 'denied') {
        toast({ title: 'Permission refusée', description: 'Activez la localisation dans les paramètres.', variant: 'destructive' });
        return;
      }
      // Étape 2 : start (background permission demandée par addWatcher ou OS)
      await start();
    } catch (e) {
      console.error('Permission request failed', e);
    }
  }, [start, toast]);

  const acceptDisclosure = useCallback(async () => {
    storeDisclosureConsent();
    setNeedsDisclosure(false);
    await requestForegroundThenStart();
  }, [requestForegroundThenStart]);

  const declineDisclosure = useCallback(() => {
    storeSessionDeclined();
    setNeedsDisclosure(false);
  }, []);

  useEffect(() => {
    return () => { stop(); };
  }, [stop]);

  return {
    isTracking,
    supported,
    lastLocation,
    lastError,
    needsDisclosure,
    start,
    stop,
    acceptDisclosure,
    declineDisclosure,
  } as const;
};
