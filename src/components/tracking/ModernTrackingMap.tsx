import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Navigation,
  MapPin,
  Clock,
  Maximize2,
  Minimize2,
  Phone,
  User,
  Loader2,
  AlertCircle,
  Radio
} from 'lucide-react';
import { useGoogleMaps } from '@/hooks/useGoogleMaps';
import { useSmartMapCamera } from '@/hooks/useSmartMapCamera';
import { PRESET_PADDINGS } from '@/utils/mapPaddingUtils';
import { toast } from 'sonner';

interface Location {
  lat: number;
  lng: number;
  address?: string;
}

interface DriverData {
  name: string;
  phone?: string;
  avatar?: string;
  vehicle?: {
    type: string;
    plate?: string;
  };
  rating?: number;
}

interface ModernTrackingMapProps {
  pickup: Location;
  destination: Location;
  driverLocation?: Location;
  driverHeading?: number;
  driver?: DriverData;
  eta?: string;
  distance?: string;
  status?: string;
  trackingType?: 'delivery' | 'taxi' | 'marketplace';
  className?: string;
  onDriverCall?: () => void;
  showControls?: boolean;
  autoFollow?: boolean;
}

export default function ModernTrackingMap({
  pickup,
  destination,
  driverLocation,
  driverHeading,
  driver,
  eta,
  distance,
  status = 'in_transit',
  trackingType = 'delivery',
  className = '',
  onDriverCall,
  showControls = true,
  autoFollow = true
}: ModernTrackingMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<google.maps.Map | null>(null);
  const driverMarkerRef = useRef<google.maps.Marker | null>(null);
  const pickupMarkerRef = useRef<google.maps.Marker | null>(null);
  const destinationMarkerRef = useRef<google.maps.Marker | null>(null);
  const routePolylineRef = useRef<google.maps.Polyline | null>(null);

  const { isLoaded } = useGoogleMaps();
  const [isFollowing, setIsFollowing] = useState(autoFollow);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mapInitialized, setMapInitialized] = useState(false);

  // Couleurs selon le type de service
  const getServiceColor = () => {
    switch (trackingType) {
      case 'delivery':
        return status === 'picked_up' ? '#ec2027' : '#F59E0B'; // Rouge Tembea ou Jaune
      case 'taxi':
        return '#10b981'; // Vert
      case 'marketplace':
        return '#8b5cf6'; // Violet
      default:
        return '#F59E0B';
    }
  };

  // Initialiser la carte
  useEffect(() => {
    if (!isLoaded || !mapRef.current || mapInitialized) return;

    const map = new google.maps.Map(mapRef.current, {
      zoom: 13, // Zoom initial bas - sera ajusté par smartCamera
      center: pickup,
      minZoom: 10,
      maxZoom: 18,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      zoomControl: false,
      styles: [
        {
          featureType: 'poi',
          elementType: 'all',
          stylers: [{ visibility: 'off' }]
        },
        {
          featureType: 'transit',
          elementType: 'labels.icon',
          stylers: [{ visibility: 'off' }]
        }
      ]
    });

    googleMapRef.current = map;
    setMapInitialized(true);

    // Marker de départ (emerald package)
    const pickupSvg = `<svg width="36" height="44" viewBox="0 0 36 44" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="gp" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#10b981"/><stop offset="100%" stop-color="#059669"/></linearGradient></defs><ellipse cx="18" cy="42" rx="6" ry="1.5" fill="#000" opacity="0.1"/><path d="M18 0C8 0 0 8 0 18C0 32 18 44 18 44S36 32 36 18C36 8 28 0 18 0Z" fill="url(#gp)"/><rect x="10" y="12" width="16" height="13" rx="2" fill="white" opacity="0.95"/><line x1="10" y1="16" x2="26" y2="16" stroke="#059669" stroke-width="1.5" opacity="0.5"/><line x1="18" y1="12" x2="18" y2="25" stroke="#059669" stroke-width="1" opacity="0.3"/></svg>`;
    pickupMarkerRef.current = new google.maps.Marker({
      position: pickup,
      map,
      title: 'Départ',
      icon: {
        url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(pickupSvg)}`,
        scaledSize: new google.maps.Size(36, 44),
        anchor: new google.maps.Point(18, 44)
      }
    });

    // Marker de destination (blue pin)
    const destSvg = `<svg width="32" height="42" viewBox="0 0 32 42" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="gd" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#3b82f6"/><stop offset="100%" stop-color="#2563eb"/></linearGradient></defs><ellipse cx="16" cy="40.5" rx="5" ry="1.2" fill="#000" opacity="0.1"/><path d="M16 0C7.2 0 0 7.2 0 16C0 28 16 42 16 42S32 28 32 16C32 7.2 24.8 0 16 0Z" fill="url(#gd)"/><circle cx="16" cy="15" r="7" fill="white" opacity="0.95"/><circle cx="16" cy="15" r="3.5" fill="#3b82f6"/></svg>`;
    destinationMarkerRef.current = new google.maps.Marker({
      position: destination,
      map,
      title: 'Arrivée',
      icon: {
        url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(destSvg)}`,
        scaledSize: new google.maps.Size(32, 42),
        anchor: new google.maps.Point(16, 42)
      }
    });

    // Tracer la route
    const directionsService = new google.maps.DirectionsService();
    directionsService.route(
      {
        origin: pickup,
        destination: destination,
        travelMode: google.maps.TravelMode.DRIVING
      },
      (result, status) => {
        if (status === 'OK' && result) {
          routePolylineRef.current = new google.maps.Polyline({
            path: result.routes[0].overview_path,
            geodesic: true,
            strokeColor: getServiceColor(),
            strokeOpacity: 0.8,
            strokeWeight: 5,
            map
          });

          // Ajuster les bounds pour voir toute la route avec padding intelligent
          const bounds = new google.maps.LatLngBounds();
          bounds.extend(pickup);
          bounds.extend(destination);
          if (driverLocation) bounds.extend(driverLocation);
          
          const padding = PRESET_PADDINGS.tracking_with_driver();
          map.fitBounds(bounds, padding);
          
          // Limiter le zoom max
          google.maps.event.addListenerOnce(map, 'bounds_changed', () => {
            const currentZoom = map.getZoom();
            if (currentZoom && currentZoom > 17) map.setZoom(17);
          });
        }
      }
    );
  }, [isLoaded, pickup, destination, mapInitialized]);

  // Mettre à jour la position du chauffeur
  useEffect(() => {
    if (!googleMapRef.current || !driverLocation || !mapInitialized) return;

    if (!driverMarkerRef.current) {
      // Créer le marker du chauffeur (rouge Tembea avec pulse)
      const driverSvg = `<svg width="36" height="36" viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="gdr" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#ec2027"/><stop offset="100%" stop-color="#c81e24"/></linearGradient></defs><circle cx="18" cy="18" r="16" fill="none" stroke="#ec2027" stroke-width="1.5" opacity="0.3"><animate attributeName="r" from="14" to="18" dur="2s" repeatCount="indefinite"/><animate attributeName="opacity" from="0.3" to="0" dur="2s" repeatCount="indefinite"/></circle><circle cx="18" cy="18" r="12" fill="url(#gdr)" stroke="white" stroke-width="2.5"/><path d="M18 10l5 10h-3v6h-4v-6h-3z" fill="white" opacity="0.95"/></svg>`;
      driverMarkerRef.current = new google.maps.Marker({
        position: driverLocation,
        map: googleMapRef.current,
        title: driver?.name || 'Chauffeur',
        icon: {
          url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(driverSvg)}`,
          scaledSize: new google.maps.Size(36, 36),
          anchor: new google.maps.Point(18, 18)
        },
        optimized: false,
        animation: google.maps.Animation.DROP
      });
    } else {
      // Animer le mouvement du marker
      const currentPos = driverMarkerRef.current.getPosition();
      if (currentPos) {
        // Animation fluide de la position
        const startLat = currentPos.lat();
        const startLng = currentPos.lng();
        const endLat = driverLocation.lat;
        const endLng = driverLocation.lng;

        let step = 0;
        const steps = 20;
        const animationInterval = setInterval(() => {
          step++;
          const progress = step / steps;
          const lat = startLat + (endLat - startLat) * progress;
          const lng = startLng + (endLng - startLng) * progress;

          driverMarkerRef.current?.setPosition({ lat, lng });

          if (step >= steps) {
            clearInterval(animationInterval);
          }
        }, 50);
      }

      // Mettre à jour la rotation si heading disponible
      if (driverHeading !== undefined) {
        const icon = driverMarkerRef.current.getIcon() as google.maps.Symbol;
        icon.rotation = driverHeading;
        driverMarkerRef.current.setIcon(icon);
      }
    }

    // Auto-suivre le chauffeur
    if (isFollowing) {
      googleMapRef.current.panTo(driverLocation);
    }
  }, [driverLocation, driverHeading, isFollowing, mapInitialized]);

  // Hook de caméra intelligente
  const smartCamera = useSmartMapCamera(googleMapRef.current);

  // Fonctions de contrôle avec smartCamera
  const handleRecenter = () => {
    if (!googleMapRef.current) return;

    if (driverLocation && pickup && destination) {
      // Utiliser fitToTrip pour afficher les 3 points
      smartCamera.fitToTrip(
        pickup,
        destination,
        driverLocation,
        { bottomSheetHeight: 350, maxZoom: 16 }
      );
      setIsFollowing(true);
    } else if (driverLocation) {
      smartCamera.zoomToSinglePoint(driverLocation, { baseZoom: 16 });
      setIsFollowing(true);
    } else {
      // Fallback: fitBounds sur pickup + destination
      smartCamera.fitToRoute(pickup, destination, { bottomSheetHeight: 300 });
    }
  };

  const handleZoomIn = () => {
    if (googleMapRef.current) {
      const currentZoom = googleMapRef.current.getZoom() || 14;
      googleMapRef.current.setZoom(currentZoom + 1);
    }
  };

  const handleZoomOut = () => {
    if (googleMapRef.current) {
      const currentZoom = googleMapRef.current.getZoom() || 14;
      googleMapRef.current.setZoom(currentZoom - 1);
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  if (!isLoaded) {
    return (
      <div className={`relative w-full h-[400px] bg-muted rounded-xl flex items-center justify-center ${className}`}>
        <div className="text-center space-y-2">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
          <p className="text-sm text-muted-foreground">Chargement de la carte...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative ${isFullscreen ? 'fixed inset-0 z-50' : `w-full ${className}`}`}
    >
      {/* Carte */}
      <div
        ref={mapRef}
        className={`rounded-xl overflow-hidden shadow-lg ${
          isFullscreen ? 'h-full' : 'h-[400px]'
        }`}
      />

      {/* Info Card flottante - ETA et Distance */}
      <AnimatePresence>
        {(eta || distance) && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-4 left-4 right-4"
          >
            <Card className="bg-background/95 backdrop-blur-xl border-border/50 shadow-2xl">
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-[#F59E0B] to-[#FBBF24] rounded-full flex items-center justify-center">
                      <Clock className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Arrivée estimée</p>
                      <p className="text-lg font-bold">{eta || 'Calcul...'}</p>
                    </div>
                  </div>
                  {distance && (
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Distance</p>
                      <p className="font-semibold">{distance}</p>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Info Chauffeur flottante */}
      <AnimatePresence>
        {driver && driverLocation && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="absolute bottom-24 left-4 right-4"
          >
            <Card className="bg-background/95 backdrop-blur-xl border-border/50 shadow-2xl">
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center">
                        {driver.avatar ? (
                          <img
                            src={driver.avatar}
                            alt={driver.name}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          <User className="w-6 h-6 text-primary" />
                        )}
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-background animate-pulse" />
                    </div>
                    <div>
                      <p className="font-semibold">{driver.name}</p>
                      {driver.vehicle && (
                        <p className="text-sm text-muted-foreground">
                          {driver.vehicle.type}
                          {driver.vehicle.plate && ` • ${driver.vehicle.plate}`}
                        </p>
                      )}
                    </div>
                  </div>
                  {onDriverCall && driver.phone && (
                    <Button
                      onClick={onDriverCall}
                      size="icon"
                      className="h-10 w-10 bg-gradient-to-br from-[#F59E0B] to-[#FBBF24] hover:from-[#FBBF24] hover:to-[#F59E0B] shadow-lg"
                    >
                      <Phone className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Contrôles de la carte */}
      {showControls && (
        <div className="absolute bottom-4 right-4 space-y-2">
          {/* Bouton Suivre */}
          {driverLocation && (
            <motion.div whileTap={{ scale: 0.95 }}>
              <Button
                onClick={() => {
                  setIsFollowing(!isFollowing);
                  if (!isFollowing) handleRecenter();
                }}
                className={`h-12 px-4 shadow-lg ${
                  isFollowing
                    ? 'bg-gradient-to-br from-[#F59E0B] to-[#FBBF24] hover:from-[#FBBF24] hover:to-[#F59E0B]'
                    : 'bg-background/95 backdrop-blur-xl text-foreground hover:bg-background'
                }`}
              >
                <Navigation className={`w-4 h-4 mr-2 ${isFollowing ? 'animate-pulse' : ''}`} />
                {isFollowing ? 'Suivi actif' : 'Suivre'}
              </Button>
            </motion.div>
          )}

          {/* Recentrer */}
          <motion.div whileTap={{ scale: 0.95 }}>
            <Button
              onClick={handleRecenter}
              size="icon"
              className="h-12 w-12 bg-background/95 backdrop-blur-xl shadow-lg hover:bg-background"
            >
              <MapPin className="w-5 h-5" />
            </Button>
          </motion.div>

          {/* Zoom + */}
          <motion.div whileTap={{ scale: 0.95 }}>
            <Button
              onClick={handleZoomIn}
              size="icon"
              className="h-12 w-12 bg-background/95 backdrop-blur-xl shadow-lg hover:bg-background font-bold text-lg"
            >
              +
            </Button>
          </motion.div>

          {/* Zoom - */}
          <motion.div whileTap={{ scale: 0.95 }}>
            <Button
              onClick={handleZoomOut}
              size="icon"
              className="h-12 w-12 bg-background/95 backdrop-blur-xl shadow-lg hover:bg-background font-bold text-lg"
            >
              −
            </Button>
          </motion.div>

          {/* Fullscreen */}
          <motion.div whileTap={{ scale: 0.95 }}>
            <Button
              onClick={toggleFullscreen}
              size="icon"
              className="h-12 w-12 bg-background/95 backdrop-blur-xl shadow-lg hover:bg-background"
            >
              {isFullscreen ? (
                <Minimize2 className="w-5 h-5" />
              ) : (
                <Maximize2 className="w-5 h-5" />
              )}
            </Button>
          </motion.div>
        </div>
      )}

      {/* Indicateur de connexion temps réel */}
      <div className="absolute top-4 right-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center space-x-2 px-3 py-2 bg-background/95 backdrop-blur-xl rounded-full shadow-lg"
        >
          <Radio className="w-4 h-4 text-green-500 animate-pulse" />
          <span className="text-xs font-medium">En direct</span>
        </motion.div>
      </div>
    </motion.div>
  );
}
