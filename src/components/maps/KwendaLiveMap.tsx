/**
 * 🗺️ Carte interactive temps réel Tembea
 * Affiche taxis et livreurs avec filtres, clustering et mode jour/nuit
 */

import React, { useEffect, useRef, useState, useCallback, memo } from 'react';
import { Loader2, Car, Package, Layers, RefreshCw } from 'lucide-react';
import { useGoogleMaps } from '@/hooks/useGoogleMaps';
import { useMapTheme } from '@/hooks/useMapTheme';
import { useSmartMapCamera } from '@/hooks/useSmartMapCamera';
import { PRESET_PADDINGS } from '@/utils/mapPaddingUtils';
import { useUnifiedVehicleTracking, VehicleFilter, TrackedVehicle } from '@/hooks/useUnifiedVehicleTracking';
import UnifiedVehicleMarker from './UnifiedVehicleMarker';
import KwendaMapControls from './KwendaMapControls';
import { getUserLocationSVG, svgToDataUrl } from './VehicleMarkerIcons';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { nativeGeolocationService } from '@/services/nativeGeolocationService';

interface Location {
  lat: number;
  lng: number;
  address?: string;
}

interface KwendaLiveMapProps {
  userLocation?: { lat: number; lng: number } | null;
  mode?: 'transport' | 'delivery' | 'all';
  showRoute?: boolean;
  pickup?: Location | null;
  destination?: Location | null;
  onVehicleClick?: (vehicle: TrackedVehicle) => void;
  className?: string;
  showFilters?: boolean;
  showVehicleCount?: boolean;
  enableTracking?: boolean;
  radiusKm?: number;
}

const FilterButton = memo(({ 
  active, 
  icon: Icon, 
  label, 
  count,
  onClick 
}: { 
  active: boolean; 
  icon: React.ElementType; 
  label: string; 
  count?: number;
  onClick: () => void;
}) => (
  <motion.button
    whileTap={{ scale: 0.95 }}
    onClick={onClick}
    className={cn(
      "flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all",
      "backdrop-blur-md shadow-sm border",
      active 
        ? "bg-primary text-primary-foreground border-primary shadow-md" 
        : "bg-background/80 text-foreground border-border hover:bg-muted"
    )}
  >
    <Icon className="h-4 w-4" />
    <span>{label}</span>
    {count !== undefined && count > 0 && (
      <Badge variant={active ? "secondary" : "outline"} className="h-5 min-w-[20px] px-1.5 text-xs">
        {count}
      </Badge>
    )}
  </motion.button>
));

FilterButton.displayName = 'FilterButton';

