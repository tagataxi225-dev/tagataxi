/**
 * 🛣️ Service de tracé de routes professionnel style Yango
 * - Tracés haute précision suivant les routes réelles
 * - Segments de trafic colorés
 * - Lissage des courbes pour rendu fluide
 */

import { DirectionsService } from './directionsService';

export interface TrafficSegment {
  startIndex: number;
  endIndex: number;
  path: google.maps.LatLng[];
  trafficLevel: 'free' | 'slow' | 'heavy' | 'blocked';
  color: string;
  speedRatio: number; // 1 = libre, 0.5 = lent, etc.
}

export interface ProfessionalRouteResult {
  geometry: google.maps.LatLng[];
  geometrySmoothed: google.maps.LatLng[];
  distance: number;
  duration: number;
  distanceText: string;
  durationText: string;
  trafficSegments: TrafficSegment[];
  bounds: google.maps.LatLngBounds;
  polylineEncoded?: string;
  provider: 'google' | 'fallback';
}

export interface RouteStep {
  instruction: string;
  distance: number;
  duration: number;
  path: google.maps.LatLng[];
  maneuver?: string;
}

// Couleurs de trafic style Yango/Google Maps
const TRAFFIC_COLORS = {
  free: '#22c55e',    // Vert - Fluide
  slow: '#f59e0b',    // Orange - Ralenti
  heavy: '#ef4444',   // Rouge - Dense
  blocked: '#7f1d1d'  // Rouge foncé - Bloqué
};

class ProfessionalRouteService {
  private cache = new Map<string, { result: ProfessionalRouteResult; timestamp: number }>();
  private CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  /**
   * 🎯 Calculer une route haute précision
   */
  async calculateRoute(
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number },
    options: { showTraffic?: boolean; smoothing?: boolean } = {}
  ): Promise<ProfessionalRouteResult> {
    // 🛡️ Guard: Google Maps must be loaded
    if (!window.google?.maps?.LatLng) {
      throw new Error('Google Maps not loaded — cannot calculate route');
    }
    const cacheKey = `${origin.lat},${origin.lng}-${destination.lat},${destination.lng}`;
    
    // Vérifier le cache
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      console.log('🚀 Route from cache');
      return cached.result;
    }

    try {
      // Utiliser le DirectionsService existant avec options optimales
      const directionsResult = await DirectionsService.getDirections(origin, destination, {
        profile: options.showTraffic ? 'driving-traffic' : 'driving',
        steps: true,
        overview: 'full'
      });

      // Convertir en format LatLng
      const geometry = directionsResult.geometry.map(
        coord => new google.maps.LatLng(coord[1], coord[0])
      );

      // Lisser la géométrie si demandé
      const geometrySmoothed = options.smoothing !== false 
        ? this.smoothPath(geometry)
        : geometry;

      // Calculer les bounds
      const bounds = new google.maps.LatLngBounds();
      geometry.forEach(point => bounds.extend(point));

      // Générer les segments de trafic (simulation basée sur la durée)
      const trafficSegments = this.generateTrafficSegments(
        geometrySmoothed,
        directionsResult.duration,
        directionsResult.distance
      );

      const result: ProfessionalRouteResult = {
        geometry,
        geometrySmoothed,
        distance: directionsResult.distance,
        duration: directionsResult.duration,
        distanceText: directionsResult.distanceText,
        durationText: directionsResult.durationText,
        trafficSegments,
        bounds,
        provider: directionsResult.provider
      };

      // Mettre en cache
      this.cache.set(cacheKey, { result, timestamp: Date.now() });

      return result;
    } catch (error) {
      console.error('❌ Professional route calculation failed:', error);
      throw error;
    }
  }

  /**
   * 🎨 Lisser le tracé pour éviter les angles cassés
   */
  private smoothPath(path: google.maps.LatLng[]): google.maps.LatLng[] {
    if (path.length < 3) return path;

    const smoothed: google.maps.LatLng[] = [path[0]];
    
    for (let i = 1; i < path.length - 1; i++) {
      const prev = path[i - 1];
      const curr = path[i];
      const next = path[i + 1];

      // Moyenne pondérée pour lisser
      const lat = (prev.lat() * 0.25 + curr.lat() * 0.5 + next.lat() * 0.25);
      const lng = (prev.lng() * 0.25 + curr.lng() * 0.5 + next.lng() * 0.25);

      smoothed.push(new google.maps.LatLng(lat, lng));
    }

    smoothed.push(path[path.length - 1]);
    return smoothed;
  }

  /**
   * 🚦 Générer les segments de trafic basés sur la durée estimée
   */
  private generateTrafficSegments(
    path: google.maps.LatLng[],
    duration: number,
    distance: number
  ): TrafficSegment[] {
    if (path.length < 2) return [];

    // Vitesse moyenne théorique (30 km/h à Kinshasa)
    const theoreticalDuration = (distance / 1000) / 30 * 3600;
    const congestionRatio = duration / theoreticalDuration;

    // Si peu de congestion, route entièrement verte
    if (congestionRatio < 1.2) {
      return [{
        startIndex: 0,
        endIndex: path.length - 1,
        path: path,
        trafficLevel: 'free',
        color: TRAFFIC_COLORS.free,
        speedRatio: 1
      }];
    }

    // Simuler des segments de trafic variés
    const segments: TrafficSegment[] = [];
    const numSegments = Math.min(5, Math.ceil(path.length / 20));
    const segmentSize = Math.floor(path.length / numSegments);

    for (let i = 0; i < numSegments; i++) {
      const startIndex = i * segmentSize;
      const endIndex = i === numSegments - 1 ? path.length - 1 : (i + 1) * segmentSize;
      
      // Variation aléatoire mais cohérente basée sur l'index
      const variation = Math.sin(i * 1.5) * 0.3 + congestionRatio;
      
      let level: TrafficSegment['trafficLevel'];
      let color: string;
      let speedRatio: number;

      if (variation < 1.3) {
        level = 'free';
        color = TRAFFIC_COLORS.free;
        speedRatio = 1;
      } else if (variation < 1.7) {
        level = 'slow';
        color = TRAFFIC_COLORS.slow;
        speedRatio = 0.6;
      } else if (variation < 2.2) {
        level = 'heavy';
        color = TRAFFIC_COLORS.heavy;
        speedRatio = 0.3;
      } else {
        level = 'blocked';
        color = TRAFFIC_COLORS.blocked;
        speedRatio = 0.1;
      }

      segments.push({
        startIndex,
        endIndex,
        path: path.slice(startIndex, endIndex + 1),
        trafficLevel: level,
        color,
        speedRatio
      });
    }

    return segments;
  }

  /**
   * 📍 Simplifier le path pour performances mobiles
   */
  simplifyPath(path: google.maps.LatLng[], maxPoints: number = 500): google.maps.LatLng[] {
    if (path.length <= maxPoints) return path;

    const step = Math.ceil(path.length / maxPoints);
    const simplified: google.maps.LatLng[] = [];

    for (let i = 0; i < path.length; i += step) {
      simplified.push(path[i]);
    }

    // Toujours inclure le dernier point
    if (simplified[simplified.length - 1] !== path[path.length - 1]) {
      simplified.push(path[path.length - 1]);
    }

    return simplified;
  }

  /**
   * 🧹 Vider le cache
   */
  clearCache(): void {
    this.cache.clear();
  }
}

export const professionalRouteService = new ProfessionalRouteService();
