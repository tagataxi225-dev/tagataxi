/**
 * 🌍 UTILITAIRES DE VALIDATION ET NORMALISATION DES COORDONNÉES GPS
 * 
 * Garantit des coordonnées cohérentes pour :
 * - Markers sur la carte
 * - Création de bookings
 * - Calculs de routes
 */

export interface Coordinates {
  lat: number;
  lng: number;
}

interface CityBounds {
  name: string;
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}

// Bounds des villes supportées
const CITY_BOUNDS: CityBounds[] = [
  {
    name: 'Kinshasa',
    minLat: -4.55,
    maxLat: -4.15,
    minLng: 15.10,
    maxLng: 15.60
  },
  {
    name: 'Lubumbashi',
    minLat: -11.85,
    maxLat: -11.55,
    minLng: 27.35,
    maxLng: 27.65
  },
  {
    name: 'Kolwezi',
    minLat: -10.85,
    maxLat: -10.55,
    minLng: 25.35,
    maxLng: 25.65
  },
  {
    name: 'Abidjan',
    minLat: 5.15,
    maxLat: 5.50,
    minLng: -4.15,
    maxLng: -3.75
  }
];

/**
 * Vérifie si les coordonnées sont valides (dans les limites géographiques mondiales)
 */
export function isValidCoordinates(coords: Coordinates): boolean {
  if (!coords || typeof coords.lat !== 'number' || typeof coords.lng !== 'number') {
    return false;
  }
  
  // Vérifier les limites mondiales
  if (coords.lat < -90 || coords.lat > 90) {
    console.warn('❌ Latitude hors limites:', coords.lat);
    return false;
  }
  
  if (coords.lng < -180 || coords.lng > 180) {
    console.warn('❌ Longitude hors limites:', coords.lng);
    return false;
  }
  
  // Vérifier que ce ne sont pas des valeurs nulles/0
  if (coords.lat === 0 && coords.lng === 0) {
    console.warn('⚠️ Coordonnées à (0, 0) - probablement invalides');
    return false;
  }
  
  return true;
}

/**
 * Détecte si lat/lng sont inversés et tente de corriger
 */
export function normalizeCoordinates(coords: Coordinates, expectedCity?: string): Coordinates {
  if (!coords) {
    console.error('❌ Coordonnées nulles');
    return { lat: -4.3217, lng: 15.3069 }; // Kinshasa par défaut
  }
  
  let { lat, lng } = coords;
  
  // Vérifier si une inversion lat/lng est suspectée
  // (lat devrait être dans [-90, 90] et lng dans [-180, 180])
  const latInLatRange = lat >= -90 && lat <= 90;
  const lngInLatRange = lng >= -90 && lng <= 90;
  const latInLngRange = lat >= -180 && lat <= 180;
  const lngInLngRange = lng >= -180 && lng <= 180;
  
  // Si lat est hors de [-90, 90] mais dans [-180, 180], et lng est dans [-90, 90]
  // C'est probablement une inversion
  if (!latInLatRange && latInLngRange && lngInLatRange) {
    console.warn('⚠️ Inversion lat/lng détectée, correction:', { original: { lat, lng }, corrected: { lat: lng, lng: lat } });
    [lat, lng] = [lng, lat];
  }
  
  // Vérifier la cohérence avec la ville attendue
  if (expectedCity) {
    const cityBounds = CITY_BOUNDS.find(c => c.name.toLowerCase() === expectedCity.toLowerCase());
    
    if (cityBounds) {
      const inBounds = lat >= cityBounds.minLat && lat <= cityBounds.maxLat &&
                       lng >= cityBounds.minLng && lng <= cityBounds.maxLng;
      
      if (!inBounds) {
        console.warn(`⚠️ Coordonnées hors de ${expectedCity}:`, { lat, lng, bounds: cityBounds });
      }
    }
  }
  
  return { lat, lng };
}

/**
 * Détermine la ville à partir des coordonnées
 */
export function detectCityFromCoordinates(coords: Coordinates): string | null {
  if (!isValidCoordinates(coords)) {
    return null;
  }
  
  for (const city of CITY_BOUNDS) {
    if (coords.lat >= city.minLat && coords.lat <= city.maxLat &&
        coords.lng >= city.minLng && coords.lng <= city.maxLng) {
      return city.name;
    }
  }
  
  return null;
}

/**
 * Calcule la distance entre deux points en mètres (formule Haversine)
 */
export function calculateDistanceMeters(point1: Coordinates, point2: Coordinates): number {
  const R = 6371000; // Rayon de la Terre en mètres
  const dLat = (point2.lat - point1.lat) * Math.PI / 180;
  const dLng = (point2.lng - point1.lng) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) *
            Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

/**
 * Formate les coordonnées pour l'affichage
 */
export function formatCoordinates(coords: Coordinates, precision: number = 6): string {
  return `${coords.lat.toFixed(precision)}, ${coords.lng.toFixed(precision)}`;
}

/**
 * Vérifie si deux positions sont "proches" (dans un rayon donné en mètres)
 */
export function arePositionsClose(pos1: Coordinates, pos2: Coordinates, radiusMeters: number = 50): boolean {
  return calculateDistanceMeters(pos1, pos2) <= radiusMeters;
}
