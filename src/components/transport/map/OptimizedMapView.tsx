import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useGoogleMaps } from '@/hooks/useGoogleMaps';
import { useMapTheme } from '@/hooks/useMapTheme';
import KwendaMapControls from '@/components/maps/KwendaMapControls';
import ProfessionalRoutePolyline from './ProfessionalRoutePolyline';
import { PickupMarker, DestinationMarker } from '@/components/maps/CustomMarkers';

import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { RefreshCw, Map } from 'lucide-react';
import { googleMapsLoader } from '@/services/googleMapsLoader';

interface Location {
  lat: number;
  lng: number;
  address: string;
  name?: string;
}

import { ProfessionalRouteResult } from '@/services/professionalRouteService';

interface OptimizedMapViewProps {
  pickup?: Location | null;
  destination?: Location | null;
  userLocation?: { lat: number; lng: number } | null;
  currentCity?: { name: string; coordinates: { lat: number; lng: number } } | null;
  onMapReady?: (map: google.maps.Map) => void;
  onMapReadyChange?: (ready: boolean) => void;
  onClickPosition?: () => void;
  onDragMarker?: (newPosition: { lat: number; lng: number }) => void;
  bottomSheetHeight?: number;
  className?: string;
  onRouteCalculated?: (result: ProfessionalRouteResult) => void;
}

type MapState = 'loading' | 'ready' | 'degraded';

// Fond statique neutre affiché quand la carte ne charge pas.
// Grille fine sur fond gris — aucun spinner, aucun texte bloquant.
const MapStaticBackground = () => (
  <div
    className="absolute inset-0"
    style={{
      // pointer-events: none garanti — aucun élément ici ne capte les clics
      pointerEvents: 'none',
      backgroundColor: 'hsl(var(--muted))',
      backgroundImage:
        'linear-gradient(hsl(var(--border)/0.6) 1px, transparent 1px),' +
        'linear-gradient(90deg, hsl(var(--border)/0.6) 1px, transparent 1px)',
      backgroundSize: '32px 32px',
    }}
  />
);

