import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface TestResult {
  name: string;
  status: 'pending' | 'success' | 'error' | 'warning';
  message: string;
  data?: any;
}

interface SubscriptionData {
  id: string;
  vendor_id: string;
  subscriber_id: string;
  is_active: boolean;
  created_at: string;
}

export default function VendorShopTestPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);
  const vendorId = 'c9ee2b59-2c9b-4bf5-833d-3473cc1aba71';

  const addResult = (result: TestResult) => {
    setResults(prev => [...prev, result]);
  };

  const testVendorRating = async () => {
    addResult({ name: 'Test Notation Vendeur', status: 'pending', message: 'Vérification en cours...' });

    try {
      // 1. Vérifier les ratings existants
      const { data: existingRatings, error: fetchError } = await supabase
        .from('marketplace_ratings')
        .select('*')
        .eq('seller_id', vendorId)
        .is('order_id', null);

      if (fetchError) throw fetchError;

      addResult({
        name: 'Ratings existants',
        status: 'success',
        message: `${existingRatings?.length || 0} notation(s) directe(s) trouvée(s)`,
        data: existingRatings
      });

      // 2. Vérifier le profil vendeur
      const { data: vendorProfile, error: profileError } = await supabase
        .from('vendor_profiles')
        .select('user_id, average_rating, shop_name')
        .eq('user_id', vendorId)
        .single();

      if (profileError) throw profileError;

      addResult({
        name: 'Profil Vendeur',
        status: 'success',
        message: `Note moyenne: ${vendorProfile.average_rating || 0}/5`,
        data: vendorProfile
      });

      // 3. Tester insertion (simulée - nécessite authentification client)
      if (!user) {
        addResult({
          name: 'Test Insertion',
          status: 'warning',
          message: 'Non connecté - impossible de tester l\'insertion'
        });
      } else {
        // Vérifier si l'utilisateur a déjà noté récemment
        const { data: recentRating } = await supabase
          .from('marketplace_ratings')
          .select('created_at')
          .eq('buyer_id', user.id)
          .eq('seller_id', vendorId)
          .is('order_id', null)
          .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
          .maybeSingle();

        if (recentRating) {
          addResult({
            name: 'Protection Anti-Spam',
            status: 'success',
            message: 'Notation déjà effectuée dans les 30 derniers jours (protection active)'
          });
        } else {
          addResult({
            name: 'Prêt pour Notation',
            status: 'success',
            message: 'Aucune notation récente - peut noter le vendeur'
          });
        }
      }

      toast.success('Test notation terminé');
    } catch (error: any) {
      addResult({
        name: 'Erreur Test Notation',
        status: 'error',
        message: error.message
      });
      toast.error('Erreur lors du test');
    }
  };

  const testVendorSubscription = async () => {
    addResult({ name: 'Test Abonnement', status: 'pending', message: 'Vérification en cours...' });

    try {
      if (!user) {
        addResult({
          name: 'Test Abonnement',
          status: 'warning',
          message: 'Non connecté - impossible de tester l\'abonnement'
        });
        return;
      }

      // 1. Vérifier les abonnements existants
      const { data, error } = await supabase
        .from('vendor_subscriptions')
        .select('id, vendor_id, subscriber_id, is_active, created_at')
        .eq('vendor_id', vendorId)
        .eq('subscriber_id', user.id);

      if (error) throw error;

      const subscriptions = (data as unknown as SubscriptionData[]) || [];

      addResult({
        name: 'Abonnements existants',
        status: 'success',
        message: `${subscriptions.length} abonnement(s) trouvé(s)`,
        data: subscriptions
      });

      // 2. Vérifier l'abonnement actif
      const activeSubscription = subscriptions.find((s: any) => s.is_active === true);
      
      if (activeSubscription) {
        addResult({
          name: 'Statut Abonnement',
          status: 'success',
          message: 'Utilisateur abonné à ce vendeur'
        });
      } else {
        addResult({
          name: 'Statut Abonnement',
          status: 'success',
          message: 'Non abonné - peut s\'abonner'
        });
      }

      toast.success('Test abonnement terminé');
    } catch (error: any) {
      addResult({
        name: 'Erreur Test Abonnement',
        status: 'error',
        message: error.message
      });
      toast.error('Erreur lors du test');
    }
  };

  const testAdminAccess = async () => {
    addResult({ name: 'Test Accès Admin', status: 'pending', message: 'Vérification en cours...' });

    try {
      if (!user) {
        addResult({
          name: 'Authentification',
          status: 'error',
          message: 'Non connecté'
        });
        return;
      }

      // Vérifier le rôle admin
      const { data: userRoles, error: roleError } = await supabase
        .from('user_roles')
        .select('role, admin_role, is_active')
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (roleError) throw roleError;

      const hasAdminRole = userRoles?.some(r => r.role === 'admin');

      addResult({
        name: 'Rôles Utilisateur',
        status: hasAdminRole ? 'success' : 'warning',
        message: hasAdminRole 
          ? `Rôle admin trouvé: ${userRoles.find(r => r.role === 'admin')?.admin_role || 'N/A'}`
          : 'Pas de rôle admin',
        data: userRoles
      });

      toast.success('Test accès admin terminé');
    } catch (error: any) {
      addResult({
        name: 'Erreur Test Admin',
        status: 'error',
        message: error.message
      });
      toast.error('Erreur lors du test');
    }
  };

  const runAllTests = async () => {
    setLoading(true);
    setResults([]);
    
    await testVendorRating();
    await testVendorSubscription();
    await testAdminAccess();
    
    setLoading(false);
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success': return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'error': return <XCircle className="h-5 w-5 text-red-500" />;
      case 'warning': return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'pending': return <Loader2 className="h-5 w-5 animate-spin text-blue-500" />;
    }
  };

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'success': return 'bg-green-500/10 text-green-700 border-green-200';
      case 'error': return 'bg-red-500/10 text-red-700 border-red-200';
      case 'warning': return 'bg-yellow-500/10 text-yellow-700 border-yellow-200';
      case 'pending': return 'bg-blue-500/10 text-blue-700 border-blue-200';
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>🧪 Page de Test VendorShop</CardTitle>
          <CardDescription>
            Validation des fonctionnalités de notation et d'abonnement vendeur
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            <Button onClick={runAllTests} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Lancer tous les tests
            </Button>
            <Button variant="outline" onClick={testVendorRating} disabled={loading}>
              Test Notation
            </Button>
            <Button variant="outline" onClick={testVendorSubscription} disabled={loading}>
              Test Abonnement
            </Button>
            <Button variant="outline" onClick={testAdminAccess} disabled={loading}>
              Test Admin
            </Button>
          </div>

          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Vendeur testé: <code className="bg-muted px-2 py-1 rounded">{vendorId}</code>
            </p>
            <p className="text-sm text-muted-foreground">
              Utilisateur connecté: <code className="bg-muted px-2 py-1 rounded">{user?.email || 'Non connecté'}</code>
            </p>
          </div>
        </CardContent>
      </Card>

      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>📊 Résultats des Tests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {results.map((result, index) => (
                <div
                  key={index}
                  className={`flex items-start gap-3 p-4 rounded-lg border ${getStatusColor(result.status)}`}
                >
                  <div className="mt-0.5">{getStatusIcon(result.status)}</div>
                  <div className="flex-1 space-y-1">
                    <p className="font-medium">{result.name}</p>
                    <p className="text-sm">{result.message}</p>
                    {result.data && (
                      <details className="mt-2">
                        <summary className="text-xs cursor-pointer text-muted-foreground hover:text-foreground">
                          Voir les données
                        </summary>
                        <pre className="mt-2 text-xs bg-background/50 p-2 rounded overflow-x-auto">
                          {JSON.stringify(result.data, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                  <Badge variant={result.status === 'success' ? 'default' : 'secondary'}>
                    {result.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
