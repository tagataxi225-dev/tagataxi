/**
 * 🔒 Service de Navigation Sécurisé - OPTIMISÉ
 * Wrapper sécurisé pour les appels à Google Directions API via Edge Function
 * Avec retry automatique et validation des coordonnées
 */

import { supabase } from '@/integrations/supabase/client';
import { NavigationRoute } from '@/types/map';
import { toast } from 'sonner';

interface CalculateRouteOptions {
  origin: { lat: number; lng: number };
  destination: { lat: number; lng: number };
  waypoints?: Array<{ lat: number; lng: number }>;
  avoidTolls?: boolean;
  avoidHighways?: boolean;
  mode?: 'driving' | 'walking' | 'bicycling';
}

// Validation des coordonnées
function isValidCoordinate(coord: { lat: number; lng: number }): boolean {
  return (
    typeof coord.lat === 'number' &&
    typeof coord.lng === 'number' &&
    !isNaN(coord.lat) &&
    !isNaN(coord.lng) &&
    coord.lat >= -90 && coord.lat <= 90 &&
    coord.lng >= -180 && coord.lng <= 180
  );
}

// Délai utilitaire
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

class SecureNavigationService {
  private maxRetries = 3;
  private retryDelay = 1500;

  /**
   * Calculer un itinéraire avec retry automatique
   */
  async calculateRoute(options: CalculateRouteOptions): Promise<NavigationRoute | null> {
    const { origin, destination, waypoints = [], avoidTolls = false, avoidHighways = false, mode = 'driving' } = options;

    // 🔧 Validation des coordonnées
    if (!isValidCoordinate(origin)) {
      console.error('❌ [Navigation] Invalid origin coordinates:', origin);
      return null;
    }
    
    if (!isValidCoordinate(destination)) {
      console.error('❌ [Navigation] Invalid destination coordinates:', destination);
      return null;
    }

    // 🔧 Vérifier que origin et destination sont différents
    if (Math.abs(origin.lat - destination.lat) < 0.0001 && Math.abs(origin.lng - destination.lng) < 0.0001) {
      console.warn('⚠️ [Navigation] Origin and destination are the same');
      return {
        distance: 0,
        duration: 0,
        distanceText: '0 m',
        durationText: '0 min',
        steps: [],
        polyline: ''
      };
    }

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        console.log(`🗺️ [Navigation] Attempt ${attempt}/${this.maxRetries}...`);

        const params: Record<string, any> = {
          origin: `${origin.lat},${origin.lng}`,
          destination: `${destination.lat},${destination.lng}`,
          mode,
          language: 'fr',
          traffic_model: 'best_guess',
          departure_time: 'now',
          alternatives: false
        };

        if (waypoints.length > 0) {
          params.waypoints = waypoints.map(wp => `${wp.lat},${wp.lng}`).join('|');
        }

        const avoid: string[] = [];
        if (avoidTolls) avoid.push('tolls');
        if (avoidHighways) avoid.push('highways');
        if (avoid.length > 0) params.avoid = avoid.join('|');

        // 🔧 Appel avec timeout de 20s
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 20000);

        const { data, error } = await supabase.functions.invoke('google-maps-proxy', {
          body: { service: 'directions', params }
        });

        clearTimeout(timeoutId);

        if (error) {
          throw new Error(error.message || 'Proxy error');
        }

        if (data?.status === 'OK' && data?.routes?.[0]) {
          const route = data.routes[0];
          const leg = route.legs[0];

          const navigationRoute: NavigationRoute = {
            distance: leg.distance.value,
            duration: leg.duration.value,
            distanceText: leg.distance.text,
            durationText: leg.duration.text,
            steps: leg.steps.map((step: any) => ({
              instruction: this.cleanHtmlInstruction(step.html_instructions),
              distance: step.distance.value,
              duration: step.duration.value,
              maneuver: step.maneuver
            })),
            polyline: route.overview_polyline.points
          };

          console.log(`✅ [Navigation] Route calculated: ${navigationRoute.distanceText}, ${navigationRoute.durationText}`);
          return navigationRoute;
        }

        if (data?.status === 'ZERO_RESULTS') {
          console.warn('⚠️ [Navigation] No route found');
          return null;
        }

        throw new Error(data?.error_message || `API returned: ${data?.status}`);

      } catch (error: any) {
        lastError = error;
        console.warn(`⚠️ [Navigation] Attempt ${attempt} failed:`, error.message);

        // Ne pas réessayer pour certaines erreurs
        if (error.message?.includes('AbortError') || error.name === 'AbortError') {
          console.log('⏱️ [Navigation] Request aborted, skipping retry');
          break;
        }

        if (attempt < this.maxRetries) {
          await delay(this.retryDelay * attempt);
        }
      }
    }

    console.error('❌ [Navigation] All attempts failed:', lastError?.message);
    return null;
  }

  /**
   * Calculer l'ETA avec prise en compte du trafic
   */
  async calculateETAWithTraffic(
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number }
  ): Promise<{ duration: number; durationInTraffic?: number } | null> {
    if (!isValidCoordinate(origin) || !isValidCoordinate(destination)) {
      return null;
    }

    try {
      const { data, error } = await supabase.functions.invoke('google-maps-proxy', {
        body: {
          service: 'distancematrix',
          params: {
            origins: `${origin.lat},${origin.lng}`,
            destinations: `${destination.lat},${destination.lng}`,
            mode: 'driving',
            language: 'fr',
            traffic_model: 'best_guess',
            departure_time: 'now'
          }
        }
      });

      if (error || data?.status !== 'OK') {
        return null;
      }

      const element = data.rows?.[0]?.elements?.[0];
      if (element?.status === 'OK') {
        return {
          duration: element.duration.value,
          durationInTraffic: element.duration_in_traffic?.value
        };
      }

      return null;
    } catch (error) {
      console.error('❌ [Navigation] ETA error:', error);
      return null;
    }
  }

  private cleanHtmlInstruction(html: string): string {
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.textContent || div.innerText || '';
  }

  decodePolyline(encoded: string): Array<{ lat: number; lng: number }> {
    const poly: Array<{ lat: number; lng: number }> = [];
    let index = 0;
    const len = encoded.length;
    let lat = 0;
    let lng = 0;

    while (index < len) {
      let b;
      let shift = 0;
      let result = 0;
      
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      
      const dlat = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
      lat += dlat;

      shift = 0;
      result = 0;
      
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      
      const dlng = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
      lng += dlng;

      poly.push({
        lat: lat / 1e5,
        lng: lng / 1e5
      });
    }

    return poly;
  }
}

export const secureNavigationService = new SecureNavigationService();
