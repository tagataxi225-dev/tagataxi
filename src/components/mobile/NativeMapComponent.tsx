/**
 * Composant Map Native optimisé pour iOS/Android
 * Utilise nativeGeolocationService comme unique point d'entrée GPS
 */

import React, { useEffect, useRef, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLocationCache } from '@/hooks/useLocationCache';
import { useNetworkOptimization } from '@/hooks/useNetworkOptimization';
import { nativeGeolocationService } from '@/services/nativeGeolocationService';
import { 
  Navigation, 
  MapPin, 
  Car, 
  Zap, 
  Smartphone,
  RefreshCw,
  Wifi,
  WifiOff
} from 'lucide-react';

interface NativeMapProps {
  origin?: { lat: number; lng: number; address?: string };
  destination?: { lat: number; lng: number; address?: string };
  showTraffic?: boolean;
  enableNavigation?: boolean;
  optimizeForBattery?: boolean;
  showDrivers?: boolean;
  onRouteCalculated?: (route: any) => void;
  onLocationUpdate?: (location: any) => void;
}

export default function NativeMapComponent({
  origin,
  destination,
  showTraffic = true,
  enableNavigation = false,
  optimizeForBattery = true,
  showDrivers = false,
  onRouteCalculated,
  onLocationUpdate
}: NativeMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [isNative, setIsNative] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<any>(null);
  const [route, setRoute] = useState<any>(null);
  const [nearbyDrivers, setNearbyDrivers] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  const locationCache = useLocationCache({ maxCacheSize: 200 });
  const networkOptimization = useNetworkOptimization();

  useEffect(() => {
    setIsNative(Capacitor.isNativePlatform());
    initializeMap();
  }, []);

  useEffect(() => {
    if (mapLoaded && origin && destination) {
      calculateRoute();
    }
  }, [mapLoaded, origin, destination]);

  const initializeMap = async () => {
    try {
      await getInitialPosition();
      setMapLoaded(true);
    } catch (error) {
      console.error('Erreur initialisation carte:', error);
      setError('Impossible de charger la carte');
    }
  };

  const getInitialPosition = async () => {
    try {
      const position = await nativeGeolocationService.getCurrentPosition({
        enableHighAccuracy: !optimizeForBattery,
        timeout: optimizeForBattery ? 15000 : 10000,
        maximumAge: optimizeForBattery ? 30000 : 10000
      });

      setCurrentLocation({
        lat: position.lat,
        lng: position.lng,
        accuracy: position.accuracy
      });

      onLocationUpdate?.({ latitude: position.lat, longitude: position.lng, accuracy: position.accuracy });
    } catch (err) {
      console.error('Erreur géolocalisation:', err);
      setError('Géolocalisation non disponible');
    }
  };

  const calculateRoute = async () => {
    if (!origin || !destination) return;

    try {
      const cacheKey = `route_${origin.lat}_${origin.lng}_${destination.lat}_${destination.lng}`;
      const cachedRoute = localStorage.getItem(cacheKey);
      
      if (cachedRoute) {
        const route = JSON.parse(cachedRoute);
        setRoute(route);
        onRouteCalculated?.(route);
        return;
      }

      const distance = calculateDistance(origin.lat, origin.lng, destination.lat, destination.lng);
      const mockRoute = {
        distance,
        duration: Math.ceil(distance / 1000 * 2),
        polyline: `${origin.lat},${origin.lng};${destination.lat},${destination.lng}`,
        steps: [{
          instruction: `Diriger vers ${destination.address || 'destination'}`,
          distance,
          duration: Math.ceil(distance / 1000 * 2)
        }],
        cached: false
      };

      const cacheEntry = { ...mockRoute, timestamp: Date.now(), expiryTime: Date.now() + (30 * 60 * 1000) };
      localStorage.setItem(cacheKey, JSON.stringify(cacheEntry));

      setRoute(mockRoute);
      onRouteCalculated?.(mockRoute);
      
      if (networkOptimization.isOnline) {
        networkOptimization.addToQueue({ type: 'route_calculation', origin, destination, timestamp: Date.now() }, 'normal');
      }
    } catch (error) {
      console.error('Erreur calcul route:', error);
      setError('Impossible de calculer l\'itinéraire');
    }
  };

  const startNavigation = () => {
    if (!destination) return;
    const url = isNative 
      ? `geo:${destination.lat},${destination.lng}?q=${destination.lat},${destination.lng}(${destination.address || 'Destination'})`
      : `https://www.google.com/maps/dir/?api=1&destination=${destination.lat},${destination.lng}`;
    window.open(url, '_system');
  };

  const refreshLocation = async () => {
    try {
      const position = await nativeGeolocationService.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      });

      setCurrentLocation({
        lat: position.lat,
        lng: position.lng,
        accuracy: position.accuracy
      });

      onLocationUpdate?.({ latitude: position.lat, longitude: position.lng, accuracy: position.accuracy });
    } catch (error) {
      console.error('Erreur actualisation position:', error);
      setError('Impossible d\'actualiser la position');
    }
  };

  const formatDistance = (meters: number): string => {
    if (meters < 1000) return `${Math.round(meters)}m`;
    return `${(meters / 1000).toFixed(1)}km`;
  };

  const formatDuration = (minutes: number): string => {
    if (minutes < 60) return `${minutes}min`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h${remainingMinutes > 0 ? ` ${remainingMinutes}min` : ''}`;
  };

  if (error) {
    return (
      <Card className="p-6 text-center">
        <div className="text-destructive mb-4">
          <MapPin className="h-12 w-12 mx-auto mb-2" />
          <p className="text-lg font-semibold">Erreur de carte</p>
          <p className="text-sm">{error}</p>
        </div>
        <Button onClick={initializeMap} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Réessayer
        </Button>
      </Card>
    );
  }

  return (
    <div className="relative h-full w-full">
      <div ref={mapRef} className="w-full h-full bg-gradient-to-br from-primary/5 via-background to-secondary/5 rounded-lg relative overflow-hidden">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--primary)_1px,_transparent_1px)] bg-[length:20px_20px]"></div>
        </div>

        {currentLocation && (
          <div className="absolute z-10 transform -translate-x-1/2 -translate-y-1/2" style={{ left: '50%', top: '50%' }}>
            <div className="relative">
              <div className="h-4 w-4 bg-blue-500 rounded-full border-2 border-white shadow-lg animate-pulse"></div>
              <div className="absolute inset-0 h-4 w-4 bg-blue-500/30 rounded-full animate-ping"></div>
            </div>
          </div>
        )}

        {origin && (
          <div className="absolute z-10 transform -translate-x-1/2 -translate-y-1/2" style={{ left: '30%', top: '60%' }}>
            <div className="h-3 w-3 bg-green-500 rounded-full border-2 border-white shadow-lg"></div>
          </div>
        )}

        {destination && (
          <div className="absolute z-10 transform -translate-x-1/2 -translate-y-1/2" style={{ left: '70%', top: '40%' }}>
            <div className="h-3 w-3 bg-red-500 rounded-full border-2 border-white shadow-lg"></div>
          </div>
        )}

        {route && origin && destination && (
          <svg className="absolute inset-0 w-full h-full z-5">
            <path d={`M 30% 60% Q 50% 30% 70% 40%`} stroke="rgb(59 130 246)" strokeWidth="3" fill="none" strokeDasharray="5,5" className="animate-pulse" />
          </svg>
        )}
      </div>

      <div className="absolute top-4 left-4 z-20 space-y-2">
        <Badge variant="secondary" className="flex items-center space-x-1">
          {isNative ? <Smartphone className="h-3 w-3" /> : <Zap className="h-3 w-3" />}
          <span>{isNative ? 'Natif' : 'Web'}</span>
        </Badge>
        
        <Badge variant={networkOptimization.isOnline ? "outline" : "destructive"} className="flex items-center space-x-1">
          {networkOptimization.isOnline ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
          <span>{networkOptimization.isOnline ? 'En ligne' : 'Hors ligne'}</span>
          {networkOptimization.queueSize > 0 && <span className="text-xs">({networkOptimization.queueSize})</span>}
        </Badge>
        
        {optimizeForBattery && (
          <Badge variant="outline" className="flex items-center space-x-1">
            <Zap className="h-3 w-3" />
            <span>Éco</span>
          </Badge>
        )}

        {currentLocation && (
          <Badge variant="outline" className="text-xs">±{Math.round(currentLocation.accuracy)}m</Badge>
        )}
        
        <Badge variant="outline" className="text-xs">Cache: {locationCache.stats.hits}H/{locationCache.stats.misses}M</Badge>
      </div>

      <div className="absolute bottom-4 right-4 z-20 space-y-2">
        <Button size="sm" variant="outline" onClick={refreshLocation} className="bg-background/90 backdrop-blur">
          <RefreshCw className="h-4 w-4" />
        </Button>

        {enableNavigation && destination && (
          <Button size="sm" onClick={startNavigation} className="bg-primary text-primary-foreground">
            <Navigation className="h-4 w-4 mr-2" />
            Navigation
          </Button>
        )}
      </div>

      {route && (
        <Card className="absolute bottom-4 left-4 z-20 p-3 bg-background/90 backdrop-blur">
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-1">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>{formatDistance(route.distance)}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Car className="h-4 w-4 text-muted-foreground" />
              <span>{formatDuration(route.duration)}</span>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
