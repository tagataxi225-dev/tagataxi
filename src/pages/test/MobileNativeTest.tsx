/**
 * Page de test pour les fonctionnalités mobiles natives
 * Interface adaptée pour tester le tracking et les maps natives
 */

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { 
  Smartphone, 
  Battery, 
  MapPin, 
  Navigation, 
  Zap,
  Signal,
  RefreshCw,
  Play,
  Pause
} from 'lucide-react';
import { useBatteryOptimizedTracking } from '@/hooks/useBatteryOptimizedTracking';
import NativeMapComponent from '@/components/mobile/NativeMapComponent';
import DrivingInterface from '@/components/mobile/DrivingInterface';
import { useToast } from '@/hooks/use-toast';

type TestModeType = 'tracking' | 'map' | 'driving';

export default function MobileNativeTestPage() {
  const [testMode, setTestMode] = useState<TestModeType>('tracking');
  const [backgroundMode, setBackgroundMode] = useState(true);
  const [batteryOptimization, setBatteryOptimization] = useState(true);
  const [accuracyLevel, setAccuracyLevel] = useState<'high' | 'balanced' | 'low_power'>('balanced');
  
  const { toast } = useToast();

  const {
    isTracking,
    currentLocation,
    error,
    stats,
    batteryLevel,
    startTracking,
    stopTracking,
    getCurrentPosition,
    clearError
  } = useBatteryOptimizedTracking({
    enableBackgroundMode: backgroundMode,
    accuracyLevel: accuracyLevel,
    updateIntervalMs: 15000,
    distanceFilterMeters: 10,
    enableBatteryOptimization: batteryOptimization,
    showNotification: true
  });

  // Données de test pour l'interface de conduite
  const mockTrip = {
    id: 'test-trip-123',
    pickup: {
      address: 'Avenue de la Paix, Kinshasa',
      lat: -4.3217,
      lng: 15.3069
    },
    destination: {
      address: 'Marché Central, Kinshasa',
      lat: -4.3276,
      lng: 15.3139
    },
    passengerName: 'Jean Mukendi',
    passengerPhone: '+243999123456',
    estimatedDuration: 15,
    estimatedDistance: 5200
  };

  const handleStartTracking = async () => {
    const success = await startTracking();
    if (success) {
      toast({
        title: "Tracking démarré",
        description: "Géolocalisation active en arrière-plan",
        duration: 3000
      });
    } else {
      toast({
        title: "Erreur",
        description: "Impossible de démarrer le tracking",
        variant: "destructive"
      });
    }
  };

  const handleStopTracking = async () => {
    await stopTracking();
    toast({
      title: "Tracking arrêté",
      description: "Géolocalisation désactivée",
      duration: 3000
    });
  };

  const handleGetCurrentPosition = async () => {
    const position = await getCurrentPosition();
    if (position) {
      toast({
        title: "Position obtenue",
        description: `Lat: ${position.latitude.toFixed(4)}, Lng: ${position.longitude.toFixed(4)}`,
        duration: 3000
      });
    }
  };

  const renderTrackingTest = () => (
    <div className="space-y-6">
      {/* Configuration */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Configuration du tracking</h2>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Mode arrière-plan</p>
              <p className="text-sm text-muted-foreground">Continuer le tracking en arrière-plan</p>
            </div>
            <Switch
              checked={backgroundMode}
              onCheckedChange={setBackgroundMode}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Optimisation batterie</p>
              <p className="text-sm text-muted-foreground">Réduire la consommation</p>
            </div>
            <Switch
              checked={batteryOptimization}
              onCheckedChange={setBatteryOptimization}
            />
          </div>

          <div>
            <p className="font-medium mb-2">Niveau de précision</p>
            <div className="flex space-x-2">
              {(['high', 'balanced', 'low_power'] as const).map((level) => (
                <Button
                  key={level}
                  size="sm"
                  variant={accuracyLevel === level ? "default" : "outline"}
                  onClick={() => setAccuracyLevel(level)}
                >
                  {level === 'high' ? 'Haute' : level === 'balanced' ? 'Équilibrée' : 'Économie'}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Statut du tracking */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Statut du tracking</h2>
          <Badge variant={isTracking ? "default" : "secondary"}>
            {isTracking ? "Actif" : "Inactif"}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Battery className="h-4 w-4" />
              <span className="text-sm">Batterie: {batteryLevel}%</span>
            </div>
            <Progress value={batteryLevel} className="h-2" />
          </div>

          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Signal className="h-4 w-4" />
              <span className="text-sm">Mises à jour: {stats.totalUpdates}</span>
            </div>
            <div className="flex items-center space-x-2">
              <MapPin className="h-4 w-4" />
              <span className="text-sm">
                {currentLocation ? 
                  `±${Math.round(currentLocation.accuracy)}m` : 
                  'Aucune position'
                }
              </span>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-destructive text-sm">{error}</p>
            <Button size="sm" variant="outline" onClick={clearError} className="mt-2">
              Effacer
            </Button>
          </div>
        )}

        {currentLocation && (
          <Card className="p-4 mb-4 bg-muted">
            <h3 className="font-medium mb-2">Position actuelle</h3>
            <div className="text-sm space-y-1">
              <p>Latitude: {currentLocation.latitude.toFixed(6)}</p>
              <p>Longitude: {currentLocation.longitude.toFixed(6)}</p>
              <p>Précision: ±{Math.round(currentLocation.accuracy)}m</p>
              {currentLocation.speed && (
                <p>Vitesse: {Math.round(currentLocation.speed * 3.6)} km/h</p>
              )}
              <p>Dernière mise à jour: {new Date(currentLocation.timestamp).toLocaleTimeString()}</p>
            </div>
          </Card>
        )}

        <div className="flex space-x-2">
          {!isTracking ? (
            <Button onClick={handleStartTracking} className="flex-1">
              <Play className="h-4 w-4 mr-2" />
              Démarrer tracking
            </Button>
          ) : (
            <Button onClick={handleStopTracking} variant="destructive" className="flex-1">
              <Pause className="h-4 w-4 mr-2" />
              Arrêter tracking
            </Button>
          )}
          
          <Button variant="outline" onClick={handleGetCurrentPosition}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Position
          </Button>
        </div>
      </Card>

      {/* Statistiques */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Statistiques</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Mises à jour totales</p>
            <p className="text-2xl font-bold">{stats.totalUpdates}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Temps actif</p>
            <p className="text-2xl font-bold">
              {Math.round(stats.activeTimeMs / 60000)}min
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Consommation batterie</p>
            <p className="text-2xl font-bold">{stats.batteryUsage.toFixed(1)}%</p>
          </div>
          <div>
            <p className="text-muted-foreground">Dernière mise à jour</p>
            <p className="text-lg">
              {stats.lastUpdate ? stats.lastUpdate.toLocaleTimeString() : '-'}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );

  const renderMapTest = () => (
    <div className="space-y-6">
      <Card className="p-4">
        <h2 className="text-xl font-semibold mb-4">Carte native mobile</h2>
        <div className="h-96 rounded-lg overflow-hidden">
          <NativeMapComponent
            origin={mockTrip.pickup}
            destination={mockTrip.destination}
            showTraffic={true}
            enableNavigation={true}
            optimizeForBattery={batteryOptimization}
            onLocationUpdate={(location) => {
              console.log('Mise à jour position carte:', location);
            }}
            onRouteCalculated={(route) => {
              toast({
                title: "Route calculée",
                description: `${(route.distance / 1000).toFixed(1)}km, ${route.duration}min`,
                duration: 3000
              });
            }}
          />
        </div>
      </Card>
    </div>
  );

  const renderDrivingTest = () => (
    <div className="h-screen">
      <DrivingInterface
        currentTrip={mockTrip}
        onTripUpdate={(status) => {
          toast({
            title: "Statut mis à jour",
            description: `Nouveau statut: ${status}`,
            duration: 3000
          });
        }}
        onEmergency={() => {
          toast({
            title: "🚨 URGENCE",
            description: "Alerte d'urgence déclenchée",
            variant: "destructive",
            duration: 5000
          });
        }}
      />
    </div>
  );

  if (testMode === 'driving') {
    return renderDrivingTest();
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Tests Mobile Natif</h1>
        <p className="text-muted-foreground">
          Interface de test pour les fonctionnalités mobiles natives
        </p>
      </div>

      {/* Sélecteur de mode */}
      <Card className="p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center">
          <Smartphone className="h-5 w-5 mr-2" />
          Mode de test
        </h2>
        <div className="flex space-x-2">
          <Button
            variant={testMode === 'tracking' ? "default" : "outline"}
            onClick={() => setTestMode('tracking')}
          >
            <Zap className="h-4 w-4 mr-2" />
            Tracking
          </Button>
          <Button
            variant={testMode === 'map' ? "default" : "outline"}
            onClick={() => setTestMode('map')}
          >
            <MapPin className="h-4 w-4 mr-2" />
            Carte
          </Button>
          <Button
            variant={(testMode as TestModeType) === 'driving' ? "default" : "outline"}
            onClick={() => setTestMode('driving')}
          >
            <Navigation className="h-4 w-4 mr-2" />
            Conduite
          </Button>
        </div>
      </Card>

      {testMode === 'tracking' && renderTrackingTest()}
      {testMode === 'map' && renderMapTest()}
    </div>
  );
}