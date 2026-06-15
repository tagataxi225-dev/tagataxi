import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import KwendaMap from '@/components/maps/KwendaMap';
import { MapPin, Navigation, Sparkles } from 'lucide-react';

export default function ModernMapDemo() {
  const [pickup, setPickup] = useState<{ lat: number; lng: number; address: string } | null>({
    lat: -4.3217,
    lng: 15.3069,
    address: 'Gombe, Kinshasa, RDC'
  });

  const [destination, setDestination] = useState<{ lat: number; lng: number; address: string } | null>({
    lat: -4.3350,
    lng: 15.3220,
    address: 'Kalamu, Kinshasa, RDC'
  });

  const [userLocation] = useState<{ lat: number; lng: number } | null>({
    lat: -4.3280,
    lng: 15.3140
  });

  const testLocations = [
    { name: 'Gombe Centre', lat: -4.3217, lng: 15.3069 },
    { name: 'Kalamu', lat: -4.3350, lng: 15.3220 },
    { name: 'Ngaliema', lat: -4.3720, lng: 15.2850 },
    { name: 'Kintambo', lat: -4.3490, lng: 15.2920 },
    { name: 'Limete', lat: -4.3680, lng: 15.3350 }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="flex items-center justify-center gap-2">
            <Sparkles className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Tembea Modern Map 2025
            </h1>
          </div>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Carte Google Maps moderne avec Map ID, markers avancés, animations fluides, mode sombre/clair, et contrôles premium
          </p>
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <Badge variant="secondary">✅ Map ID Configuré</Badge>
            <Badge variant="secondary">🎨 Thème Auto</Badge>
            <Badge variant="secondary">🚀 3D Buildings</Badge>
            <Badge variant="secondary">⚡ Performance Optimisée</Badge>
          </div>
        </div>

        {/* Main Map */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              Carte Interactive Moderne
            </CardTitle>
            <CardDescription>
              Testez les fonctionnalités : cliquez sur la carte, utilisez les contrôles de zoom, localisez-vous
            </CardDescription>
          </CardHeader>
          <CardContent>
            <KwendaMap
              pickup={pickup}
              destination={destination}
              userLocation={userLocation}
              showRouteInfo={true}
              enableControls={true}
              enable3D={true}
              className="h-[600px] rounded-lg"
              onMapClick={(location) => {
                console.log('Clic sur carte:', location);
                if (!pickup) {
                  setPickup({ ...location, address: 'Nouveau départ' });
                } else if (!destination) {
                  setDestination({ ...location, address: 'Nouvelle destination' });
                } else {
                  setPickup({ ...location, address: 'Nouveau départ' });
                  setDestination(null);
                }
              }}
            />
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">🎯 Départ</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex flex-wrap gap-2">
                {testLocations.map((loc) => (
                  <Button
                    key={loc.name}
                    size="sm"
                    variant="outline"
                    onClick={() => setPickup({ lat: loc.lat, lng: loc.lng, address: loc.name })}
                  >
                    {loc.name}
                  </Button>
                ))}
              </div>
              {pickup && (
                <div className="mt-3 p-3 bg-muted rounded-lg">
                  <p className="text-sm font-medium">{pickup.address}</p>
                  <p className="text-xs text-muted-foreground">
                    {pickup.lat.toFixed(4)}, {pickup.lng.toFixed(4)}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">📍 Destination</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex flex-wrap gap-2">
                {testLocations.map((loc) => (
                  <Button
                    key={loc.name}
                    size="sm"
                    variant="outline"
                    onClick={() => setDestination({ lat: loc.lat, lng: loc.lng, address: loc.name })}
                  >
                    {loc.name}
                  </Button>
                ))}
              </div>
              {destination && (
                <div className="mt-3 p-3 bg-muted rounded-lg">
                  <p className="text-sm font-medium">{destination.address}</p>
                  <p className="text-xs text-muted-foreground">
                    {destination.lat.toFixed(4)}, {destination.lng.toFixed(4)}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Features List */}
        <Card>
          <CardHeader>
            <CardTitle>✨ Fonctionnalités Implémentées</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <h4 className="font-semibold text-sm flex items-center gap-2">
                  <Navigation className="h-4 w-4 text-primary" />
                  Visuel Moderne
                </h4>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>✅ Map ID Google configuré</li>
                  <li>✅ AdvancedMarkerElement</li>
                  <li>✅ Animations markers (pulse, bounce)</li>
                  <li>✅ Glassmorphism controls</li>
                  <li>✅ Effet ripple au clic</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold text-sm flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  UX Premium
                </h4>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>✅ Mode sombre/clair auto</li>
                  <li>✅ 3D Buildings (tilt 45°)</li>
                  <li>✅ Animations caméra fluides</li>
                  <li>✅ Route overlay avec stats</li>
                  <li>✅ Contrôles personnalisés</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold text-sm flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  Performance
                </h4>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>✅ Lazy loading intelligent</li>
                  <li>✅ Throttling des events</li>
                  <li>✅ Cache des routes</li>
                  <li>✅ Hooks réutilisables</li>
                  <li>✅ Composants modulaires</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
