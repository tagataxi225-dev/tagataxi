/**
 * 🚗 Utilitaires d'animation pour véhicules
 * Interpolation fluide de position et rotation pour mouvement réaliste
 */

// Easing functions
export const easeOutCubic = (t: number): number => 1 - Math.pow(1 - t, 3);
export const easeInOutCubic = (t: number): number => 
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

export interface LatLng {
  lat: number;
  lng: number;
}

/**
 * Anime la position d'un marker de façon fluide
 */
export const animateVehicleMove = (
  marker: google.maps.Marker | google.maps.marker.AdvancedMarkerElement,
  from: LatLng,
  to: LatLng,
  duration: number = 1000,
  onComplete?: () => void
): number => {
  const startTime = Date.now();
  let animationId: number;
  
  const animate = () => {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = easeOutCubic(progress);
    
    const lat = from.lat + (to.lat - from.lat) * eased;
    const lng = from.lng + (to.lng - from.lng) * eased;
    
    if ('setPosition' in marker) {
      marker.setPosition({ lat, lng });
    } else {
      marker.position = { lat, lng };
    }
    
    if (progress < 1) {
      animationId = requestAnimationFrame(animate);
    } else {
      onComplete?.();
    }
  };
  
  animationId = requestAnimationFrame(animate);
  return animationId;
};

/**
 * Interpole la rotation (heading) en prenant le chemin le plus court
 */
export const interpolateHeading = (
  currentHeading: number,
  targetHeading: number
): number => {
  let diff = targetHeading - currentHeading;
  
  // Normaliser pour choisir le chemin le plus court
  if (diff > 180) diff -= 360;
  if (diff < -180) diff += 360;
  
  return diff;
};

/**
 * Calcule la durée d'animation basée sur la distance
 */
export const calculateAnimationDuration = (
  from: LatLng,
  to: LatLng,
  minDuration: number = 500,
  maxDuration: number = 2000
): number => {
  // Distance approximative en mètres
  const R = 6371000; // Rayon terrestre en mètres
  const dLat = (to.lat - from.lat) * Math.PI / 180;
  const dLng = (to.lng - from.lng) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(from.lat * Math.PI / 180) * Math.cos(to.lat * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  // 10ms par mètre, clampé entre min et max
  return Math.min(Math.max(distance * 10, minDuration), maxDuration);
};

/**
 * Classe pour gérer l'animation continue d'un véhicule
 */
export class VehicleAnimationController {
  private animationId: number | null = null;
  private currentPosition: LatLng;
  private currentHeading: number = 0;
  
  constructor(initialPosition: LatLng, initialHeading: number = 0) {
    this.currentPosition = initialPosition;
    this.currentHeading = initialHeading;
  }
  
  moveTo(
    marker: google.maps.Marker | google.maps.marker.AdvancedMarkerElement,
    targetPosition: LatLng,
    targetHeading?: number,
    duration?: number
  ) {
    // Annuler l'animation précédente
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    
    const calculatedDuration = duration ?? calculateAnimationDuration(
      this.currentPosition,
      targetPosition
    );
    
    this.animationId = animateVehicleMove(
      marker,
      this.currentPosition,
      targetPosition,
      calculatedDuration,
      () => {
        this.currentPosition = targetPosition;
        if (targetHeading !== undefined) {
          this.currentHeading = targetHeading;
        }
      }
    );
    
    return this.animationId;
  }
  
  stop() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }
  
  getCurrentPosition(): LatLng {
    return this.currentPosition;
  }
  
  getCurrentHeading(): number {
    return this.currentHeading;
  }
}

/**
 * Groupe les updates rapides pour réduire les animations
 */
export const createThrottledUpdater = (
  callback: (position: LatLng, heading: number) => void,
  delay: number = 100
) => {
  let lastUpdate = 0;
  let pendingUpdate: { position: LatLng; heading: number } | null = null;
  let timeoutId: NodeJS.Timeout | null = null;
  
  return (position: LatLng, heading: number) => {
    const now = Date.now();
    
    if (now - lastUpdate >= delay) {
      lastUpdate = now;
      callback(position, heading);
    } else {
      pendingUpdate = { position, heading };
      
      if (!timeoutId) {
        timeoutId = setTimeout(() => {
          if (pendingUpdate) {
            lastUpdate = Date.now();
            callback(pendingUpdate.position, pendingUpdate.heading);
            pendingUpdate = null;
          }
          timeoutId = null;
        }, delay - (now - lastUpdate));
      }
    }
  };
};
