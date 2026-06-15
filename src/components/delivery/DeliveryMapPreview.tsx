/**
 * Composant de preview de carte pour visualiser le trajet de livraison
 * ✅ FIX: Utilise googleMapsLoader au lieu de VITE_GOOGLE_MAPS_API_KEY
 * ✅ FIX: Padding dynamique pour éviter éléments masqués
 */

import React, { useEffect, useRef, useState } from 'react';
import { X, Navigation, Clock, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { formatCurrency } from '@/utils/formatCurrency';
import { googleMapsLoader } from '@/services/googleMapsLoader';
import { PRESET_PADDINGS } from '@/utils/mapPaddingUtils';

interface DeliveryMapPreviewProps {
  pickup: {
    lat: number;
    lng: number;
    address: string;
  };
  destination: {
    lat: number;
    lng: number;
    address: string;
  };
  serviceType: 'flash' | 'flex' | 'maxicharge';
  distance?: number;
  duration?: number;
  price?: number;
  onClose: () => void;
}

export const DeliveryMapPreview: React.FC<DeliveryMapPreviewProps> = ({
  pickup,
  destination,
  serviceType,
  distance,
  duration,
  price,
  onClose
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapError, setMapError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadGoogleMaps = async () => {
      try {
        setIsLoading(true);
        
        // ✅ Utiliser le loader unifié qui récupère la clé depuis Edge Function
        await googleMapsLoader.load(['places', 'geometry']);
        
        initMap();
      } catch (error) {
        console.error('Erreur chargement carte:', error);
        setMapError('Impossible de charger la carte');
      } finally {
        setIsLoading(false);
      }
    };

    const initMap = () => {
      if (!mapRef.current) return;

      try {
        const bounds = new google.maps.LatLngBounds();
        bounds.extend(new google.maps.LatLng(pickup.lat, pickup.lng));
        bounds.extend(new google.maps.LatLng(destination.lat, destination.lng));

        const map = new google.maps.Map(mapRef.current, {
          center: bounds.getCenter(),
          zoom: 12,
          minZoom: 10,
          maxZoom: 18,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false
        });

        // Ajuster la vue avec padding adaptatif pour le bottom overlay
        const padding = PRESET_PADDINGS.simple_preview();
        map.fitBounds(bounds, padding);
        
        // Limiter le zoom max
        google.maps.event.addListenerOnce(map, 'bounds_changed', () => {
          const currentZoom = map.getZoom();
          if (currentZoom && currentZoom > 17) map.setZoom(17);
        });

        // Marker de pickup (emerald package)
        const pickupSvg = `<svg width="36" height="44" viewBox="0 0 36 44" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="gp" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#10b981"/><stop offset="100%" stop-color="#059669"/></linearGradient></defs><ellipse cx="18" cy="42" rx="6" ry="1.5" fill="#000" opacity="0.1"/><path d="M18 0C8 0 0 8 0 18C0 32 18 44 18 44S36 32 36 18C36 8 28 0 18 0Z" fill="url(#gp)"/><rect x="10" y="12" width="16" height="13" rx="2" fill="white" opacity="0.95"/><line x1="10" y1="16" x2="26" y2="16" stroke="#059669" stroke-width="1.5" opacity="0.5"/><line x1="18" y1="12" x2="18" y2="25" stroke="#059669" stroke-width="1" opacity="0.3"/></svg>`;
        new google.maps.Marker({
          position: { lat: pickup.lat, lng: pickup.lng },
          map,
          title: 'Point de collecte',
          icon: {
            url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(pickupSvg)}`,
            scaledSize: new google.maps.Size(36, 44),
            anchor: new google.maps.Point(18, 44)
          }
        });

        // Marker de destination (blue pin)
        const destSvg = `<svg width="32" height="42" viewBox="0 0 32 42" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="gd" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#3b82f6"/><stop offset="100%" stop-color="#2563eb"/></linearGradient></defs><ellipse cx="16" cy="40.5" rx="5" ry="1.2" fill="#000" opacity="0.1"/><path d="M16 0C7.2 0 0 7.2 0 16C0 28 16 42 16 42S32 28 32 16C32 7.2 24.8 0 16 0Z" fill="url(#gd)"/><circle cx="16" cy="15" r="7" fill="white" opacity="0.95"/><circle cx="16" cy="15" r="3.5" fill="#3b82f6"/></svg>`;
        new google.maps.Marker({
          position: { lat: destination.lat, lng: destination.lng },
          map,
          title: 'Point de livraison',
          icon: {
            url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(destSvg)}`,
            scaledSize: new google.maps.Size(32, 42),
            anchor: new google.maps.Point(16, 42)
          }
        });

        // Tracer la route (emerald pour livraison)
        const directionsService = new google.maps.DirectionsService();
        const directionsRenderer = new google.maps.DirectionsRenderer({
          map,
          suppressMarkers: true,
          polylineOptions: {
            strokeColor: '#10b981',
            strokeWeight: 4,
            strokeOpacity: 0.8
          }
        });

        directionsService.route(
          {
            origin: { lat: pickup.lat, lng: pickup.lng },
            destination: { lat: destination.lat, lng: destination.lng },
            travelMode: google.maps.TravelMode.DRIVING
          },
          (result, status) => {
            if (status === 'OK' && result) {
              directionsRenderer.setDirections(result);
            }
          }
        );
      } catch (error) {
        console.error('Erreur initialisation carte:', error);
        setMapError('Erreur d\'affichage de la carte');
      }
    };

    loadGoogleMaps();
  }, [pickup, destination]);

  const formatPrice = (priceValue: number) => formatCurrency(priceValue);

  const serviceLabels = {
    flash: 'Flash',
    flex: 'Flex',
    maxicharge: 'MaxiCharge'
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl bg-card border border-border shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-card/50">
          <div className="flex items-center gap-2">
            <Navigation className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Aperçu du trajet</h2>
            <span className="text-sm text-muted-foreground">
              {serviceLabels[serviceType]}
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="rounded-full"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Map Container */}
        <div className="relative">
          {isLoading ? (
            <div className="h-96 flex items-center justify-center bg-muted/20">
              <div className="animate-pulse text-muted-foreground">Chargement de la carte...</div>
            </div>
          ) : mapError ? (
            <div className="h-96 flex items-center justify-center bg-muted/20">
              <p className="text-muted-foreground">{mapError}</p>
            </div>
          ) : (
            <div ref={mapRef} className="h-96 w-full" />
          )}

          {/* Info Overlay */}
          {distance && duration && price && (
            <div className="absolute bottom-4 left-4 right-4">
              <div className="bg-card/95 backdrop-blur-sm rounded-lg border border-border shadow-lg p-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                      <Navigation className="h-4 w-4" />
                      <span className="text-xs">Distance</span>
                    </div>
                    <p className="font-bold text-foreground">
                      {distance.toFixed(1)} km
                    </p>
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                      <Clock className="h-4 w-4" />
                      <span className="text-xs">Durée estimée</span>
                    </div>
                    <p className="font-bold text-foreground">
                      ~{duration} min
                    </p>
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                      <DollarSign className="h-4 w-4" />
                      <span className="text-xs">Prix</span>
                    </div>
                    <p className="font-bold text-primary">
                      {formatPrice(price)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Address Details */}
        <div className="p-4 space-y-3 bg-card/30">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center flex-shrink-0 mt-1">
              <span className="text-emerald-600 font-bold text-sm">A</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground mb-1">Point de collecte</p>
              <p className="text-sm font-medium text-foreground truncate">
                {pickup.address}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
              <span className="text-primary font-bold text-sm">B</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground mb-1">Point de livraison</p>
              <p className="text-sm font-medium text-foreground truncate">
                {destination.address}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-card/50 flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={onClose}
          >
            Fermer
          </Button>
        </div>
      </Card>
    </div>
  );
};
