/**
 * Hook de géocodage offline avec fallback quartiers populaires
 */

import { useState, useCallback } from 'react';
import { offlineQuartiers, findNearestQuartier, type QuartierData } from '@/data/offlineQuartiers';
import type { LocationData } from '@/types/location';

export const useOfflineGeocoding = () => {
  const [loading, setLoading] = useState(false);

  /**
   * Geocode une adresse en mode offline
   */
  const geocodeOffline = useCallback((address: string, city: string): LocationData | null => {
    setLoading(true);
    
    try {
      const quartiers = offlineQuartiers[city.toLowerCase()];
      if (!quartiers) {
        console.warn(`Pas de données offline pour ${city}`);
        return null;
      }

      // Recherche par nom de quartier dans l'adresse
      const normalizedAddress = address.toLowerCase();
      const quartierEntry = Object.entries(quartiers).find(([key, data]) => 
        normalizedAddress.includes(key.toLowerCase()) || 
        normalizedAddress.includes(data.name.toLowerCase())
      );

      if (quartierEntry) {
        const [, quartierData] = quartierEntry;
        return {
          address: `${quartierData.name}, ${city}`,
          lat: quartierData.lat,
          lng: quartierData.lng,
          type: 'database',
          name: quartierData.name
        };
      }

      console.warn(`Quartier non trouvé dans ${city} pour: ${address}`);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Reverse geocode des coordonnées vers l'adresse la plus proche
   */
  const reverseGeocodeOffline = useCallback((
    lat: number, 
    lng: number, 
    city: string
  ): LocationData | null => {
    setLoading(true);
    
    try {
      const nearest = findNearestQuartier(lat, lng, city);
      
      if (nearest) {
        return {
          address: `${nearest.name}, ${city}`,
          lat: nearest.lat,
          lng: nearest.lng,
          type: 'database',
          name: nearest.name
        };
      }

      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Obtient tous les quartiers disponibles pour une ville
   */
  const getAvailableQuartiers = useCallback((city: string): QuartierData[] => {
    const cityQuartiers = offlineQuartiers[city.toLowerCase()];
    return cityQuartiers ? Object.values(cityQuartiers) : [];
  }, []);

  return {
    geocodeOffline,
    reverseGeocodeOffline,
    getAvailableQuartiers,
    loading
  };
};
