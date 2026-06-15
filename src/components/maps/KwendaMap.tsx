import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { useGoogleMaps } from '@/hooks/useGoogleMaps';
import { useMapCamera } from '@/hooks/useMapCamera';
import { useMapTheme } from '@/hooks/useMapTheme';
import { useToast } from '@/hooks/use-toast';
import KwendaMapControls from './KwendaMapControls';
import RouteOverlay from './RouteOverlay';
import { throttle } from '@/utils/performanceUtils';
import { nativeGeolocationService } from '@/services/nativeGeolocationService';

interface Location {
  lat: number;
  lng: number;
  address: string;
  name?: string;
}

interface KwendaMapProps {
  pickup?: Location | null;
  destination?: Location | null;
  onMapClick?: (location: { lat: number; lng: number }) => void;
  currentDriverLocation?: { lat: number; lng: number };
  userLocation?: { lat: number; lng: number } | null;
  showRouteInfo?: boolean;
  className?: string;
  enableControls?: boolean;
  enable3D?: boolean;
}

export default function KwendaMap({
  pickup,
  destination,
  onMapClick,
  currentDriverLocation,
  userLocation,
  showRouteInfo = false,
  className = '',
  enableControls = true,
  enable3D = true
}: KwendaMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<(google.maps.marker.AdvancedMarkerElement | google.maps.Marker)[]>([]);
  const polylineRef = useRef<google.maps.Polyline | null>(null);
  
  const { isLoaded, error, isLoading } = useGoogleMaps();
  const { mapStyles } = useMapTheme();
  const { toast } = useToast();
  
  const [isMapReady, setIsMapReady] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [mapType, setMapType] = useState<'roadmap' | 'satellite'>('roadmap');
  const [routeInfo, setRouteInfo] = useState<{ distance: string; duration: string; price?: string } | null>(null);

  const { animateCamera, flyTo, fitBoundsAnimated } = useMapCamera(mapInstanceRef.current);

  // Initialisation de la carte Google Maps moderne
  useEffect(() => {
    if (!isLoaded || !mapRef.current || mapInstanceRef.current) return;

    const initializeMap = async () => {
      try {
        // ✅ NO importLibrary — libraries loaded via script URL for Safari compatibility
        const { googleMapsLoader } = await import('@/services/googleMapsLoader');
        const mapId = googleMapsLoader.getMapId();
        
        // ✅ Map ID est OPTIONNEL - valider le format
        const validMapId = (mapId && !mapId.startsWith('AIza')) ? mapId : undefined;
        
        if (!validMapId) {
          console.warn('⚠️ Map ID absent ou invalide - utilisation des marqueurs classiques');
        }

        const defaultCenter = userLocation 
          ? { lat: userLocation.lat, lng: userLocation.lng }
          : pickup 
          ? { lat: pickup.lat, lng: pickup.lng }
          : { lat: -4.3217, lng: 15.3069 };

        const map = new google.maps.Map(mapRef.current!, {
          // ✅ Map ID conditionnel - fonctionne sans
          ...(validMapId && { mapId: validMapId }),
          center: defaultCenter,
          zoom: userLocation ? 15 : pickup ? 14 : 13,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          zoomControl: false,
          tilt: enable3D ? 45 : 0,
          heading: 0,
          gestureHandling: 'greedy',
          styles: mapStyles
        });

        // Gestion du clic sur la carte
        if (onMapClick) {
          const throttledClick = throttle((e: google.maps.MapMouseEvent) => {
            if (e.latLng) {
              createRippleEffect(e.latLng);
              onMapClick({
                lat: e.latLng.lat(),
                lng: e.latLng.lng()
              });
            }
          }, 300);

          map.addListener('click', throttledClick);
        }

        mapInstanceRef.current = map;
        setIsMapReady(true);
        
        toast({
          title: "🗺️ Carte chargée",
          description: "Carte interactive prête"
        });
      } catch (err) {
        console.error('Erreur initialisation carte:', err);
        toast({
          title: "Erreur",
          description: "Impossible de charger la carte",
          variant: "destructive"
        });
      }
    };

    initializeMap();
  }, [isLoaded, onMapClick, pickup, userLocation, enable3D, mapStyles, toast]);

  // Créer un effet ripple au clic
  const createRippleEffect = (position: google.maps.LatLng) => {
    if (!mapInstanceRef.current) return;

    const ripple = new google.maps.Circle({
      strokeColor: 'hsl(var(--primary))',
      strokeOpacity: 0.8,
      strokeWeight: 2,
      fillColor: 'hsl(var(--primary))',
      fillOpacity: 0.35,
      map: mapInstanceRef.current,
      center: position,
      radius: 10
    });

    let currentRadius = 10;
    const maxRadius = 100;
    const step = 10;

    const animate = () => {
      currentRadius += step;
      if (currentRadius < maxRadius) {
        ripple.setRadius(currentRadius);
        ripple.setOptions({
          fillOpacity: 0.35 * (1 - currentRadius / maxRadius),
          strokeOpacity: 0.8 * (1 - currentRadius / maxRadius)
        });
        requestAnimationFrame(animate);
      } else {
        ripple.setMap(null);
      }
    };

    animate();
  };

  // Gestion des markers — avec fallback classique pour Safari/iOS
  useEffect(() => {
    if (!isMapReady || !window.google?.maps) return;

    // Nettoyer les anciens markers
    markersRef.current.forEach(marker => {
      if ('setMap' in marker && typeof marker.setMap === 'function') {
        marker.setMap(null);
      } else if ('map' in marker) {
        (marker as any).map = null;
      }
    });
    markersRef.current = [];

    const hasAdvanced = !!window.google.maps.marker?.AdvancedMarkerElement;

    const icons: Record<string, string> = {
      pickup: '📍',
      destination: '🎯',
      driver: '🚗',
      user: '👤'
    };

    const emojiColors: Record<string, string> = {
      pickup: '#1a1a1a',
      destination: '#ef4444',
      driver: '#f59e0b',
      user: '#3b82f6'
    };

    const createMarker = (
      position: { lat: number; lng: number },
      title: string,
      type: 'pickup' | 'destination' | 'driver' | 'user'
    ) => {
      if (hasAdvanced) {
        try {
          const markerDiv = document.createElement('div');
          markerDiv.style.cssText = `
            width:44px;height:44px;border-radius:50%;border:3px solid white;
            box-shadow:0 8px 24px rgba(0,0,0,0.3);display:flex;align-items:center;
            justify-content:center;font-size:22px;cursor:pointer;
            background:${emojiColors[type]};
          `;
          markerDiv.innerHTML = icons[type];

          const marker = new google.maps.marker.AdvancedMarkerElement({
            map: mapInstanceRef.current!,
            position,
            content: markerDiv,
            title,
          });
          markersRef.current.push(marker);
          return;
        } catch (e) {
          console.warn('⚠️ AdvancedMarker failed, using classic:', e);
        }
      }

      // 🔄 Classic Marker fallback for Safari/iOS/Android
      const svgIcon = `data:image/svg+xml,${encodeURIComponent(`
        <svg width="44" height="44" xmlns="http://www.w3.org/2000/svg">
          <circle cx="22" cy="22" r="20" fill="${emojiColors[type]}" stroke="white" stroke-width="3"/>
          <text x="22" y="28" text-anchor="middle" font-size="22">${icons[type]}</text>
        </svg>
      `)}`;

      const marker = new google.maps.Marker({
        map: mapInstanceRef.current!,
        position,
        title,
        icon: {
          url: svgIcon,
          scaledSize: new google.maps.Size(44, 44),
          anchor: new google.maps.Point(22, 22),
        },
      });
      markersRef.current.push(marker);
    };

    if (userLocation) {
      createMarker(userLocation, 'Ma position', 'user');
    }

    if (pickup) {
      createMarker(pickup, 'Départ', 'pickup');
    }

    if (destination) {
      createMarker(destination, 'Destination', 'destination');
    }

    if (currentDriverLocation) {
      createMarker(currentDriverLocation, 'Chauffeur', 'driver');
    }
  }, [isMapReady, pickup, destination, userLocation, currentDriverLocation]);

  // Dessiner la route
  useEffect(() => {
    if (!isMapReady || !pickup || !destination) return;

    // Nettoyer ancienne route
    if (polylineRef.current) {
      polylineRef.current.setMap(null);
    }

    const path = [
      { lat: pickup.lat, lng: pickup.lng },
      { lat: destination.lat, lng: destination.lng }
    ];

    const polyline = new google.maps.Polyline({
      path: path,
      geodesic: true,
      strokeColor: 'hsl(var(--primary))',
      strokeOpacity: 0.8,
      strokeWeight: 5,
      map: mapInstanceRef.current!
    });

    polylineRef.current = polyline;

    // Calculer distance et durée
    const distance = google.maps.geometry.spherical.computeDistanceBetween(
      new google.maps.LatLng(pickup.lat, pickup.lng),
      new google.maps.LatLng(destination.lat, destination.lng)
    );

    const distanceKm = (distance / 1000).toFixed(1);
    const durationMin = Math.ceil(distance / 500); // ~30km/h moyenne

    setRouteInfo({
      distance: `${distanceKm} km`,
      duration: `${durationMin} min`,
      price: showRouteInfo ? `${Math.ceil(parseFloat(distanceKm) * 500)} CDF` : undefined
    });

    // Ajuster la vue
    const bounds = new google.maps.LatLngBounds();
    bounds.extend(pickup);
    bounds.extend(destination);
    fitBoundsAnimated(bounds, 100);
  }, [isMapReady, pickup, destination, showRouteInfo, fitBoundsAnimated]);

  // Contrôles de la carte
  const handleZoomIn = useCallback(() => {
    if (!mapInstanceRef.current) return;
    const currentZoom = mapInstanceRef.current.getZoom() || 13;
    animateCamera({ zoom: currentZoom + 1 }, 300);
  }, [animateCamera]);

  const handleZoomOut = useCallback(() => {
    if (!mapInstanceRef.current) return;
    const currentZoom = mapInstanceRef.current.getZoom() || 13;
    animateCamera({ zoom: currentZoom - 1 }, 300);
  }, [animateCamera]);

  const handleLocate = useCallback(async () => {
    setIsLocating(true);
    try {
      // Utiliser nativeGeolocationService avec retry 2 passes (Android/iOS/Safari)
      const position = await nativeGeolocationService.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0 // Force GPS hardware frais
      });
      flyTo({ lat: position.lat, lng: position.lng }, 16);
    } catch {
      toast({
        title: "Erreur",
        description: "Impossible d'obtenir votre position",
        variant: "destructive"
      });
    } finally {
      setIsLocating(false);
    }
  }, [flyTo, toast]);

  const handleToggleMapType = useCallback(() => {
    if (!mapInstanceRef.current) return;
    const newType = mapType === 'roadmap' ? 'satellite' : 'roadmap';
    mapInstanceRef.current.setMapTypeId(newType);
    setMapType(newType);
  }, [mapType]);

  // État de chargement
  if (isLoading) {
    return (
      <div className={`flex items-center justify-center bg-muted/30 ${className}`}>
        <div className="text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Chargement de la carte...</p>
        </div>
      </div>
    );
  }

  // État d'erreur
  if (error) {
    return (
      <div className={`flex items-center justify-center bg-destructive/10 ${className}`}>
        <p className="text-sm text-destructive">Erreur: {error}</p>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <div ref={mapRef} className="absolute inset-0 rounded-lg overflow-hidden" />
      
      {enableControls && isMapReady && (
        <KwendaMapControls
          onLocate={handleLocate}
          isLocating={isLocating}
          isLocated={!!userLocation}
        />
      )}

      {showRouteInfo && routeInfo && (
        <RouteOverlay
          distance={routeInfo.distance}
          duration={routeInfo.duration}
          price={routeInfo.price}
        />
      )}

      <style>{`
        @keyframes pulse-marker {
          0%, 100% { transform: scale(1); box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3); }
          50% { transform: scale(1.1); box-shadow: 0 12px 32px rgba(0, 0, 0, 0.4); }
        }
        
        @keyframes bounce-in {
          0% { transform: scale(0) translateY(-100px); opacity: 0; }
          50% { transform: scale(1.2); }
          100% { transform: scale(1) translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
