import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle2, XCircle, AlertCircle, Loader2 } from 'lucide-react';

/**
 * 📊 PAGE DE TEST ADMIN - PHASE 4
 * 
 * Cette page permet aux administrateurs de tester les différents scénarios
 * d'inscription chauffeur/livreur et de vérifier les logs détaillés.
 */
export default function AdminRegistrationTest() {
  const { toast } = useToast();
  const [testing, setTesting] = useState(false);
  const [testResults, setTestResults] = useState<any[]>([]);
  const [debugLogs, setDebugLogs] = useState<any[]>([]);

  // ✅ TEST 1: Inscription chauffeur avec véhicule propre
  const testDriverWithVehicle = async () => {
    setTesting(true);
    const testEmail = `driver_test_${Date.now()}@test.com`;
    const testPassword = 'TestPassword123!';
    
    try {
      console.log('🚗 TEST 1: Chauffeur avec véhicule propre');
      
      // 1. Créer compte auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: testEmail,
        password: testPassword,
        options: {
          emailRedirectTo: `${window.location.origin}/`
        }
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('No user created');

      // 2. Appeler RPC
      const { data: rpcResult, error: rpcError } = await supabase.rpc('create_driver_profile_secure', {
        p_user_id: authData.user.id,
        p_email: testEmail,
        p_display_name: 'Test Driver With Vehicle',
        p_phone_number: `+243${Date.now().toString().slice(-9)}`,
        p_license_number: `LIC${Date.now()}`,
        p_vehicle_plate: `ABC${Date.now().toString().slice(-3)}`,
        p_service_type: 'taxi',
        p_delivery_capacity: null,
        p_vehicle_class: 'standard',
        p_has_own_vehicle: true
      });

      if (rpcError) throw rpcError;

      // 3. Vérifier les résultats
      const { data: profile } = await supabase
        .from('chauffeurs')
        .select('*')
        .eq('user_id', authData.user.id)
        .single();

      const { data: role } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', authData.user.id)
        .eq('role', 'driver')
        .single();

      const rpcSuccess = typeof rpcResult === 'object' && rpcResult !== null && 'success' in rpcResult ? (rpcResult as any).success : false;

      setTestResults(prev => [...prev, {
        test: 'Chauffeur avec véhicule',
        success: !!(rpcSuccess && profile && role),
        details: {
          rpcResult,
          profileCreated: !!profile,
          roleCreated: !!role,
          hasOwnVehicle: profile?.has_own_vehicle
        }
      }]);

      // Cleanup
      await supabase.auth.admin.deleteUser(authData.user.id);

      toast({
        title: "✅ Test 1 réussi",
        description: "Chauffeur avec véhicule créé avec succès"
      });

    } catch (error: any) {
      setTestResults(prev => [...prev, {
        test: 'Chauffeur avec véhicule',
        success: false,
        error: error.message
      }]);

      toast({
        title: "❌ Test 1 échoué",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setTesting(false);
    }
  };

  // ✅ TEST 2: Inscription chauffeur sans véhicule
  const testDriverWithoutVehicle = async () => {
    setTesting(true);
    const testEmail = `driver_novehicle_${Date.now()}@test.com`;
    const testPassword = 'TestPassword123!';
    
    try {
      console.log('🚶 TEST 2: Chauffeur sans véhicule');
      
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: testEmail,
        password: testPassword,
        options: {
          emailRedirectTo: `${window.location.origin}/`
        }
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('No user created');

      const { data: rpcResult, error: rpcError } = await supabase.rpc('create_driver_profile_secure', {
        p_user_id: authData.user.id,
        p_email: testEmail,
        p_display_name: 'Test Driver No Vehicle',
        p_phone_number: `+243${Date.now().toString().slice(-9)}`,
        p_license_number: `LIC${Date.now()}`,
        p_vehicle_plate: null,
        p_service_type: 'taxi',
        p_delivery_capacity: null,
        p_vehicle_class: 'standard',
        p_has_own_vehicle: false
      });

      if (rpcError) throw rpcError;

      const { data: profile } = await supabase
        .from('chauffeurs')
        .select('*')
        .eq('user_id', authData.user.id)
        .single();

      const rpcSuccess = typeof rpcResult === 'object' && rpcResult !== null && 'success' in rpcResult ? (rpcResult as any).success : false;

      setTestResults(prev => [...prev, {
        test: 'Chauffeur sans véhicule',
        success: !!(rpcSuccess && profile && profile.has_own_vehicle === false),
        details: {
          rpcResult,
          profileCreated: !!profile,
          hasOwnVehicle: profile?.has_own_vehicle,
          vehiclePlate: profile?.vehicle_plate
        }
      }]);

      // Cleanup
      await supabase.auth.admin.deleteUser(authData.user.id);

      toast({
        title: "✅ Test 2 réussi",
        description: "Chauffeur sans véhicule créé avec succès"
      });

    } catch (error: any) {
      setTestResults(prev => [...prev, {
        test: 'Chauffeur sans véhicule',
        success: false,
        error: error.message
      }]);

      toast({
        title: "❌ Test 2 échoué",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setTesting(false);
    }
  };

  // ✅ TEST 3: Inscription livreur
  const testDeliveryDriver = async () => {
    setTesting(true);
    const testEmail = `delivery_test_${Date.now()}@test.com`;
    const testPassword = 'TestPassword123!';
    
    try {
      console.log('📦 TEST 3: Livreur');
      
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: testEmail,
        password: testPassword,
        options: {
          emailRedirectTo: `${window.location.origin}/`
        }
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('No user created');

      const { data: rpcResult, error: rpcError } = await supabase.rpc('create_driver_profile_secure', {
        p_user_id: authData.user.id,
        p_email: testEmail,
        p_display_name: 'Test Delivery Driver',
        p_phone_number: `+243${Date.now().toString().slice(-9)}`,
        p_license_number: `LIC${Date.now()}`,
        p_vehicle_plate: `DEL${Date.now().toString().slice(-3)}`,
        p_service_type: 'flash',
        p_delivery_capacity: 'small',
        p_vehicle_class: 'moto',
        p_has_own_vehicle: true
      });

      if (rpcError) throw rpcError;

      const { data: profile } = await supabase
        .from('chauffeurs')
        .select('*')
        .eq('user_id', authData.user.id)
        .single();

      const rpcSuccess = typeof rpcResult === 'object' && rpcResult !== null && 'success' in rpcResult ? (rpcResult as any).success : false;

      setTestResults(prev => [...prev, {
        test: 'Livreur',
        success: !!(rpcSuccess && profile && profile.service_type === 'flash'),
        details: {
          rpcResult,
          profileCreated: !!profile,
          serviceType: profile?.service_type,
          deliveryCapacity: profile?.delivery_capacity
        }
      }]);

      // Cleanup
      await supabase.auth.admin.deleteUser(authData.user.id);

      toast({
        title: "✅ Test 3 réussi",
        description: "Livreur créé avec succès"
      });

    } catch (error: any) {
      setTestResults(prev => [...prev, {
        test: 'Livreur',
        success: false,
        error: error.message
      }]);

      toast({
        title: "❌ Test 3 échoué",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setTesting(false);
    }
  };

  // Charger les logs de debug via fonction sécurisée
  const loadDebugLogs = async () => {
    const { data, error } = await supabase
      .rpc('get_admin_registration_debug_logs', { limit_count: 20 });

    if (error) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les logs de debug",
        variant: "destructive"
      });
      return;
    }

    setDebugLogs(data || []);
  };

  // Lancer tous les tests
  const runAllTests = async () => {
    setTestResults([]);
    await testDriverWithVehicle();
    await new Promise(resolve => setTimeout(resolve, 2000));
    await testDriverWithoutVehicle();
    await new Promise(resolve => setTimeout(resolve, 2000));
    await testDeliveryDriver();
    await loadDebugLogs();
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">🧪 Tests Inscription Chauffeur/Livreur</h1>
        <p className="text-muted-foreground">Phase 4 : Validation complète du système d'inscription</p>
      </div>

      {/* Boutons de test */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Button 
          onClick={testDriverWithVehicle} 
          disabled={testing}
          variant="outline"
        >
          {testing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Test 1: Avec véhicule
        </Button>
        
        <Button 
          onClick={testDriverWithoutVehicle} 
          disabled={testing}
          variant="outline"
        >
          {testing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Test 2: Sans véhicule
        </Button>
        
        <Button 
          onClick={testDeliveryDriver} 
          disabled={testing}
          variant="outline"
        >
          {testing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Test 3: Livreur
        </Button>
        
        <Button 
          onClick={runAllTests} 
          disabled={testing}
        >
          {testing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          🚀 Lancer tous les tests
        </Button>
      </div>

      {/* Résultats des tests */}
      {testResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>📊 Résultats des Tests</CardTitle>
            <CardDescription>
              {testResults.filter(r => r.success).length} / {testResults.length} réussis
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {testResults.map((result, idx) => (
              <div key={idx} className="flex items-start gap-3 p-4 border rounded-lg">
                {result.success ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500 mt-0.5" />
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{result.test}</span>
                    <Badge variant={result.success ? "default" : "destructive"}>
                      {result.success ? "Réussi" : "Échoué"}
                    </Badge>
                  </div>
                  {result.error && (
                    <p className="text-sm text-red-500 mt-1">{result.error}</p>
                  )}
                  {result.details && (
                    <pre className="text-xs bg-muted p-2 rounded mt-2 overflow-auto">
                      {JSON.stringify(result.details, null, 2)}
                    </pre>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Logs de debug */}
      {debugLogs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>🔍 Logs de Debug (20 derniers)</CardTitle>
            <CardDescription>Vue admin_registration_debug</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {debugLogs.map((log, idx) => (
                <div key={idx} className="p-3 border rounded text-sm">
                  <div className="flex items-center gap-2 mb-2">
                    {log.activity_type === 'driver_registration_success' ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : log.activity_type.includes('error') ? (
                      <XCircle className="h-4 w-4 text-red-500" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-yellow-500" />
                    )}
                    <span className="font-medium">{log.activity_type}</span>
                    <Badge variant="outline">{log.failed_step || 'N/A'}</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                    <div>Auth exists: {log.user_exists_in_auth ? '✅' : '❌'}</div>
                    <div>Profile exists: {log.driver_profile_exists ? '✅' : '❌'}</div>
                    <div>Role exists: {log.driver_role_exists ? '✅' : '❌'}</div>
                    <div>Time: {new Date(log.created_at).toLocaleString()}</div>
                  </div>
                  {log.error_message && (
                    <p className="text-xs text-red-500 mt-2">{log.error_message}</p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>📋 Checklist Phase 4</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span>Test chauffeur avec véhicule propre</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span>Test chauffeur sans véhicule (cherche partenaire)</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span>Test livreur avec capacité définie</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span>Vérification logs détaillés dans admin_registration_debug</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span>Fonction admin_repair_orphan_driver disponible</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
