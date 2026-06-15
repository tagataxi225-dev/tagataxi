import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { MapPin, User, Calendar, CheckCircle2, XCircle, AlertCircle, RefreshCw, Play } from 'lucide-react';

interface DriverStatus {
  driver_id: string;
  display_name: string;
  is_online: boolean;
  is_available: boolean;
  last_ping: string;
  minutes_since_ping: number;
  rides_remaining: number;
  vehicle_class: string;
  latitude: number;
  longitude: number;
}

interface BookingResult {
  booking_id: string;
  status: string;
  driver_assigned?: string;
  dispatch_result?: any;
  error?: string;
}

export default function DispatchSystemTest() {
  const [driverStatus, setDriverStatus] = useState<DriverStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [testResults, setTestResults] = useState<BookingResult[]>([]);
  const [testStep, setTestStep] = useState<string>('');

  const loadDriverStatus = async () => {
    try {
      const { data, error } = await supabase
        .from('driver_locations')
        .select(`
          driver_id,
          is_online,
          is_available,
          last_ping,
          latitude,
          longitude,
          vehicle_class,
          chauffeurs!inner(
            display_name,
            driver_subscriptions!inner(
              rides_remaining,
              status
            )
          )
        `)
        .eq('chauffeurs.driver_subscriptions.status', 'active')
        .limit(1)
        .single();

      if (error) throw error;

      if (data) {
        const minutesSincePing = Math.floor(
          (new Date().getTime() - new Date(data.last_ping).getTime()) / 60000
        );

        setDriverStatus({
          driver_id: data.driver_id,
          display_name: (data.chauffeurs as any).display_name,
          is_online: data.is_online,
          is_available: data.is_available,
          last_ping: data.last_ping,
          minutes_since_ping: minutesSincePing,
          rides_remaining: (data.chauffeurs as any).driver_subscriptions[0]?.rides_remaining || 0,
          vehicle_class: data.vehicle_class,
          latitude: data.latitude,
          longitude: data.longitude,
        });
      }
    } catch (error) {
      console.error('Error loading driver status:', error);
      toast.error('Erreur lors du chargement du chauffeur');
    }
  };

  const activateDriver = async () => {
    if (!driverStatus) return;

    setLoading(true);
    setTestStep('Activation du chauffeur...');

    try {
      const { error } = await supabase
        .from('driver_locations')
        .update({
          last_ping: new Date().toISOString(),
          is_online: true,
          is_available: true,
        })
        .eq('driver_id', driverStatus.driver_id);

      if (error) throw error;

      toast.success('Chauffeur activé avec succès');
      await loadDriverStatus();
    } catch (error) {
      console.error('Error activating driver:', error);
      toast.error('Erreur lors de l\'activation');
    } finally {
      setLoading(false);
      setTestStep('');
    }
  };

  const createTestBooking = async () => {
    setLoading(true);
    setTestStep('Création du booking...');

    try {
      // Coordonnées de test (Kinshasa - proche du chauffeur)
      const pickupCoords = { lat: -4.3217, lng: 15.3069 };
      const destCoords = { lat: -4.3300, lng: 15.3150 };

      // Créer le booking
      const { data: booking, error: bookingError } = await supabase
        .from('transport_bookings')
        .insert({
          user_id: (await supabase.auth.getUser()).data.user?.id,
          pickup_location: 'Test Pickup - Gombe, Kinshasa',
          destination: 'Test Destination - Limete, Kinshasa',
          pickup_coordinates: pickupCoords,
          destination_coordinates: destCoords,
          vehicle_type: 'standard',
          estimated_price: 5000,
          status: 'pending',
        })
        .select()
        .single();

      if (bookingError) throw bookingError;

      toast.success('Booking créé: ' + booking.id.substring(0, 8));
      setTestStep('Appel du dispatcher...');

      // Attendre 1 seconde pour simuler le délai
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Appeler le dispatcher
      const { data: dispatchResult, error: dispatchError } = await supabase.functions.invoke(
        'ride-dispatcher',
        {
          body: {
            bookingId: booking.id,
            pickupLat: pickupCoords.lat,
            pickupLng: pickupCoords.lng,
            vehicleClass: 'standard',
            serviceType: 'taxi',
          },
        }
      );

      if (dispatchError) {
        console.error('Dispatch error:', dispatchError);
        setTestResults(prev => [...prev, {
          booking_id: booking.id,
          status: 'dispatch_failed',
          error: dispatchError.message,
        }]);
        toast.error('Erreur dispatch: ' + dispatchError.message);
        return;
      }

      setTestStep('Vérification de l\'assignation...');
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Vérifier l'assignation
      const { data: updatedBooking } = await supabase
        .from('transport_bookings')
        .select('*, chauffeurs(display_name)')
        .eq('id', booking.id)
        .single();

      const result: BookingResult = {
        booking_id: booking.id,
        status: updatedBooking?.status || 'unknown',
        driver_assigned: updatedBooking?.driver_id ? 
          `${(updatedBooking.chauffeurs as any)?.display_name} (${updatedBooking.driver_id.substring(0, 8)})` 
          : undefined,
        dispatch_result: dispatchResult,
      };

      setTestResults(prev => [...prev, result]);

      if (updatedBooking?.driver_id) {
        toast.success('✅ Test réussi ! Chauffeur assigné');
      } else {
        toast.warning('⚠️ Booking créé mais pas de chauffeur assigné');
      }

      await loadDriverStatus();

    } catch (error) {
      console.error('Test error:', error);
      toast.error('Erreur lors du test: ' + (error as Error).message);
    } finally {
      setLoading(false);
      setTestStep('');
    }
  };

  const runFullTest = async () => {
    setTestResults([]);
    await activateDriver();
    await new Promise(resolve => setTimeout(resolve, 1500));
    await createTestBooking();
  };

  useEffect(() => {
    loadDriverStatus();
  }, []);

  const isPingRecent = driverStatus && driverStatus.minutes_since_ping < 30;
  const hasRides = driverStatus && driverStatus.rides_remaining > 0;
  const isReady = driverStatus?.is_online && driverStatus?.is_available && isPingRecent && hasRides;

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">🔍 Test Système Dispatch</h1>
        <p className="text-muted-foreground">
          Test end-to-end : Booking → Dispatcher → Assignation
        </p>
      </div>

      {/* État du chauffeur */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                État du Chauffeur
              </CardTitle>
              <CardDescription>Status temps réel du chauffeur de test</CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={loadDriverStatus}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {driverStatus ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Nom</p>
                  <p className="font-medium">{driverStatus.display_name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Status</p>
                  <div className="flex gap-2">
                    <Badge variant={driverStatus.is_online ? 'default' : 'secondary'}>
                      {driverStatus.is_online ? 'Online' : 'Offline'}
                    </Badge>
                    <Badge variant={driverStatus.is_available ? 'default' : 'secondary'}>
                      {driverStatus.is_available ? 'Dispo' : 'Occupé'}
                    </Badge>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Courses restantes</p>
                  <p className="font-medium text-lg">{driverStatus.rides_remaining}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Véhicule</p>
                  <p className="font-medium capitalize">{driverStatus.vehicle_class}</p>
                </div>
              </div>

              <Separator />

              <div className="flex items-center gap-4">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Dernier ping</p>
                  <p className="font-medium">
                    {new Date(driverStatus.last_ping).toLocaleString('fr-FR')}
                    <span className={`ml-2 text-sm ${isPingRecent ? 'text-green-600' : 'text-red-600'}`}>
                      ({Math.floor(driverStatus.minutes_since_ping / 60)}h {driverStatus.minutes_since_ping % 60}min)
                    </span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Position GPS</p>
                  <p className="font-mono text-sm">
                    {driverStatus.latitude.toFixed(4)}, {driverStatus.longitude.toFixed(4)}
                  </p>
                </div>
              </div>

              <Separator />

              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div>
                  <p className="font-medium mb-1">Prêt pour dispatch ?</p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant={driverStatus.is_online ? 'default' : 'destructive'}>
                      {driverStatus.is_online ? '✓' : '✗'} Online
                    </Badge>
                    <Badge variant={driverStatus.is_available ? 'default' : 'destructive'}>
                      {driverStatus.is_available ? '✓' : '✗'} Disponible
                    </Badge>
                    <Badge variant={isPingRecent ? 'default' : 'destructive'}>
                      {isPingRecent ? '✓' : '✗'} Ping récent
                    </Badge>
                    <Badge variant={hasRides ? 'default' : 'destructive'}>
                      {hasRides ? '✓' : '✗'} Courses dispo
                    </Badge>
                  </div>
                </div>
                {!isReady && (
                  <Button onClick={activateDriver} disabled={loading}>
                    Activer le chauffeur
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground">Chargement...</p>
          )}
        </CardContent>
      </Card>

      {/* Actions de test */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Play className="h-5 w-5" />
            Lancer les Tests
          </CardTitle>
          <CardDescription>Tester le flux complet de dispatch</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={activateDriver}
              disabled={loading || !driverStatus}
              variant="outline"
            >
              1. Activer Chauffeur
            </Button>
            <Button
              onClick={createTestBooking}
              disabled={loading || !driverStatus || !isReady}
              variant="outline"
            >
              2. Créer Booking Test
            </Button>
            <Button
              onClick={runFullTest}
              disabled={loading || !driverStatus}
              className="ml-auto"
            >
              ▶ Test Complet
            </Button>
          </div>

          {testStep && (
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950 rounded-md">
              <p className="text-sm text-blue-900 dark:text-blue-100 flex items-center gap-2">
                <RefreshCw className="h-4 w-4 animate-spin" />
                {testStep}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Résultats des tests */}
      {testResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>📊 Résultats des Tests</CardTitle>
            <CardDescription>{testResults.length} test(s) effectué(s)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {testResults.map((result, index) => (
                <div
                  key={index}
                  className="p-4 border rounded-lg space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-mono text-sm text-muted-foreground">
                        Booking: {result.booking_id.substring(0, 13)}...
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={
                          result.status === 'confirmed' ? 'default' :
                          result.status === 'pending' ? 'secondary' :
                          'destructive'
                        }>
                          {result.status}
                        </Badge>
                        {result.driver_assigned && (
                          <Badge variant="outline" className="text-green-600">
                            ✓ Chauffeur assigné
                          </Badge>
                        )}
                      </div>
                    </div>
                    {result.driver_assigned ? (
                      <CheckCircle2 className="h-6 w-6 text-green-600" />
                    ) : result.error ? (
                      <XCircle className="h-6 w-6 text-red-600" />
                    ) : (
                      <AlertCircle className="h-6 w-6 text-yellow-600" />
                    )}
                  </div>

                  {result.driver_assigned && (
                    <div className="text-sm">
                      <p className="text-muted-foreground">Chauffeur assigné:</p>
                      <p className="font-medium">{result.driver_assigned}</p>
                    </div>
                  )}

                  {result.error && (
                    <div className="text-sm p-2 bg-red-50 dark:bg-red-950 rounded">
                      <p className="text-red-600 dark:text-red-400">{result.error}</p>
                    </div>
                  )}

                  {result.dispatch_result && (
                    <details className="text-sm">
                      <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                        Détails du dispatch
                      </summary>
                      <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
                        {JSON.stringify(result.dispatch_result, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
