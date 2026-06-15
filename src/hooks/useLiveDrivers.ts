/**
 * 🚗 Hook pour compter les chauffeurs disponibles à proximité
 * Polling léger uniquement — pas de realtime, pas de markers
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { scheduleIdle, cancelIdle } from '@/utils/safeTap';
import { APP_CONFIG } from '@/config/appConfig';

interface UseLiveDriversOptions {
  userLocation: { lat: number; lng: number } | null;
  maxRadius?: number;
  showOnlyAvailable?: boolean;
  updateInterval?: number;
}

const kmToDegLat = (km: number) => km / 111;
const kmToDegLng = (km: number, lat: number) => km / (111 * Math.cos(lat * Math.PI / 180));

const DRIVER_CACHE_TTL = 30_000;   // résultat valide 30s
const MIN_CALL_INTERVAL = 15_000;  // pas plus d'1 appel DB toutes les 15s
const MOVE_THRESHOLD_M = 100;      // ignorer déplacements < 100m

function distMeters(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6_371_000;
  const φ1 = a.lat * Math.PI / 180, φ2 = b.lat * Math.PI / 180;
  const Δφ = (b.lat - a.lat) * Math.PI / 180, Δλ = (b.lng - a.lng) * Math.PI / 180;
  const s = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
}

export const useLiveDrivers = ({
  userLocation,
  maxRadius = 10,
  showOnlyAvailable = true,
  updateInterval = 60000
}: UseLiveDriversOptions) => {
  const [driversCount, setDriversCount] = useState(0);
  const [drivers, setDrivers] = useState<{ lat: number; lng: number; heading?: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const userLocationRef = useRef(userLocation);
  userLocationRef.current = userLocation;
  const maxRadiusRef = useRef(maxRadius);
  maxRadiusRef.current = maxRadius;

  const isFirstLoadRef = useRef(true);
  const isLoadingRef = useRef(false);
  // Initialiser avec un offset de 2s : le premier appel DB ne peut pas se faire
  // avant 2s depuis le mount, même si enableDrivers + scheduleIdle déclenchent plus tôt.
  const lastCallTimeRef = useRef(Date.now() - MIN_CALL_INTERVAL + 2000);
  const resultCacheRef = useRef<{ count: number; loc: { lat: number; lng: number }; ts: number } | null>(null);
  // Circuit breaker : arrête le polling après MAX_DRIVER_ERRORS consécutives pour éviter
  // une boucle réseau infinie si Supabase est indisponible.
  const errorCountRef = useRef(0);
  const MAX_CONSECUTIVE_ERRORS = APP_CONFIG.MAX_DRIVER_ERRORS;

  const loadDriversCount = useCallback(async () => {
    if (document.hidden) return;
    if (isLoadingRef.current) return;
    // Circuit breaker : ne plus appeler Supabase après N erreurs consécutives
    if (errorCountRef.current >= MAX_CONSECUTIVE_ERRORS) return;

    const loc = userLocationRef.current;
    if (!loc) {
      setDriversCount(0);
      setLoading(false);
      isFirstLoadRef.current = false;
      return;
    }

    const now = Date.now();
    const cache = resultCacheRef.current;

    // Tier 1 — rate limit : pas plus d'1 appel DB toutes les MIN_CALL_INTERVAL ms
    // Pas de bypass pour le premier appel — lastCallTimeRef est initialisé avec offset 2s
    if (now - lastCallTimeRef.current < MIN_CALL_INTERVAL) return;

    // Tier 2 — cache valide + position inchangée : utiliser le résultat mémorisé
    if (cache && now - cache.ts < DRIVER_CACHE_TTL &&
        distMeters(loc, cache.loc) < MOVE_THRESHOLD_M) {
      setDriversCount(cache.count);
      setLoading(false);
      isFirstLoadRef.current = false;
      return;
    }

    isLoadingRef.current = true;
    lastCallTimeRef.current = now;

    try {
      if (isFirstLoadRef.current) {
        setLoading(true);
      }

      const dLat = kmToDegLat(maxRadiusRef.current * 1.2);
      const dLng = kmToDegLng(maxRadiusRef.current * 1.2, loc.lat);

      let query = supabase
        .from('driver_locations')
        .select('user_id, latitude, longitude, heading')
        .eq('is_online', true)
        .gte('updated_at', new Date(Date.now() - 15 * 60 * 1000).toISOString())
        .gte('latitude', loc.lat - dLat)
        .lte('latitude', loc.lat + dLat)
        .gte('longitude', loc.lng - dLng)
        .lte('longitude', loc.lng + dLng);

      if (showOnlyAvailable) {
        query = query.eq('is_available', true);
      }

      const { data, error: dbError } = await query;

      if (dbError) throw dbError;

      const finalCount = data?.length ?? 0;
      const finalDrivers = data?.map(d => ({ lat: d.latitude, lng: d.longitude, heading: d.heading ?? undefined })) ?? [];
      setDriversCount(finalCount);
      setDrivers(finalDrivers);
      resultCacheRef.current = { count: finalCount, loc, ts: Date.now() };
      errorCountRef.current = 0; // reset circuit breaker on success
      setError(null);
    } catch (err) {
      errorCountRef.current += 1;
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
      isFirstLoadRef.current = false;
      isLoadingRef.current = false;
    }
  }, [showOnlyAvailable]);

  // Visibility change handler
  useEffect(() => {
    const handleVisibility = () => {
      if (!document.hidden) loadDriversCount();
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [loadDriversCount]);

  // Polling only — no realtime channel
  useEffect(() => {
    if (!userLocation) {
      setDriversCount(0);
      setLoading(false);
      return;
    }

    const idleId = scheduleIdle(() => {
      loadDriversCount();
    }, 4000);
    const interval = setInterval(loadDriversCount, updateInterval);
    return () => {
      cancelIdle(idleId);
      clearInterval(interval);
    };
  }, [loadDriversCount, updateInterval, userLocation]);

  return {
    liveDrivers: drivers,
    loading,
    error,
    driversCount,
    drivers,
    refresh: loadDriversCount
  };
};