const OptimizedMapView = React.memo(({
  pickup, destination, userLocation, currentCity,
  onMapReady, onMapReadyChange, onClickPosition, onDragMarker,
  bottomSheetHeight = 450, className = '',
  onRouteCalculated
}: OptimizedMapViewProps) => {

  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);

  const { isLoaded, error: mapsError, isLoading: mapsLoading, retry } = useGoogleMaps();
  const { mapStyles } = useMapTheme();
  const [mapState, setMapState] = useState<MapState>('loading');
  const [isLocating, setIsLocating] = useState(false);
  const [showLoadingRetry, setShowLoadingRetry] = useState(false);

  const hasCenteredRef = useRef(false);
  const isUserInteractingRef = useRef(false);
  const deadlineRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountTimeRef = useRef(Date.now());
  const retryCountRef = useRef(0);

  const isMapReady = mapState === 'ready';
  const isDegraded = mapState === 'degraded';

  // Notifie le parent dès que l'état carte change.
  // ready  → parent peut activer pointer-events sur le wrapper carte
  // degraded → pareil (la carte est stable, même sans tiles)
  // loading → parent garde pointer-events: none sur le wrapper
  useEffect(() => {
    onMapReadyChange?.(isMapReady || isDegraded);
  }, [isMapReady, isDegraded, onMapReadyChange]);

  // Passer en dégradé si le hook Google Maps remonte une erreur
  useEffect(() => {
    if (mapState !== 'loading') return;

    if (mapsError) {
      console.warn('⚠️ [MAP] Google Maps error → degraded:', mapsError);
      setMapState('degraded');
      return;
    }

    // isLoaded=true pendant le loading = cas normal (SDK vient de finir) → ne pas dégrader
    if (isLoaded) return;

    if (!mapsLoading && !isLoaded && !mapsError) {
      console.warn('⚠️ [MAP] Hook terminated without load/error → degraded');
      setMapState('degraded');
      return;
    }
  }, [mapsError, mapsLoading, isLoaded, mapState]);

  // Deadline 10s : aligné sur le timeout de useGoogleMaps (10s) pour ne pas
  // basculer en dégradé avant que le SDK ait eu le temps de se charger.
  // Appelé UNE SEULE fois au montage — pas dans handleRetry pour éviter le reset infini.
  const startDeadline = useCallback(() => {
    if (deadlineRef.current) clearTimeout(deadlineRef.current);
    deadlineRef.current = setTimeout(() => {
      setMapState(prev => {
        if (prev === 'ready') return prev;
        console.warn(`⏰ [MAP] 10s deadline → degraded (elapsed: ${Date.now() - mountTimeRef.current}ms)`);
        return 'degraded';
      });
    }, 10000);
  }, []);

  useEffect(() => {
    startDeadline();
    return () => {
      if (deadlineRef.current) clearTimeout(deadlineRef.current);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Cleanup au démontage : libérer l'instance Map et les timers
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        google.maps.event?.clearInstanceListeners?.(mapInstanceRef.current);
        mapInstanceRef.current = null;
      }
      if (deadlineRef.current) clearTimeout(deadlineRef.current);
      hasCenteredRef.current = false;
      initCenterRef.current = null;
    };
  }, []);

  // Bouton "Recharger" apparaît après 3s si toujours en loading
  useEffect(() => {
    if (mapState !== 'loading') {
      setShowLoadingRetry(false);
      return;
    }
    const t = setTimeout(() => setShowLoadingRetry(true), 3000);
    return () => clearTimeout(t);
  }, [mapState]);

  // Centre initial gelé au premier isLoaded pour éviter la race condition
  // double-init si userLocation/pickup/currentCity changent avant le rAF.
  const initCenterRef = useRef<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    console.log('[MAP_INIT] check:', { isLoaded, hasRef: !!mapRef.current, hasInstance: !!mapInstanceRef.current });
    if (!isLoaded || !mapRef.current || mapInstanceRef.current) return;
    if (typeof window.google?.maps?.Map !== 'function') {
      console.warn('⚠️ [MAP] isLoaded=true but google.maps.Map is not a function');
      setMapState('degraded');
      return;
    }

    if (!initCenterRef.current) {
      initCenterRef.current = userLocation || pickup || currentCity?.coordinates || { lat: 5.35, lng: -4.00 };
    }

    try {
      const realMapId = googleMapsLoader.getMapId();

      const mapOptions: google.maps.MapOptions = {
        center: initCenterRef.current,
        zoom: userLocation ? 15 : 14,
        mapTypeControl: false, streetViewControl: false,
        fullscreenControl: false, zoomControl: false,
        tilt: 0, gestureHandling: 'cooperative',
        disableDoubleClickZoom: true,
        backgroundColor: '#f8fafc',
        styles: mapStyles,
      };

      if (realMapId) mapOptions.mapId = realMapId;

      requestAnimationFrame(() => {
        if (!mapRef.current || mapInstanceRef.current) return;
        try {
          console.warn('[MAP_INIT] container dimensions:',
            mapRef.current?.offsetWidth, 'x', mapRef.current?.offsetHeight);
          const map = new google.maps.Map(mapRef.current!, mapOptions);
          mapInstanceRef.current = map;

          // Force Maps à recalculer les bounds avec les vraies dimensions du container.
          // Sans ça : si le div avait height:0 ou était en cours d'animation au moment
          // de l'init, Maps calcule des viewport bounds vides → aucune tuile demandée.
          (google.maps.event as any).trigger(map, 'resize');
          map.setCenter(mapOptions.center!);

          if (deadlineRef.current) clearTimeout(deadlineRef.current);

          setMapState('ready');
          console.log('✅ [MAP] Google Maps ready');
          onMapReady?.(map);

          // Deux resize différés pour couvrir les animations du bottom sheet
          // qui repoussent le layout après l'init :
          // — 500ms  : fin de l'animation d'apparition du parent (motion.div)
          // — 1500ms : fin du slide du bottom sheet qui comprime la zone carte
          setTimeout(() => {
            if (mapInstanceRef.current) {
              (google.maps.event as any).trigger(mapInstanceRef.current, 'resize');
              mapInstanceRef.current.setCenter(mapInstanceRef.current.getCenter()!);
            }
          }, 500);
          setTimeout(() => {
            if (mapInstanceRef.current) {
              (google.maps.event as any).trigger(mapInstanceRef.current, 'resize');
              mapInstanceRef.current.setCenter(mapInstanceRef.current.getCenter()!);
            }
          }, 1500);

          map.addListener('dragstart', () => { isUserInteractingRef.current = true; });
          map.addListener('dragend', () => {
            setTimeout(() => { isUserInteractingRef.current = false; }, 500);
          });
        } catch (error: any) {
          console.error('❌ [MAP] Init error:', error);
          setMapState('degraded');
        }
      });

    } catch (error: any) {
      console.error('❌ [MAP] Init error:', error);
      setMapState('degraded');
    }
  // userLocation, pickup, currentCity intentionnellement exclus :
  // capturés dans initCenterRef au premier run pour éviter double-init.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, mapStyles, onMapReady]);

  // ResizeObserver : relance un resize Maps quand le container change de dimensions.
  // Couvre : animation d'apparition du parent (motion.div), rotation écran,
  // changement de hauteur du bottom sheet, re-layout après uiReady.
  useEffect(() => {
    if (!isMapReady || !mapRef.current) return;
    const container = mapRef.current;

    const observer = new ResizeObserver(() => {
      if (mapInstanceRef.current) {
        (google.maps.event as any).trigger(mapInstanceRef.current, 'resize');
      }
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, [isMapReady]);

  // Recentrer sur la position GPS une fois la carte prête
  useEffect(() => {
    if (!isMapReady || !userLocation || !mapInstanceRef.current) return;
    if (hasCenteredRef.current || isUserInteractingRef.current) return;
    mapInstanceRef.current.panTo(userLocation);
    mapInstanceRef.current.setZoom(15);
    hasCenteredRef.current = true;
  }, [userLocation, isMapReady]);

  const handleRetry = useCallback(() => {
    retryCountRef.current += 1;
    // Après 2 retries infructueux → dégradé immédiat, pas de spinner supplémentaire
    if (retryCountRef.current > 2) {
      setMapState('degraded');
      return;
    }
    mapInstanceRef.current = null;
    initCenterRef.current = null; // permettre re-capture du centre
    if (mapRef.current) mapRef.current.innerHTML = '';
    mountTimeRef.current = Date.now();
    setMapState('loading');
    // startDeadline() intentionnellement absent : le timer du montage initial
    // gère déjà le fallback. L'appeler ici permettrait un loading infini en cas
    // de clicks répétés sur "Recharger".
    retry();
  }, [retry]);

  return (
    // pointer-events: none permanent sur le conteneur : le canvas Maps (enfant direct)
    // gère ses propres événements via son stacking context.
    // Le bottom sheet (fixed z-[200], hors de ce div) reste toujours cliquable,
    // même quand la carte ne charge pas.
    <div
      className={`relative w-full h-full z-0 isolate ${className}`}
      style={{ pointerEvents: 'none' }}
    >
      {/* Canvas Google Maps.
          Toujours visible (pas de visibility:hidden) : le Maps SDK calcule ses bounds
          au moment de new google.maps.Map() — un container caché donne des bounds
          incohérentes et empêche le chargement des tuiles (carte grise).
          pointer-events: auto permanent pour que le SDK reçoive les événements
          pan/zoom directement sur ce canvas. */}
      <div
        ref={mapRef}
        className="absolute inset-0"
        style={{
          pointerEvents: 'auto',
          // Dimensions explicites : certains WebView Android ignorent inset-0
          // si le parent flex n'a pas de hauteur résolue → Maps voit height:0 → tuiles grises.
          width: '100%',
          height: '100%',
        }}
      />

      {/* Fond statique neutre — affiché UNIQUEMENT en mode dégradé.
          Pendant le loading, fond transparent : le SDK Maps a besoin que le container
          soit visible pour calculer ses bounds et déclencher le chargement des tuiles.
          pointer-events: none garanti via MapStaticBackground. */}
      {isDegraded && <MapStaticBackground />}

      {/* En mode dégradé : message minimaliste en bas, pas d'overlay bloquant */}
      {isDegraded && (
        <div
          className="absolute bottom-4 inset-x-0 flex justify-center"
          style={{ pointerEvents: 'none' }}
        >
          <span className="text-[10px] text-muted-foreground/60 bg-background/60 px-2 py-0.5 rounded-full">
            Carte indisponible · réservation possible ci-dessous
          </span>
        </div>
      )}

      {/* Pendant le loading : bouton "Recharger" discret après 3s.
          Le bouton est le SEUL élément interactif dans la zone carte,
          positionné en haut pour ne pas entrer en conflit avec le sheet. */}
      {mapState === 'loading' && showLoadingRetry && (
        <div
          className="absolute top-16 inset-x-0 flex justify-center"
          style={{ pointerEvents: 'auto' }}
        >
          <button
            type="button"
            onClick={handleRetry}
            onTouchEnd={(e) => { e.preventDefault(); handleRetry(); }}
            className="flex items-center gap-1.5 text-xs text-muted-foreground bg-background/80 border border-border/50 rounded-full px-3 py-1.5 shadow-sm"
            style={{ touchAction: 'manipulation' }}
          >
            <RefreshCw className="h-3 w-3" /> Recharger la carte
          </button>
        </div>
      )}

      {/* Marqueurs et polyline — seulement quand la carte est prête */}
      {isMapReady && mapInstanceRef.current && pickup && (
        <PickupMarker
          map={mapInstanceRef.current}
          position={{ lat: pickup.lat, lng: pickup.lng }}
          label={pickup.name || pickup.address}
        />
      )}

      {isMapReady && mapInstanceRef.current && destination && (
        <DestinationMarker
          map={mapInstanceRef.current}
          position={{ lat: destination.lat, lng: destination.lng }}
          label={destination.name || destination.address}
        />
      )}

      {isMapReady && mapInstanceRef.current && pickup && destination && (
        <ProfessionalRoutePolyline
          map={mapInstanceRef.current}
          pickup={pickup} destination={destination}
          showTraffic={false} animate={true}
          onRouteCalculated={onRouteCalculated}
          bottomSheetHeight={bottomSheetHeight}
        />
      )}
    </div>
  );
});

OptimizedMapView.displayName = 'OptimizedMapView';
export default OptimizedMapView;
