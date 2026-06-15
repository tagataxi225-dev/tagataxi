/**
 * 🎯 Hook de gestion intelligente de la caméra Google Maps
 * Style Uber/Yango: fitBounds dynamique, pas de zoom fixe
 */

import { useCallback, useRef, useState } from 'react';
import { 
  calculateDynamicPadding, 
  PRESET_PADDINGS, 
  MapPadding,
  MapPaddingConfig,
  isMobileDevice 
} from '@/utils/mapPaddingUtils';

interface Coordinates {
  lat: number;
  lng: number;
}

interface SmartCameraOptions {
  bottomSheetHeight?: number;
  maxZoom?: number;
  minZoom?: number;
  animationDuration?: number;
  padding?: MapPadding | MapPaddingConfig;
}

interface ZoomToPointOptions extends SmartCameraOptions {
  contextualZoom?: boolean;
  baseZoom?: number;
}

interface FollowModeOptions {
  updateThreshold?: number; // Distance en mètres avant recadrage
  zoomLevel?: number;
}

const DEFAULT_OPTIONS: SmartCameraOptions = {
  bottomSheetHeight: 420,
  maxZoom: 17,
  minZoom: 10,
  animationDuration: 600,
};

const CONTEXTUAL_ZOOM_LEVELS = {
  singlePoint: 16,
  route: 15,
  tripWithDriver: 14,
  cityOverview: 12,
};

// Easing function (ease-out cubic)
const easeOutCubic = (t: number): number => 1 - Math.pow(1 - t, 3);

