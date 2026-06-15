/**
 * 🧪 PAGE DE TEST - GÉOLOCALISATION SMART
 * 
 * Test complet du nouveau système de géolocalisation unifié
 */

import React, { useState } from 'react';
import { SmartLocationPicker } from '@/components/location/SmartLocationPicker';
import { useSmartGeolocation, LocationData } from '@/hooks/useSmartGeolocation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { MapPin, Navigation, Search, Clock, Star, Zap } from 'lucide-react';

export default function SmartLocationTest() {
  const [pickupLocation, setPickupLocation] = useState<LocationData | null>(null);
  const [deliveryLocation, setDeliveryLocation] = useState<LocationData | null>(null);
  
  const { 
    getCurrentPosition, 
    searchLocations,
    loading, 
    error,
    source,
    lastUpdate,
    currentLocation,
    calculateDistance,
    formatDistance
  } = useSmartGeolocation();

  const handleStartTracking = async () => {
    try {
      await getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 15000,
        fallbackToIP: true,
        fallbackToDefault: true
      });
    } catch (error) {
      console.error('Tracking failed:', error);
    }
  };

  const getDeliveryDistance = () => {
    if (!pickupLocation || !deliveryLocation) return null;
    
    const distance = calculateDistance(
      { lat: pickupLocation.lat, lng: pickupLocation.lng },
      { lat: deliveryLocation.lat, lng: deliveryLocation.lng }
    );
    
    return formatDistance(distance);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-accent/5 p-4">
      <div className="container mx-auto max-w-4xl space-y-6">
        
        {/* Header */}
        <Card className="border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-accent/5">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2 text-2xl">
              <Navigation className="h-6 w-6 text-primary" />
              Test Géolocalisation Smart
            </CardTitle>
            <p className="text-muted-foreground">
              Système unifié de géolocalisation avec fallbacks automatiques
            </p>
          </CardHeader>
        </Card>

        {/* Section de test de sélection */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-emerald-500" />
                Sélection d'adresses
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <SmartLocationPicker
                  label="📍 Lieu de ramassage"
                  placeholder="Où récupérer..."
                  value={pickupLocation}
                  onChange={setPickupLocation}
                  context="pickup"
                  showAccuracy={true}
                />
              </div>

              <div>
                <SmartLocationPicker
                  label="🎯 Destination"
                  placeholder="Où livrer..."
                  value={deliveryLocation}
                  onChange={setDeliveryLocation}
                  context="delivery"
                  showAccuracy={true}
                />
              </div>

              {pickupLocation && deliveryLocation && (
                <div className="mt-4 p-3 bg-gradient-to-r from-primary/5 to-accent/5 rounded-lg border border-primary/20">
                  <div className="text-sm font-medium text-primary">
                    Distance estimée: {getDeliveryDistance()}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Navigation className="h-5 w-5 text-blue-500" />
                Géolocalisation automatique
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={handleStartTracking}
                disabled={loading}
                className="w-full"
                variant={currentLocation ? "outline" : "default"}
              >
                {loading ? (
                  <>
                    <Navigation className="mr-2 h-4 w-4 animate-spin" />
                    Détection en cours...
                  </>
                ) : (
                  <>
                    <MapPin className="mr-2 h-4 w-4" />
                    {currentLocation ? 'Actualiser position' : 'Détecter ma position'}
                  </>
                )}
              </Button>

              {error && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <div className="text-sm text-destructive">
                    ❌ {error}
                  </div>
                </div>
              )}

              {currentLocation && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Position actuelle:</span>
                    {source && (
                      <Badge variant="secondary" className="text-xs">
                        {source}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="p-3 bg-muted/50 rounded-lg text-sm">
                    <div className="font-medium">{currentLocation.address}</div>
                    <div className="text-muted-foreground text-xs mt-1">
                      {currentLocation.lat.toFixed(6)}, {currentLocation.lng.toFixed(6)}
                    </div>
                    {currentLocation.accuracy && (
                      <div className="text-muted-foreground text-xs">
                        Précision: ±{Math.round(currentLocation.accuracy)}m
                      </div>
                    )}
                  </div>
                </div>
              )}

              {lastUpdate && (
                <div className="text-xs text-muted-foreground text-center">
                  Dernière mise à jour: {new Date(lastUpdate).toLocaleTimeString()}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Section de diagnostic */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-500" />
              Diagnostic du système
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="text-center p-3 bg-muted/30 rounded-lg">
                <div className="text-sm text-muted-foreground">Statut GPS</div>
                <div className="font-semibold">
                  {navigator.geolocation ? '✅ Disponible' : '❌ Indisponible'}
                </div>
              </div>
              
              <div className="text-center p-3 bg-muted/30 rounded-lg">
                <div className="text-sm text-muted-foreground">Source de données</div>
                <div className="font-semibold">
                  {source || 'Aucune'}
                </div>
              </div>
              
              <div className="text-center p-3 bg-muted/30 rounded-lg">
                <div className="text-sm text-muted-foreground">Connexion réseau</div>
                <div className="font-semibold">
                  {navigator.onLine ? '✅ En ligne' : '❌ Hors ligne'}
                </div>
              </div>
            </div>

            <Separator className="my-4" />

            <div className="text-sm text-muted-foreground space-y-2">
              <h4 className="font-medium text-foreground">Fallbacks automatiques :</h4>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                <Badge variant="outline">GPS</Badge>
                <Badge variant="outline">IP</Badge>
                <Badge variant="outline">Cache</Badge>
                <Badge variant="outline">Database</Badge>
                <Badge variant="outline">Défaut</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section de performances */}
        {(pickupLocation || deliveryLocation || currentLocation) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5 text-purple-500" />
                Performances
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {currentLocation && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Géolocalisation:</span>
                    <Badge variant="secondary">
                      {currentLocation.confidence ? 
                        `${Math.round(currentLocation.confidence * 100)}% confiance` : 
                        'Position acquise'
                      }
                    </Badge>
                  </div>
                )}
                
                {pickupLocation && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Pickup sélectionné:</span>
                    <Badge variant="secondary">
                      {pickupLocation.type} • {pickupLocation.confidence ? 
                        `${Math.round(pickupLocation.confidence * 100)}%` : 
                        'OK'
                      }
                    </Badge>
                  </div>
                )}
                
                {deliveryLocation && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Destination sélectionnée:</span>
                    <Badge variant="secondary">
                      {deliveryLocation.type} • {deliveryLocation.confidence ? 
                        `${Math.round(deliveryLocation.confidence * 100)}%` : 
                        'OK'
                      }
                    </Badge>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
        
      </div>
    </div>
  );
}