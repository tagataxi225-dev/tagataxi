import React, { useState, useEffect } from 'react';
import { useGeolocation } from '@/hooks/useGeolocation';
import { MapPin, Truck, Clock, DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { secureLocation, isValidLocation, calculateDistance } from '@/utils/locationValidation';
import { toast } from 'sonner';

interface DeliveryCalculatorProps {
  vendorLocation?: { lat: number; lng: number };
  onDeliveryCalculated: (info: DeliveryInfo) => void;
}

interface DeliveryInfo {
  distance: number;
  duration: number;
  cost: number;
  zone: string;
}

export const DeliveryCalculator: React.FC<DeliveryCalculatorProps> = ({
  vendorLocation,
  onDeliveryCalculated
}) => {
  const geolocation = useGeolocation();
  const locationLoading = geolocation.loading;
  
  // Sécurisation des coordonnées
  const userLocation = geolocation.latitude && geolocation.longitude ? 
    secureLocation({ lat: geolocation.latitude, lng: geolocation.longitude, address: 'Position actuelle' }) : null;
  const secureVendorLocation = vendorLocation ? secureLocation(vendorLocation) : null;
  
  const [deliveryInfo, setDeliveryInfo] = useState<DeliveryInfo | null>(null);
  const [calculating, setCalculating] = useState(false);

  // Utiliser la fonction sécurisée de calcul de distance
  const calculateDeliveryDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    return calculateDistance(lat1, lon1, lat2, lon2);
  };

  // Determine delivery zone based on distance
  const getDeliveryZone = (distance: number): string => {
    if (distance <= 5) return 'Proche';
    if (distance <= 15) return 'Ville';
    if (distance <= 30) return 'Banlieue';
    return 'Longue distance';
  };

  // Calculate delivery cost based on distance and zone
  const calculateDeliveryCost = (distance: number, zone: string): number => {
    const baseFee = 2000; // Base fee in CDF
    const perKmRate = zone === 'Proche' ? 300 : 
                     zone === 'Ville' ? 500 : 
                     zone === 'Banlieue' ? 800 : 1200;
    
    return baseFee + (distance * perKmRate);
  };

  // Estimate delivery duration based on distance and zone
  const estimateDeliveryDuration = (distance: number, zone: string): number => {
    // Base time + travel time (assuming average speed)
    const baseTime = 15; // minutes
    const avgSpeed = zone === 'Proche' ? 25 : 
                    zone === 'Ville' ? 20 : 
                    zone === 'Banlieue' ? 30 : 40; // km/h
    
    const travelTime = (distance / avgSpeed) * 60; // minutes
    return Math.round(baseTime + travelTime);
  };

  useEffect(() => {
    if (userLocation && secureVendorLocation && !calculating) {
      calculateDelivery();
    }
  }, [userLocation, secureVendorLocation]);

  const calculateDelivery = async () => {
    if (!userLocation || !secureVendorLocation) return;

    setCalculating(true);
    
    try {
      // Validation des coordonnées avant calcul
      if (!isValidLocation(userLocation) || !isValidLocation(secureVendorLocation)) {
        toast.error('Coordonnées invalides pour le calcul de livraison');
        return;
      }

      // Calculate straight-line distance avec validation
      const distance = calculateDeliveryDistance(
        userLocation.lat,
        userLocation.lng,
        secureVendorLocation.lat,
        secureVendorLocation.lng
      );

      // Determine zone and costs
      const zone = getDeliveryZone(distance);
      const cost = calculateDeliveryCost(distance, zone);
      const duration = estimateDeliveryDuration(distance, zone);

      const info: DeliveryInfo = {
        distance: Math.round(distance * 10) / 10, // Round to 1 decimal
        duration,
        cost,
        zone
      };

      setDeliveryInfo(info);
      onDeliveryCalculated(info);
    } catch (error) {
      console.error('Error calculating delivery:', error);
    } finally {
      setCalculating(false);
    }
  };

  if (locationLoading || calculating) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="animate-pulse">
            <div className="h-4 bg-muted rounded mb-2"></div>
            <div className="h-3 bg-muted rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!userLocation) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="text-center text-sm text-muted-foreground">
            <MapPin className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>Activez la géolocalisation pour calculer la livraison</p>
            <Button onClick={() => geolocation.getCurrentPosition()} className="mt-2" size="sm">
              Actualiser position
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!secureVendorLocation) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="text-center text-sm text-muted-foreground">
            <Truck className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>Localisation du vendeur non disponible</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Truck className="w-5 h-5" />
          Informations de livraison
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {deliveryInfo && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  Distance
                </div>
                <div className="font-semibold">{deliveryInfo.distance} km</div>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  Durée
                </div>
                <div className="font-semibold">{deliveryInfo.duration} min</div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="outline">{deliveryInfo.zone}</Badge>
              </div>
              <div className="flex items-center gap-1">
                <DollarSign className="w-4 h-4 text-primary" />
                <span className="font-bold text-primary">
                  {deliveryInfo.cost.toLocaleString()} CDF
                </span>
              </div>
            </div>

            <div className="text-xs text-muted-foreground text-center">
              Frais calculés selon la distance et la zone de livraison
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};