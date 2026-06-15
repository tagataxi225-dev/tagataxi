import React from 'react';
import { useDispatcherTests } from '@/hooks/useDispatcherTests';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  PlayCircle, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  Clock,
  ChevronDown,
  AlertTriangle,
  Info
} from 'lucide-react';

const DispatcherValidation = () => {
  const { results, isRunning, runAllTests } = useDispatcherTests();

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'running':
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
      default:
        return <Clock className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      success: 'bg-green-500/10 text-green-500 border-green-500/20',
      error: 'bg-red-500/10 text-red-500 border-red-500/20',
      running: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
      pending: 'bg-muted text-muted-foreground'
    };
    return variants[status] || variants.pending;
  };

  const successCount = results.filter(r => r.status === 'success').length;
  const errorCount = results.filter(r => r.status === 'error').length;
  const totalTests = results.length;

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Tests Automatisés Dispatcher</h1>
        <p className="text-muted-foreground">
          Validation complète du système de dispatch taxi & livraison
        </p>
      </div>

      <Alert className="mb-6 border-blue-500/20 bg-blue-500/5">
        <Info className="h-4 w-4 text-blue-500" />
        <AlertDescription className="text-sm">
          <strong>Prérequis:</strong> Au moins 1 chauffeur doit être en ligne avec des crédits disponibles.
          Connectez-vous comme chauffeur sur <code className="px-1 py-0.5 bg-muted rounded">/app/driver</code> avant de lancer les tests.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTests}</div>
            <p className="text-xs text-muted-foreground">tests configurés</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Réussis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{successCount}</div>
            <p className="text-xs text-muted-foreground">validations OK</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Échecs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{errorCount}</div>
            <p className="text-xs text-muted-foreground">erreurs détectées</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Taux</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalTests > 0 ? Math.round((successCount / totalTests) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">de succès</p>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Exécution des Tests
            <Button 
              onClick={runAllTests} 
              disabled={isRunning}
              size="lg"
            >
              {isRunning ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Tests en cours...
                </>
              ) : (
                <>
                  <PlayCircle className="mr-2 h-4 w-4" />
                  Lancer tous les tests
                </>
              )}
            </Button>
          </CardTitle>
          <CardDescription>
            Validation automatique de toutes les fonctionnalités critiques
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px] pr-4">
            <div className="space-y-3">
              {results.map((result, index) => (
                <Collapsible key={index}>
                  <Card className={`border-l-4 transition-all ${
                    result.status === 'success' ? 'border-l-green-500' :
                    result.status === 'error' ? 'border-l-red-500' :
                    result.status === 'running' ? 'border-l-blue-500' :
                    'border-l-muted'
                  }`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {getStatusIcon(result.status)}
                          <div>
                            <CardTitle className="text-base">
                              {index + 1}. {result.name}
                            </CardTitle>
                            {result.message && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {result.message}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {result.duration && (
                            <Badge variant="outline" className="text-xs">
                              {result.duration}ms
                            </Badge>
                          )}
                          <Badge className={getStatusBadge(result.status)}>
                            {result.status}
                          </Badge>
                          {result.details && (
                            <CollapsibleTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <ChevronDown className="h-4 w-4" />
                              </Button>
                            </CollapsibleTrigger>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    {result.details && (
                      <CollapsibleContent>
                        <CardContent className="pt-0">
                          <pre className="text-xs bg-muted p-3 rounded-lg overflow-x-auto">
                            {JSON.stringify(result.details, null, 2)}
                          </pre>
                        </CardContent>
                      </CollapsibleContent>
                    )}
                  </Card>
                </Collapsible>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {errorCount > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>{errorCount} test(s) échoué(s).</strong> Consultez les détails ci-dessus pour corriger les problèmes.
          </AlertDescription>
        </Alert>
      )}

      {successCount === totalTests && totalTests > 0 && (
        <Alert className="border-green-500/20 bg-green-500/5">
          <CheckCircle2 className="h-4 w-4 text-green-500" />
          <AlertDescription className="text-green-500">
            <strong>Tous les tests réussis!</strong> Le système dispatcher est pleinement opérationnel et sécurisé.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default DispatcherValidation;
