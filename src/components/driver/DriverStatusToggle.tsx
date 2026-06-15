import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useDriverDispatch } from '@/hooks/useDriverDispatch';
import { useDriverStatus } from '@/hooks/useDriverStatus';
import { useDriverGeolocation } from '@/hooks/useDriverGeolocation';
import { 
  Power, 
  MapPin, 
  Car, 
  Package, 
  ShoppingBag, 
  Wifi, 
  WifiOff,
  Activity,
  Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface DriverStatusToggleProps {
  className?: string;
}

const DriverStatusToggle: React.FC<DriverStatusToggleProps> = ({ className }) => {
  const { 
    activeOrders,
    loading: dispatchLoading 
  } = useDriverDispatch();
  
  const { 
    location, 
    loading: locationLoading,
    error: locationError,
    getCurrentPosition
  } = useDriverGeolocation({ autoSync: false });
  
  const {
    status: driverStatus,
    loading: statusLoading,
    goOnline,
    goOffline,
    setAvailable,
    updateServiceTypes
  } = useDriverStatus();

  const [updating, setUpdating] = useState(false);
  const loading = dispatchLoading || locationLoading || statusLoading;

  const handleOnlineToggle = async (isOnline: boolean) => {
    setUpdating(true);
    try {
      if (isOnline) {
        // Essayer d'obtenir la position GPS
        let currentLocation = location;
        
        if (!currentLocation) {
          try {
            currentLocation = await getCurrentPosition();
          } catch (err) {
            // Si échec GPS, utiliser position par défaut (Kinshasa)
            currentLocation = {
              latitude: -4.3217,
              longitude: 15.3069,
              accuracy: 0,
              timestamp: Date.now()
            };
          }
        }
        
        const success = await goOnline(currentLocation?.latitude, currentLocation?.longitude);
        if (!success) {
          return;
        }
      } else {
        const success = await goOffline();
        if (!success) {
          return;
        }
      }
    } finally {
      setUpdating(false);
    }
  };

  const handleAvailabilityToggle = async (isAvailable: boolean) => {
    if (activeOrders.length > 0 && !isAvailable) {
      return; // Cannot go unavailable with active orders
    }

    setUpdating(true);
    try {
      await setAvailable(isAvailable);
    } finally {
      setUpdating(false);
    }
  };

  const handleServiceTypeToggle = async (serviceType: string, enabled: boolean) => {
    const newServiceTypes = enabled 
      ? [...driverStatus.serviceTypes, serviceType]
      : driverStatus.serviceTypes.filter(s => s !== serviceType);

    setUpdating(true);
    try {
      await updateServiceTypes(newServiceTypes);
    } finally {
      setUpdating(false);
    }
  };

  const getStatusBadge = () => {
    if (!driverStatus.isOnline) {
      return (
        <Badge variant="secondary" className="bg-muted/50 text-muted-foreground border border-muted">
          <div className="w-2 h-2 rounded-full bg-gray-400 mr-1.5"></div>
          Hors ligne
        </Badge>
      );
    }
    
    if (activeOrders.length > 0) {
      return (
        <Badge variant="default" className="bg-gradient-to-r from-orange-500 to-red-500 text-white border-0 shadow-lg">
          <div className="w-2 h-2 rounded-full bg-white mr-1.5 animate-pulse"></div>
          En course ({activeOrders.length})
        </Badge>
      );
    }
    
    if (driverStatus.isAvailable) {
      return (
        <Badge variant="default" className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0 shadow-lg">
          <div className="w-2 h-2 rounded-full bg-white mr-1.5 animate-pulse"></div>
          Disponible
        </Badge>
      );
    }
    
    return (
      <Badge variant="outline" className="border-yellow-500 text-yellow-600 bg-yellow-50 shadow-sm">
        <div className="w-2 h-2 rounded-full bg-yellow-500 mr-1.5"></div>
        Occupé
      </Badge>
    );
  };

  return (
    <Card className={cn("border-border/50", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Statut Chauffeur
          {getStatusBadge()}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Online Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {driverStatus.isOnline ? (
              <Wifi className="h-4 w-4 text-green-500" />
            ) : (
              <WifiOff className="h-4 w-4 text-gray-500" />
            )}
            <span className="text-sm font-medium">
              {driverStatus.isOnline ? 'En ligne' : 'Hors ligne'}
            </span>
          </div>
          <Switch
            checked={driverStatus.isOnline}
            onCheckedChange={handleOnlineToggle}
            disabled={updating || loading}
          />
        </div>

        {/* Availability Status (only when online) */}
        {driverStatus.isOnline && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={cn(
                "w-3 h-3 rounded-full",
                activeOrders.length > 0 
                  ? "bg-blue-500" 
                  : driverStatus.isAvailable 
                    ? "bg-green-500" 
                    : "bg-yellow-500"
              )} />
              <span className="text-sm font-medium">
                {activeOrders.length > 0 
                  ? `En course (${activeOrders.length})`
                  : driverStatus.isAvailable 
                    ? 'Disponible pour commandes' 
                    : 'Occupé'}
              </span>
            </div>
            <Switch
              checked={driverStatus.isAvailable}
              onCheckedChange={handleAvailabilityToggle}
              disabled={updating || loading || activeOrders.length > 0}
            />
          </div>
        )}

        {/* Service Types (only when online) */}
        {driverStatus.isOnline && (
          <div className="space-y-3">
            <div className="text-sm font-medium text-muted-foreground">
              Types de service acceptés :
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Car className="h-4 w-4 text-blue-500" />
                  <span className="text-sm">Courses taxi</span>
                </div>
                <Switch
                  checked={driverStatus.serviceTypes.includes('taxi')}
                  onCheckedChange={(checked) => handleServiceTypeToggle('taxi', checked)}
                  disabled={updating || loading}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Livraisons directes</span>
                </div>
                <Switch
                  checked={driverStatus.serviceTypes.includes('delivery')}
                  onCheckedChange={(checked) => handleServiceTypeToggle('delivery', checked)}
                  disabled={updating || loading}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="h-4 w-4 text-purple-500" />
                  <span className="text-sm">Livraisons marketplace</span>
                </div>
                <Switch
                  checked={driverStatus.serviceTypes.includes('marketplace')}
                  onCheckedChange={(checked) => handleServiceTypeToggle('marketplace', checked)}
                  disabled={updating || loading}
                />
              </div>
            </div>
          </div>
        )}

        {/* Location Status */}
        {driverStatus.isOnline && (
          <div className="pt-3 border-t border-border/50">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" />
              {location ? (
                <span>Position: {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}</span>
              ) : (
                <span>Localisation en cours...</span>
              )}
            </div>
            {location && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                <Clock className="h-3 w-3" />
                <span>Dernière mise à jour: {new Date(location.timestamp).toLocaleTimeString('fr-FR')}</span>
              </div>
            )}
            {locationError && (
              <div className="text-xs text-yellow-600 mt-1">
                {locationError} - Position par défaut utilisée
              </div>
            )}
          </div>
        )}

        {/* Active Orders Summary */}
        {activeOrders.length > 0 && (
          <div className="pt-3 border-t border-border/50">
            <div className="text-sm font-medium mb-2">Commandes actives:</div>
            <div className="space-y-1">
              {activeOrders.map((order, index) => (
                <div key={order.id} className="text-xs bg-blue-50 p-2 rounded border">
                  {order.type === 'taxi' && `Course: ${order.pickup_location}`}
                  {order.type === 'delivery' && `Livraison: ${order.pickup_location}`}
                  {order.type === 'marketplace' && `Marketplace: ${order.pickup_location}`}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DriverStatusToggle;