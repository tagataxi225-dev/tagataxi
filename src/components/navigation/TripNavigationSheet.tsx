import React from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Navigation, 
  MapPin, 
  Package, 
  User, 
  Phone, 
  Clock, 
  Route,
  Play,
  Square,
  VolumeX,
  Volume2,
  RotateCcw,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';
import { UniversalNavigationMap } from '@/components/navigation/UniversalNavigationMap';
import { VoiceControlPanel } from '@/components/navigation/VoiceControlPanel';
import { useAdvancedNavigation } from '@/hooks/useAdvancedNavigation';
import { useVoiceNavigation } from '@/hooks/useVoiceNavigation';
import type { TripData } from '@/types/navigation';

interface TripNavigationSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trip: TripData;
  onStatusUpdate?: (status: TripData['status']) => void;
}

export const TripNavigationSheet: React.FC<TripNavigationSheetProps> = ({
  open,
  onOpenChange,
  trip,
  onStatusUpdate
}) => {
  const {
    route,
    navigationState,
    currentDestination,
    hasPickedUp,
    startNavigation,
    stopNavigation,
    confirmPickup,
    skipToDestination,
    calculateRoute
  } = useAdvancedNavigation(trip);

  const { settings, isPlaying, updateSettings, stopSpeaking } = useVoiceNavigation();

  const handleStatusUpdate = (newStatus: TripData['status']) => {
    onStatusUpdate?.(newStatus);
    
    if (newStatus === 'pickup' && !hasPickedUp) {
      confirmPickup();
    }
  };

  const openExternalMaps = () => {
    const { lat, lng } = currentDestination;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;
    window.open(url, '_blank');
  };

  const getTripTypeIcon = () => {
    switch (trip.type) {
      case 'delivery':
        return <Package className="h-4 w-4" />;
      case 'marketplace':
        return <Package className="h-4 w-4" />;
      case 'transport':
      default:
        return <User className="h-4 w-4" />;
    }
  };

  const getTripTypeLabel = () => {
    switch (trip.type) {
      case 'delivery':
        return 'Livraison';
      case 'marketplace':
        return 'Marketplace';
      case 'transport':
      default:
        return 'Transport';
    }
  };

  const getCurrentPhase = () => {
    if (!hasPickedUp) {
      return {
        title: 'Aller au point de collecte',
        description: trip.pickup.address,
        icon: <MapPin className="h-4 w-4" />,
        color: 'text-blue-600'
      };
    } else {
      return {
        title: 'Aller à la destination',
        description: trip.destination.address,
        icon: <Navigation className="h-4 w-4" />,
        color: 'text-green-600'
      };
    }
  };

  const currentPhase = getCurrentPhase();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full max-w-2xl overflow-y-auto">
        <SheetHeader className="space-y-4">
          <div className="flex items-center gap-3">
            {getTripTypeIcon()}
            <div className="flex-1">
              <SheetTitle className="text-left">
                Navigation - {getTripTypeLabel()}
              </SheetTitle>
              <SheetDescription className="text-left">
                Course #{trip.id.substring(0, 8)}
              </SheetDescription>
            </div>
            <Badge variant={navigationState.isActive ? "default" : "secondary"}>
              {navigationState.isActive ? "Active" : "Inactive"}
            </Badge>
          </div>

          {/* Current Phase */}
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className={currentPhase.color}>
                  {currentPhase.icon}
                </div>
                <div className="flex-1">
                  <h3 className="font-medium">{currentPhase.title}</h3>
                  <p className="text-sm text-muted-foreground">{currentPhase.description}</p>
                </div>
                {navigationState.offRoute && (
                  <Badge variant="destructive" className="text-xs">
                    Hors itinéraire
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* Navigation Map */}
          <UniversalNavigationMap
            trip={trip}
            route={route}
            navigationState={navigationState}
            currentDestination={currentDestination}
            className="h-64"
          />

          {/* Route Information */}
          {route && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Route className="h-4 w-4" />
                  Informations de route
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Distance:</span>
                    <p className="font-medium">{route.distanceText}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Durée:</span>
                    <p className="font-medium">{route.durationText}</p>
                  </div>
                </div>
                
                {navigationState.isActive && (
                  <div className="grid grid-cols-2 gap-4 text-sm border-t pt-3">
                    <div>
                      <span className="text-muted-foreground">Restant:</span>
                      <p className="font-medium">
                        {(navigationState.remainingDistance / 1000).toFixed(1)} km
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">ETA:</span>
                      <p className="font-medium">
                        {Math.round(navigationState.remainingDuration / 60)} min
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Badge variant="outline" className="text-xs">
                    {route.provider}
                  </Badge>
                  {route.trafficAware && (
                    <Badge variant="outline" className="text-xs">
                      🚦 Trafic temps réel
                    </Badge>
                  )}
                  {navigationState.recalculating && (
                    <Badge variant="outline" className="text-xs">
                      <RotateCcw className="h-3 w-3 mr-1 animate-spin" />
                      Recalcul
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Voice Control */}
          <VoiceControlPanel
            settings={settings}
            isPlaying={isPlaying}
            onSettingsChange={updateSettings}
            onStopSpeaking={stopSpeaking}
          />

          {/* Client/Package Information */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                {trip.type === 'transport' ? (
                  <User className="h-4 w-4" />
                ) : (
                  <Package className="h-4 w-4" />
                )}
                {trip.type === 'transport' ? 'Informations client' : 'Informations colis'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {trip.clientInfo && (
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{trip.clientInfo.name}</span>
                    {trip.clientInfo.phone && (
                      <Button size="sm" variant="outline" asChild>
                        <a href={`tel:${trip.clientInfo.phone}`}>
                          <Phone className="h-3 w-3 mr-1" />
                          Appeler
                        </a>
                      </Button>
                    )}
                  </div>
                  {trip.clientInfo.instructions && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {trip.clientInfo.instructions}
                    </p>
                  )}
                </div>
              )}

              {trip.packageInfo && (
                <div>
                  <div className="text-sm">
                    <span className="font-medium">Type:</span> {trip.packageInfo.type}
                  </div>
                  {trip.packageInfo.description && (
                    <div className="text-sm">
                      <span className="font-medium">Description:</span> {trip.packageInfo.description}
                    </div>
                  )}
                  {trip.packageInfo.value && (
                    <div className="text-sm">
                      <span className="font-medium">Valeur:</span> {trip.packageInfo.value} CDF
                    </div>
                  )}
                </div>
              )}

              {trip.estimatedPrice && (
                <div className="text-sm">
                  <span className="font-medium">Prix estimé:</span> {trip.estimatedPrice} CDF
                </div>
              )}
            </CardContent>
          </Card>

          <Separator />

          {/* Navigation Controls */}
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              {!navigationState.isActive ? (
                <Button 
                  onClick={startNavigation}
                  className="flex items-center gap-2"
                  disabled={!route}
                >
                  <Play className="h-4 w-4" />
                  Démarrer navigation
                </Button>
              ) : (
                <Button 
                  onClick={stopNavigation}
                  variant="destructive"
                  className="flex items-center gap-2"
                >
                  <Square className="h-4 w-4" />
                  Arrêter navigation
                </Button>
              )}

              <Button
                variant="outline"
                onClick={openExternalMaps}
                className="flex items-center gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                Maps externe
              </Button>
            </div>

            {/* Status Update Controls */}
            <div className="grid grid-cols-2 gap-3">
              {!hasPickedUp ? (
                <Button
                  onClick={() => handleStatusUpdate('pickup')}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Confirmer collecte
                </Button>
              ) : (
                <Button
                  onClick={() => handleStatusUpdate('completed')}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Course terminée
                </Button>
              )}

              <Button
                variant="outline"
                onClick={calculateRoute}
                disabled={navigationState.recalculating}
                className="flex items-center gap-2"
              >
                <RotateCcw className={`h-4 w-4 ${navigationState.recalculating ? 'animate-spin' : ''}`} />
                Recalculer
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};