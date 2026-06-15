/**
 * Service de détection intelligente de ville pour Tembea
 * RDC uniquement: Kinshasa, Lubumbashi, Kolwezi
 */

import { SUPPORTED_CITIES, type CityConfig, type UnifiedCoordinates } from '@/types/unifiedLocation';

// Type pour le résultat de détection
export interface CityDetectionResult {
  city: CityConfig;
  confidence: number;
  source: 'coordinates' | 'address' | 'user_selection' | 'default';
}

class CityDetectionService {
  private static instance: CityDetectionService;
  private selectedCity: CityConfig | null = null;

  static getInstance(): CityDetectionService {
    if (!CityDetectionService.instance) {
      CityDetectionService.instance = new CityDetectionService();
    }
    return CityDetectionService.instance;
  }

  /**
   * Détecter la ville à partir des coordonnées GPS
   */
  detectCityFromCoordinates(coords: UnifiedCoordinates): CityDetectionResult {
    for (const city of Object.values(SUPPORTED_CITIES)) {
      if (city.bounds) {
        const { north, south, east, west } = city.bounds;
        if (coords.lat <= north && coords.lat >= south && 
            coords.lng <= east && coords.lng >= west) {
          return {
            city,
            confidence: 0.95,
            source: 'coordinates'
          };
        }
      }
    }

    // Fallback: ville la plus proche par distance
    const distances = Object.values(SUPPORTED_CITIES).map(city => ({
      city,
      distance: this.calculateDistance(coords, city.defaultCoordinates)
    }));

    const closest = distances.reduce((prev, curr) => 
      curr.distance < prev.distance ? curr : prev
    );

    return {
      city: closest.city,
      confidence: Math.max(0.3, 1 - (closest.distance / 1000)), // Confiance inversement proportionnelle à la distance
      source: 'coordinates'
    };
  }

  /**
   * Détecter la ville à partir d'une adresse textuelle
   */
  detectCityFromAddress(address: string): CityDetectionResult {
    const normalizedAddress = address.toLowerCase();
    
    // Recherche directe du nom de ville
    for (const city of Object.values(SUPPORTED_CITIES)) {
      if (normalizedAddress.includes(city.name.toLowerCase())) {
        return {
          city,
          confidence: 0.9,
          source: 'address'
        };
      }

      // Recherche dans les communes
      if (city.communes) {
        for (const commune of city.communes) {
          if (normalizedAddress.includes(commune.toLowerCase())) {
            return {
              city,
              confidence: 0.8,
              source: 'address'
            };
          }
        }
      }
    }

    // Fallback vers Kinshasa
    return {
      city: SUPPORTED_CITIES.kinshasa,
      confidence: 0.3,
      source: 'default'
    };
  }

  /**
   * Détecter la ville intelligemment avec plusieurs sources
   */
  detectCity(data: {
    coordinates?: UnifiedCoordinates;
    address?: string;
    userSelection?: string;
  }): CityDetectionResult {
    // Priorité 1: Sélection utilisateur
    if (data.userSelection) {
      const city = Object.values(SUPPORTED_CITIES).find(
        c => c.name === data.userSelection || c.code === data.userSelection
      );
      if (city) {
        return {
          city,
          confidence: 1.0,
          source: 'user_selection'
        };
      }
    }

    // Priorité 2: Coordonnées GPS
    if (data.coordinates) {
      const coordResult = this.detectCityFromCoordinates(data.coordinates);
      if (coordResult.confidence > 0.7) {
        return coordResult;
      }
    }

    // Priorité 3: Adresse textuelle
    if (data.address) {
      const addressResult = this.detectCityFromAddress(data.address);
      if (addressResult.confidence > 0.7) {
        return addressResult;
      }
    }

    // Priorité 4: Ville sélectionnée précédemment
    if (this.selectedCity) {
      return {
        city: this.selectedCity,
        confidence: 0.6,
        source: 'user_selection'
      };
    }

    // Fallback: Kinshasa par défaut
    return {
      city: SUPPORTED_CITIES.kinshasa,
      confidence: 0.3,
      source: 'default'
    };
  }

  /**
   * Définir la ville sélectionnée par l'utilisateur
   */
  setSelectedCity(city: CityConfig): void {
    this.selectedCity = city;
    // Sauvegarder dans localStorage pour persistance
    localStorage.setItem('kwenda_selected_city', JSON.stringify({
      name: city.name,
      code: city.code
    }));
  }

  /**
   * Récupérer la ville sélectionnée depuis localStorage
   */
  getSelectedCity(): CityConfig | null {
    try {
      const stored = localStorage.getItem('kwenda_selected_city');
      if (stored) {
        const { code } = JSON.parse(stored);
        const city = Object.values(SUPPORTED_CITIES).find(c => c.code === code);
        if (city) {
          this.selectedCity = city;
          return city;
        }
      }
    } catch (error) {
      console.warn('Erreur lors de la récupération de la ville stockée:', error);
    }
    return null;
  }

  /**
   * Obtenir la configuration de prix pour une ville
   */
  getCityPricingConfig(city: CityConfig) {
    const baseConfig = {
      basePriceMultiplier: 1.0,
      currency: city.currency,
      surgePricingEnabled: true
    };

    switch (city.name) {
      case 'Lubumbashi':
        return { ...baseConfig, basePriceMultiplier: 1.2 }; // +20%
      case 'Kolwezi':
        return { ...baseConfig, basePriceMultiplier: 1.1 }; // +10%
      default: // Kinshasa
        return baseConfig;
    }
  }

  /**
   * Calculer la distance entre deux points (formule de Haversine)
   */
  private calculateDistance(coord1: UnifiedCoordinates, coord2: UnifiedCoordinates): number {
    const R = 6371; // Rayon de la Terre en km
    const dLat = this.toRad(coord2.lat - coord1.lat);
    const dLng = this.toRad(coord2.lng - coord1.lng);
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(coord1.lat)) * Math.cos(this.toRad(coord2.lat)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(deg: number): number {
    return deg * (Math.PI / 180);
  }
}

export const cityDetectionService = CityDetectionService.getInstance();