export const KwendaLiveMap = memo(({
  userLocation,
  mode = 'all',
  showRoute = false,
  pickup,
  destination,
  onVehicleClick,
  className = '',
  showFilters = true,
  showVehicleCount = true,
  enableTracking = true,
  radiusKm = 10
}: KwendaLiveMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const userMarkerRef = useRef<google.maps.Marker | null>(null);
  const trafficLayerRef = useRef<google.maps.TrafficLayer | null>(null);
  const polylineRef = useRef<google.maps.Polyline | null>(null);
  
  const { isLoaded, error, isLoading } = useGoogleMaps();
  const { mapStyles, isDark } = useMapTheme();
  
  const [isMapReady, setIsMapReady] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [activeFilter, setActiveFilter] = useState<VehicleFilter>(
    mode === 'transport' ? 'taxi' : mode === 'delivery' ? 'delivery' : 'all'
  );
  const [showTraffic, setShowTraffic] = useState(false);

  // Hook de tracking unifié
  const { 
    vehicles, 
    loading: trackingLoading, 
    vehicleCount,
    refreshVehicles,
    setFilter
  } = useUnifiedVehicleTracking({
    filter: activeFilter,
    userLocation,
    radiusKm,
    enabled: enableTracking && isMapReady
  });

  // Initialisation de la carte
  useEffect(() => {
    if (!isLoaded || !mapRef.current || mapInstanceRef.current) return;

    const initMap = async () => {
      try {
        await window.google.maps.importLibrary('maps');
        
        const defaultCenter = userLocation 
          ? { lat: userLocation.lat, lng: userLocation.lng }
          : { lat: -4.3217, lng: 15.3069 }; // Kinshasa

        const map = new google.maps.Map(mapRef.current!, {
          center: defaultCenter,
          zoom: 13, // Zoom initial bas - sera ajusté par smartCamera
          minZoom: 10,
          maxZoom: 18,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          zoomControl: false,
          gestureHandling: 'greedy',
          styles: mapStyles
        });

        mapInstanceRef.current = map;
        setIsMapReady(true);
        
        console.log('🗺️ KwendaLiveMap initialisée');
      } catch (err) {
        console.error('Erreur init carte:', err);
      }
    };

    initMap();
  }, [isLoaded, userLocation, mapStyles]);

  // Hook de caméra intelligente
  const smartCamera = useSmartMapCamera(mapInstanceRef.current);

  // Mettre à jour les styles quand le thème change
  useEffect(() => {
    if (mapInstanceRef.current && mapStyles) {
      mapInstanceRef.current.setOptions({ styles: mapStyles });
    }
  }, [mapStyles]);

  // Marker utilisateur pulsant
  useEffect(() => {
    if (!isMapReady || !mapInstanceRef.current || !userLocation) return;

    const iconUrl = svgToDataUrl(getUserLocationSVG());

    if (!userMarkerRef.current) {
      userMarkerRef.current = new google.maps.Marker({
        position: userLocation,
        map: mapInstanceRef.current,
        title: 'Ma position',
        icon: {
          url: iconUrl,
          scaledSize: new google.maps.Size(40, 40),
          anchor: new google.maps.Point(20, 20)
        },
        zIndex: 2000
      });
    } else {
      userMarkerRef.current.setPosition(userLocation);
    }

    return () => {
      if (userMarkerRef.current) {
        userMarkerRef.current.setMap(null);
        userMarkerRef.current = null;
      }
    };
  }, [isMapReady, userLocation]);

  // Traffic layer
  useEffect(() => {
    if (!isMapReady || !mapInstanceRef.current) return;

    if (showTraffic && !trafficLayerRef.current) {
      trafficLayerRef.current = new google.maps.TrafficLayer();
      trafficLayerRef.current.setMap(mapInstanceRef.current);
    } else if (!showTraffic && trafficLayerRef.current) {
      trafficLayerRef.current.setMap(null);
      trafficLayerRef.current = null;
    }
  }, [isMapReady, showTraffic]);

  // Route entre pickup et destination avec smart camera
  useEffect(() => {
    if (!isMapReady || !mapInstanceRef.current || !showRoute || !pickup || !destination) {
      if (polylineRef.current) {
        polylineRef.current.setMap(null);
        polylineRef.current = null;
      }
      return;
    }

    // Dessiner la route
    const path = [pickup, destination];
    
    if (polylineRef.current) {
      polylineRef.current.setPath(path);
    } else {
      polylineRef.current = new google.maps.Polyline({
        path,
        geodesic: true,
        strokeColor: isDark ? '#60A5FA' : '#3B82F6',
        strokeOpacity: 0.8,
        strokeWeight: 5,
        map: mapInstanceRef.current
      });
    }

    // Ajuster la vue avec smart camera
    smartCamera.fitToRoute(pickup, destination, {
      bottomSheetHeight: 200,
      maxZoom: 16
    });
  }, [isMapReady, showRoute, pickup, destination, isDark, smartCamera]);

  // Handlers
  const handleFilterChange = useCallback((filter: VehicleFilter) => {
    setActiveFilter(filter);
    setFilter(filter);
  }, [setFilter]);

  const handleLocate = useCallback(async () => {
    if (!mapInstanceRef.current) return;
    
    setIsLocating(true);
    try {
      // Utiliser nativeGeolocationService avec retry 2 passes (Android/iOS/Safari)
      const position = await nativeGeolocationService.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0 // Force GPS hardware frais
      });
      const pos = { lat: position.lat, lng: position.lng };
      smartCamera.zoomToSinglePoint(pos, { baseZoom: 16, animationDuration: 600 });
    } catch {
      console.warn('⚠️ handleLocate: impossible d\'obtenir la position');
    } finally {
      setIsLocating(false);
    }
  }, [smartCamera]);

  // Loading state
  if (isLoading) {
    return (
      <div className={cn("flex items-center justify-center bg-muted/30", className)}>
        <div className="text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Chargement de la carte...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={cn("flex items-center justify-center bg-destructive/10", className)}>
        <p className="text-sm text-destructive">Erreur: {error}</p>
      </div>
    );
  }

  return (
    <div className={cn("relative overflow-hidden", className)}>
      {/* Map container */}
      <div ref={mapRef} className="absolute inset-0" />
      
      {/* Filtres en haut à gauche */}
      {showFilters && isMapReady && (
        <div className="absolute top-4 left-4 z-10 flex gap-2">
          <FilterButton
            active={activeFilter === 'all'}
            icon={Layers}
            label="Tous"
            count={vehicleCount.total}
            onClick={() => handleFilterChange('all')}
          />
          <FilterButton
            active={activeFilter === 'taxi'}
            icon={Car}
            label="Taxi"
            count={vehicleCount.taxi}
            onClick={() => handleFilterChange('taxi')}
          />
          <FilterButton
            active={activeFilter === 'delivery'}
            icon={Package}
            label="Livraison"
            count={vehicleCount.delivery}
            onClick={() => handleFilterChange('delivery')}
          />
        </div>
      )}

      {/* Compteur de véhicules disponibles */}
      {showVehicleCount && isMapReady && (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute top-4 right-4 z-10"
          >
            <div className="flex items-center gap-2 px-3 py-2 bg-background/90 backdrop-blur-md rounded-xl border shadow-sm">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-sm font-medium">{vehicleCount.available}</span>
                <span className="text-xs text-muted-foreground">disponibles</span>
              </div>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7"
                onClick={refreshVehicles}
                disabled={trackingLoading}
              >
                <RefreshCw className={cn("h-3.5 w-3.5", trackingLoading && "animate-spin")} />
              </Button>
            </div>
          </motion.div>
        </AnimatePresence>
      )}

      {/* Contrôles de la carte */}
      {isMapReady && (
        <KwendaMapControls
          onLocate={handleLocate}
          isLocating={isLocating}
          isLocated={!!userLocation}
        />
      )}

      {/* Markers des véhicules */}
      {isMapReady && mapInstanceRef.current && vehicles.map((vehicle) => (
        <UnifiedVehicleMarker
          key={vehicle.id}
          map={mapInstanceRef.current}
          vehicle={vehicle}
          smoothTransition={true}
          onClick={onVehicleClick}
        />
      ))}
    </div>
  );
});

KwendaLiveMap.displayName = 'KwendaLiveMap';

export default KwendaLiveMap;
