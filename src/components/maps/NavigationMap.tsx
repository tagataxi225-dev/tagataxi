import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Navigation, MapPin, Clock, Route, Zap, AlertTriangle, Radio } from 'lucide-react';
import { useGeolocation } from '@/hooks/useGeolocation';
import { DirectionsService, DirectionsResult } from '@/services/directionsService';
import { ZoneService } from '@/services/zoneService';
import { useToast } from '@/hooks/use-toast';

interface NavigationMapProps {
  origin?: { lat: number; lng: number; address?: string };
  destination?: { lat: number; lng: number; address?: string };
  onRouteCalculated?: (route: DirectionsResult) => void;
  showTrafficLayer?: boolean;
  enableNavigation?: boolean;
  className?: string;
}

export const NavigationMap: React.FC<NavigationMapProps> = ({
  origin,
  destination,
  onRouteCalculated,
  showTrafficLayer = true,
  enableNavigation = false,
  className = ""
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [route, setRoute] = useState<DirectionsResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [navigationActive, setNavigationActive] = useState(false);
  const [currentZone, setCurrentZone] = useState<string | null>(null);
  const { toast } = useToast();
  const geolocation = useGeolocation();

  // Calculate route when origin/destination changes
  useEffect(() => {
    if (origin && destination) {
      calculateRoute();
    }
  }, [origin, destination]);

  // Update current zone based on user location
  useEffect(() => {
    if (geolocation.latitude && geolocation.longitude) {
      const zone = ZoneService.getZoneByPoint(geolocation.longitude, geolocation.latitude);
      setCurrentZone(zone?.name || null);
    }
  }, [geolocation.latitude, geolocation.longitude]);

  const calculateRoute = useCallback(async () => {
    if (!origin || !destination) return;

    setIsCalculating(true);
    try {
      const routeData = await DirectionsService.getDirections(
        origin,
        destination,
        { 
          profile: showTrafficLayer ? 'driving-traffic' : 'driving',
          steps: true 
        }
      );
      
      setRoute(routeData);
      onRouteCalculated?.(routeData);
      
      toast({
        title: "Itinéraire calculé",
        description: `${routeData.distanceText} • ${routeData.durationText}`,
      });
    } catch (error) {
      console.error('Route calculation failed:', error);
      toast({
        title: "Erreur d'itinéraire",
        description: "Impossible de calculer l'itinéraire",
        variant: "destructive"
      });
    } finally {
      setIsCalculating(false);
    }
  }, [origin, destination, showTrafficLayer, onRouteCalculated, toast]);

  const startNavigation = useCallback(() => {
    if (!route) return;
    
    setNavigationActive(true);
    toast({
      title: "Navigation démarrée",
      description: "Suivez les instructions GPS",
    });
  }, [route, toast]);

  const stopNavigation = useCallback(() => {
    setNavigationActive(false);
    toast({
      title: "Navigation arrêtée",
      description: "Vous pouvez reprendre quand vous le souhaitez",
    });
  }, [toast]);

  const getSurgeInfo = useCallback(() => {
    if (!geolocation.latitude || !geolocation.longitude) return null;
    
    const multiplier = ZoneService.getSurgeMultiplier(geolocation.longitude, geolocation.latitude);
    return {
      multiplier,
      isHigh: multiplier > 1.5,
      level: multiplier > 2 ? 'très élevée' : multiplier > 1.5 ? 'élevée' : 'normale'
    };
  }, [geolocation.latitude, geolocation.longitude]);

  const surgeInfo = getSurgeInfo();

  return (
    <div className={`relative ${className}`}>
      <Card className="relative h-96 overflow-hidden">
        {/* Map container - simplified visual representation */}
        <div 
          ref={mapRef}
          className="w-full h-full bg-gradient-to-br from-green-100 to-blue-100 dark:from-green-900 dark:to-blue-900"
        >
          {/* Map styling overlay */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.1)_100%)]" />
          
          {/* Kinshasa river simulation */}
          <div className="absolute bottom-1/4 left-0 right-0 h-8 bg-blue-300 dark:bg-blue-700 opacity-60 transform rotate-12" />
          
          {/* Grid overlay for streets */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[length:20px_20px]" />
          
          {/* Origin marker */}
          {origin && (
            <div className="absolute top-1/3 left-1/3 transform -translate-x-1/2 -translate-y-1/2">
              <div className="bg-green-500 rounded-full p-2 shadow-lg animate-pulse">
                <MapPin className="h-4 w-4 text-white" />
              </div>
            </div>
          )}
          
          {/* Destination marker */}
          {destination && (
            <div className="absolute top-2/3 right-1/3 transform -translate-x-1/2 -translate-y-1/2">
              <div className="bg-red-500 rounded-full p-2 shadow-lg">
                <MapPin className="h-4 w-4 text-white" />
              </div>
            </div>
          )}
          
          {/* Route line */}
          {route && (
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              <path
                d="M 33% 33% Q 50% 25% 67% 67%"
                stroke={showTrafficLayer ? "#ef4444" : "#3b82f6"}
                strokeWidth="4"
                fill="none"
                strokeDasharray={navigationActive ? "8,4" : "none"}
                className={navigationActive ? "animate-pulse" : ""}
              />
            </svg>
          )}
          
          {/* Current location marker */}
          {geolocation.latitude && geolocation.longitude && (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <div className="relative">
                {/* Cercle pulsant externe */}
                <div className="absolute inset-0 bg-blue-500/30 rounded-full animate-ping" />
                
                {/* Icône principale */}
                <div className="relative bg-gradient-to-br from-blue-500 to-blue-600 rounded-full p-2.5 shadow-xl border-3 border-white">
                  <Radio className="h-5 w-5 text-white animate-pulse" strokeWidth={2.5} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Status overlay */}
        <div className="absolute top-4 left-4 right-4 flex flex-col gap-2">
          {/* Current zone badge */}
          {currentZone && (
            <Badge variant="secondary" className="w-fit">
              <MapPin className="h-3 w-3 mr-1" />
              {currentZone}
            </Badge>
          )}
          
          {/* Surge pricing indicator */}
          {surgeInfo && surgeInfo.multiplier > 1 && (
            <Badge 
              variant={surgeInfo.isHigh ? "destructive" : "default"}
              className="w-fit"
            >
              <Zap className="h-3 w-3 mr-1" />
              Demande {surgeInfo.level} ({surgeInfo.multiplier}x)
            </Badge>
          )}
          
          {/* GPS accuracy indicator */}
          {geolocation.accuracy && (
            <Badge 
              variant={geolocation.isRealGPS ? "default" : "outline"}
              className="w-fit"
            >
              {geolocation.isRealGPS ? "GPS" : "Réseau"} 
              {geolocation.accuracy && ` (±${Math.round(geolocation.accuracy)}m)`}
            </Badge>
          )}
        </div>

        {/* Route info overlay */}
        {route && (
          <div className="absolute bottom-4 left-4 right-4">
            <Card className="p-3 bg-white/95 dark:bg-gray-900/95 backdrop-blur">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Route className="h-4 w-4 text-primary" />
                  <span className="font-medium text-sm">
                    {route.distanceText} • {route.durationText}
                  </span>
                </div>
                <Badge variant="outline" className="text-xs">
                  {route.provider} {route.trafficAware && "🚦"}
                </Badge>
              </div>
              
              {enableNavigation && (
                <div className="flex gap-2">
                  {!navigationActive ? (
                    <Button
                      size="sm"
                      onClick={startNavigation}
                      className="flex-1"
                      disabled={isCalculating}
                    >
                      <Navigation className="h-4 w-4 mr-1" />
                      Démarrer
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={stopNavigation}
                      className="flex-1"
                    >
                      <AlertTriangle className="h-4 w-4 mr-1" />
                      Arrêter
                    </Button>
                  )}
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={calculateRoute}
                    disabled={isCalculating}
                  >
                    <Clock className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </Card>
          </div>
        )}

        {/* Loading overlay */}
        {isCalculating && (
          <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
            <Card className="p-4 bg-white dark:bg-gray-900">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <span className="text-sm">Calcul de l'itinéraire...</span>
              </div>
            </Card>
          </div>
        )}
      </Card>
    </div>
  );
};