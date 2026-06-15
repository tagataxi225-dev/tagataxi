/**
 * Service sécurisé pour la géolocalisation des chauffeurs
 * Corrige la faille de sécurité critique : protection des coordonnées exactes des chauffeurs
 */

import { supabase } from '@/integrations/supabase/client';

export interface SecureDriverInfo {
  driver_id: string;
  distance_km: number;
  estimated_arrival_minutes: number;
  vehicle_class: string;
  rating_average: number;
  is_available: boolean;
}

export interface DriverSummary {
  total_available_drivers: number;
  vehicle_class: string;
  city: string;
  avg_rating: number;
}

class SecureDriverLocationService {
  private static instance: SecureDriverLocationService;

  static getInstance(): SecureDriverLocationService {
    if (!SecureDriverLocationService.instance) {
      SecureDriverLocationService.instance = new SecureDriverLocationService();
    }
    return SecureDriverLocationService.instance;
  }

  /**
   * Trouve des chauffeurs à proximité de manière sécurisée
   * Cette fonction ne retourne PAS les coordonnées exactes des chauffeurs
   */
  async findNearbyDriversSecure(
    userLat: number,
    userLng: number,
    maxDistanceKm: number = 5,
    vehicleClassFilter?: string
  ): Promise<SecureDriverInfo[]> {
    try {
      console.log('🔒 Recherche sécurisée de chauffeurs à proximité', {
        userCoordinates: `${userLat.toFixed(4)}, ${userLng.toFixed(4)}`,
        maxDistanceKm,
        vehicleClassFilter
      });

      // Utiliser la fonction pour livraison qui filtre par service_type
      const { data, error } = await supabase.rpc('find_nearby_delivery_drivers', {
        p_lat: userLat,
        p_lng: userLng,
        p_max_distance_km: maxDistanceKm,
        p_delivery_type: vehicleClassFilter || 'flash'
      });

      if (error) {
        console.error('❌ Erreur lors de la recherche sécurisée:', error);
        
        // Messages d'erreur spécifiques pour l'utilisateur
        if (error.message.includes('Authentication required')) {
          throw new Error('Connexion requise pour rechercher des chauffeurs');
        }
        if (error.message.includes('Rate limit exceeded')) {
          throw new Error('Trop de recherches, veuillez patienter quelques minutes');
        }
        throw new Error('Erreur lors de la recherche de chauffeurs');
      }

      // Mapper les données RPC vers l'interface SecureDriverInfo
      const drivers: SecureDriverInfo[] = (data || []).map((driver: any) => ({
        driver_id: driver.driver_id,
        distance_km: driver.distance_km,
        estimated_arrival_minutes: driver.estimated_arrival_minutes || Math.round(driver.distance_km * 2.5),
        vehicle_class: driver.vehicle_class,
        rating_average: driver.rating_average || 0,
        is_available: driver.is_available
      }));
      
      console.log(`✅ ${drivers.length} chauffeurs trouvés de manière sécurisée`);

      return drivers;
    } catch (error) {
      console.error('❌ Erreur dans findNearbyDriversSecure:', error);
      throw error;
    }
  }

  /**
   * Obtient un résumé anonymisé des chauffeurs disponibles
   * Aucune donnée de localisation sensible n'est exposée
   */
  async getAvailableDriversSummary(): Promise<DriverSummary[]> {
    try {
      // Utiliser la fonction sécurisée
      const { data, error } = await supabase.rpc('get_available_drivers_summary');

      if (error) {
        console.error('❌ Erreur lors du résumé des chauffeurs:', error);
        throw new Error('Erreur lors du chargement du résumé des chauffeurs');
      }

      return data || [];
    } catch (error) {
      console.error('❌ Erreur dans getAvailableDriversSummary:', error);
      throw error;
    }
  }

  /**
   * Vérifie si l'utilisateur est authentifié pour les recherches sécurisées
   */
  async isUserAuthenticated(): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      return !!user;
    } catch (error) {
      return false;
    }
  }

  /**
   * Obtient les limites de recherche de l'utilisateur
   */
  async getUserSearchLimits(): Promise<{ remaining: number; resetTime: Date }> {
    try {
      if (!await this.isUserAuthenticated()) {
        return { remaining: 0, resetTime: new Date() };
      }

      // Cette information pourrait être exposée via une fonction RPC si nécessaire
      // Pour l'instant, on retourne des valeurs par défaut
      return {
        remaining: 10, // Limite de 10 recherches par 5 minutes
        resetTime: new Date(Date.now() + 5 * 60 * 1000) // 5 minutes
      };
    } catch (error) {
      console.error('❌ Erreur lors de la vérification des limites:', error);
      return { remaining: 0, resetTime: new Date() };
    }
  }

  /**
   * Signale un problème de sécurité ou d'abus
   */
  async reportSecurityIssue(issue: {
    type: 'privacy_violation' | 'location_tracking' | 'abuse' | 'other';
    description: string;
    metadata?: any;
  }): Promise<void> {
    try {
      if (!await this.isUserAuthenticated()) {
        throw new Error('Connexion requise pour signaler un problème');
      }

      // Logger le signalement pour les admins
      const { error } = await supabase
        .from('location_access_audit')
        .insert({
          access_type: 'security_report',
          search_coordinates: {
            issue_type: issue.type,
            description: issue.description,
            metadata: issue.metadata
          }
        });

      if (error) {
        console.error('❌ Erreur lors du signalement:', error);
        throw new Error('Erreur lors du signalement du problème');
      }

      console.log('✅ Problème de sécurité signalé avec succès');
    } catch (error) {
      console.error('❌ Erreur dans reportSecurityIssue:', error);
      throw error;
    }
  }
}

export const secureDriverLocationService = SecureDriverLocationService.getInstance();

// Types pour le hook de géolocalisation sécurisée
export interface UseSecureDriverLocationOptions {
  autoSearch?: boolean;
  maxDistance?: number;
  vehicleClass?: string;
  refreshInterval?: number;
}

export interface UseSecureDriverLocationReturn {
  drivers: SecureDriverInfo[];
  summary: DriverSummary[];
  isLoading: boolean;
  error: string | null;
  lastSearchTime: Date | null;
  searchLimits: { remaining: number; resetTime: Date };
  searchNearbyDrivers: (lat: number, lng: number, options?: { maxDistance?: number; vehicleClass?: string }) => Promise<void>;
  refreshSummary: () => Promise<void>;
  reportSecurityIssue: (issue: any) => Promise<void>;
  isAuthenticated: boolean;
}