import { supabase } from '@/integrations/supabase/client';

export interface CoordinateResult {
  lat: number;
  lng: number;
  formatted_address: string;
}

export class IntegrationGeocodingService {
  
  /**
   * Géocode une adresse en utilisant l'edge function geocode-proxy
   */
  static async geocodeAddress(address: string, city: string = 'Kinshasa'): Promise<CoordinateResult> {
    try {
      // Préparation de la requête avec la ville
      const searchQuery = `${address} ${city} RDC`;
      
      console.log('Géocodage de:', searchQuery);
      
      const { data, error } = await supabase.functions.invoke('geocode-proxy', {
        body: { query: searchQuery }
      });

      if (error) {
        console.error('Erreur geocode-proxy:', error);
        throw error;
      }

      if (data?.results && data.results.length > 0) {
        const result = data.results[0];
        const coords = {
          lat: result.geometry.location.lat,
          lng: result.geometry.location.lng,
          formatted_address: result.formatted_address
        };
        
        console.log('Géocodage réussi:', coords);
        return coords;
      }

      throw new Error('Aucun résultat trouvé');
    } catch (error) {
      console.error('Erreur géocodage:', error);
      
      // Fallback avec coordonnées par défaut pour Kinshasa
      return this.getFallbackCoordinates(city);
    }
  }

  /**
   * Coordonnées par défaut par ville
   */
  private static getFallbackCoordinates(city: string): CoordinateResult {
    const fallbacks: Record<string, CoordinateResult> = {
      'Kinshasa': {
        lat: -4.3217,
        lng: 15.3069,
        formatted_address: 'Kinshasa, République Démocratique du Congo'
      },
      'Lubumbashi': {
        lat: -11.6609,
        lng: 27.4794,
        formatted_address: 'Lubumbashi, République Démocratique du Congo'
      },
      'Kolwezi': {
        lat: -10.7143,
        lng: 25.4731,
        formatted_address: 'Kolwezi, République Démocratique du Congo'
      },
    };

    const result = fallbacks[city] || fallbacks['Kinshasa'];
    
    // Ajouter une légère variation pour éviter les coordonnées identiques
    const variation = (Math.random() - 0.5) * 0.01;
    
    return {
      ...result,
      lat: result.lat + variation,
      lng: result.lng + variation
    };
  }

  /**
   * Calcule la distance entre deux points
   */
  static calculateDistance(
    lat1: number, lng1: number, 
    lat2: number, lng2: number
  ): number {
    const R = 6371; // Rayon de la Terre en km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }
}