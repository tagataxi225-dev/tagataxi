import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, XCircle, Clock, Zap, MapPin, Car, Package } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface TestResult {
  success: boolean;
  test_name: string;
  duration_ms: number;
  performance_pass: boolean;
  results: any;
  timestamp: string;
}

interface TestStep {
  name: string;
  duration_ms: number;
  success: boolean;
  [key: string]: any;
}

export const TestSuite = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);
  const [currentTest, setCurrentTest] = useState<string>('');
  const { toast } = useToast();

  const runTest = async (testType: string, testName: string, payload: any) => {
    setIsRunning(true);
    setCurrentTest(testName);

    try {
      const { data, error } = await supabase.functions.invoke('e2e-tests', {
        body: {
          scenario: {
            name: testName,
            type: testType,
            payload: payload,
            expected_duration_ms: 2000
          }
        }
      });

      if (error) throw error;

      setResults(prev => [data, ...prev]);
      
      toast({
        title: data.success ? "Test réussi ✅" : "Test échoué ❌",
        description: `${testName} terminé en ${data.duration_ms}ms`,
        variant: data.success ? "default" : "destructive"
      });

    } catch (error) {
      console.error('Test error:', error);
      toast({
        title: "Erreur de test",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsRunning(false);
      setCurrentTest('');
    }
  };

  const runAllTests = async () => {
    const tests = [
      {
        type: 'performance_test',
        name: 'Test de Performance Global',
        payload: { search_query: 'gombe' }
      },
      {
        type: 'taxi_workflow',
        name: 'Workflow Taxi Complet',
        payload: {
          pickup_location: 'Place Victoire, Kinshasa',
          destination: 'Aéroport de Ndjili',
          pickup_coordinates: { lat: -4.3217, lng: 15.3069 },
          delivery_coordinates: { lat: -4.3856, lng: 15.4442 }
        }
      },
      {
        type: 'delivery_workflow',
        name: 'Workflow Livraison avec Géolocalisation',
        payload: {
          pickup_location: 'Marché Central, Kinshasa',
          delivery_location: 'Gombe, Kinshasa',
          pickup_coordinates: { lat: -4.3217, lng: 15.3069 },
          delivery_coordinates: { lat: -4.3095, lng: 15.3074 }
        }
      }
    ];

    for (const test of tests) {
      await runTest(test.type, test.name, test.payload);
      // Attendre un peu entre les tests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  };

  const getTestIcon = (testName: string) => {
    if (testName.includes('Performance')) return <Zap className="h-4 w-4" />;
    if (testName.includes('Taxi')) return <Car className="h-4 w-4" />;
    if (testName.includes('Livraison')) return <Package className="h-4 w-4" />;
    return <CheckCircle className="h-4 w-4" />;
  };

  const getPerformanceColor = (duration: number) => {
    if (duration < 1000) return 'text-green-600';
    if (duration < 2000) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Phase 6 - Tests et Optimisation</h2>
          <p className="text-muted-foreground">
            Tests end-to-end du système VTC multimodal
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button
            onClick={() => runTest('performance_test', 'Test de Performance', { search_query: 'gombe' })}
            disabled={isRunning}
            variant="outline"
          >
            <Zap className="h-4 w-4 mr-2" />
            Performance
          </Button>
          
          <Button
            onClick={() => runTest('taxi_workflow', 'Test Taxi', {
              pickup_location: 'Place Victoire',
              destination: 'Aéroport Ndjili'
            })}
            disabled={isRunning}
            variant="outline"
          >
            <Car className="h-4 w-4 mr-2" />
            Taxi
          </Button>
          
          <Button
            onClick={() => runTest('delivery_workflow', 'Test Livraison', {
              pickup_location: 'Marché Central',
              delivery_location: 'Gombe'
            })}
            disabled={isRunning}
            variant="outline"
          >
            <Package className="h-4 w-4 mr-2" />
            Livraison
          </Button>
          
          <Button
            onClick={runAllTests}
            disabled={isRunning}
          >
            {isRunning ? (
              <>
                <Clock className="h-4 w-4 mr-2 animate-spin" />
                En cours...
              </>
            ) : (
              'Lancer tous les tests'
            )}
          </Button>
        </div>
      </div>

      {isRunning && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-4">
              <Clock className="h-5 w-5 animate-spin" />
              <div className="flex-1">
                <p className="font-medium">Test en cours</p>
                <p className="text-sm text-muted-foreground">{currentTest}</p>
              </div>
            </div>
            <Progress value={50} className="mt-4" />
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {results.map((result, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <div className="flex items-center space-x-2">
                {getTestIcon(result.test_name)}
                <CardTitle className="text-lg">{result.test_name}</CardTitle>
              </div>
              
              <div className="flex items-center space-x-2">
                <Badge variant={result.success ? "default" : "destructive"}>
                  {result.success ? "RÉUSSI" : "ÉCHOUÉ"}
                </Badge>
                <Badge 
                  variant={result.performance_pass ? "secondary" : "outline"}
                  className={getPerformanceColor(result.duration_ms)}
                >
                  {result.duration_ms}ms
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent>
              <CardDescription className="mb-4">
                Exécuté le {new Date(result.timestamp).toLocaleString('fr-FR')}
              </CardDescription>
              
              {result.results.steps && (
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Étapes du test :</h4>
                  <div className="grid gap-2">
                    {result.results.steps.map((step: TestStep, stepIndex: number) => (
                      <div key={stepIndex} className="flex items-center justify-between p-2 bg-muted rounded text-sm">
                        <div className="flex items-center space-x-2">
                          {step.success ? (
                            <CheckCircle className="h-3 w-3 text-green-600" />
                          ) : (
                            <XCircle className="h-3 w-3 text-red-600" />
                          )}
                          <span>{step.name.replace(/_/g, ' ')}</span>
                        </div>
                        <span className={getPerformanceColor(step.duration_ms)}>
                          {step.duration_ms}ms
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {result.results.metrics && (
                <div className="mt-4">
                  <h4 className="font-medium text-sm mb-2">Métriques de performance :</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {Object.entries(result.results.metrics).map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span>{key.replace(/_/g, ' ')}:</span>
                        <span className={getPerformanceColor(Number(value))}>
                          {String(value)}ms
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {result.results.errors && result.results.errors.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-medium text-sm text-red-600 mb-2">Erreurs :</h4>
                  <div className="space-y-1">
                    {result.results.errors.map((error: string, errorIndex: number) => (
                      <p key={errorIndex} className="text-sm text-red-600 bg-red-50 p-2 rounded">
                        {error}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {results.length === 0 && !isRunning && (
        <Card>
          <CardContent className="pt-6 text-center">
            <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              Aucun test exécuté. Lancez des tests pour vérifier les performances du système.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};