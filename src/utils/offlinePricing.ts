/**
 * Calculs de tarification offline
 * Utilise formules Haversine et tables de tarifs statiques
 */

interface Coordinates {
  lat: number;
  lng: number;
}

interface PricingResult {
  price: number;
  distance: number;
  duration: number;
  currency: string;
}

const EARTH_RADIUS_KM = 6371;

/**
 * Calcule la distance entre deux points avec formule Haversine
 */
export const calculateOfflineDistance = (pointA: Coordinates, pointB: Coordinates): number => {
  const dLat = toRad(pointB.lat - pointA.lat);
  const dLng = toRad(pointB.lng - pointA.lng);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(pointA.lat)) *
      Math.cos(toRad(pointB.lat)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
};

const toRad = (degrees: number): number => {
  return (degrees * Math.PI) / 180;
};

/**
 * Tarifs statiques par ville et service
 */
// ✅ TARIFS 2025 - Synchronisés avec pricing_rules DB
const tarifsOffline: Record<string, Record<string, { base: number; perKm: number; currency: string }>> = {
  kinshasa: {
    moto_taxi: { base: 1500, perKm: 500, currency: 'CDF' },
    taxi_eco: { base: 2500, perKm: 1500, currency: 'CDF' },
    taxi_confort: { base: 3200, perKm: 1800, currency: 'CDF' },
    taxi_premium: { base: 4300, perKm: 2300, currency: 'CDF' },
    delivery_flash: { base: 7000, perKm: 500, currency: 'CDF' },
    delivery_flex: { base: 55000, perKm: 2500, currency: 'CDF' },
    delivery_maxicharge: { base: 100000, perKm: 5000, currency: 'CDF' }
  },
  lubumbashi: {
    moto_taxi: { base: 1800, perKm: 600, currency: 'CDF' }, // +20%
    taxi_eco: { base: 3000, perKm: 1800, currency: 'CDF' },
    taxi_confort: { base: 3840, perKm: 2160, currency: 'CDF' },
    taxi_premium: { base: 5160, perKm: 2760, currency: 'CDF' },
    delivery_flash: { base: 8400, perKm: 600, currency: 'CDF' },
    delivery_flex: { base: 66000, perKm: 3000, currency: 'CDF' },
    delivery_maxicharge: { base: 120000, perKm: 6000, currency: 'CDF' }
  },
  kolwezi: {
    moto_taxi: { base: 1650, perKm: 550, currency: 'CDF' }, // +10%
    taxi_eco: { base: 2750, perKm: 1650, currency: 'CDF' },
    taxi_confort: { base: 3520, perKm: 1980, currency: 'CDF' },
    taxi_premium: { base: 4730, perKm: 2530, currency: 'CDF' },
    delivery_flash: { base: 7700, perKm: 550, currency: 'CDF' },
    delivery_flex: { base: 60500, perKm: 2750, currency: 'CDF' },
    delivery_maxicharge: { base: 110000, perKm: 5500, currency: 'CDF' }
  },
  abidjan: {
    moto_taxi: { base: 500, perKm: 200, currency: 'XOF' },
    taxi_eco: { base: 1000, perKm: 500, currency: 'XOF' },
    taxi_confort: { base: 1500, perKm: 700, currency: 'XOF' },
    delivery_flash: { base: 2000, perKm: 200, currency: 'XOF' },
    delivery_flex: { base: 20000, perKm: 1000, currency: 'XOF' }
  }
};

/**
 * Vitesses moyennes par ville (km/h)
 */
const averageSpeedByCity: Record<string, number> = {
  kinshasa: 20,
  lubumbashi: 25,
  kolwezi: 30,
  abidjan: 18
};

/**
 * Calcule le tarif offline pour un trajet
 */
export const getOfflineTarif = (
  city: string,
  serviceType: string,
  distance: number
): PricingResult | null => {
  const cityTarifs = tarifsOffline[city.toLowerCase()];
  if (!cityTarifs) return null;

  const tarif = cityTarifs[serviceType.toLowerCase()];
  if (!tarif) return null;

  const price = tarif.base + distance * tarif.perKm;
  const duration = estimateOfflineDuration(distance, city);

  return {
    price: Math.round(price),
    distance: Math.round(distance * 100) / 100,
    duration,
    currency: tarif.currency
  };
};

/**
 * Estime la durée du trajet en minutes
 */
export const estimateOfflineDuration = (distanceKm: number, city: string): number => {
  const speed = averageSpeedByCity[city.toLowerCase()] || 20;
  const hours = distanceKm / speed;
  return Math.round(hours * 60);
};

/**
 * Calcule le prix total d'un trajet offline
 */
export const calculateOfflinePrice = (
  pickupCoords: Coordinates,
  deliveryCoords: Coordinates,
  city: string,
  serviceType: string
): PricingResult | null => {
  const distance = calculateOfflineDistance(pickupCoords, deliveryCoords);
  return getOfflineTarif(city, serviceType, distance);
};

/**
 * Vérifie si les tarifs offline sont disponibles
 */
export const hasOfflineTarifs = (city: string, serviceType: string): boolean => {
  const cityTarifs = tarifsOffline[city.toLowerCase()];
  if (!cityTarifs) return false;
  return !!cityTarifs[serviceType.toLowerCase()];
};

/**
 * Obtient tous les services disponibles offline pour une ville
 */
export const getAvailableOfflineServices = (city: string): string[] => {
  const cityTarifs = tarifsOffline[city.toLowerCase()];
  return cityTarifs ? Object.keys(cityTarifs) : [];
};
