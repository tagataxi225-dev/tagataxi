/**
 * 🛰️ Hook de suivi de route en temps réel
 * - Écoute la position du chauffeur via Supabase Realtime
 * - Recalcule la route si déviation significative
 * - Optimisé pour performances mobiles
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { professionalRouteService, ProfessionalRouteResult } from '@/services/professionalRouteService';

interface DriverLocation {
  lat: number;
  lng: number;
  heading?: number;
  speed?: number;
  timestamp: string;
}

interface UseRealtimeRouteTrackingProps {
  bookingId: string | null;
  driverId: string | null;
  destination: { lat: number; lng: number } | null;
  enabled?: boolean;
  deviationThreshold?: number; // en mètres
  updateInterval?: number; // en ms
}

interface RealtimeTrackingState {
  driverLocation: DriverLocation | null;
  route: ProfessionalRouteResult | null;
  isRecalculating: boolean;
  lastUpdate: Date | null;
  isOffRoute: boolean;
  eta: number | null; // en minutes
  remainingDistance: number | null; // en km
}

// Calculer la distance entre deux points (Haversine)
const calculateDistance = (
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number => {
  const R = 6371e3; // Rayon de la Terre en mètres
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lng2 - lng1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

// Trouver le point le plus proche sur la route
const findClosestPointOnRoute = (
  location: { lat: number; lng: number },
  routePath: google.maps.LatLng[]
): { distance: number; index: number } => {
  let minDistance = Infinity;
  let closestIndex = 0;

  for (let i = 0; i < routePath.length; i++) {
    const point = routePath[i];
    const distance = calculateDistance(
      location.lat, location.lng,
      point.lat(), point.lng()
    );

    if (distance < minDistance) {
      minDistance = distance;
      closestIndex = i;
    }
  }

  return { distance: minDistance, index: closestIndex };
};

export function useRealtimeRouteTracking({
  bookingId,
  driverId,
  destination,
  enabled = true,
  deviationThreshold = 50, // 50m par défaut
  updateInterval = 3000 // 3s par défaut
}: UseRealtimeRouteTrackingProps): RealtimeTrackingState {
  const [state, setState] = useState<RealtimeTrackingState>({
    driverLocation: null,
    route: null,
    isRecalculating: false,
    lastUpdate: null,
    isOffRoute: false,
    eta: null,
    remainingDistance: null
  });

  const lastRecalculationRef = useRef<number>(0);
  const currentRouteRef = useRef<ProfessionalRouteResult | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Recalculer la route
  const recalculateRoute = useCallback(async (
    driverPos: { lat: number; lng: number },
    dest: { lat: number; lng: number }
  ) => {
    // Throttle: max 1 recalcul toutes les 10 secondes
    const now = Date.now();
    if (now - lastRecalculationRef.current < 10000) {
      return;
    }
    lastRecalculationRef.current = now;

    setState(prev => ({ ...prev, isRecalculating: true }));

    try {
      const newRoute = await professionalRouteService.calculateRoute(
        driverPos,
        dest,
        { showTraffic: true, smoothing: true }
      );

      currentRouteRef.current = newRoute;

      setState(prev => ({
        ...prev,
        route: newRoute,
        isRecalculating: false,
        isOffRoute: false,
        eta: Math.round(newRoute.duration / 60),
        remainingDistance: Math.round(newRoute.distance / 100) / 10
      }));

      console.log('🔄 Route recalculée:', {
        distance: newRoute.distanceText,
        duration: newRoute.durationText
      });
    } catch (error) {
      console.error('❌ Erreur recalcul route:', error);
      setState(prev => ({ ...prev, isRecalculating: false }));
    }
  }, []);

  // Traiter une mise à jour de position
  const handleLocationUpdate = useCallback((
    location: DriverLocation
  ) => {
    setState(prev => ({
      ...prev,
      driverLocation: location,
      lastUpdate: new Date()
    }));

    // Vérifier si le chauffeur est hors route
    if (currentRouteRef.current && destination) {
      const { distance, index } = findClosestPointOnRoute(
        { lat: location.lat, lng: location.lng },
        currentRouteRef.current.geometrySmoothed
      );

      const isOffRoute = distance > deviationThreshold;

      if (isOffRoute && !state.isRecalculating) {
        console.log(`⚠️ Chauffeur hors route (${Math.round(distance)}m)`);
        recalculateRoute(
          { lat: location.lat, lng: location.lng },
          destination
        );
      }

      // Calculer ETA et distance restante basés sur la position actuelle
      if (!isOffRoute) {
        const remainingPath = currentRouteRef.current.geometrySmoothed.slice(index);
        let remainingDist = 0;
        
        for (let i = 0; i < remainingPath.length - 1; i++) {
          remainingDist += calculateDistance(
            remainingPath[i].lat(), remainingPath[i].lng(),
            remainingPath[i + 1].lat(), remainingPath[i + 1].lng()
          );
        }

        // Estimer ETA basé sur vitesse actuelle ou 30 km/h par défaut
        const speedKmh = location.speed ? location.speed * 3.6 : 30;
        const etaMinutes = Math.round((remainingDist / 1000) / speedKmh * 60);

        setState(prev => ({
          ...prev,
          isOffRoute,
          eta: etaMinutes,
          remainingDistance: Math.round(remainingDist / 100) / 10
        }));
      }
    }
  }, [destination, deviationThreshold, recalculateRoute, state.isRecalculating]);

  // Écouter les mises à jour de position du chauffeur
  useEffect(() => {
    if (!enabled || !driverId || !destination) return;

    console.log('🛰️ Activation suivi temps réel pour chauffeur:', driverId);

    // Calculer la route initiale
    // On ne peut pas appeler getCurrentPosition ici, donc on attend la première mise à jour

    // S'abonner aux mises à jour de position
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
          const data = payload.new as any;
          handleLocationUpdate({
            lat: data.latitude,
            lng: data.longitude,
            heading: data.heading,
            speed: data.speed,
            timestamp: data.updated_at
          });
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      console.log('🛰️ Arrêt suivi temps réel');
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [enabled, driverId, destination, handleLocationUpdate]);

  return state;
}
