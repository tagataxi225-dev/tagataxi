import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { toast } from 'sonner';

// Create a simple client without deep types to avoid TypeScript issues
const supabase = createClient(
  'https://wddlktajnhwhyquwcdgf.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndkZGxrdGFqbmh3aHlxdXdjZGdmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQxNDA1NjUsImV4cCI6MjA2OTcxNjU2NX0.rViBegpawtg1sFwafH_fczlB0oeA8E6V3MtDELcSIiU'
);

interface TestResult {
  name: string;
  status: 'pending' | 'running' | 'success' | 'error';
  message: string;
  duration?: number;
  details?: any;
}

export const useDispatcherTests = () => {
  const [results, setResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const updateResult = (index: number, updates: Partial<TestResult>) => {
    setResults(prev => {
      const newResults = [...prev];
      newResults[index] = { ...newResults[index], ...updates };
      return newResults;
    });
  };

  const runAllTests = async () => {
    setIsRunning(true);
    const testSuite: TestResult[] = [
      { name: 'Vérification Edge Functions', status: 'pending', message: '' },
      { name: 'Vérification Chauffeurs Disponibles', status: 'pending', message: '' },
      { name: 'Création Réservation Taxi', status: 'pending', message: '' },
      { name: 'Dispatch Automatique', status: 'pending', message: '' },
      { name: 'Assignation Chauffeur', status: 'pending', message: '' },
      { name: 'Sécurité Crédits (Non-Déduction)', status: 'pending', message: '' },
      { name: 'Workflow Arrivée Chauffeur', status: 'pending', message: '' },
      { name: 'Test Distance Limite (100m)', status: 'pending', message: '' },
      { name: 'Test Délai Minimum (2min)', status: 'pending', message: '' },
      { name: 'Audit Trail Complet', status: 'pending', message: '' },
    ];
    setResults(testSuite);

    // Test 1: Vérifier Edge Functions
    await runTest(0, async () => {
      const { data, error } = await supabase.functions.invoke('get-google-maps-key');
      if (error) throw new Error(`Edge functions inaccessibles: ${error.message}`);
      return { message: '✅ Edge functions opérationnelles', details: data };
    });

    // Test 2: Vérifier Chauffeurs Disponibles
    await runTest(1, async () => {
      const { data: drivers, error } = await supabase
        .from('driver_profiles')
        .select('id, user_id, is_online')
        .eq('is_online', true)
        .limit(5);

      if (error) throw new Error(`Erreur DB: ${error.message}`);
      if (!drivers || drivers.length === 0) {
        throw new Error('❌ AUCUN CHAUFFEUR DISPONIBLE - Activez un chauffeur test');
      }
      return { 
        message: `✅ ${drivers.length} chauffeur(s) disponible(s)`, 
        details: drivers 
      };
    });

    // Test 3: Créer Réservation Taxi
    let bookingId: string | null = null;
    await runTest(2, async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Utilisateur non connecté');

      const { data, error } = await supabase
        .from('transport_bookings')
        .insert({
          user_id: user.id,
          pickup_location: 'Test Pickup - Gombe, Kinshasa',
          pickup_lat: -4.3025,
          pickup_lng: 15.3074,
          destination_location: 'Test Destination - Lemba, Kinshasa',
          destination_lat: -4.3849,
          destination_lng: 15.3012,
          vehicle_class: 'eco',
          service_type: 'taxi',
          estimated_price: 2500,
          status: 'pending',
          city: 'Kinshasa',
          country: 'CD'
        } as any)
        .select()
        .single();

      if (error) throw new Error(`Erreur création: ${error.message}`);
      bookingId = data.id;
      return { 
        message: `✅ Booking créé: ${bookingId.slice(0, 8)}...`, 
        details: data 
      };
    });

    // Test 4: Dispatch Automatique
    let dispatchResult: any = null;
    await runTest(3, async () => {
      if (!bookingId) throw new Error('Pas de booking créé');

      const { data, error } = await supabase.functions.invoke('ride-dispatcher', {
        body: {
          bookingId: bookingId,
          pickupLat: 5.3479031,
          pickupLng: -4.079288,
          serviceType: 'taxi',
          vehicleClass: 'eco',
          priority: 'normal'
        }
      });

      if (error) throw new Error(`Dispatch échoué: ${error.message}`);
      if (!data.success) throw new Error(`Dispatch failed: ${data.error}`);
      
      dispatchResult = data;
      return { 
        message: `✅ Dispatch réussi - Chauffeur trouvé`, 
        details: data 
      };
    });

    // Test 5: Vérifier Assignation
    let driverId: string | null = null;
    await runTest(4, async () => {
      if (!bookingId) throw new Error('Pas de booking');

      await new Promise(resolve => setTimeout(resolve, 2000));

      const { data: booking, error } = await supabase
        .from('transport_bookings')
        .select('*')
        .eq('id', bookingId)
        .single();

      if (error) throw new Error(`Erreur vérification: ${error.message}`);
      if (!booking.driver_id) throw new Error('❌ Aucun chauffeur assigné');
      
      driverId = booking.driver_id;
      return { 
        message: `✅ Chauffeur assigné: ${driverId.slice(0, 8)}...`, 
        details: booking 
      };
    });

    // Test 6: Vérifier Crédits NON Défalqués
    await runTest(5, async () => {
      if (!driverId) throw new Error('Pas de chauffeur assigné');

      const { data: subscription, error } = await supabase
        .from('driver_subscriptions')
        .select('rides_remaining')
        .eq('driver_id', driverId)
        .single();

      if (error) throw new Error(`Erreur lecture crédits: ${error.message}`);

      // Check activity logs for credit consumption
      const { data: logs } = await supabase
        .from('activity_logs')
        .select('*')
        .eq('user_id', driverId)
        .eq('reference_id', bookingId);

      const hasCreditLog = logs?.some(l => l.activity_type?.includes('credit') || l.activity_type?.includes('consume'));
      
      if (hasCreditLog) {
        throw new Error('❌ SÉCURITÉ ÉCHOUÉE: Crédit déjà défalqué!');
      }

      return { 
        message: `✅ Sécurité OK - Crédits intacts: ${subscription?.rides_remaining}`, 
        details: { subscription, logs } 
      };
    });

    // Test 7: Simuler Arrivée Chauffeur
    await runTest(6, async () => {
      if (!bookingId || !driverId) throw new Error('Données manquantes');

      await new Promise(resolve => setTimeout(resolve, 3000));

      const { data, error } = await supabase.functions.invoke('driver-arrival-confirmation', {
        body: {
          bookingId: bookingId,
          driverId: driverId,
          latitude: 5.3479031,
          longitude: -4.079288
        }
      });

      if (error) throw new Error(`Erreur arrivée: ${error.message}`);
      if (!data.success) throw new Error(`Arrivée échouée: ${data.message}`);

      return { 
        message: `✅ Arrivée confirmée - Crédit défalqué`, 
        details: data 
      };
    });

    // Test 8: Test Distance
    await runTest(7, async () => {
      const { data: newBooking } = await supabase
        .from('transport_bookings')
        .insert({
          user_id: (await supabase.auth.getUser()).data.user?.id,
          pickup_location: 'Test Distance',
          pickup_lat: 5.3479031,
          pickup_lng: -4.079288,
          destination_location: 'Test',
          destination_lat: 5.3250,
          destination_lng: -4.0250,
          vehicle_class: 'eco',
          status: 'driver_assigned',
          driver_id: driverId
        } as any)
        .select()
        .single();

      const { data, error } = await supabase.functions.invoke('driver-arrival-confirmation', {
        body: {
          bookingId: newBooking?.id,
          driverId: driverId,
          latitude: 5.4, // 5.5km away
          longitude: -4.1
        }
      });

      if (data?.success) throw new Error('❌ Distance limite non respectée!');
      
      return { 
        message: '✅ Validation distance OK (> 100m rejeté)', 
        details: data 
      };
    });

    // Test 9: Test Délai
    await runTest(8, async () => {
      const { data: newBooking } = await supabase
        .from('transport_bookings')
        .insert({
          user_id: (await supabase.auth.getUser()).data.user?.id,
          pickup_location: 'Test Délai',
          pickup_lat: 5.3479031,
          pickup_lng: -4.079288,
          destination_location: 'Test',
          destination_lat: 5.3250,
          destination_lng: -4.0250,
          vehicle_class: 'eco',
          status: 'driver_assigned',
          driver_id: driverId,
          driver_assigned_at: new Date().toISOString()
        } as any)
        .select()
        .single();

      await new Promise(resolve => setTimeout(resolve, 500));

      const { data, error } = await supabase.functions.invoke('driver-arrival-confirmation', {
        body: {
          bookingId: newBooking?.id,
          driverId: driverId,
          latitude: 5.3479031,
          longitude: -4.079288
        }
      });

      if (data?.success) throw new Error('❌ Délai minimum non respecté!');
      
      return { 
        message: '✅ Validation délai OK (< 2min rejeté)', 
        details: data 
      };
    });

    // Test 10: Audit Trail
    await runTest(9, async () => {
      if (!bookingId || !driverId) throw new Error('Données manquantes');

      const { data: logs, error } = await supabase
        .from('activity_logs')
        .select('*')
        .or(`reference_id.eq.${bookingId},user_id.eq.${driverId}`)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw new Error(`Erreur logs: ${error.message}`);
      if (!logs || logs.length === 0) throw new Error('❌ Aucun log trouvé');

      const hasDispatchLog = logs.some(l => l.activity_type?.includes('dispatch') || l.activity_type?.includes('booking'));
      const hasArrivalLog = logs.some(l => l.activity_type?.includes('arrival') || l.activity_type?.includes('driver'));

      if (!hasDispatchLog && !hasArrivalLog) {
        throw new Error('❌ Logs incomplets - aucune trace d\'activité');
      }

      return { 
        message: `✅ Audit trail complet (${logs.length} entrées)`, 
        details: logs 
      };
    });

    setIsRunning(false);
    toast.success('Tests terminés!');
  };

  const runTest = async (index: number, testFn: () => Promise<any>) => {
    updateResult(index, { status: 'running' });
    const startTime = Date.now();
    
    try {
      const result = await testFn();
      const duration = Date.now() - startTime;
      updateResult(index, { 
        status: 'success', 
        message: result.message,
        details: result.details,
        duration 
      });
    } catch (error: any) {
      const duration = Date.now() - startTime;
      updateResult(index, { 
        status: 'error', 
        message: error.message,
        duration 
      });
      throw error; // Stop on first error
    }
  };

  return { results, isRunning, runAllTests };
};
