// Service centralisé pour la validation et normalisation des coordonnées

export interface NormalizedCoordinates {
  lat: number;
  lng: number;
  isValid: boolean;
  source: 'gps' | 'address' | 'fallback';
}

// Coordonnées par défaut par ville
const CITY_DEFAULTS: Record<string, { lat: number; lng: number }> = {
  Kinshasa: { lat: -4.4419, lng: 15.2663 },
  Lubumbashi: { lat: -11.6876, lng: 27.5026 },
  Kolwezi: { lat: -10.7147, lng: 25.4665 },
};

export const coordinateService = {
  /**
   * Normalise et valide les coordonnées
   */
  normalize(
    coords: { lat?: number; lng?: number } | null | undefined,
    city: string = 'Kinshasa'
  ): NormalizedCoordinates {
    const cityDefault = CITY_DEFAULTS[city] || CITY_DEFAULTS.Kinshasa;

    // Vérifier si les coordonnées existent
    if (!coords || typeof coords.lat !== 'number' || typeof coords.lng !== 'number') {
      return {
        lat: cityDefault.lat,
        lng: cityDefault.lng,
        isValid: false,
        source: 'fallback'
      };
    }

    // Vérifier les bounds valides globaux
    if (coords.lat < -90 || coords.lat > 90 || coords.lng < -180 || coords.lng > 180) {
      return {
        lat: cityDefault.lat,
        lng: cityDefault.lng,
        isValid: false,
        source: 'fallback'
      };
    }

    // Vérifier si les coordonnées sont NaN
    if (isNaN(coords.lat) || isNaN(coords.lng)) {
      return {
        lat: cityDefault.lat,
        lng: cityDefault.lng,
        isValid: false,
        source: 'fallback'
      };
    }

    return {
      lat: coords.lat,
      lng: coords.lng,
      isValid: true,
      source: 'address'
    };
  },

  /**
   * Calcule la distance entre deux points (formule Haversine) en mètres
   */
  distance(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
    const R = 6371000; // Rayon de la Terre en mètres
    const dLat = this.toRad(b.lat - a.lat);
    const dLng = this.toRad(b.lng - a.lng);
    const lat1 = this.toRad(a.lat);
    const lat2 = this.toRad(b.lat);

    const x = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.sin(dLng / 2) * Math.sin(dLng / 2) * Math.cos(lat1) * Math.cos(lat2);
    const c = 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));

    return R * c;
  },

  /**
   * Convertit des degrés en radians
   */
  toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  },

  /**
   * Vérifie si deux coordonnées sont proches (dans un rayon donné en mètres)
   */
  areClose(a: { lat: number; lng: number }, b: { lat: number; lng: number }, radiusMeters: number = 100): boolean {
    return this.distance(a, b) <= radiusMeters;
  },

  /**
   * Déduplique une liste d'adresses par proximité géographique
   */
  deduplicateByProximity<T extends { coordinates?: { lat: number; lng: number } }>(
    items: T[],
    radiusMeters: number = 100
  ): T[] {
    const result: T[] = [];
    
    for (const item of items) {
      if (!item.coordinates) {
        result.push(item);
        continue;
      }
      
      const isDuplicate = result.some(existing => 
        existing.coordinates && this.areClose(item.coordinates!, existing.coordinates, radiusMeters)
      );
      
      if (!isDuplicate) {
        result.push(item);
      }
    }
    
    return result;
  }
};
