import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  MapPin, 
  Navigation, 
  Phone, 
  MessageCircle, 
  Clock,
  Package,
  Truck,
  CheckCircle
} from 'lucide-react';
import { useDeliveryTracking } from '@/hooks/useDeliveryTracking';
import { useGoogleMaps } from '@/hooks/useGoogleMaps';
import { toast } from 'sonner';
import { formatAddressForDisplay } from '@/utils/googleMapsUnified';

interface DeliveryTrackingMapProps {
  orderId: string;
  showDriverInfo?: boolean;
  showEstimatedTime?: boolean;
}

export const DeliveryTrackingMap: React.FC<DeliveryTrackingMapProps> = ({
  orderId,
  showDriverInfo = true,
  showEstimatedTime = true
}) => {
  const {
    order,
    loading,
    error,
    driverProfile,
    driverLocation,
    statusLabel,
    price
  } = useDeliveryTracking(orderId);

  const { isLoaded } = useGoogleMaps();
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [driverMarker, setDriverMarker] = useState<google.maps.Marker | null>(null);
  const [pickupMarker, setPickupMarker] = useState<google.maps.Marker | null>(null);
  const [deliveryMarker, setDeliveryMarker] = useState<google.maps.Marker | null>(null);
  const [routeRenderer, setRouteRenderer] = useState<google.maps.DirectionsRenderer | null>(null);

  const initializeMap = useCallback(async () => {
    if (!isLoaded || !order || map) return;

    const mapElement = document.getElementById('delivery-tracking-map');
    if (!mapElement) return;

    // ✅ FIX: Utiliser les coordonnées de la commande, pas un centre hardcodé
    const pickupCoords = await getPickupCoordinates();
    const deliveryCoords = await getDeliveryCoordinates();
    const mapCenter = pickupCoords || deliveryCoords || { lat: 0, lng: 0 };

    const newMap = new google.maps.Map(mapElement, {
      zoom: 13,
      center: mapCenter,
      styles: [
        {
          featureType: 'poi',
          elementType: 'all',
          stylers: [{ visibility: 'off' }]
        }
      ]
    });

    setMap(newMap);

    // Add pickup marker (réutilise pickupCoords déjà récupéré)
      
    if (pickupCoords) {
      const pickupSvg = `<svg width="36" height="44" viewBox="0 0 36 44" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="gp" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#10b981"/><stop offset="100%" stop-color="#059669"/></linearGradient></defs><ellipse cx="18" cy="42" rx="6" ry="1.5" fill="#000" opacity="0.1"/><path d="M18 0C8 0 0 8 0 18C0 32 18 44 18 44S36 32 36 18C36 8 28 0 18 0Z" fill="url(#gp)"/><rect x="10" y="12" width="16" height="13" rx="2" fill="white" opacity="0.95"/><line x1="10" y1="16" x2="26" y2="16" stroke="#059669" stroke-width="1.5" opacity="0.5"/><line x1="18" y1="12" x2="18" y2="25" stroke="#059669" stroke-width="1" opacity="0.3"/></svg>`;
      const pickup = new google.maps.Marker({
        position: { lat: pickupCoords.lat, lng: pickupCoords.lng },
        map: newMap,
        title: 'Point de récupération',
        icon: {
          url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(pickupSvg)}`,
          scaledSize: new google.maps.Size(36, 44),
          anchor: new google.maps.Point(18, 44)
        }
      });
      setPickupMarker(pickup);
    }

    // Add delivery marker (réutilise deliveryCoords déjà récupéré)
      
    if (deliveryCoords) {
      const destSvg = `<svg width="32" height="42" viewBox="0 0 32 42" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="gd" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#3b82f6"/><stop offset="100%" stop-color="#2563eb"/></linearGradient></defs><ellipse cx="16" cy="40.5" rx="5" ry="1.2" fill="#000" opacity="0.1"/><path d="M16 0C7.2 0 0 7.2 0 16C0 28 16 42 16 42S32 28 32 16C32 7.2 24.8 0 16 0Z" fill="url(#gd)"/><circle cx="16" cy="15" r="7" fill="white" opacity="0.95"/><circle cx="16" cy="15" r="3.5" fill="#3b82f6"/></svg>`;
      const delivery = new google.maps.Marker({
        position: { lat: deliveryCoords.lat, lng: deliveryCoords.lng },
        map: newMap,
        title: 'Point de livraison',
        icon: {
          url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(destSvg)}`,
          scaledSize: new google.maps.Size(32, 42),
          anchor: new google.maps.Point(16, 42)
        }
      });
      setDeliveryMarker(delivery);
    }

    // Add route if both coordinates exist
    if (pickupCoords && deliveryCoords) {
      const directionsService = new google.maps.DirectionsService();
      const directionsRenderer = new google.maps.DirectionsRenderer({
        map: newMap,
        suppressMarkers: true,
        polylineOptions: {
          strokeColor: '#10b981',
          strokeWeight: 4,
          strokeOpacity: 0.8
        }
      });

      try {
        const result = await directionsService.route({
          origin: pickupCoords,
          destination: deliveryCoords,
          travelMode: google.maps.TravelMode.DRIVING
        });
        
        directionsRenderer.setDirections(result);
        setRouteRenderer(directionsRenderer);
      } catch (error) {
        console.error('Error calculating route:', error);
      }
    }

  }, [isLoaded, order, map]);

  // Helper function to extract coordinates from Google address
  const extractCoordinatesFromGoogle = async (googleAddress: string) => {
    try {
      const { extractCoordinatesFromFallback } = await import('@/utils/googleMapsUnified');
      return extractCoordinatesFromFallback(googleAddress);
    } catch {
      return null;
    }
  };

  // Helper to get coordinates with fallback
  const getPickupCoordinates = () => {
    return (order as any)?.pickup_google_address ? 
      extractCoordinatesFromGoogle((order as any).pickup_google_address) :
      order?.pickup_coordinates;
  };

  const getDeliveryCoordinates = () => {
    return (order as any)?.delivery_google_address ?
      extractCoordinatesFromGoogle((order as any).delivery_google_address) :
      order?.delivery_coordinates;
  };

  // Update driver location
  useEffect(() => {
    if (!map || !driverLocation) return;

    if (driverMarker) {
      driverMarker.setPosition({
        lat: driverLocation.lat || 0,
        lng: driverLocation.lng || 0
      });
    } else if (isLoaded) {
      const driverSvg = `<svg width="36" height="36" viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="gdr" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#ec2027"/><stop offset="100%" stop-color="#c81e24"/></linearGradient></defs><circle cx="18" cy="18" r="16" fill="none" stroke="#ec2027" stroke-width="1.5" opacity="0.3"><animate attributeName="r" from="14" to="18" dur="2s" repeatCount="indefinite"/><animate attributeName="opacity" from="0.3" to="0" dur="2s" repeatCount="indefinite"/></circle><circle cx="18" cy="18" r="12" fill="url(#gdr)" stroke="white" stroke-width="2.5"/><path d="M18 10l5 10h-3v6h-4v-6h-3z" fill="white" opacity="0.95"/></svg>`;
      const newDriverMarker = new google.maps.Marker({
        position: { lat: driverLocation.lat || 0, lng: driverLocation.lng || 0 },
        map,
        title: 'Chauffeur',
        icon: {
          url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(driverSvg)}`,
          scaledSize: new google.maps.Size(36, 36),
          anchor: new google.maps.Point(18, 18)
        },
        optimized: false
      });
      setDriverMarker(newDriverMarker);
    }
  }, [map, driverLocation, isLoaded, driverMarker]);

  useEffect(() => {
    initializeMap();
  }, [initializeMap]);

  const getStatusIcon = () => {
    switch (order?.status) {
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'confirmed':
      case 'driver_assigned':
        return <Truck className="h-4 w-4" />;
      case 'picked_up':
      case 'in_transit':
        return <Navigation className="h-4 w-4" />;
      case 'delivered':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  const getStatusColor = () => {
    switch (order?.status) {
      case 'pending':
        return 'warning';
      case 'confirmed':
      case 'driver_assigned':
        return 'info';
      case 'picked_up':
      case 'in_transit':
        return 'primary';
      case 'delivered':
        return 'success';
      default:
        return 'secondary';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-64 bg-muted rounded"></div>
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !order) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            {error || 'Commande non trouvée'}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              {getStatusIcon()}
              Suivi de livraison
            </span>
            <Badge variant={getStatusColor() as any}>
              {statusLabel}
            </Badge>
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Map Container */}
          <div
            id="delivery-tracking-map"
            className="h-64 w-full rounded-lg border"
          />

          {/* Delivery Info */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="font-medium text-muted-foreground">De</div>
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>{formatAddressForDisplay((order as any)?.pickup_google_address || order.pickup_location)}</span>
              </div>
            </div>
            <div>
              <div className="font-medium text-muted-foreground">Vers</div>
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                <span>{formatAddressForDisplay((order as any)?.delivery_google_address || order.delivery_location)}</span>
              </div>
            </div>
          </div>

          {/* Price */}
          <div className="flex justify-between items-center pt-2 border-t">
            <span className="font-medium">Total</span>
            <span className="text-lg font-semibold text-primary">
              {price.toLocaleString()} CDF
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Driver Info Card */}
      {showDriverInfo && driverProfile && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Informations Chauffeur</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <Truck className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <div className="font-semibold">{driverProfile.display_name}</div>
                  <div className="text-sm text-muted-foreground">
                    Chauffeur professionnel
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Service de livraison
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const phone = driverProfile.phone_number;
                    if (phone) {
                      window.open(`tel:${phone}`, '_self');
                    } else {
                      toast.error('Numéro de téléphone non disponible');
                    }
                  }}
                >
                  <Phone className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    toast.info('Chat en cours de développement');
                  }}
                >
                  <MessageCircle className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};