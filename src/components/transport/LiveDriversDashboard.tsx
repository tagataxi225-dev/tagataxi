/**
 * 🗺️ LIVE DRIVERS DASHBOARD - Phase 3
 * Widget pour voir tous les chauffeurs disponibles en temps réel
 * Carte interactive avec clusters + stats live
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Car, Users, Activity, TrendingUp } from 'lucide-react';
import { useLiveDrivers } from '@/hooks/useLiveDrivers';
import GoogleMapsKwenda from '@/components/maps/GoogleMapsKwenda';

interface LiveDriversDashboardProps {
  userLocation: { lat: number; lng: number } | null;
  city?: string;
}

export default function LiveDriversDashboard({ userLocation, city }: LiveDriversDashboardProps) {
  const { liveDrivers, driversCount, loading } = useLiveDrivers({
    userLocation,
    maxRadius: 20,
    showOnlyAvailable: false,
    updateInterval: 15000 // Refresh toutes les 15s
  });

  const availableCount = liveDrivers.filter(d => d.is_available).length;
  const busyCount = driversCount - availableCount;

  return (
    <div className="space-y-4">
      {/* Stats en temps réel */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="glassmorphism">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{driversCount}</p>
              </div>
              <Users className="h-8 w-8 text-primary opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="glassmorphism">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Disponibles</p>
                <p className="text-2xl font-bold text-green-500">{availableCount}</p>
              </div>
              <Activity className="h-8 w-8 text-green-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="glassmorphism">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">En course</p>
                <p className="text-2xl font-bold text-orange-500">{busyCount}</p>
              </div>
              <Car className="h-8 w-8 text-orange-500 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Carte des chauffeurs */}
      <Card className="glassmorphism">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Chauffeurs en direct
            </CardTitle>
            <Badge variant="secondary">
              {loading ? 'Chargement...' : 'Temps réel'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <GoogleMapsKwenda
            pickup={userLocation || undefined}
            height="400px"
            showRoute={false}
          />
          
          {/* Liste des chauffeurs */}
          <div className="p-4 max-h-60 overflow-y-auto">
            {liveDrivers.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Aucun chauffeur disponible dans la zone
              </p>
            ) : (
              <div className="space-y-2">
                {liveDrivers.slice(0, 10).map((driver) => (
                  <div
                    key={driver.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${driver.is_available ? 'bg-green-500' : 'bg-orange-500'}`} />
                      <div>
                        <p className="font-medium text-sm">{driver.driver_name}</p>
                        <p className="text-xs text-muted-foreground">{driver.vehicle_model}</p>
                      </div>
                    </div>
                    <Badge variant={driver.is_available ? 'default' : 'secondary'} className="text-xs">
                      {driver.is_available ? 'Disponible' : 'En course'}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Légende */}
      <Card className="glassmorphism">
        <CardContent className="p-4">
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="text-muted-foreground">Disponible</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-orange-500" />
              <span className="text-muted-foreground">En course</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gray-400" />
              <span className="text-muted-foreground">Hors ligne</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
