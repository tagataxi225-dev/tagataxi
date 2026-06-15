/**
 * 🔮 PREDICTIVE ROUTE CACHE SERVICE - Phase 3 OPTIMIZED
 * Cache léger - Préchargement désactivé pour éviter les conflits
 */

import { routeCache } from './routeCacheService';
import { secureNavigationService } from './secureNavigationService';

interface PopularDestination {
  id: string;
  name: string;
  coordinates: { lat: number; lng: number };
  visitCount: number;
}

export class PredictiveRouteCacheService {
  private isPreloading = false;
  private preloadDisabled = true; // 🔧 DÉSACTIVÉ - cause des AbortError

  /**
   * Récupère les destinations populaires pour une ville
   */
  private getPopularDestinations(city: string): PopularDestination[] {
    const kinshasa = [
      { id: '1', name: 'Aéroport de N\'djili', coordinates: { lat: -4.3857, lng: 15.4446 }, visitCount: 100 },
      { id: '2', name: 'Gare Centrale', coordinates: { lat: -4.3276, lng: 15.3136 }, visitCount: 95 },
      { id: '3', name: 'Marché Central', coordinates: { lat: -4.3217, lng: 15.3069 }, visitCount: 90 },
    ];

    return kinshasa;
  }

  /**
   * Pré-charge les routes - DÉSACTIVÉ pour éviter les conflits
   */
  async preloadPopularRoutes(
    userLocation: { lat: number; lng: number },
    city: string = 'Kinshasa'
  ): Promise<void> {
    // 🔧 DÉSACTIVÉ - Le préchargement causait des AbortError et conflits
    if (this.preloadDisabled) {
      console.log('⏸️ [PredictiveCache] Preload disabled to avoid conflicts');
      return;
    }

    if (this.isPreloading) {
      return;
    }

    this.isPreloading = true;
    console.log('🔮 [PredictiveCache] Starting minimal preload for', city);

    try {
      const popularPlaces = this.getPopularDestinations(city);
      
      // Précharger seulement 1 destination avec délai
      for (const place of popularPlaces.slice(0, 1)) {
        await new Promise(resolve => setTimeout(resolve, 3000)); // 3s délai
        
        try {
          await routeCache.getOrCalculate(
            userLocation,
            place.coordinates,
            () => secureNavigationService.calculateRoute({
              origin: userLocation,
              destination: place.coordinates,
              mode: 'driving'
            })
          );
          console.log(`✅ [PredictiveCache] Preloaded ${place.name}`);
        } catch (error) {
          // Silencieux - pas de spam d'erreurs
        }
      }
    } finally {
      this.isPreloading = false;
    }
  }

  /**
   * Pré-charge intelligente - DÉSACTIVÉE
   */
  async smartPreload(
    userLocation: { lat: number; lng: number },
    city: string = 'Kinshasa'
  ): Promise<void> {
    // 🔧 DÉSACTIVÉ pour stabilité
    console.log('⏸️ [PredictiveCache] Smart preload disabled');
    return;
  }
}

// Instance singleton
export const predictiveRouteCache = new PredictiveRouteCacheService();
