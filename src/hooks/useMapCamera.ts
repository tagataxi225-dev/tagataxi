import { useCallback, useRef } from 'react';

interface CameraOptions {
  center?: google.maps.LatLng | google.maps.LatLngLiteral;
  zoom?: number;
  tilt?: number;
  heading?: number;
}

export function useMapCamera(mapInstance: google.maps.Map | null) {
  const animationFrameRef = useRef<number>();

  const animateCamera = useCallback((
    targetOptions: CameraOptions,
    duration: number = 1000
  ) => {
    if (!mapInstance) return;

    const startTime = Date.now();
    const startZoom = mapInstance.getZoom() || 13;
    const startCenter = mapInstance.getCenter();
    const startTilt = mapInstance.getTilt() || 0;
    const startHeading = mapInstance.getHeading() || 0;

    const targetZoom = targetOptions.zoom ?? startZoom;
    const targetCenter = targetOptions.center;
    const targetTilt = targetOptions.tilt ?? startTilt;
    const targetHeading = targetOptions.heading ?? startHeading;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function (ease-in-out)
      const eased = progress < 0.5
        ? 2 * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 2) / 2;

      // Interpolate zoom
      const currentZoom = startZoom + (targetZoom - startZoom) * eased;
      mapInstance.setZoom(currentZoom);

      // Interpolate center
      if (targetCenter && startCenter) {
        const targetLat: number = 'lat' in targetCenter 
          ? (targetCenter.lat as number)
          : (targetCenter as google.maps.LatLng).lat();
        const targetLng: number = 'lng' in targetCenter 
          ? (targetCenter.lng as number)
          : (targetCenter as google.maps.LatLng).lng();
        
        const lat = startCenter.lat() + (targetLat - startCenter.lat()) * eased;
        const lng = startCenter.lng() + (targetLng - startCenter.lng()) * eased;
        mapInstance.setCenter({ lat, lng });
      }

      // Interpolate tilt
      const currentTilt = startTilt + (targetTilt - startTilt) * eased;
      mapInstance.setTilt(currentTilt);

      // Interpolate heading
      const currentHeading = startHeading + (targetHeading - startHeading) * eased;
      mapInstance.setHeading(currentHeading);

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      }
    };

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    animate();
  }, [mapInstance]);

  const flyTo = useCallback((
    location: google.maps.LatLng | google.maps.LatLngLiteral,
    zoom: number = 15
  ) => {
    animateCamera({ center: location, zoom, tilt: 45 }, 1500);
  }, [animateCamera]);

  const fitBoundsAnimated = useCallback((
    bounds: google.maps.LatLngBounds,
    padding: number = 80
  ) => {
    if (!mapInstance) return;
    
    mapInstance.fitBounds(bounds, padding);
  }, [mapInstance]);

  return {
    animateCamera,
    flyTo,
    fitBoundsAnimated
  };
}
