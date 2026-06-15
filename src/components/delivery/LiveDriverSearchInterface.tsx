/**
 * 🔍 Interface Moderne de Recherche de Livreurs en Temps Réel
 * Carte interactive + Animations + Notifications push
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  MapPin, 
  Truck, 
  Clock, 
  Star,
  Zap,
  Loader2,
  Navigation,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import GoogleMapsKwenda from '@/components/maps/GoogleMapsKwenda';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { getVehicleClassForDelivery } from '@/utils/deliveryVehicleMapper';

interface LiveDriverSearchInterfaceProps {
  pickupLocation: {
    lat: number;
    lng: number;
    address: string;
  };
  deliveryType: 'flash' | 'flex' | 'maxicharge';
  onDriversFound: (count: number) => void;
  onSendRequest: (driverIds: string[]) => void;
}

interface NearbyDriver {
  id: string;
  name: string;
  photo_url?: string;
  rating: number;
  distance_km: number;
  eta_minutes: number;
  vehicle_type: string;
  vehicle_plate: string;
  rides_remaining: number;
  latitude: number;
  longitude: number;
}

export default function LiveDriverSearchInterface({
  pickupLocation,
  deliveryType,
  onDriversFound,
  onSendRequest
}: LiveDriverSearchInterfaceProps) {
  const [isSearching, setIsSearching] = useState(false);
  const [searchRadius, setSearchRadius] = useState(5);
  const [nearbyDrivers, setNearbyDrivers] = useState<NearbyDriver[]>([]);
  const [selectedDriverIds, setSelectedDriverIds] = useState<string[]>([]);

  // Recherche en cascade : 5km → 10km → 15km → 20km
  const searchDriversCascade = async () => {
    setIsSearching(true);
    const radii = [5, 10, 15, 20];
    
    for (const radius of radii) {
      setSearchRadius(radius);
      
      try {
        // Utiliser le mapper pour obtenir la bonne classe de véhicule
        const requiredVehicleClass = getVehicleClassForDelivery(deliveryType);
        
        console.log(`🔍 Recherche livreurs ${deliveryType} → vehicle_class: ${requiredVehicleClass}, rayon: ${radius}km`);
        
        const { data, error } = await supabase.rpc('find_nearby_delivery_drivers', {
          p_lat: pickupLocation.lat,
          p_lng: pickupLocation.lng,
          p_max_distance_km: radius,
          p_delivery_type: deliveryType
        });

        if (error) throw error;

        if (data && data.length > 0) {
          const formattedDrivers: NearbyDriver[] = data.map((driver: any) => ({
            id: driver.driver_id,
            name: driver.driver_name || 'Chauffeur',
            photo_url: driver.profile_photo_url,
            rating: driver.rating_average || 4.5,
            distance_km: driver.distance_km,
            eta_minutes: Math.ceil(driver.distance_km * 3), // Estimation: 3 min par km
            vehicle_type: driver.vehicle_type || 'Moto',
            vehicle_plate: driver.vehicle_plate || 'N/A',
            rides_remaining: driver.rides_remaining || 0,
            latitude: driver.latitude,
            longitude: driver.longitude
          }));

          setNearbyDrivers(formattedDrivers);
          onDriversFound(formattedDrivers.length);
          setIsSearching(false);
          
          toast.success(`🚚 ${formattedDrivers.length} livreur(s) disponible(s) dans un rayon de ${radius}km`);
          return;
        }
      } catch (error) {
        console.error('Error searching drivers:', error);
      }
    }

    setIsSearching(false);
    toast.error('Aucun livreur disponible pour le moment', {
      description: 'Veuillez réessayer dans quelques minutes'
    });
  };

  useEffect(() => {
    searchDriversCascade();
  }, []);

  const handleSendRequestToAll = () => {
    if (nearbyDrivers.length === 0) {
      toast.error('Aucun livreur disponible');
      return;
    }

    const allDriverIds = nearbyDrivers.map(d => d.id);
    onSendRequest(allDriverIds);
    toast.success(`📬 Demande envoyée à ${allDriverIds.length} livreur(s)`);
  };

  const getServiceIcon = () => {
    switch (deliveryType) {
      case 'flash':
        return <Zap className="h-4 w-4 text-yellow-500" />;
      case 'maxicharge':
        return <Truck className="h-4 w-4 text-blue-500" />;
      default:
        return <Navigation className="h-4 w-4 text-primary" />;
    }
  };

  const getDriverMarkers = () => {
    return nearbyDrivers.map(driver => ({
      lat: driver.latitude,
      lng: driver.longitude,
      icon: 'driver',
      label: `${driver.distance_km.toFixed(1)}km`
    }));
  };

  return (
    <div className="space-y-4">
      {/* En-tête de recherche */}
      <Card className="bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {isSearching ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <span>Recherche de livreurs...</span>
              </>
            ) : nearbyDrivers.length > 0 ? (
              <>
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <span>{nearbyDrivers.length} livreur(s) disponible(s)</span>
              </>
            ) : (
              <>
                <AlertCircle className="h-5 w-5 text-yellow-500" />
                <span>Recherche en cours...</span>
              </>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getServiceIcon()}
              <span className="text-sm font-medium">
                Service {deliveryType.toUpperCase()}
              </span>
            </div>
            <Badge variant="secondary" className="text-xs">
              Rayon: {searchRadius}km
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Carte interactive */}
      <Card className="overflow-hidden border-primary/20 shadow-lg">
        <CardContent className="p-0">
          <GoogleMapsKwenda
            pickup={pickupLocation}
            destination={null}
            driverLocation={null}
            showRoute={false}
            height="300px"
            additionalMarkers={getDriverMarkers()}
            deliveryMode={deliveryType}
          />
        </CardContent>
      </Card>

      {/* Liste des livreurs */}
      {nearbyDrivers.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">
            Livreurs disponibles
          </h3>
          {nearbyDrivers.slice(0, 5).map((driver) => (
            <Card 
              key={driver.id} 
              className="bg-card border border-border hover:border-primary/50 transition-all cursor-pointer"
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={driver.photo_url} />
                    <AvatarFallback>
                      <Truck className="h-6 w-6" />
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold">{driver.name}</h4>
                      <div className="flex items-center gap-1 text-xs">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        <span>{driver.rating.toFixed(1)}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span>{driver.vehicle_type} • {driver.vehicle_plate}</span>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-sm font-bold text-primary">
                      {driver.distance_km.toFixed(1)} km
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      ~{driver.eta_minutes} min
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Bouton d'envoi de demande */}
      {nearbyDrivers.length > 0 && (
        <Button
          onClick={handleSendRequestToAll}
          className="w-full h-14 text-base font-medium rounded-xl
                    bg-gradient-to-r from-primary to-primary/90 
                    hover:from-primary/90 hover:to-primary
                    transition-all duration-300 transform
                    hover:scale-[1.02] active:scale-[0.98]
                    shadow-lg hover:shadow-xl"
        >
          <Zap className="h-5 w-5 mr-2" />
          Envoyer la demande à tous les livreurs
        </Button>
      )}

      {/* État de recherche vide */}
      {!isSearching && nearbyDrivers.length === 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-3" />
            <h3 className="font-semibold mb-2">Aucun livreur disponible</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Aucun livreur n'est disponible dans votre zone pour le moment
            </p>
            <Button onClick={searchDriversCascade} variant="outline">
              <Loader2 className="h-4 w-4 mr-2" />
              Rechercher à nouveau
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
