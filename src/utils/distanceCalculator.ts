/**
 * Utilitaires de calcul de distance et de durée de trajet.
 *
 * - calculateDistance : distance Haversine en km (arrondie à 2 décimales)
 * - calculateDistanceFromCoordinates : variante acceptant des lat/lng séparés
 * - calculateTripDuration / estimateTripDuration : estimation de la durée
 * - formatDistance / formatDuration : formatage pour l'affichage
 */

import { logger } from './logger';

export interface Coordinates {
  lat: number;
  lng: number;
}

// Vitesse moyenne urbaine par défaut (km/h) — contexte RDC (trafic dense)
const DEFAULT_AVERAGE_SPEED_KMH = 30;
const EARTH_RADIUS_KM = 6371;

const toRadians = (degrees: number): number => (degrees * Math.PI) / 180;

/**
 * Distance Haversine entre deux coordonnées, en kilomètres (arrondie à 2 décimales).
 */
export function calculateDistance(coord1: Coordinates, coord2: Coordinates): number {
  if (!coord1 || !coord2) {
    logger.warn('calculateDistance: coordonnées manquantes', { coord1, coord2 });
    return 0;
  }

  const dLat = toRadians(coord2.lat - coord1.lat);
  const dLng = toRadians(coord2.lng - coord1.lng);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(coord1.lat)) *
      Math.cos(toRadians(coord2.lat)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distanceKm = EARTH_RADIUS_KM * c;

  return Math.round(distanceKm * 100) / 100;
}

/**
 * Distance Haversine à partir de latitudes/longitudes séparées, en kilomètres.
 */
export function calculateDistanceFromCoordinates(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  return calculateDistance({ lat: lat1, lng: lng1 }, { lat: lat2, lng: lng2 });
}

/**
 * Estime la durée d'un trajet (en minutes) pour une distance donnée en km.
 */
export function calculateTripDuration(
  distanceKm: number,
  averageSpeedKmh: number = DEFAULT_AVERAGE_SPEED_KMH
): number {
  if (distanceKm <= 0 || averageSpeedKmh <= 0) {
    return 0;
  }

  const durationMinutes = (distanceKm / averageSpeedKmh) * 60;
  return Math.round(durationMinutes);
}

/**
 * Estime la durée d'un trajet (en minutes) entre deux coordonnées.
 */
export function estimateTripDuration(
  coord1: Coordinates,
  coord2: Coordinates,
  averageSpeedKmh: number = DEFAULT_AVERAGE_SPEED_KMH
): number {
  const distanceKm = calculateDistance(coord1, coord2);
  return calculateTripDuration(distanceKm, averageSpeedKmh);
}

/**
 * Formate une durée en minutes vers une chaîne lisible (« 45 min », « 1h 20 »).
 */
export function formatDuration(minutes: number): string {
  if (!minutes || minutes <= 0) {
    return '0 min';
  }

  const rounded = Math.round(minutes);

  if (rounded < 60) {
    return `${rounded} min`;
  }

  const hours = Math.floor(rounded / 60);
  const remainingMinutes = rounded % 60;

  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}` : `${hours}h`;
}

/**
 * Formate une distance en km vers une chaîne lisible (« 850 m », « 3.2 km »).
 */
export function formatDistance(distanceKm: number): string {
  if (!distanceKm || distanceKm <= 0) {
    return '0 m';
  }

  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)} m`;
  }

  return `${distanceKm.toFixed(1)} km`;
}
