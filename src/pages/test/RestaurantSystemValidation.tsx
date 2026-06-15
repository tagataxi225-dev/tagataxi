import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  User, 
  UtensilsCrossed,
  Database,
  Shield,
  Image as ImageIcon,
  FileCheck
} from 'lucide-react';

interface TestResult {
  name: string;
  status: 'pending' | 'success' | 'error';
  message: string;
  details?: any;
}

export default function RestaurantSystemValidation() {
  const { toast } = useToast();
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);

  const updateResult = (name: string, status: 'success' | 'error', message: string, details?: any) => {
    setResults(prev => {
      const existing = prev.find(r => r.name === name);
      if (existing) {
        return prev.map(r => r.name === name ? { name, status, message, details } : r);
      }
      return [...prev, { name, status, message, details }];
    });
  };

  const runTests = async () => {
    setTesting(true);
    setResults([]);

    try {
      // Test 1: Vérifier la table restaurant_profiles
      const { count: profileCount, error: tableError } = await supabase
        .from('restaurant_profiles')
        .select('*', { count: 'exact', head: true });

      if (tableError) {
        updateResult('table', 'error', 'Erreur d\'accès à la table', tableError);
      } else {
        updateResult('table', 'success', `✅ Table accessible (${profileCount} restaurants)`);
      }

      // Test 2: Vérifier la table food_products
      const { count: productCount, error: productError } = await supabase
        .from('food_products')
        .select('*', { count: 'exact', head: true });

      if (productError) {
        updateResult('products', 'error', 'Erreur d\'accès aux produits', productError);
      } else {
        updateResult('products', 'success', `✅ Table food_products accessible (${productCount} plats)`);
      }

      // Test 3: Vérifier le bucket de storage
      const { data: buckets, error: bucketError } = await supabase
        .storage
        .listBuckets();

      if (bucketError) {
        updateResult('storage', 'error', 'Impossible de lister les buckets', bucketError);
      } else {
        const bucket = buckets.find(b => b.name === 'restaurant_products');
        if (bucket) {
          updateResult('storage', 'success', '✅ Bucket restaurant_products existe');
        } else {
          updateResult('storage', 'error', '❌ Bucket restaurant_products manquant');
        }
      }

      // Test 4: Vérifier les rôles utilisateurs
      const { count: rolesCount, error: rolesError } = await supabase
        .from('user_roles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'restaurant');

      if (rolesError) {
        updateResult('roles', 'error', 'Erreur d\'accès aux rôles', rolesError);
      } else {
        updateResult('roles', 'success', `✅ Table user_roles accessible (${rolesCount} restaurants)`);
      }

      // Test 5: Tester l'accès à un restaurant spécifique
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile, error: profileError } = await supabase
          .from('restaurant_profiles')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (profileError) {
          updateResult('profile', 'error', 'Erreur de lecture du profil', profileError);
        } else if (profile) {
          updateResult('profile', 'success', `✅ Profil restaurant trouvé: ${profile.restaurant_name}`);
        } else {
          updateResult('profile', 'success', '✅ Aucun profil restaurant (normal si non connecté comme resto)');
        }
      }

      // Test 6: Vérifier les catégories de plats
      const { data: categories, error: catError } = await supabase
        .from('food_products')
        .select('category')
        .limit(1);

      if (catError) {
        updateResult('categories', 'error', 'Erreur de lecture des catégories', catError);
      } else {
        updateResult('categories', 'success', '✅ Catégories de plats accessibles');
      }

      toast({
        title: '✅ Tests terminés',
        description: 'Tous les tests ont été exécutés',
      });

    } catch (error: any) {
      toast({
        title: '❌ Erreur lors des tests',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setTesting(false);
    }
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'pending':
        return <Loader2 className="h-5 w-5 animate-spin text-blue-600" />;
    }
  };

  const getTestIcon = (name: string) => {
    switch (name) {
      case 'table':
      case 'products':
      case 'categories':
        return <UtensilsCrossed className="h-5 w-5" />;
      case 'storage':
        return <ImageIcon className="h-5 w-5" />;
      case 'roles':
      case 'profile':
        return <User className="h-5 w-5" />;
      default:
        return <FileCheck className="h-5 w-5" />;
    }
  };

  const successCount = results.filter(r => r.status === 'success').length;
  const errorCount = results.filter(r => r.status === 'error').length;

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2">
                <UtensilsCrossed className="h-6 w-6" />
                Validation Système Restaurant
              </CardTitle>
              <CardDescription>
                Tests complets de l'espace restaurant et food delivery
              </CardDescription>
            </div>
            <Button 
              onClick={runTests} 
              disabled={testing}
              size="lg"
            >
              {testing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Tests en cours...
                </>
              ) : (
                'Lancer les tests'
              )}
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Summary */}
          {results.length > 0 && (
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold">{results.length}</div>
                    <div className="text-sm text-muted-foreground">Total tests</div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600">{successCount}</div>
                    <div className="text-sm text-muted-foreground">Succès</div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-red-600">{errorCount}</div>
                    <div className="text-sm text-muted-foreground">Erreurs</div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Test Results */}
          <div className="space-y-3">
            {results.map((result, index) => (
              <Card key={index}>
                <CardContent className="pt-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-muted">
                      {getTestIcon(result.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <h3 className="font-medium">{result.name}</h3>
                        {getStatusIcon(result.status)}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {result.message}
                      </p>
                      {result.details && (
                        <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-x-auto">
                          {JSON.stringify(result.details, null, 2)}
                        </pre>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {results.length === 0 && !testing && (
            <div className="text-center py-12">
              <FileCheck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-medium">Aucun test exécuté</p>
              <p className="text-sm text-muted-foreground mt-2">
                Cliquez sur "Lancer les tests" pour commencer
              </p>
            </div>
          )}

          {/* Test Instructions */}
          <Card className="border-orange-500/50 bg-orange-50 dark:bg-orange-950/20">
            <CardHeader>
              <CardTitle className="text-lg">📋 Tests manuels recommandés</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <Badge variant="outline">1</Badge>
                  <div>
                    <strong>Inscription restaurant :</strong> Aller sur /restaurant/auth et créer un nouveau compte
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Badge variant="outline">2</Badge>
                  <div>
                    <strong>Ajout de plat :</strong> Vérifier que la modale est scrollable sur mobile
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Badge variant="outline">3</Badge>
                  <div>
                    <strong>Validation formulaire :</strong> Tester les validations (nom court, prix négatif, etc.)
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Badge variant="outline">4</Badge>
                  <div>
                    <strong>Upload images :</strong> Ajouter 3 photos et vérifier l'affichage
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Badge variant="outline">5</Badge>
                  <div>
                    <strong>Modération :</strong> Valider un plat depuis l'admin et vérifier le changement de statut
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
}