export function useSmartMapCamera(mapInstance: google.maps.Map | null) {
  const animationFrameRef = useRef<number | null>(null);
  const lastBoundsRef = useRef<google.maps.LatLngBounds | null>(null);
  const [isUserZooming, setIsUserZooming] = useState(false);
  const userZoomTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Détecte si l'utilisateur manipule manuellement la carte
   */
  const setupUserInteractionDetection = useCallback(() => {
    if (!mapInstance) return;

    const handleDragStart = () => setIsUserZooming(true);
    const handleDragEnd = () => {
      if (userZoomTimeoutRef.current) clearTimeout(userZoomTimeoutRef.current);
      userZoomTimeoutRef.current = setTimeout(() => setIsUserZooming(false), 3000);
    };

    google.maps.event.addListener(mapInstance, 'dragstart', handleDragStart);
    google.maps.event.addListener(mapInstance, 'dragend', handleDragEnd);
    google.maps.event.addListener(mapInstance, 'zoom_changed', () => {
      setIsUserZooming(true);
      if (userZoomTimeoutRef.current) clearTimeout(userZoomTimeoutRef.current);
      userZoomTimeoutRef.current = setTimeout(() => setIsUserZooming(false), 3000);
    });
  }, [mapInstance]);

  /**
   * Applique un limiteur de zoom après fitBounds
   */
  const clampZoomAfterFit = useCallback((maxZoom: number = 17, minZoom: number = 10) => {
    if (!mapInstance) return;

    const listener = google.maps.event.addListenerOnce(mapInstance, 'bounds_changed', () => {
      const currentZoom = mapInstance.getZoom();
      if (currentZoom) {
        if (currentZoom > maxZoom) {
          mapInstance.setZoom(maxZoom);
        } else if (currentZoom < minZoom) {
          mapInstance.setZoom(minZoom);
        }
      }
    });

    return () => google.maps.event.removeListener(listener);
  }, [mapInstance]);

  /**
   * Animation fluide de la caméra
   */
  const animateCamera = useCallback((
    targetOptions: {
      center?: google.maps.LatLngLiteral;
      zoom?: number;
      tilt?: number;
      heading?: number;
    },
    duration: number = 600
  ): Promise<void> => {
    return new Promise((resolve) => {
      if (!mapInstance) {
        resolve();
        return;
      }

      // Annuler animation en cours
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      const startTime = Date.now();
      const startCenter = mapInstance.getCenter();
      const startZoom = mapInstance.getZoom() || 13;
      const startTilt = mapInstance.getTilt() || 0;
      const startHeading = mapInstance.getHeading() || 0;

      const targetZoom = targetOptions.zoom ?? startZoom;
      const targetTilt = targetOptions.tilt ?? startTilt;
      const targetHeading = targetOptions.heading ?? startHeading;

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = easeOutCubic(progress);

        // Interpoler zoom
        const currentZoom = startZoom + (targetZoom - startZoom) * eased;
        mapInstance.setZoom(currentZoom);

        // Interpoler center
        if (targetOptions.center && startCenter) {
          const lat = startCenter.lat() + (targetOptions.center.lat - startCenter.lat()) * eased;
          const lng = startCenter.lng() + (targetOptions.center.lng - startCenter.lng()) * eased;
          mapInstance.setCenter({ lat, lng });
        }

        // Interpoler tilt
        mapInstance.setTilt(startTilt + (targetTilt - startTilt) * eased);

        // Interpoler heading
        mapInstance.setHeading(startHeading + (targetHeading - startHeading) * eased);

        if (progress < 1) {
          animationFrameRef.current = requestAnimationFrame(animate);
        } else {
          resolve();
        }
      };

      animate();
    });
  }, [mapInstance]);

  /**
   * 📍 Zoom sur un point unique (position utilisateur ou pickup seul)
   */
  const zoomToSinglePoint = useCallback((
    point: Coordinates,
    options: ZoomToPointOptions = {}
  ) => {
    if (!mapInstance) return;

    const {
      contextualZoom = true,
      baseZoom = CONTEXTUAL_ZOOM_LEVELS.singlePoint,
      animationDuration = 600,
    } = options;

    const zoom = contextualZoom ? baseZoom : (options.maxZoom ?? 16);

    animateCamera(
      { center: { lat: point.lat, lng: point.lng }, zoom, tilt: 45 },
      animationDuration
    );
  }, [mapInstance, animateCamera]);

  /**
   * 🛣️ Afficher pickup + destination (fitBounds)
   */
  const fitToRoute = useCallback((
    pickup: Coordinates,
    destination: Coordinates,
    options: SmartCameraOptions = {}
  ) => {
    if (!mapInstance) return;

    const { 
      bottomSheetHeight = 420, 
      maxZoom = 17, 
      minZoom = 10,
      padding: customPadding 
    } = { ...DEFAULT_OPTIONS, ...options };

    const bounds = new google.maps.LatLngBounds();
    bounds.extend({ lat: pickup.lat, lng: pickup.lng });
    bounds.extend({ lat: destination.lat, lng: destination.lng });

    // Calculer padding dynamique
    const padding = customPadding 
      ? (typeof customPadding === 'object' && 'top' in customPadding)
        ? customPadding as MapPadding
        : calculateDynamicPadding(customPadding as MapPaddingConfig)
      : calculateDynamicPadding({ bottomSheetHeight, isMobile: isMobileDevice() });

    mapInstance.fitBounds(bounds, padding);
    lastBoundsRef.current = bounds;

    // Limiter le zoom après fit
    clampZoomAfterFit(maxZoom, minZoom);

    console.log('📍 fitToRoute:', { pickup, destination, padding });
  }, [mapInstance, clampZoomAfterFit]);

  /**
   * 🚗 Afficher pickup + destination + chauffeur (3 points)
   */
  const fitToTrip = useCallback((
    pickup: Coordinates,
    destination: Coordinates,
    driverLocation: Coordinates,
    options: SmartCameraOptions = {}
  ) => {
    if (!mapInstance) return;

    const { 
      bottomSheetHeight = 350, 
      maxZoom = 16, 
      minZoom = 10,
      padding: customPadding 
    } = { ...DEFAULT_OPTIONS, ...options };

    const bounds = new google.maps.LatLngBounds();
    bounds.extend({ lat: pickup.lat, lng: pickup.lng });
    bounds.extend({ lat: destination.lat, lng: destination.lng });
    bounds.extend({ lat: driverLocation.lat, lng: driverLocation.lng });

    // Padding avec info chauffeur
    const padding = customPadding 
      ? (typeof customPadding === 'object' && 'top' in customPadding)
        ? customPadding as MapPadding
        : calculateDynamicPadding(customPadding as MapPaddingConfig)
      : PRESET_PADDINGS.tracking_with_driver();

    mapInstance.fitBounds(bounds, padding);
    lastBoundsRef.current = bounds;

    clampZoomAfterFit(maxZoom, minZoom);

    console.log('🚗 fitToTrip:', { pickup, destination, driver: driverLocation, padding });
  }, [mapInstance, clampZoomAfterFit]);

  /**
   * 👁️ Mode suivi chauffeur avec auto-recadrage
   */
  const followDriver = useCallback((
    driverLocation: Coordinates,
    pickup?: Coordinates,
    destination?: Coordinates,
    options: FollowModeOptions = {}
  ) => {
    if (!mapInstance || isUserZooming) return;

    const { zoomLevel = 16 } = options;

    // Vérifier si le chauffeur est hors des bounds visibles
    const currentBounds = mapInstance.getBounds();
    if (currentBounds) {
      const driverLatLng = new google.maps.LatLng(driverLocation.lat, driverLocation.lng);
      
      if (!currentBounds.contains(driverLatLng)) {
        // Recadrer avec les 3 points si disponibles
        if (pickup && destination) {
          fitToTrip(pickup, destination, driverLocation);
        } else {
          // Sinon, centrer sur le chauffeur
          animateCamera({ center: driverLocation, zoom: zoomLevel }, 400);
        }
      }
    }
  }, [mapInstance, isUserZooming, fitToTrip, animateCamera]);

  /**
   * 🔄 Recentrer la vue sur le contexte actuel
   */
  const recenter = useCallback((
    pickup?: Coordinates,
    destination?: Coordinates,
    driverLocation?: Coordinates
  ) => {
    if (!mapInstance) return;

    if (pickup && destination && driverLocation) {
      fitToTrip(pickup, destination, driverLocation);
    } else if (pickup && destination) {
      fitToRoute(pickup, destination);
    } else if (driverLocation) {
      zoomToSinglePoint(driverLocation, { baseZoom: 16 });
    } else if (pickup) {
      zoomToSinglePoint(pickup, { baseZoom: 15 });
    }
  }, [mapInstance, fitToTrip, fitToRoute, zoomToSinglePoint]);

  /**
   * Vérifie si une position est visible dans le viewport
   */
  const isInViewport = useCallback((position: Coordinates): boolean => {
    if (!mapInstance) return false;
    
    const bounds = mapInstance.getBounds();
    if (!bounds) return false;
    
    return bounds.contains(new google.maps.LatLng(position.lat, position.lng));
  }, [mapInstance]);

  return {
    // Actions principales
    zoomToSinglePoint,
    fitToRoute,
    fitToTrip,
    followDriver,
    recenter,
    animateCamera,
    
    // Utilitaires
    isInViewport,
    isUserZooming,
    setupUserInteractionDetection,
    
    // Config
    presetPaddings: PRESET_PADDINGS,
  };
}
