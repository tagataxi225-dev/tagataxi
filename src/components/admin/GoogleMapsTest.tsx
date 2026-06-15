/**
 * 🧪 Composant de test pour valider la migration Google Maps
 * Vérifie les adresses Google vs coordonnées brutes
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { 
  MapPin, 
  CheckCircle, 
  AlertTriangle, 
  RefreshCw,
  Zap,
  Database
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { formatAddressForDisplay, isRealGoogleAddress } from '@/utils/googleMapsUnified';

interface TestResults {
  totalRecords: number;
  withGoogleAddress: number;
  withoutGoogleAddress: number;
  progress: number;
}

export const GoogleMapsTest: React.FC = () => {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<{
    driver_locations: TestResults;
    transport_bookings: TestResults;
    delivery_orders: TestResults;
  } | null>(null);

  // Test migration status
  const runMigrationTest = async () => {
    setTesting(true);
    try {
      // Test driver locations
      const { data: drivers, error: driversError } = await supabase
        .from('driver_locations')
        .select('id, google_address, latitude, longitude')
        .limit(1000);

      if (driversError) throw driversError;

      const driverResults = {
        totalRecords: drivers?.length || 0,
        withGoogleAddress: drivers?.filter(d => isRealGoogleAddress(d.google_address)).length || 0,
        withoutGoogleAddress: drivers?.filter(d => !isRealGoogleAddress(d.google_address)).length || 0,
        progress: 0
      };
      driverResults.progress = driverResults.totalRecords > 0 ? 
        (driverResults.withGoogleAddress / driverResults.totalRecords) * 100 : 0;

      // Test transport bookings  
      const { data: bookings, error: bookingsError } = await supabase
        .from('transport_bookings')
        .select('id, pickup_location, delivery_location, pickup_coordinates, pickup_google_address, delivery_google_address')
        .limit(1000);

      if (bookingsError) throw bookingsError;

      const bookingResults = {
        totalRecords: bookings?.length || 0,
        withGoogleAddress: bookings?.filter(b => 
          isRealGoogleAddress((b as any).pickup_google_address) || 
          isRealGoogleAddress((b as any).delivery_google_address)
        ).length || 0,
        withoutGoogleAddress: bookings?.filter(b => 
          !isRealGoogleAddress((b as any).pickup_google_address) && 
          !isRealGoogleAddress((b as any).delivery_google_address)
        ).length || 0,
        progress: 0
      };
      bookingResults.progress = bookingResults.totalRecords > 0 ? 
        (bookingResults.withGoogleAddress / bookingResults.totalRecords) * 100 : 0;

      // Test delivery orders
      const { data: deliveries, error: deliveriesError } = await supabase
        .from('delivery_orders')
        .select('id, pickup_google_address, delivery_google_address, pickup_coordinates, delivery_coordinates')
        .limit(1000);

      if (deliveriesError) throw deliveriesError;

      const deliveryResults = {
        totalRecords: deliveries?.length || 0,
        withGoogleAddress: deliveries?.filter(d => 
          isRealGoogleAddress((d as any).pickup_google_address) || 
          isRealGoogleAddress((d as any).delivery_google_address)
        ).length || 0,
        withoutGoogleAddress: deliveries?.filter(d => 
          !isRealGoogleAddress((d as any).pickup_google_address) && 
          !isRealGoogleAddress((d as any).delivery_google_address)
        ).length || 0,
        progress: 0
      };
      deliveryResults.progress = deliveryResults.totalRecords > 0 ? 
        (deliveryResults.withGoogleAddress / deliveryResults.totalRecords) * 100 : 0;

      setResults({
        driver_locations: driverResults,
        transport_bookings: bookingResults,
        delivery_orders: deliveryResults
      });

      const overallProgress = (
        driverResults.progress + 
        bookingResults.progress + 
        deliveryResults.progress
      ) / 3;

      if (overallProgress > 90) {
        toast.success('🎉 Migration Google Maps quasi-complète !');
      } else if (overallProgress > 50) {
        toast.info('⚡ Migration Google Maps en cours...');
      } else {
        toast.warning('⚠️ Migration Google Maps requise');
      }

    } catch (error) {
      console.error('Erreur test migration:', error);
      toast.error('Erreur lors du test de migration');
    } finally {
      setTesting(false);
    }
  };

  useEffect(() => {
    runMigrationTest();
  }, []);

  const getProgressColor = (progress: number) => {
    if (progress > 80) return 'bg-green-500';
    if (progress > 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getStatusBadge = (progress: number) => {
    if (progress > 90) return <Badge className="bg-green-500">Migré</Badge>;
    if (progress > 50) return <Badge className="bg-yellow-500">En cours</Badge>;
    return <Badge variant="destructive">À migrer</Badge>;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Test de Migration Google Maps
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 mb-4">
            <Button 
              onClick={runMigrationTest} 
              disabled={testing}
              variant="outline"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${testing ? 'animate-spin' : ''}`} />
              Actualiser
            </Button>
            <div className="text-sm text-muted-foreground">
              Statut: Vérification des adresses Google Maps réelles
            </div>
          </div>

          {results && (
            <div className="space-y-4">
              {/* Driver Locations */}
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Database className="h-4 w-4" />
                    Positions Chauffeurs
                  </h3>
                  {getStatusBadge(results.driver_locations.progress)}
                </div>
                <Progress 
                  value={results.driver_locations.progress} 
                  className="mb-2" 
                />
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground">Total</div>
                    <div className="font-semibold">{results.driver_locations.totalRecords}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Migrés</div>
                    <div className="font-semibold text-green-600">
                      {results.driver_locations.withGoogleAddress}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">À migrer</div>
                    <div className="font-semibold text-red-600">
                      {results.driver_locations.withoutGoogleAddress}
                    </div>
                  </div>
                </div>
              </div>

              {/* Transport Bookings */}
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    Réservations Transport
                  </h3>
                  {getStatusBadge(results.transport_bookings.progress)}
                </div>
                <Progress 
                  value={results.transport_bookings.progress} 
                  className="mb-2" 
                />
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground">Total</div>
                    <div className="font-semibold">{results.transport_bookings.totalRecords}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Migrés</div>
                    <div className="font-semibold text-green-600">
                      {results.transport_bookings.withGoogleAddress}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">À migrer</div>
                    <div className="font-semibold text-red-600">
                      {results.transport_bookings.withoutGoogleAddress}
                    </div>
                  </div>
                </div>
              </div>

              {/* Delivery Orders */}
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Database className="h-4 w-4" />
                    Commandes Livraison
                  </h3>
                  {getStatusBadge(results.delivery_orders.progress)}
                </div>
                <Progress 
                  value={results.delivery_orders.progress} 
                  className="mb-2" 
                />
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground">Total</div>
                    <div className="font-semibold">{results.delivery_orders.totalRecords}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Migrés</div>
                    <div className="font-semibold text-green-600">
                      {results.delivery_orders.withGoogleAddress}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">À migrer</div>
                    <div className="font-semibold text-red-600">
                      {results.delivery_orders.withoutGoogleAddress}
                    </div>
                  </div>
                </div>
              </div>

              {/* Overall Status */}
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  {(
                    (results.driver_locations.progress + 
                     results.transport_bookings.progress + 
                     results.delivery_orders.progress) / 3
                  ) > 80 ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-yellow-600" />
                  )}
                  <h3 className="font-semibold">Statut Global</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  {(
                    (results.driver_locations.progress + 
                     results.transport_bookings.progress + 
                     results.delivery_orders.progress) / 3
                  ).toFixed(1)}% des données utilisent des adresses Google Maps réelles
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};