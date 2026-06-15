import React, { useEffect, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Navigation, Truck, Package, AlertTriangle, Zap, Radio } from 'lucide-react';
import { useGeolocation } from '@/hooks/useGeolocation';
import type { TripData, NavigationRoute, NavigationState, TripLocation } from '@/types/navigation';

interface UniversalNavigationMapProps {
  trip: TripData;
  route?: NavigationRoute | null;
  navigationState: NavigationState;
  currentDestination: TripLocation;
  className?: string;
}

export const UniversalNavigationMap: React.FC<UniversalNavigationMapProps> = ({
  trip,
  route,
  navigationState,
  currentDestination,
  className = ""
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapStyle, setMapStyle] = useState<'street' | 'satellite'>('street');
  const geolocation = useGeolocation();

  // Simulate different map styles
  const getMapBackground = () => {
    if (mapStyle === 'satellite') {
      return 'bg-gradient-to-br from-green-800 via-green-700 to-brown-600';
    }
    return 'bg-gradient-to-br from-gray-100 to-blue-100 dark:from-gray-800 dark:to-blue-900';
  };

  const getLocationIcon = (type: 'pickup' | 'destination' | 'current') => {
    switch (type) {
      case 'pickup':
        return trip.type === 'transport' ? 
          <MapPin className="h-4 w-4 text-white" /> : 
          <Package className="h-4 w-4 text-white" />;
      case 'destination':
        return <Navigation className="h-4 w-4 text-white" />;
      case 'current':
        return <Radio className="h-5 w-5 text-white" strokeWidth={2.5} />;
    }
  };

  const getMarkerColor = (type: 'pickup' | 'destination' | 'current') => {
    switch (type) {
      case 'pickup':
        return 'bg-blue-500';
      case 'destination':
        return 'bg-red-500';
      case 'current':
        return 'bg-green-500';
    }
  };

  // Calculate relative positions for markers
  const getMarkerPosition = (location: 'pickup' | 'destination' | 'current') => {
    switch (location) {
      case 'pickup':
        return 'top-1/4 left-1/4';
      case 'destination':
        return 'bottom-1/4 right-1/4';
      case 'current':
        return navigationState.currentLocation ? 'top-1/2 left-1/2' : 'top-2/5 left-2/5';
    }
  };

  return (
    <div className={`relative ${className}`}>
      <Card className="relative h-full overflow-hidden">
        {/* Map container */}
        <div 
          ref={mapRef}
          className={`w-full h-full ${getMapBackground()} relative`}
        >
          {/* Map grid overlay */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[length:20px_20px]" />
          
          {/* Kinshasa river simulation */}
          <div className="absolute bottom-1/3 left-0 right-0 h-6 bg-blue-400 dark:bg-blue-600 opacity-60 transform rotate-12" />
          
          {/* Streets simulation */}
          <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-400 dark:bg-gray-600 opacity-40" />
          <div className="absolute top-0 bottom-0 left-1/2 w-1 bg-gray-400 dark:bg-gray-600 opacity-40" />

          {/* Pickup marker */}
          <div className={`absolute ${getMarkerPosition('pickup')} transform -translate-x-1/2 -translate-y-1/2`}>
            <div className={`${getMarkerColor('pickup')} rounded-full p-2 shadow-lg border-2 border-white`}>
              {getLocationIcon('pickup')}
            </div>
            <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
              <Badge variant="secondary" className="text-xs">
                {trip.type === 'transport' ? 'Client' : 'Collecte'}
              </Badge>
            </div>
          </div>

          {/* Destination marker */}
          <div className={`absolute ${getMarkerPosition('destination')} transform -translate-x-1/2 -translate-y-1/2`}>
            <div className={`${getMarkerColor('destination')} rounded-full p-2 shadow-lg border-2 border-white`}>
              {getLocationIcon('destination')}
            </div>
            <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
              <Badge variant="secondary" className="text-xs">
                Destination
              </Badge>
            </div>
          </div>

          {/* Current location marker */}
          {geolocation.latitude && geolocation.longitude && (
            <div className={`absolute ${getMarkerPosition('current')} transform -translate-x-1/2 -translate-y-1/2`}>
              <div className="relative">
                {/* Cercle pulsant externe */}
                {navigationState.isActive && (
                  <div className="absolute inset-0 bg-green-500/30 rounded-full animate-ping" />
                )}
                
                {/* Icône principale */}
                <div className={`relative ${getMarkerColor('current')} rounded-full p-2.5 shadow-xl border-3 border-white ${navigationState.isActive ? 'bg-gradient-to-br from-green-500 to-green-600' : ''}`}>
                  {getLocationIcon('current')}
                </div>
              </div>
            </div>
          )}

          {/* Route line */}
          {route && (
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              <defs>
                <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#ef4444" stopOpacity="0.8" />
                </linearGradient>
              </defs>
              <path
                d="M 25% 25% Q 50% 20% 75% 75%"
                stroke="url(#routeGradient)"
                strokeWidth="4"
                fill="none"
                strokeDasharray={navigationState.isActive ? "8,4" : "none"}
                className={`${navigationState.isActive ? 'animate-pulse' : ''} ${navigationState.offRoute ? 'opacity-50' : ''}`}
              />
            </svg>
          )}

          {/* Progress indicator for active navigation */}
          {navigationState.isActive && route && (
            <div className="absolute top-2 left-2 right-2">
              <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur rounded-lg p-2">
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="font-medium">Navigation active</span>
                  {navigationState.nextInstruction && (
                    <span className="text-muted-foreground">
                      - {navigationState.nextInstruction}
                    </span>
                  )}
                </div>
                
                {/* Progress bar */}
                <div className="mt-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1">
                  <div 
                    className="bg-green-500 h-1 rounded-full transition-all duration-500"
                    style={{ 
                      width: `${Math.max(10, 100 - (navigationState.remainingDistance / route.distance) * 100)}%` 
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Status overlays */}
        <div className="absolute bottom-2 left-2 right-2 flex flex-col gap-2">
          {/* Current phase badge */}
          <div className="flex gap-2">
            <Badge 
              variant={currentDestination === trip.pickup ? "default" : "secondary"}
              className="text-xs"
            >
              {currentDestination === trip.pickup ? (
                <>
                  <MapPin className="h-3 w-3 mr-1" />
                  Vers collecte
                </>
              ) : (
                <>
                  <Navigation className="h-3 w-3 mr-1" />
                  Vers destination
                </>
              )}
            </Badge>

            {/* GPS quality indicator */}
            {geolocation.accuracy && (
              <Badge 
                variant={geolocation.isRealGPS ? "default" : "outline"}
                className="text-xs"
              >
                {geolocation.isRealGPS ? "GPS" : "Réseau"}
                {geolocation.accuracy && ` ±${Math.round(geolocation.accuracy)}m`}
              </Badge>
            )}
          </div>

          {/* Route info */}
          {route && (
            <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur rounded-lg p-2">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-medium">
                    {route.distanceText} • {route.durationText}
                  </span>
                  {route.trafficAware && (
                    <Zap className="h-3 w-3 text-orange-500" />
                  )}
                </div>
                <Badge variant="outline" className="text-xs">
                  {route.provider}
                </Badge>
              </div>
            </div>
          )}

          {/* Warning indicators */}
          {navigationState.offRoute && (
            <div className="bg-red-500/90 backdrop-blur rounded-lg p-2">
              <div className="flex items-center gap-2 text-white text-xs">
                <AlertTriangle className="h-3 w-3" />
                <span className="font-medium">Hors itinéraire - Recalcul en cours</span>
              </div>
            </div>
          )}
        </div>

        {/* Map style toggle */}
        <div className="absolute top-2 right-2">
          <button
            onClick={() => setMapStyle(prev => prev === 'street' ? 'satellite' : 'street')}
            className="bg-white/90 dark:bg-gray-900/90 backdrop-blur rounded-lg p-2 text-xs font-medium border border-gray-200 dark:border-gray-700 hover:bg-white dark:hover:bg-gray-900 transition-colors"
          >
            {mapStyle === 'street' ? '🛰️' : '🗺️'}
          </button>
        </div>
      </Card>
    </div>
  );
};