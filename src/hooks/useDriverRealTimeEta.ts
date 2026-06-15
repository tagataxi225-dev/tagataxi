/**
 * 🕐 Hook ETA Temps Réel du Chauffeur
 * Calcule l'ETA dynamique basé sur la position GPS du chauffeur
 */

import { useMemo } from 'react';
import { calculateDistance } from '@/utils/distanceCalculator';

interface DriverPosition {
  lat: number;
  lng: number;
  speed?: number | null;
}

interface PickupPosition {
  lat: number;
  lng: number;
}

interface RealTimeEta {
  etaMinutes: number | null;
  etaText: string;
  distanceKm: number | null;
}

const AVERAGE_CITY_SPEED_KMH = 20; // Vitesse moyenne en ville africaine

export function useDriverRealTimeEta(
  driverPosition: DriverPosition | null,
  pickupPosition: PickupPosition | null | undefined
): RealTimeEta {
  return useMemo(() => {
    if (!driverPosition || !pickupPosition) {
      return { etaMinutes: null, etaText: '', distanceKm: null };
    }

    const distanceKm = calculateDistance(
      { lat: driverPosition.lat, lng: driverPosition.lng },
      { lat: pickupPosition.lat, lng: pickupPosition.lng }
    );

    // Utiliser la vitesse réelle du chauffeur si disponible, sinon la moyenne
    const speedKmh = driverPosition.speed && driverPosition.speed > 2
      ? driverPosition.speed * 3.6 // m/s -> km/h
      : AVERAGE_CITY_SPEED_KMH;

    const etaMinutes = Math.max(1, Math.round((distanceKm / speedKmh) * 60));

    const etaText = etaMinutes < 2
      ? 'Arrive bientôt'
      : `Arrive dans ~${etaMinutes} min`;

    return { etaMinutes, etaText, distanceKm };
  }, [driverPosition?.lat, driverPosition?.lng, driverPosition?.speed, pickupPosition?.lat, pickupPosition?.lng]);
}
