import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Phone, MapPin, Package, Clock, User2 } from 'lucide-react';
import GoogleMapsKwenda from '@/components/maps/GoogleMapsKwenda';
import { useDeliveryTracking } from '@/hooks/useDeliveryTracking';
import DriverRequestManager from './DriverRequestManager';

interface DeliveryLiveTrackerProps {
  orderId: string;
  orderData?: {
    pickup?: { lat: number; lng: number; address?: string };
    destination?: { lat: number; lng: number; address?: string };
    mode?: 'flash' | 'flex' | 'maxicharge';
  };
  onBack: () => void;
}

const formatDateTime = (iso?: string | null) => {
  try {
    const d = iso ? new Date(iso) : new Date();
    return d.toLocaleString('fr-FR', {
      weekday: 'short', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
    });
  } catch {
    return '';
  }
};

export default function DeliveryLiveTracker({ orderId, orderData, onBack }: DeliveryLiveTrackerProps) {
  const { order, statusLabel, price, packageType, driverProfile, recipientProfile, driverLocation } = useDeliveryTracking(orderId);

  const handleDriverAssigned = (driverId: string) => {
    console.log('🚗 Chauffeur assigné:', driverId);
    // Le hook useDeliveryTracking se mettra à jour automatiquement via realtime
  };

  const pickup = useMemo(() => {
    const c = (order?.pickup_coordinates as any) || orderData?.pickup;
    if (c && typeof c.lat === 'number' && typeof c.lng === 'number') return { lat: c.lat, lng: c.lng };
    return undefined;
  }, [order?.pickup_coordinates, orderData?.pickup]);

  const destination = useMemo(() => {
    const c = (order?.delivery_coordinates as any) || orderData?.destination;
    if (c && typeof c.lat === 'number' && typeof c.lng === 'number') return { lat: c.lat, lng: c.lng };
    return undefined;
  }, [order?.delivery_coordinates, orderData?.destination]);

  const deliveryMode = (order?.delivery_type as any) || (orderData?.mode as any) || 'flex';

  return (
    <div className="min-h-screen bg-background">
      {/* Header summary */}
      <div className="p-4 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              <span className="text-sm">{packageType || 'Colis'}</span>
            </div>
            <h1 className="text-xl font-bold mt-1">{order?.status === 'searching_driver' ? 'Recherche de livreur…' : statusLabel}</h1>
          </div>
          {price !== null && (
            <div className="text-right">
              <div className="text-lg font-bold">{price.toLocaleString()} CDF</div>
              <div className="text-xs opacity-90">{formatDateTime(order?.delivery_time || order?.created_at)}</div>
            </div>
          )}
        </div>
      </div>

      {/* Map */}
      <div className="p-4 pt-3">
        <GoogleMapsKwenda
          pickup={pickup}
          destination={destination}
          showRoute={Boolean(pickup && destination)}
          height="320px"
          deliveryMode={deliveryMode}
          driverLocation={driverLocation ? { lat: driverLocation.lat, lng: driverLocation.lng, heading: driverLocation.heading ?? null } : undefined}
        />
      </div>

      {/* Addresses */}
      <div className="px-4 space-y-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-3 h-3 rounded-full bg-green-500 mt-1.5" />
              <div className="flex-1">
                <div className="text-sm text-muted-foreground">Point de départ</div>
                <div className="font-medium break-words">{order?.pickup_location || orderData?.pickup?.address || '—'}</div>
              </div>
            </div>
            <div className="mt-3 flex items-start gap-3">
              <div className="w-3 h-3 rounded-full bg-red-500 mt-1.5" />
              <div className="flex-1">
                <div className="text-sm text-muted-foreground">Destination</div>
                <div className="font-medium break-words">{order?.delivery_location || orderData?.destination?.address || '—'}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Driver + recipient */}
      <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={driverProfile?.avatar_url || ''} alt="Livreur" />
                  <AvatarFallback>DR</AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-semibold">
                    {driverProfile?.display_name || (order?.driver_id ? 'Livreur assigné' : 'Recherche de livreur...')}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {order?.delivery_type?.toString()?.toUpperCase()} • 
                    {(driverProfile as any)?.rating ? ` ⭐ ${((driverProfile as any).rating).toFixed(1)} • ` : ' '}
                    {statusLabel}
                  </div>
                </div>
              </div>
              {driverProfile?.phone_number ? (
                <Button asChild size="sm" variant="outline">
                  <a href={`tel:${driverProfile.phone_number}`}>
                    <Phone className="w-4 h-4 mr-1" /> Appeler
                  </a>
                </Button>
              ) : order?.status === 'pending' ? (
                <Badge variant="outline" className="text-orange-600">
                  Recherche...
                </Badge>
              ) : (
                <Badge variant="outline" className="text-gray-500">
                  Non disponible
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>Dernière mise à jour {formatDateTime((driverLocation?.updated_at as any) || (order?.updated_at as any))}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                <User2 className="w-5 h-5" />
              </div>
              <div>
                <div className="font-semibold">{recipientProfile?.display_name || 'Destinataire'}</div>
                <div className="text-sm text-muted-foreground flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {order?.delivery_location || orderData?.destination?.address || '—'}
                </div>
              </div>
            </div>
            {recipientProfile?.phone_number && (
              <Badge variant="outline">Contact: {recipientProfile.phone_number}</Badge>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Gestionnaire de demandes de chauffeur */}
      {order && (
        <div className="p-4">
          <DriverRequestManager
            orderId={orderId}
            orderStatus={order.status || 'pending'}
            pickupCoordinates={pickup || { lat: -4.3217, lng: 15.3069 }}
            estimatedPrice={price || 5000}
            onDriverAssigned={handleDriverAssigned}
          />
        </div>
      )}

      {/* Footer actions */}
      <div className="p-4">
        <Button onClick={onBack} className="w-full">Nouvelle livraison</Button>
      </div>
    </div>
  );
}
