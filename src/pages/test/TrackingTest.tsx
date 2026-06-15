/**
 * 🧪 PAGE DE TEST DU TRACKING MODERNE
 * 
 * Interface de test et de démonstration du système unifié
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  useModernTracking, 
  useDriverTracking, 
  useClientTracking, 
  useDeliveryTracking 
} from '@/hooks/useModernTracking';
import TrackingMonitor from '@/components/tracking/TrackingMonitor';
import FluidPositionMarker from '@/components/tracking/FluidPositionMarker';
import { 
  MapPin, 
  Car, 
  Package, 
  User,
  Play,
  Square,
  RotateCcw,
  Activity,
  TrendingUp
} from 'lucide-react';

export default function TrackingTest() {
  const [activeTest, setActiveTest] = useState<'client' | 'driver' | 'delivery'>('client');
  const [simulatedPosition, setSimulatedPosition] = useState({
    lat: -4.3217,
    lng: 15.3069,
    heading: 0,
    speed: 0
  });

  // Hooks de tracking spécialisés
  const clientTracking = useClientTracking();
  const driverTracking = useDriverTracking();
  const deliveryTracking = useDeliveryTracking();

  const getActiveTracking = () => {
    switch (activeTest) {
      case 'driver': return driverTracking;
      case 'delivery': return deliveryTracking;
      default: return clientTracking;
    }
  };

  const simulateMovement = () => {
    const speed = Math.random() * 20 + 5; // 5-25 m/s
    const heading = Math.random() * 360;
    const distance = 0.001; // ~100m
    
    const newLat = simulatedPosition.lat + (Math.cos(heading * Math.PI / 180) * distance);
    const newLng = simulatedPosition.lng + (Math.sin(heading * Math.PI / 180) * distance);
    
    setSimulatedPosition({
      lat: newLat,
      lng: newLng,
      heading,
      speed
    });
  };

  const resetPosition = () => {
    setSimulatedPosition({
      lat: -4.3217,
      lng: 15.3069,
      heading: 0,
      speed: 0
    });
  };

  const currentTracking = getActiveTracking();

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">🚀 Test du Système de Tracking Moderne</h1>
        <p className="text-muted-foreground">
          Démonstration et tests des fonctionnalités avancées de géolocalisation
        </p>
      </div>

      <Tabs value={activeTest} onValueChange={(value: any) => setActiveTest(value)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="client" className="flex items-center space-x-2">
            <User className="h-4 w-4" />
            <span>Client</span>
          </TabsTrigger>
          <TabsTrigger value="driver" className="flex items-center space-x-2">
            <Car className="h-4 w-4" />
            <span>Chauffeur</span>
          </TabsTrigger>
          <TabsTrigger value="delivery" className="flex items-center space-x-2">
            <Package className="h-4 w-4" />
            <span>Livreur</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="client" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5 text-orange-500" />
                <span>Tracking Client - Optimisé Batterie</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <Button
                    onClick={() => clientTracking.isTracking ? clientTracking.stopTracking() : clientTracking.startTracking()}
                    className={clientTracking.isTracking ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}
                  >
                    {clientTracking.isTracking ? <Square className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
                    {clientTracking.isTracking ? 'Arrêter' : 'Démarrer'} Client
                  </Button>
                  
                  <Badge variant={clientTracking.isTracking ? 'default' : 'secondary'}>
                    {clientTracking.isTracking ? 'Actif' : 'Inactif'}
                  </Badge>
                  
                  {clientTracking.currentPosition && (
                    <Badge variant="outline">
                      Précision: {clientTracking.currentPosition.accuracy.toFixed(0)}m
                    </Badge>
                  )}
                </div>

                <TrackingMonitor variant="compact" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="driver" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Car className="h-5 w-5 text-green-500" />
                <span>Tracking Chauffeur - Haute Performance</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <Button
                    onClick={() => driverTracking.isTracking ? driverTracking.stopTracking() : driverTracking.startTracking()}
                    className={driverTracking.isTracking ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}
                  >
                    {driverTracking.isTracking ? <Square className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
                    {driverTracking.isTracking ? 'Arrêter' : 'Démarrer'} Chauffeur
                  </Button>
                  
                  <Badge variant={driverTracking.isTracking ? 'default' : 'secondary'}>
                    {driverTracking.isTracking ? 'En ligne' : 'Hors ligne'}
                  </Badge>
                  
                  <Badge variant="outline">
                    Santé: {driverTracking.healthStatus}
                  </Badge>
                </div>

                <TrackingMonitor variant="full" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="delivery" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Package className="h-5 w-5 text-blue-500" />
                <span>Tracking Livreur - Temps Réel</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <Button
                    onClick={() => deliveryTracking.isTracking ? deliveryTracking.stopTracking() : deliveryTracking.startTracking()}
                    className={deliveryTracking.isTracking ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}
                  >
                    {deliveryTracking.isTracking ? <Square className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
                    {deliveryTracking.isTracking ? 'Arrêter' : 'Démarrer'} Livraison
                  </Button>
                  
                  <Badge variant={deliveryTracking.isTracking ? 'default' : 'secondary'}>
                    {deliveryTracking.isTracking ? 'En livraison' : 'Disponible'}
                  </Badge>
                </div>

                <TrackingMonitor variant="compact" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Simulateur de Position */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MapPin className="h-5 w-5" />
            <span>Simulateur de Position</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <Button onClick={simulateMovement} variant="outline">
                <Activity className="h-4 w-4 mr-2" />
                Simuler Mouvement
              </Button>
              
              <Button onClick={resetPosition} variant="outline">
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset Position
              </Button>
            </div>

            {/* Marqueurs de Test */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="text-center">
                <h4 className="font-medium mb-2">Client</h4>
                <FluidPositionMarker
                  latitude={simulatedPosition.lat}
                  longitude={simulatedPosition.lng}
                  heading={simulatedPosition.heading}
                  speed={simulatedPosition.speed * 0.5} // Client moins rapide
                  type="client"
                  isActive={clientTracking.isTracking}
                />
              </div>
              
              <div className="text-center">
                <h4 className="font-medium mb-2">Chauffeur</h4>
                <FluidPositionMarker
                  latitude={simulatedPosition.lat + 0.001}
                  longitude={simulatedPosition.lng + 0.001}
                  heading={simulatedPosition.heading + 45}
                  speed={simulatedPosition.speed}
                  type="driver"
                  isActive={driverTracking.isTracking}
                  size="lg"
                />
              </div>
              
              <div className="text-center">
                <h4 className="font-medium mb-2">Livreur</h4>
                <FluidPositionMarker
                  latitude={simulatedPosition.lat - 0.001}
                  longitude={simulatedPosition.lng - 0.001}
                  heading={simulatedPosition.heading - 45}
                  speed={simulatedPosition.speed * 0.8}
                  type="delivery"
                  isActive={deliveryTracking.isTracking}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistiques Comparatives */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center space-x-2">
              <User className="h-4 w-4 text-orange-500" />
              <span>Stats Client</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Positions:</span>
              <span>{clientTracking.stats.totalUpdates}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Batterie:</span>
              <span>{clientTracking.status.batteryLevel}%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Précision:</span>
              <span>{clientTracking.getLocationAccuracy()}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center space-x-2">
              <Car className="h-4 w-4 text-green-500" />
              <span>Stats Chauffeur</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Positions:</span>
              <span>{driverTracking.stats.totalUpdates}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Compression:</span>
              <span>{driverTracking.stats.dataCompression.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Erreurs réseau:</span>
              <span>{driverTracking.stats.networkErrors}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center space-x-2">
              <Package className="h-4 w-4 text-blue-500" />
              <span>Stats Livraison</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Positions:</span>
              <span>{deliveryTracking.stats.totalUpdates}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Buffer:</span>
              <span>{deliveryTracking.status.bufferSize}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Interval:</span>
              <span>{deliveryTracking.status.currentInterval}ms</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Guide d'utilisation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5" />
            <span>Guide du Système Moderne</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div>
              <strong>✅ Optimisations automatiques :</strong>
              <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                <li>Adaptation fréquence selon vitesse et batterie</li>
                <li>Compression delta des coordonnées</li>
                <li>Cache multi-niveau des positions</li>
                <li>Buffer offline avec synchronisation</li>
              </ul>
            </div>
            
            <div>
              <strong>🎯 Différences par profil :</strong>
              <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                <li><strong>Client :</strong> Économie batterie, précision normale</li>
                <li><strong>Chauffeur :</strong> Haute précision, prédiction trajectoire</li>
                <li><strong>Livreur :</strong> Temps réel, suivi continu</li>
              </ul>
            </div>
            
            <div>
              <strong>📊 Monitoring temps réel :</strong>
              <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                <li>Santé système (excellent → critique)</li>
                <li>Statistiques de performance détaillées</li>
                <li>Auto-recovery en cas de problème</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}