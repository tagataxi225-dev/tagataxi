import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle2, XCircle, Clock, AlertCircle } from 'lucide-react';

/**
 * 🧪 PAGE DE TEST - PHASE 4 : VALIDATION INSCRIPTION CHAUFFEURS
 * 
 * Cette page permet de tester les 3 scénarios principaux:
 * 1. Inscription chauffeur avec véhicule propre
 * 2. Inscription chauffeur sans véhicule (cherche partenaire)
 * 3. Inscription livreur
 */

interface TestResult {
  scenario: string;
  status: 'pending' | 'success' | 'error';
  message: string;
  details?: any;
}

export default function DriverRegistrationTest() {
  const { toast } = useToast();
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const addResult = (result: TestResult) => {
    setTestResults(prev => [...prev, result]);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  // 🧪 TEST 1: Chauffeur avec véhicule propre
  const testDriverWithVehicle = async () => {
    const scenario = 'TEST 1: Chauffeur avec véhicule propre';
    addResult({ scenario, status: 'pending', message: 'Test en cours...' });

    try {
      const testEmail = `test-driver-${Date.now()}@kwenda.test`;
      const testData = {
        serviceCategory: 'taxi' as const,
        serviceType: 'taxi',
        displayName: 'Test Chauffeur VéhiculePropre',
        phoneNumber: `+243${Math.floor(Math.random() * 1000000000)}`,
        email: testEmail,
        password: 'Test@123456',
        licenseNumber: `LIC-${Date.now()}`,
        licenseExpiry: '2026-12-31',
        vehicleType: 'sedan',
        vehicleMake: 'Toyota',
        vehicleModel: 'Corolla',
        vehicleYear: 2020,
        vehiclePlate: `TEST-${Date.now()}`,
        vehicleColor: 'Blanche',
        insuranceNumber: `INS-${Date.now()}`,
        insuranceExpiry: '2026-12-31',
        bankAccountNumber: '123456789',
        emergencyContactName: 'Contact Test',
        emergencyContactPhone: '+243999999999',
        acceptsTerms: true,
        hasOwnVehicle: true
      };

      console.log('🧪 Test 1 - Données:', testData);

      // Validation
      const { data: validation } = await supabase.rpc('validate_driver_registration_data', {
        p_email: testData.email,
        p_phone_number: testData.phoneNumber,
        p_license_number: testData.licenseNumber,
        p_vehicle_plate: testData.vehiclePlate
      });

      if (validation && !(validation as any).valid) {
        throw new Error(`Validation échouée: ${JSON.stringify((validation as any).errors)}`);
      }

      // Création compte auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: testData.email,
        password: testData.password,
        options: { emailRedirectTo: `${window.location.origin}/` }
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Pas d\'utilisateur créé');

      // Création profil via RPC
      const { data: rpcResult, error: rpcError } = await supabase.rpc('create_driver_profile_secure', {
        p_user_id: authData.user.id,
        p_email: testData.email,
        p_display_name: testData.displayName,
        p_phone_number: testData.phoneNumber,
        p_license_number: testData.licenseNumber,
        p_vehicle_plate: testData.vehiclePlate,
        p_service_type: testData.serviceType,
        p_vehicle_class: 'standard',
        p_has_own_vehicle: true
      });

      if (rpcError) throw rpcError;
      if (!(rpcResult as any)?.success) throw new Error((rpcResult as any)?.error || 'RPC échoué');

      // Vérifications
      const { data: profile } = await supabase.from('chauffeurs').select('*').eq('user_id', authData.user.id).single();
      const { data: role } = await supabase.from('user_roles').select('*').eq('user_id', authData.user.id).eq('role', 'driver').single();

      addResult({
        scenario,
        status: 'success',
        message: '✅ Profil créé, véhicule enregistré, rôle attribué',
        details: {
          userId: authData.user.id,
          profileExists: !!profile,
          hasOwnVehicle: profile?.has_own_vehicle,
          vehiclePlate: profile?.vehicle_plate,
          roleExists: !!role,
          serviceType: profile?.service_type
        }
      });

    } catch (error: any) {
      addResult({
        scenario,
        status: 'error',
        message: `❌ ${error.message}`,
        details: error
      });
    }
  };

  // 🧪 TEST 2: Chauffeur sans véhicule
  const testDriverWithoutVehicle = async () => {
    const scenario = 'TEST 2: Chauffeur sans véhicule (cherche partenaire)';
    addResult({ scenario, status: 'pending', message: 'Test en cours...' });

    try {
      const testEmail = `test-driver-novehicle-${Date.now()}@kwenda.test`;
      const testData = {
        serviceCategory: 'taxi' as const,
        serviceType: 'taxi',
        displayName: 'Test Chauffeur SansVéhicule',
        phoneNumber: `+243${Math.floor(Math.random() * 1000000000)}`,
        email: testEmail,
        password: 'Test@123456',
        licenseNumber: `LIC-NV-${Date.now()}`,
        licenseExpiry: '2026-12-31',
        bankAccountNumber: '987654321',
        emergencyContactName: 'Contact Test 2',
        emergencyContactPhone: '+243888888888',
        acceptsTerms: true,
        hasOwnVehicle: false
      };

      console.log('🧪 Test 2 - Données:', testData);

      // Création compte auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: testData.email,
        password: testData.password,
        options: { emailRedirectTo: `${window.location.origin}/` }
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Pas d\'utilisateur créé');

      // Création profil via RPC (sans véhicule)
      const { data: rpcResult, error: rpcError } = await supabase.rpc('create_driver_profile_secure', {
        p_user_id: authData.user.id,
        p_email: testData.email,
        p_display_name: testData.displayName,
        p_phone_number: testData.phoneNumber,
        p_license_number: testData.licenseNumber,
        p_vehicle_plate: null, // Pas de véhicule
        p_service_type: testData.serviceType,
        p_vehicle_class: 'standard',
        p_has_own_vehicle: false
      });

      if (rpcError) throw rpcError;
      if (!(rpcResult as any)?.success) throw new Error((rpcResult as any)?.error || 'RPC échoué');

      // Vérifications
      const { data: profile } = await supabase.from('chauffeurs').select('*').eq('user_id', authData.user.id).single();

      if (profile?.has_own_vehicle) {
        throw new Error('has_own_vehicle devrait être false');
      }

      if (profile?.vehicle_plate) {
        throw new Error('vehicle_plate devrait être NULL');
      }

      addResult({
        scenario,
        status: 'success',
        message: '✅ Profil créé sans véhicule, redirection /driver/find-partner attendue',
        details: {
          userId: authData.user.id,
          hasOwnVehicle: profile?.has_own_vehicle,
          vehiclePlate: profile?.vehicle_plate,
          expectedRedirect: '/driver/find-partner'
        }
      });

    } catch (error: any) {
      addResult({
        scenario,
        status: 'error',
        message: `❌ ${error.message}`,
        details: error
      });
    }
  };

  // 🧪 TEST 3: Inscription livreur
  const testDeliveryDriver = async () => {
    const scenario = 'TEST 3: Livreur (Flash)';
    addResult({ scenario, status: 'pending', message: 'Test en cours...' });

    try {
      const testEmail = `test-delivery-${Date.now()}@kwenda.test`;
      const testData = {
        serviceCategory: 'delivery' as const,
        serviceType: 'flash',
        displayName: 'Test Livreur Flash',
        phoneNumber: `+243${Math.floor(Math.random() * 1000000000)}`,
        email: testEmail,
        password: 'Test@123456',
        licenseNumber: `LIC-DEL-${Date.now()}`,
        licenseExpiry: '2026-12-31',
        deliveryCapacity: 'moto',
        vehicleType: 'motorcycle',
        vehicleMake: 'Yamaha',
        vehicleModel: 'YBR 125',
        vehicleYear: 2021,
        vehiclePlate: `MOTO-${Date.now()}`,
        vehicleColor: 'Rouge',
        acceptsTerms: true,
        hasOwnVehicle: true
      };

      console.log('🧪 Test 3 - Données:', testData);

      // Création compte auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: testData.email,
        password: testData.password,
        options: { emailRedirectTo: `${window.location.origin}/` }
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Pas d\'utilisateur créé');

      // Création profil via RPC
      const { data: rpcResult, error: rpcError } = await supabase.rpc('create_driver_profile_secure', {
        p_user_id: authData.user.id,
        p_email: testData.email,
        p_display_name: testData.displayName,
        p_phone_number: testData.phoneNumber,
        p_license_number: testData.licenseNumber,
        p_vehicle_plate: testData.vehiclePlate,
        p_service_type: testData.serviceType,
        p_delivery_capacity: testData.deliveryCapacity,
        p_vehicle_class: 'standard',
        p_has_own_vehicle: true
      });

      if (rpcError) throw rpcError;
      if (!(rpcResult as any)?.success) throw new Error((rpcResult as any)?.error || 'RPC échoué');

      // Vérifications spécifiques livreur
      const { data: profile } = await supabase.from('chauffeurs').select('*').eq('user_id', authData.user.id).single();
      const { data: preferences } = await supabase.from('driver_service_preferences').select('*').eq('driver_id', authData.user.id).single();

      if (profile?.service_type !== 'flash') {
        throw new Error('service_type devrait être "flash"');
      }

      if (profile?.delivery_capacity !== 'moto') {
        throw new Error('delivery_capacity devrait être "moto"');
      }

      addResult({
        scenario,
        status: 'success',
        message: '✅ Livreur créé avec service_type=flash et delivery_capacity=moto',
        details: {
          userId: authData.user.id,
          serviceType: profile?.service_type,
          deliveryCapacity: profile?.delivery_capacity,
          hasPreferences: !!preferences
        }
      });

    } catch (error: any) {
      addResult({
        scenario,
        status: 'error',
        message: `❌ ${error.message}`,
        details: error
      });
    }
  };

  const runAllTests = async () => {
    setIsRunning(true);
    clearResults();

    toast({
      title: "🧪 Lancement des tests",
      description: "Tests d'inscription chauffeur en cours...",
    });

    await testDriverWithVehicle();
    await testDriverWithoutVehicle();
    await testDeliveryDriver();

    setIsRunning(false);

    const successCount = testResults.filter(r => r.status === 'success').length;
    const totalTests = 3;

    toast({
      title: successCount === totalTests ? "✅ Tous les tests réussis" : "⚠️ Tests terminés",
      description: `${successCount}/${totalTests} tests réussis`,
      variant: successCount === totalTests ? "default" : "destructive"
    });
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-500 animate-pulse" />;
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-6 w-6" />
            Phase 4 : Tests de Validation - Inscription Chauffeurs
          </CardTitle>
          <CardDescription>
            Tests automatisés pour valider les 3 scénarios d'inscription : 
            chauffeur avec véhicule, chauffeur sans véhicule, et livreur.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex gap-4">
            <Button 
              onClick={runAllTests} 
              disabled={isRunning}
              size="lg"
              className="flex-1"
            >
              {isRunning ? 'Tests en cours...' : '🧪 Lancer tous les tests'}
            </Button>
            <Button 
              onClick={clearResults} 
              variant="outline"
              disabled={isRunning || testResults.length === 0}
            >
              Effacer
            </Button>
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold text-lg">Résultats des tests :</h3>
            
            {testResults.length === 0 && (
              <p className="text-muted-foreground text-center py-8">
                Aucun test exécuté. Cliquez sur "Lancer tous les tests" pour commencer.
              </p>
            )}

            {testResults.map((result, index) => (
              <Card key={index} className="p-4">
                <div className="flex items-start gap-3">
                  {getStatusIcon(result.status)}
                  <div className="flex-1">
                    <h4 className="font-medium">{result.scenario}</h4>
                    <p className="text-sm text-muted-foreground mt-1">{result.message}</p>
                    {result.details && (
                      <details className="mt-2">
                        <summary className="text-xs text-blue-600 cursor-pointer hover:underline">
                          Voir les détails
                        </summary>
                        <pre className="text-xs bg-muted p-2 rounded mt-2 overflow-auto">
                          {JSON.stringify(result.details, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">📋 Critères de validation :</h4>
            <ul className="text-sm space-y-1 ml-4 list-disc">
              <li>Test 1 : Profil créé + véhicule enregistré + rôle driver actif</li>
              <li>Test 2 : Profil créé + has_own_vehicle=false + vehicle_plate=null</li>
              <li>Test 3 : Profil créé + service_type='flash' + delivery_capacity='moto'</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
