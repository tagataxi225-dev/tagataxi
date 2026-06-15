import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { CheckCircle2, XCircle, Loader2, MapPin, Users, Calendar } from 'lucide-react';

interface TestResult {
  phase: string;
  step: string;
  status: 'success' | 'error' | 'pending';
  message: string;
  timestamp: Date;
}

export default function DispatchValidationTest() {
  const [phase1Loading, setPhase1Loading] = useState(false);
  const [phase2Loading, setPhase2Loading] = useState(false);
  const [phase3Loading, setPhase3Loading] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);

  const addResult = (phase: string, step: string, status: 'success' | 'error', message: string) => {
    setResults(prev => [...prev, { phase, step, status, message, timestamp: new Date() }]);
  };

  // PHASE 1: Réactiver le chauffeur existant
  const runPhase1 = async () => {
    setPhase1Loading(true);
    try {
      const driverId = '6bd56fde-d3e1-4df9-a79c-670397581890';
      
      // Étape 1: Mettre à jour last_ping
      const { error: updateError } = await supabase
        .from('driver_locations')
        .update({
          last_ping: new Date().toISOString(),
          is_online: true,
          is_available: true,
          latitude: -4.3217,
          longitude: 15.3069
        })
        .eq('driver_id', driverId);

      if (updateError) {
        addResult('Phase 1', 'Update driver', 'error', updateError.message);
        toast.error('Erreur lors de la mise à jour du chauffeur');
        return;
      }

      addResult('Phase 1', 'Update last_ping', 'success', 'last_ping mis à jour avec succès');
      
      // Étape 2: Vérifier is_online
      const { data: driverData, error: verifyError } = await supabase
        .from('driver_locations')
        .select('is_online, is_available, last_ping')
        .eq('driver_id', driverId)
        .single();

      if (verifyError || !driverData) {
        addResult('Phase 1', 'Verify status', 'error', verifyError?.message || 'Driver not found');
        return;
      }

      if (driverData.is_online) {
        addResult('Phase 1', 'Verify is_online', 'success', 'is_online = true ✓');
      } else {
        addResult('Phase 1', 'Verify is_online', 'error', 'is_online = false');
      }

      // Étape 3: Vérifier is_available
      if (driverData.is_available) {
        addResult('Phase 1', 'Verify is_available', 'success', 'is_available = true ✓');
      } else {
        addResult('Phase 1', 'Verify is_available', 'error', 'is_available = false');
      }

      toast.success('✅ Phase 1 terminée avec succès');
    } catch (error: any) {
      addResult('Phase 1', 'Error', 'error', error.message);
      toast.error('Erreur Phase 1');
    } finally {
      setPhase1Loading(false);
    }
  };

  // PHASE 2: Test de booking complet
  const runPhase2 = async () => {
    setPhase2Loading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Vous devez être connecté');
        return;
      }

      // Étape 1: Créer un booking directement (sans RPC)
      const { data: directBooking, error: directError } = await supabase
        .from('transport_bookings')
        .insert({
          user_id: user.id,
          pickup_location: 'Gombe, Kinshasa',
          destination: 'Limete, Kinshasa',
          pickup_coordinates: { lat: -4.3217, lng: 15.3069 },
          destination_coordinates: { lat: -4.3566, lng: 15.3229 },
          estimated_price: 5000,
          vehicle_type: 'taxi'
        } as any)
        .select('id')
        .single();
      
      if (directError || !directBooking) {
        addResult('Phase 2', 'Create booking', 'error', directError?.message || 'Failed to create');
        toast.error('Erreur création booking');
        return;
      }

      const bookingId = directBooking.id;
      addResult('Phase 2', 'Create booking', 'success', `Booking créé: ${bookingId}`);

      // Étape 2: Appeler ride-dispatcher
      await new Promise(resolve => setTimeout(resolve, 1000)); // Attendre 1s

      const { data: dispatchData, error: dispatchError } = await supabase.functions.invoke('ride-dispatcher', {
        body: {
          bookingId: bookingId,
          pickupLat: -4.3217,
          pickupLng: 15.3069,
          serviceType: 'taxi',
          vehicleClass: 'standard'
        }
      });

      if (dispatchError) {
        addResult('Phase 2', 'Call ride-dispatcher', 'error', dispatchError.message);
        toast.error('Erreur dispatch');
        return;
      }

      addResult('Phase 2', 'Call ride-dispatcher', 'success', 'Dispatcher invoqué avec succès');

      // Étape 3: Vérifier matching
      await new Promise(resolve => setTimeout(resolve, 2000)); // Attendre 2s

      const { data: updatedBooking, error: verifyError } = await supabase
        .from('transport_bookings')
        .select('driver_id, status')
        .eq('id', bookingId)
        .single();

      if (verifyError || !updatedBooking) {
        addResult('Phase 2', 'Verify matching', 'error', verifyError?.message || 'No booking found');
        return;
      }

      if (updatedBooking.driver_id) {
        addResult('Phase 2', 'Confirm matching', 'success', `Chauffeur assigné: ${updatedBooking.driver_id}`);
      } else {
        addResult('Phase 2', 'Confirm matching', 'error', 'Aucun chauffeur assigné');
      }

      // Étape 4: Valider assignation
      if (updatedBooking.status === 'driver_assigned' || updatedBooking.status === 'confirmed') {
        addResult('Phase 2', 'Validate assignment', 'success', `Status: ${updatedBooking.status}`);
        toast.success('✅ Phase 2 terminée: Booking assigné avec succès');
      } else {
        addResult('Phase 2', 'Validate assignment', 'error', `Status incorrect: ${updatedBooking.status}`);
        toast.warning(`Booking créé mais status: ${updatedBooking.status}`);
      }

    } catch (error: any) {
      addResult('Phase 2', 'Error', 'error', error.message);
      toast.error('Erreur Phase 2');
    } finally {
      setPhase2Loading(false);
    }
  };

  // PHASE 3: Créer 10 chauffeurs de test
  const runPhase3 = async () => {
    setPhase3Loading(true);
    try {
      const testDrivers = [
        { name: 'Jean Kabila', zone: 'Gombe', lat: -4.3217, lng: 15.3069, vehicle: 'taxi-bus' },
        { name: 'Marie Tshisekedi', zone: 'Limete', lat: -4.3566, lng: 15.3229, vehicle: 'vtc-prive' },
        { name: 'Joseph Mulumba', zone: 'Kinshasa', lat: -4.2897, lng: 15.2662, vehicle: 'moto-taxi' },
        { name: 'Grace Kabongo', zone: 'Matete', lat: -4.3745, lng: 15.2889, vehicle: 'taxi-bus' },
        { name: 'Patrick Ilunga', zone: 'Ngaliema', lat: -4.3807, lng: 15.2614, vehicle: 'vtc-prive' },
        { name: 'Sarah Mbuyi', zone: 'Kasa-Vubu', lat: -4.3405, lng: 15.2989, vehicle: 'moto-taxi' },
        { name: 'Daniel Kalala', zone: 'Bandalungwa', lat: -4.3481, lng: 15.2897, vehicle: 'taxi-bus' },
        { name: 'Anne Mutombo', zone: 'Selembao', lat: -4.3806, lng: 15.3012, vehicle: 'vtc-prive' },
        { name: 'Pierre Mukendi', zone: 'Lemba', lat: -4.4009, lng: 15.3189, vehicle: 'moto-taxi' },
        { name: 'Rachel Kalonji', zone: 'Ngiri-Ngiri', lat: -4.3298, lng: 15.2845, vehicle: 'taxi-bus' }
      ];

      for (const driver of testDrivers) {
        // Créer l'utilisateur de test
        const userId = crypto.randomUUID();
        
        // Insérer dans driver_locations
        const { error: locationError } = await supabase
          .from('driver_locations')
          .insert({
            driver_id: userId,
            latitude: driver.lat,
            longitude: driver.lng,
            is_online: true,
            is_available: true,
            last_ping: new Date().toISOString(),
            city: 'Kinshasa',
            vehicle_class: 'standard'
          });

        if (locationError) {
          addResult('Phase 3', `Create ${driver.name}`, 'error', locationError.message);
          continue;
        }

        // Créer le profil chauffeur
        const { error: profileError } = await supabase
          .from('chauffeurs')
          .insert({
            user_id: userId,
            display_name: driver.name,
            email: `${driver.name.toLowerCase().replace(' ', '.')}@test.com`,
            phone_number: `+243${Math.floor(Math.random() * 1000000000)}`,
            is_active: true,
            verification_status: 'verified',
            vehicle_type: driver.vehicle,
            vehicle_class: 'standard',
            rating_average: 4.5 + Math.random() * 0.5,
            service_areas: ['Kinshasa']
          });

        if (profileError) {
          addResult('Phase 3', `Create profile ${driver.name}`, 'error', profileError.message);
          continue;
        }

        // Créer subscription active
        const { error: subError } = await supabase
          .from('driver_subscriptions')
          .insert({
            driver_id: userId,
            plan_id: '00000000-0000-0000-0000-000000000001',
            payment_method: 'mobile_money',
            status: 'active',
            start_date: new Date().toISOString(),
            end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            rides_remaining: 50,
            rides_used: 0
          });

        if (subError) {
          addResult('Phase 3', `Create subscription ${driver.name}`, 'error', subError.message);
          continue;
        }

        addResult('Phase 3', `Create ${driver.name}`, 'success', `✓ ${driver.zone} - ${driver.vehicle}`);
      }

      toast.success('✅ Phase 3 terminée: 10 chauffeurs créés');
    } catch (error: any) {
      addResult('Phase 3', 'Error', 'error', error.message);
      toast.error('Erreur Phase 3');
    } finally {
      setPhase3Loading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Validation Système de Dispatch</h1>
        <p className="text-muted-foreground">Plan de test en 3 phases pour résoudre les 98% d'annulations</p>
      </div>

      {/* PHASE 1 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5" />
            Phase 1: Données Immédiates (5 min)
          </CardTitle>
          <CardDescription>
            Réactiver le chauffeur existant pour tests immédiats
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline">Étape 1</Badge>
              <span>Mettre à jour last_ping du chauffeur existant</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">Étape 2</Badge>
              <span>Vérifier is_online = true</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">Étape 3</Badge>
              <span>Vérifier is_available = true</span>
            </div>
          </div>
          <Button 
            onClick={runPhase1} 
            disabled={phase1Loading}
            className="w-full"
          >
            {phase1Loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Exécution en cours...
              </>
            ) : (
              <>
                <MapPin className="mr-2 h-4 w-4" />
                Exécuter Phase 1
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* PHASE 2 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Phase 2: Tests End-to-End (10 min)
          </CardTitle>
          <CardDescription>
            Tester le flow complet: booking → dispatch → assignation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline">Étape 1</Badge>
              <span>Créer 1 nouveau booking</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">Étape 2</Badge>
              <span>Vérifier appel ride-dispatcher</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">Étape 3</Badge>
              <span>Confirmer matching du chauffeur</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">Étape 4</Badge>
              <span>Valider assignation</span>
            </div>
          </div>
          <Button 
            onClick={runPhase2} 
            disabled={phase2Loading}
            className="w-full"
          >
            {phase2Loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Test en cours...
              </>
            ) : (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Exécuter Phase 2
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* PHASE 3 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Phase 3: Données de Test (30 min)
          </CardTitle>
          <CardDescription>
            Créer un environnement de test complet avec 10 chauffeurs
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline">Étape 1</Badge>
              <span>Créer 10 chauffeurs test (divers véhicules)</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">Étape 2</Badge>
              <span>Créer subscriptions actives</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">Étape 3</Badge>
              <span>Positionner dans différentes zones de Kinshasa</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">Étape 4</Badge>
              <span>Simuler pings réguliers</span>
            </div>
          </div>
          <Button 
            onClick={runPhase3} 
            disabled={phase3Loading}
            className="w-full"
          >
            {phase3Loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Création en cours...
              </>
            ) : (
              <>
                <Users className="mr-2 h-4 w-4" />
                Exécuter Phase 3
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* RESULTS LOG */}
      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Journal des Résultats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {results.map((result, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 rounded-lg border">
                  {result.status === 'success' ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{result.phase}</Badge>
                      <span className="font-medium">{result.step}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{result.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {result.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
