import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Plus, Minus, Bike, Truck, Container } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { googleMapsLoader } from '@/services/googleMapsLoader';
import CustomAnimatedMarker from './CustomAnimatedMarker';
import DriverMarkerAdvanced from './DriverMarkerAdvanced';

// Centres par ville supportée — utilisé comme fallback si aucune position n'est fournie
const CITY_CENTERS: Record<string, { lat: number; lng: number }> = {
  Kinshasa: { lat: -4.3276, lng: 15.3136 },
  Lubumbashi: { lat: -11.6642, lng: 27.4794 },
  Kolwezi: { lat: -10.7167, lng: 25.4667 },
  Abidjan: { lat: 5.3600, lng: -4.0083 },
};
const DEFAULT_CENTER = CITY_CENTERS.Kinshasa; // dernier recours uniquement
const DEFAULT_ZOOM = 12;

interface GoogleMapsKwendaProps {
  onLocationSelect?: (location: { lat: number; lng: number; address: string }) => void;
  pickup?: { lat: number; lng: number };
  destination?: { lat: number; lng: number };
  showRoute?: boolean;
  center?: { lat: number; lng: number };
  zoom?: number;
  height?: string;
  deliveryMode?: 'flash' | 'flex' | 'maxicharge';
  driverLocation?: { lat: number; lng: number; heading?: number | null };
  additionalMarkers?: Array<{ lat: number; lng: number; icon?: string; label?: string }>;
}

