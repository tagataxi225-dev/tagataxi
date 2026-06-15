import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { CheckCircle2, XCircle, AlertCircle, Loader2 } from 'lucide-react';

interface TestResult {
  name: string;
  status: 'pending' | 'success' | 'error' | 'warning';
  message: string;
  details?: any;
}

export const RLSTestingPanel = () => {
  const { user } = useAuth();
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);

  const runRLSTests = async () => {
    if (!user) {
      toast.error('Vous devez être connecté pour tester les RLS');
      return;
    }

    setTesting(true);
    setResults([]);
    const testResults: TestResult[] = [];

    // Test 1: Vérifier l'accès aux conversations marketplace
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .limit(5);
      
      testResults.push({
        name: 'conversations - Lecture',
        status: error ? 'error' : 'success',
        message: error 
          ? `Erreur: ${error.message}` 
          : `${data?.length || 0} conversations accessibles`,
        details: error || data
      });
    } catch (err: any) {
      testResults.push({
        name: 'conversations - Lecture',
        status: 'error',
        message: err.message
      });
    }

    // Test 2: Vérifier l'accès aux messages de livraison
    try {
      const { data, error } = await supabase
        .from('delivery_chat_messages')
        .select('*')
        .limit(5);
      
      testResults.push({
        name: 'delivery_chat_messages - Lecture',
        status: error ? 'error' : 'success',
        message: error 
          ? `Erreur: ${error.message}` 
          : `${data?.length || 0} messages accessibles`,
        details: error || data
      });
    } catch (err: any) {
      testResults.push({
        name: 'delivery_chat_messages - Lecture',
        status: 'error',
        message: err.message
      });
    }

    // Test 4: Vérifier l'accès aux bookings transport
    try {
      const { data, error } = await supabase
        .from('transport_bookings')
        .select('id, user_id, driver_id, status')
        .limit(5);
      
      testResults.push({
        name: 'transport_bookings - Lecture',
        status: error ? 'error' : 'success',
        message: error 
          ? `Erreur: ${error.message}` 
          : `${data?.length || 0} bookings accessibles`,
        details: error || data
      });
    } catch (err: any) {
      testResults.push({
        name: 'transport_bookings - Lecture',
        status: 'error',
        message: err.message
      });
    }

    // Test 5: Vérifier l'accès aux delivery_orders
    try {
      const { data, error } = await supabase
        .from('delivery_orders')
        .select('id, user_id, driver_id, status')
        .limit(5);
      
      testResults.push({
        name: 'delivery_orders - Lecture',
        status: error ? 'error' : 'success',
        message: error 
          ? `Erreur: ${error.message}` 
          : `${data?.length || 0} livraisons accessibles`,
        details: error || data
      });
    } catch (err: any) {
      testResults.push({
        name: 'delivery_orders - Lecture',
        status: 'error',
        message: err.message
      });
    }

    // Test 6: Vérifier les profils chauffeur
    try {
      const { data, error } = await supabase
        .from('chauffeurs')
        .select('id, user_id, display_name, phone_number')
        .limit(5);
      
      const status = error 
        ? 'error' 
        : data?.some(d => d.phone_number) 
          ? 'warning' 
          : 'success';

      testResults.push({
        name: 'chauffeurs - Sécurité données sensibles',
        status,
        message: error 
          ? `Erreur: ${error.message}` 
          : data?.some(d => d.phone_number)
            ? '⚠️ Données sensibles visibles (phone_number)'
            : 'Données sensibles protégées',
        details: error || data
      });
    } catch (err: any) {
      testResults.push({
        name: 'chauffeurs - Sécurité données sensibles',
        status: 'error',
        message: err.message
      });
    }

    // Test 7: Vérifier l'accès admin
    try {
      const { data, error } = await supabase
        .from('admins')
        .select('*')
        .limit(1);
      
      testResults.push({
        name: 'admins - Protection accès',
        status: error ? 'success' : 'warning',
        message: error 
          ? 'Accès refusé (normal pour non-admin)' 
          : '⚠️ Accès admin autorisé',
        details: error || data
      });
    } catch (err: any) {
      testResults.push({
        name: 'admins - Protection accès',
        status: 'success',
        message: 'Accès correctement refusé'
      });
    }

    setResults(testResults);
    setTesting(false);

    const errorCount = testResults.filter(r => r.status === 'error').length;
    const warningCount = testResults.filter(r => r.status === 'warning').length;

    if (errorCount === 0 && warningCount === 0) {
      toast.success('Tous les tests RLS sont passés avec succès');
    } else if (errorCount > 0) {
      toast.error(`${errorCount} test(s) en erreur, ${warningCount} avertissement(s)`);
    } else {
      toast.warning(`${warningCount} avertissement(s) détecté(s)`);
    }
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-destructive" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      default:
        return <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <Badge variant="outline" className="bg-green-500/10 text-green-700 border-green-500/20">Réussi</Badge>;
      case 'error':
        return <Badge variant="destructive">Erreur</Badge>;
      case 'warning':
        return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-700 border-yellow-500/20">Attention</Badge>;
      default:
        return <Badge variant="outline">En attente</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Tests RLS - Sécurité des données</span>
          <Button 
            onClick={runRLSTests} 
            disabled={testing || !user}
            size="sm"
          >
            {testing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Tests en cours...
              </>
            ) : (
              'Lancer les tests'
            )}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!user && (
          <div className="text-center py-8 text-muted-foreground">
            Connectez-vous pour tester les RLS policies
          </div>
        )}

        {user && results.length === 0 && !testing && (
          <div className="text-center py-8 text-muted-foreground">
            Cliquez sur "Lancer les tests" pour vérifier les RLS policies
          </div>
        )}

        {results.length > 0 && (
          <div className="space-y-3">
            <div className="flex gap-4 mb-4">
              <Badge variant="outline" className="bg-green-500/10 text-green-700 border-green-500/20">
                {results.filter(r => r.status === 'success').length} Réussis
              </Badge>
              <Badge variant="outline" className="bg-yellow-500/10 text-yellow-700 border-yellow-500/20">
                {results.filter(r => r.status === 'warning').length} Avertissements
              </Badge>
              <Badge variant="destructive">
                {results.filter(r => r.status === 'error').length} Erreurs
              </Badge>
            </div>

            {results.map((result, index) => (
              <div 
                key={index}
                className="p-4 rounded-lg border bg-card"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1">
                    {getStatusIcon(result.status)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-sm">{result.name}</p>
                        {getStatusBadge(result.status)}
                      </div>
                      <p className="text-sm text-muted-foreground">{result.message}</p>
                      {result.details && (
                        <details className="mt-2">
                          <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                            Détails techniques
                          </summary>
                          <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-auto max-h-32">
                            {JSON.stringify(result.details, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
