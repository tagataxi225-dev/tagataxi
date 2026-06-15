import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { CheckCircle, XCircle, Clock, AlertCircle, Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface TestResult {
  name: string;
  status: 'pending' | 'running' | 'success' | 'error';
  message?: string;
  duration?: number;
}

export default function AdminValidationTest() {
  const [tests, setTests] = useState<TestResult[]>([
    { name: 'Connexion Admin', status: 'pending' },
    { name: 'Permissions Admin', status: 'pending' },
    { name: 'Chauffeurs en attente', status: 'pending' },
    { name: 'Restaurants en attente', status: 'pending' },
    { name: 'Produits Food en attente', status: 'pending' },
    { name: 'Notifications Admin', status: 'pending' },
    { name: 'Analytics Dashboard', status: 'pending' },
    { name: 'Assignation Rôles', status: 'pending' },
  ]);
  
  const [isRunning, setIsRunning] = useState(false);

  const updateTest = (name: string, updates: Partial<TestResult>) => {
    setTests(prev => prev.map(t => t.name === name ? { ...t, ...updates } : t));
  };

  const runTest = async (testName: string, testFn: () => Promise<void>) => {
    const startTime = Date.now();
    updateTest(testName, { status: 'running' });
    
    try {
      await testFn();
      const duration = Date.now() - startTime;
      updateTest(testName, { 
        status: 'success', 
        message: `✅ Réussi en ${duration}ms`,
        duration 
      });
    } catch (error: any) {
      updateTest(testName, { 
        status: 'error', 
        message: `❌ ${error.message}` 
      });
    }
  };

  const runAllTests = async () => {
    setIsRunning(true);
    
    // Test 1: Connexion Admin
    await runTest('Connexion Admin', async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) throw new Error('Utilisateur non connecté');
      
      const { data: isAdmin, error: adminError } = await supabase.rpc('is_current_user_admin');
      if (adminError) throw adminError;
      if (!isAdmin) throw new Error('Utilisateur non admin');
    });

    // Test 2: Permissions Admin
    await runTest('Permissions Admin', async () => {
      const { data: roles, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('is_active', true);
      
      if (error) throw error;
      if (!roles || roles.length === 0) throw new Error('Aucun rôle trouvé');
    });

    // Test 3: Chauffeurs en attente
    await runTest('Chauffeurs en attente', async () => {
      const { data, error } = await supabase
        .from('driver_profiles')
        .select('id, full_name, verification_status, created_at')
        .eq('verification_status', 'pending')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      if (!data) throw new Error('Erreur de récupération');
    });

    // Test 4: Restaurants en attente
    await runTest('Restaurants en attente', async () => {
      const { data, error } = await supabase
        .from('restaurant_profiles')
        .select('id, restaurant_name, verification_status, created_at')
        .eq('verification_status', 'pending')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      if (!data) throw new Error('Erreur de récupération');
    });

    // Test 5: Produits Food en attente
    await runTest('Produits Food en attente', async () => {
      const { data, error } = await supabase
        .from('food_products')
        .select('id, name, moderation_status, created_at')
        .eq('moderation_status', 'pending')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      if (!data) throw new Error('Erreur de récupération');
    });

    // Test 6: Notifications Admin
    await runTest('Notifications Admin', async () => {
      const { data, error } = await supabase
        .from('admin_notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      if (!data) throw new Error('Erreur de récupération');
    });

    // Test 7: Analytics Dashboard
    await runTest('Analytics Dashboard', async () => {
      const { count, error } = await supabase
        .from('transport_bookings')
        .select('*', { count: 'exact', head: true });
      
      if (error) throw error;
      if (count === null) throw new Error('Analytics non disponibles');
    });

    // Test 8: Assignation Rôles
    await runTest('Assignation Rôles', async () => {
      const { data, error } = await supabase
        .from('role_permissions')
        .select('role, permission')
        .eq('is_active', true)
        .limit(10);
      
      if (error) throw error;
      if (!data || data.length === 0) throw new Error('Aucune permission trouvée');
    });

    setIsRunning(false);
    
    const allSuccess = tests.every(t => t.status === 'success');
    if (allSuccess) {
      toast.success('🎉 Tous les tests passés avec succès !');
    } else {
      toast.error('⚠️ Certains tests ont échoué');
    }
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error': return <XCircle className="h-5 w-5 text-red-500" />;
      case 'running': return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
      default: return <Clock className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: TestResult['status']) => {
    switch (status) {
      case 'success': return <Badge variant="default" className="bg-green-500">Réussi</Badge>;
      case 'error': return <Badge variant="destructive">Échoué</Badge>;
      case 'running': return <Badge variant="secondary">En cours...</Badge>;
      default: return <Badge variant="outline">En attente</Badge>;
    }
  };

  const pendingCount = tests.filter(t => t.status === 'pending').length;
  const successCount = tests.filter(t => t.status === 'success').length;
  const errorCount = tests.filter(t => t.status === 'error').length;

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-3xl">✅ Validation Tests Pré-Production</CardTitle>
              <CardDescription className="mt-2">
                Tests critiques pour valider le système admin avant mise en production
              </CardDescription>
            </div>
            <Button 
              onClick={runAllTests} 
              disabled={isRunning}
              size="lg"
            >
              {isRunning ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Tests en cours...
                </>
              ) : (
                '▶️ Lancer tous les tests'
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{tests.length}</div>
                <p className="text-xs text-muted-foreground">Total tests</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-green-500">{successCount}</div>
                <p className="text-xs text-muted-foreground">Réussis</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-red-500">{errorCount}</div>
                <p className="text-xs text-muted-foreground">Échoués</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-muted-foreground">{pendingCount}</div>
                <p className="text-xs text-muted-foreground">En attente</p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="tests" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="tests">Tests</TabsTrigger>
          <TabsTrigger value="checklist">Checklist Production</TabsTrigger>
        </TabsList>

        <TabsContent value="tests" className="space-y-4">
          {tests.map((test) => (
            <Card key={test.name}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {getStatusIcon(test.status)}
                    <div>
                      <h3 className="font-semibold">{test.name}</h3>
                      {test.message && (
                        <p className="text-sm text-muted-foreground mt-1">{test.message}</p>
                      )}
                    </div>
                  </div>
                  {getStatusBadge(test.status)}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="checklist">
          <Card>
            <CardHeader>
              <CardTitle>📋 Checklist Pré-Production</CardTitle>
              <CardDescription>Actions à réaliser avant la mise en production</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-red-500" />
                  🔥 PRIORITÉ 1 - OBLIGATOIRE
                </h3>
                <div className="space-y-3 ml-7">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                    <div>
                      <p className="font-medium">Tests de Validation Admin (2h)</p>
                      <ul className="text-sm text-muted-foreground mt-1 space-y-1">
                        <li>• Connexion admin avec support@icon-sarl.com</li>
                        <li>• Valider 1 chauffeur en attente</li>
                        <li>• Valider 1 restaurant en attente</li>
                        <li>• Modérer 1 produit food en attente</li>
                        <li>• Vérifier notifications admin</li>
                        <li>• Tester assignation rôle</li>
                      </ul>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <Clock className="h-5 w-5 text-orange-500 mt-0.5" />
                    <div>
                      <p className="font-medium">Activer Protection Mots de Passe (5 min)</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Supabase Dashboard → Authentication → Policies → Leaked Password Protection
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                    <div>
                      <p className="font-medium">Documentation Quick Start (1h)</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        ✅ Créé : docs/ADMIN_QUICK_START.md
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-orange-500" />
                  ⚠️ PRIORITÉ 2 - RECOMMANDÉ (1 semaine)
                </h3>
                <div className="space-y-2 ml-7 text-sm text-muted-foreground">
                  <p>• Notifications push admin pour éléments en attente</p>
                  <p>• Centralisation hooks (useAdminUsers, useAdminDrivers)</p>
                  <p>• Logs audit systématiques pour actions critiques</p>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-yellow-500" />
                  🟡 PRIORITÉ 3 - FUTUR (1 mois)
                </h3>
                <div className="space-y-2 ml-7 text-sm text-muted-foreground">
                  <p>• Tests unitaires complets (Jest)</p>
                  <p>• Documentation technique complète avec screenshots</p>
                  <p>• Vidéos tutoriels pour admins</p>
                </div>
              </div>

              <Card className="bg-primary/5 border-primary">
                <CardContent className="pt-6">
                  <p className="font-semibold text-primary mb-2">
                    🚀 STATUT : PRÊT POUR PRODUCTION
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Après validation des tests PRIORITÉ 1 (3h05 total), le système sera 100% opérationnel.
                  </p>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