const GoogleMapsComponent: React.FC<GoogleMapsKwendaProps> = ({
  onLocationSelect,
  pickup,
  destination,
  showRoute,
  center,
  zoom,
  height,
  deliveryMode,
  driverLocation,
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [initError, setInitError] = useState<string | null>(null);
  const [tilesTimeout, setTilesTimeout] = useState(false);
  const [mapsReady, setMapsReady] = useState(false);
  const directionsRendererRef = useRef<google.maps.DirectionsRenderer | null>(null);
  const youAreHereRef = useRef<google.maps.Marker | null>(null);
  const onLocationSelectRef = useRef(onLocationSelect);
  // Tracks whether the user has manually moved the map. Once true, we must not
  // recentre the map automatically (e.g. on resize / 500ms post-init fix).
  const userInteractedRef = useRef(false);
  const { toast } = useToast();

  console.warn('[Map] GoogleMapsComponent rendered', {
    mapsReady,
    hasGoogleSDK: typeof window !== 'undefined' && !!window.google?.maps,
    hasMapRef: !!mapRef.current,
    hasMapInstance: !!map,
    initError,
    center,
    height,
  });

  // Charger le SDK Google Maps via le service singleton
  useEffect(() => {
    let cancelled = false;
    console.warn('[Map] googleMapsLoader.load() starting...');
    googleMapsLoader.load(['places', 'geometry'])
      .then(() => {
        if (cancelled) return;
        console.warn('[Map] googleMapsLoader.load() resolved → mapsReady=true');
        setMapsReady(true);
      })
      .catch((err) => {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : String(err);
        console.error('[Map] googleMapsLoader.load() rejected:', msg);
        setInitError(`LOADER_FAILED: ${msg}`);
      });
    return () => { cancelled = true; };
  }, []);

  // Si après 5s mapRef existe mais map jamais initialisé → debug overlay
  useEffect(() => {
    if (map) return;
    const timer = setTimeout(() => {
      if (!map && mapRef.current) {
        console.warn('[Map] Timeout 5s: ref OK mais pas de tiles');
        setTilesTimeout(true);
      }
    }, 5000);
    return () => clearTimeout(timer);
  }, [map]);

  // Garder la ref à jour sans déclencher de re-render
  useEffect(() => {
    onLocationSelectRef.current = onLocationSelect;
  }, [onLocationSelect]);

  // ✅ Initialisation de la carte — déclenchée quand mapsReady passe à true
  useEffect(() => {
    console.warn('[Map] init useEffect fired', {
      mapsReady,
      hasMapRef: !!mapRef.current,
      hasMapInstance: !!map,
      hasGoogleSDK: !!window.google?.maps,
    });
    if (!mapsReady) return;
    if (!mapRef.current || map) return;
    if (!window.google?.maps) {
      console.warn('[Map] init aborted: window.google.maps absent malgré mapsReady=true');
      setInitError('SDK_NOT_LOADED');
      return;
    }

    const initialCenter = isValidCoord(center) ? center! : DEFAULT_CENTER;
    const initialZoom = zoom ?? DEFAULT_ZOOM;

    let mapInstance: google.maps.Map;
    try {
      console.warn('[Map] Calling new google.maps.Map()...', { initialCenter, initialZoom });
      mapInstance = new google.maps.Map(mapRef.current, {
        mapId: 'DEMO',
        center: initialCenter,
        zoom: initialZoom,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        gestureHandling: 'greedy',
        zoomControl: false,
        styles: [
          {
            featureType: "all",
            elementType: "geometry.fill",
            stylers: [{ weight: "2.00" }]
          },
          {
            featureType: "all",
            elementType: "geometry.stroke",
            stylers: [{ color: "#9c9c9c" }]
          },
          {
            featureType: "all",
            elementType: "labels.text",
            stylers: [{ visibility: "on" }]
          },
          {
            featureType: "poi",
            elementType: "all",
            stylers: [{ visibility: "off" }]
          },
          {
            featureType: "poi.park",
            elementType: "geometry.fill",
            stylers: [{ visibility: "on" }, { color: "#e8f5e9" }]
          }
        ]
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[Map] Échec init Google Maps:', msg);
      setInitError(`INIT_THROWN: ${msg}`);
      return;
    }

    console.warn('[Map] Map instance created successfully');
    setMap(mapInstance);

    // CSS trick: hide Google Maps POI icons via injected style (no API permission needed)
    const styleEl = document.createElement('style');
    styleEl.id = 'kwenda-hide-poi';
    styleEl.textContent = `
      .gm-style img[src*="icon"],
      .gm-style-mtc,
      .poi-info-window,
      [class*="gm-style"] [style*="z-index: 3"] img,
      .gm-style div[role="button"] img[src*="googleapis.com/maps/vt"] {
        display: none !important;
      }
    `;
    if (!document.getElementById('kwenda-hide-poi')) {
      document.head.appendChild(styleEl);
    }

    // ──────────── RESIZE FIX ────────────
    // Tiles partielles / zone blanche : la map a été créée avant que le container
    // ait sa taille finale → on déclenche un resize après 500ms pour forcer
    // le recalcul du viewport et le rechargement des tiles.
    // Marquer l'interaction utilisateur — empêche tout recentrage auto
    mapInstance.addListener('dragstart', () => {
      userInteractedRef.current = true;
    });

    setTimeout(() => {
      console.warn('[Map] Triggering resize (500ms)');
      google.maps.event.trigger(mapInstance, 'resize');
      if (!userInteractedRef.current) {
        mapInstance.setCenter(initialCenter);
      }
    }, 500);

    // ResizeObserver : re-trigger resize chaque fois que le container change de taille
    // (rotation device, ouverture/fermeture sheet, etc.)
    let resizeObserver: ResizeObserver | null = null;
    if (mapRef.current && typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const { width, height } = entry.contentRect;
          if (width > 0 && height > 0) {
            console.warn('[Map] container resized', width, 'x', height, '— triggering map resize');
            google.maps.event.trigger(mapInstance, 'resize');
          }
        }
      });
      resizeObserver.observe(mapRef.current);
    }

    // ──────────── DEBUG TILES ────────────
    google.maps.event.addListenerOnce(mapInstance, 'tilesloaded', () => {
      console.warn('[Map] tiles loaded OK');
    });
    google.maps.event.addListenerOnce(mapInstance, 'idle', () => {
      console.warn('[Map] map idle (first paint complete)');
    });

    setTimeout(() => {
      const container = mapRef.current;
      if (!container) {
        console.warn('[Map] 3s probe: container ref is null');
        return;
      }
      const rect = container.getBoundingClientRect();
      console.warn('[Map] container size:', rect.width, 'x', rect.height);

      const tiles = container.querySelectorAll('img[src*="googleapis"]');
      console.warn('[Map] tiles count:', tiles.length);

      // Walk up parents to detect overflow/opacity/display issues
      let el: HTMLElement | null = container;
      let depth = 0;
      while (el && depth < 12) {
        const cs = window.getComputedStyle(el);
        const issues: string[] = [];
        if (cs.display === 'none') issues.push('display:none');
        if (cs.visibility === 'hidden') issues.push('visibility:hidden');
        if (parseFloat(cs.opacity) === 0) issues.push('opacity:0');
        if (parseFloat(cs.height) === 0) issues.push(`height:0 (computed ${cs.height})`);
        if (issues.length) {
          console.warn(`[Map] parent[${depth}] ${el.tagName}.${el.className || '(no class)'} → ${issues.join(', ')}`);
        }
        el = el.parentElement;
        depth++;
      }
    }, 3000);
    // ──────────────────────────────────────

    // Gestionnaire de clic sur la carte
    mapInstance.addListener('click', async (event: google.maps.MapMouseEvent) => {
      if (event.latLng && onLocationSelectRef.current) {
        const lat = event.latLng.lat();
        const lng = event.latLng.lng();
        
        const geocoder = new google.maps.Geocoder();
        try {
          const response = await geocoder.geocode({ location: { lat, lng } });
          const address = response.results[0]?.formatted_address || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
          onLocationSelectRef.current({ lat, lng, address });
        } catch (error) {
          console.error('Erreur de géocodage:', error);
          onLocationSelectRef.current({ lat, lng, address: `${lat.toFixed(6)}, ${lng.toFixed(6)}` });
        }
      }
    });

    return () => {
      google.maps.event.clearInstanceListeners(mapInstance);
      if (resizeObserver) resizeObserver.disconnect();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapsReady]);

  // Validation robuste des coordonnées — bloque (0, 0) (Atlantique au large de l'Afrique)
  const isValidCoord = (coord: { lat: number; lng: number } | undefined): boolean => {
    if (!coord) return false;
    return typeof coord.lat === 'number' &&
           typeof coord.lng === 'number' &&
           !isNaN(coord.lat) && !isNaN(coord.lng) &&
           coord.lat >= -90 && coord.lat <= 90 &&
           coord.lng >= -180 && coord.lng <= 180 &&
           !(coord.lat === 0 && coord.lng === 0);
  };

  // fitBounds ne doit s'exécuter qu'une seule fois par paire pickup/destination
  // pour ne pas re-centrer la map à chaque mise à jour GPS du chauffeur.
  const fitBoundsDoneRef = useRef(false);

  // Ajuster la vue pour inclure tous les points lorsque aucun itinéraire n'est affiché
  useEffect(() => {
    if (fitBoundsDoneRef.current) return;
    if (!map) return;
    if (showRoute) return; // DirectionsRenderer gère le fitBounds quand l'itinéraire est visible

    const bounds = new google.maps.LatLngBounds();
    let hasAny = false;

    if (isValidCoord(pickup)) { bounds.extend(pickup!); hasAny = true; }
    if (isValidCoord(destination)) { bounds.extend(destination!); hasAny = true; }
    if (driverLocation && isValidCoord({ lat: driverLocation.lat, lng: driverLocation.lng })) {
      bounds.extend({ lat: driverLocation.lat, lng: driverLocation.lng });
      hasAny = true;
    }

    if (hasAny && (isValidCoord(pickup) || isValidCoord(destination))) {
      map.fitBounds(bounds, 64);
      fitBoundsDoneRef.current = true;
    }
    // ✅ FIX: Pas de recentrage sur DEFAULT_CENTER si aucune position réelle
  }, [map, pickup, destination, showRoute]);

  // Reset du flag fitBounds quand une nouvelle paire pickup/destination valide arrive
  useEffect(() => {
    if (isValidCoord(pickup) && isValidCoord(destination)) {
      fitBoundsDoneRef.current = false;
    }
  }, [pickup?.lat, pickup?.lng, destination?.lat, destination?.lng]);

  useEffect(() => {
    if (!map || !showRoute) return;
    // Early return: pickup/destination missing or 0,0 → ne pas appeler directionsService.route()
    if (
      !pickup || !destination ||
      !pickup.lat || !pickup.lng ||
      !destination.lat || !destination.lng ||
      !isValidCoord(pickup) || !isValidCoord(destination)
    ) {
      console.warn('⚠️ Coordonnées invalides pour calcul itinéraire', { pickup, destination });
      return;
    }

    // Nettoyer l'ancien renderer
    if (directionsRendererRef.current) {
      directionsRendererRef.current.setMap(null);
      directionsRendererRef.current = null;
    }

    const directionsService = new google.maps.DirectionsService();
    const renderer = new google.maps.DirectionsRenderer({
      suppressMarkers: true,
      polylineOptions: {
        strokeColor: deliveryMode === 'flash' ? '#F59E0B' : deliveryMode === 'flex' ? '#22C55E' : '#8B5CF6',
        strokeWeight: 4,
        strokeOpacity: 0.9
      }
    });

    renderer.setMap(map);
    directionsRendererRef.current = renderer;

    const origin = (driverLocation && driverLocation.lat && driverLocation.lng)
      ? { lat: driverLocation.lat, lng: driverLocation.lng }
      : pickup!;
    directionsService.route({
      origin,
      destination: destination!,
      travelMode: google.maps.TravelMode.DRIVING
    }, (result, status) => {
      if (status === google.maps.DirectionsStatus.OK && result) {
        renderer.setDirections(result);
        console.log('✅ Itinéraire calculé avec succès');
      } else {
        console.warn('❌ Erreur calcul itinéraire:', status);
        directionsRendererRef.current?.setMap(null);
      }
    });
  }, [map, pickup, destination, showRoute, deliveryMode, driverLocation]);

  // ──────────── Auto-pan sur la position du chauffeur ────────────
  const driverPanRef = useRef(false);
  useEffect(() => {
    if (!map || !driverLocation) return;
    if (!isValidCoord({ lat: driverLocation.lat, lng: driverLocation.lng })) return;
    // Premier point GPS → centrer automatiquement
    if (!driverPanRef.current) {
      driverPanRef.current = true;
      map.setCenter({ lat: driverLocation.lat, lng: driverLocation.lng });
      map.setZoom(15);
      return;
    }
    // Suivi continu si l'utilisateur n'a pas bougé la carte manuellement
    if (!userInteractedRef.current && !showRoute) {
      map.panTo({ lat: driverLocation.lat, lng: driverLocation.lng });
    }
  }, [map, driverLocation?.lat, driverLocation?.lng, showRoute]);

  // Marker "Vous êtes ici" — bleu, suit center (GPS réel ou fallback ville)
  useEffect(() => {
    if (!map || !center || !isValidCoord(center)) return;

    if (youAreHereRef.current) {
      youAreHereRef.current.setPosition(center);
    } else {
      youAreHereRef.current = new google.maps.Marker({
        map,
        position: center,
        title: 'Vous êtes ici',
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          fillColor: '#3B82F6',
          fillOpacity: 1,
          strokeColor: '#FFFFFF',
          strokeWeight: 3,
          scale: 10,
        },
        zIndex: 20,
      });
    }
  }, [map, center]);

  const handleZoomIn = useCallback(() => {
    if (map) {
      map.setZoom(map.getZoom()! + 1);
    }
  }, [map]);

  const handleZoomOut = useCallback(() => {
    if (map) {
      map.setZoom(map.getZoom()! - 1);
    }
  }, [map]);

  const handleLocateUser = useCallback(async () => {
    try {
      const { nativeGeolocationService } = await import('@/services/nativeGeolocationService');
      const position = await nativeGeolocationService.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0
      });
      const pos = { lat: position.lat, lng: position.lng };
      map?.setCenter(pos);
      map?.setZoom(16);
      console.log('📍 [GoogleMapsKwenda] Position GPS précise:', pos, `±${position.accuracy}m`);
    } catch (err) {
      console.error('❌ [GoogleMapsKwenda] GPS failed:', err);
      toast({
        title: "Erreur",
        description: "Impossible d'obtenir votre position",
        variant: "destructive"
      });
    }
  }, [map, toast]);

  return (
    <Card
      className="relative overflow-hidden h-full w-full rounded-none border-0 shadow-none"
      style={height && height !== '100%' ? { height } : undefined}
    >
      <div ref={mapRef} className="w-full h-full" />

      {/* Spinner pendant le chargement du SDK */}
      {!mapsReady && !initError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-200 z-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      )}

      {/* DEBUG : SDK Google Maps absent (après mapsReady=true) */}
      {mapsReady && (typeof window !== 'undefined' && !window.google?.maps) && (
        <div className="absolute inset-0 bg-red-600 text-white flex flex-col items-center justify-center text-base font-bold z-[60] p-4 text-center">
          <div>⚠️ Google Maps SDK non chargé</div>
          <div className="text-xs font-normal mt-2 opacity-80">window.google.maps absent</div>
        </div>
      )}




      
      {/* Overlay "En attente" — masqué dès qu'un center ou driverLocation est disponible */}
      {!center && !isValidCoord(pickup) && !isValidCoord(destination)
        && !(driverLocation && isValidCoord({ lat: driverLocation.lat, lng: driverLocation.lng })) && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/50 pointer-events-none z-10">
          <div className="text-center p-4 bg-background/80 rounded-xl backdrop-blur-sm">
            <MapPin className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
            <p className="text-sm text-muted-foreground">
              En attente des coordonnées...
            </p>
          </div>
        </div>
      )}
      
      {/* Markers modernes animés */}
      {isValidCoord(pickup) && (
        <CustomAnimatedMarker
          map={map}
          position={pickup!}
          type="pickup"
          label="Point de départ"
          animation="drop"
        />
      )}
      
      {isValidCoord(destination) && (
        <CustomAnimatedMarker
          map={map}
          position={destination!}
          type="destination"
          label="Destination"
          animation="drop"
        />
      )}
      
      {driverLocation && isValidCoord({ lat: driverLocation.lat, lng: driverLocation.lng }) && (
        <DriverMarkerAdvanced
          map={map}
          position={{ lat: driverLocation.lat, lng: driverLocation.lng }}
          heading={driverLocation.heading || 0}
          driverName="Chauffeur"
          smoothTransition={true}
          speed={0}
        />
      )}
      
      {/* Contrôles de zoom compacts */}
      <div className="absolute bottom-4 right-4 flex flex-col gap-1 z-10">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleZoomIn}
          className="h-9 w-9 rounded-full bg-white/90 dark:bg-gray-800/90 backdrop-blur-md shadow-sm border border-border/40 hover:bg-white dark:hover:bg-gray-700"
        >
          <Plus className="h-3.5 w-3.5 text-foreground/70" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleZoomOut}
          className="h-9 w-9 rounded-full bg-white/90 dark:bg-gray-800/90 backdrop-blur-md shadow-sm border border-border/40 hover:bg-white dark:hover:bg-gray-700"
        >
          <Minus className="h-3.5 w-3.5 text-foreground/70" />
        </Button>
      </div>

      {/* Badge mode livraison glassmorphism */}
      {deliveryMode && (
        <div className="absolute top-3 left-3 z-10">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/90 dark:bg-gray-800/90 backdrop-blur-md shadow-sm border border-border/30">
            {deliveryMode === 'flash' && <Bike className="h-3.5 w-3.5 text-amber-500" />}
            {deliveryMode === 'flex' && <Truck className="h-3.5 w-3.5 text-emerald-500" />}
            {deliveryMode === 'maxicharge' && <Container className="h-3.5 w-3.5 text-violet-500" />}
            <span className={`text-xs font-semibold ${
              deliveryMode === 'flash' ? 'text-amber-600' :
              deliveryMode === 'flex' ? 'text-emerald-600' :
              'text-violet-600'
            }`}>
              {deliveryMode.toUpperCase()}
            </span>
          </div>
        </div>
      )}
    </Card>
  );
};

const GoogleMapsKwenda: React.FC<GoogleMapsKwendaProps> = (props) => {
  console.warn('[Map] GoogleMapsKwenda rendered', {
    height: props.height,
    center: props.center,
    hasGoogleSDK: typeof window !== 'undefined' && !!window.google?.maps,
  });

  return <GoogleMapsComponent {...props} />;
};

export default GoogleMapsKwenda;