import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useProductModerationDiagnostics } from '@/hooks/useProductModerationDiagnostics';
import { 
  Shield, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  RefreshCw, 
  Play,
  Package,
  Clock,
  FileCheck,
  FileX
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';

export const ProductModerationDiagnostics = () => {
  const { stats, loading, checking, fetchStats, testProductCreation } = useProductModerationDiagnostics();

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <RefreshCw className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  const hasIssues = !stats?.rlsEnabled || !stats?.insertPolicyExists;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            Diagnostic de Modération
          </h2>
          <p className="text-muted-foreground mt-1">
            État du système de création et modération de produits
          </p>
        </div>
        <Button onClick={fetchStats} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualiser
        </Button>
      </div>

      {/* Statistiques principales */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Produits</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalProducts || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Attente</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats?.pendingProducts || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approuvés</CardTitle>
            <FileCheck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats?.approvedProducts || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejetés</CardTitle>
            <FileX className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats?.rejectedProducts || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* État du système */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            État des Permissions RLS
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {stats?.rlsEnabled ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
              <span className="font-medium">Row Level Security (RLS)</span>
            </div>
            <Badge variant={stats?.rlsEnabled ? 'default' : 'destructive'}>
              {stats?.rlsEnabled ? 'Activé' : 'Désactivé'}
            </Badge>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {stats?.insertPolicyExists ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
              <span className="font-medium">Politique INSERT pour vendeurs</span>
            </div>
            <Badge variant={stats?.insertPolicyExists ? 'default' : 'destructive'}>
              {stats?.insertPolicyExists ? 'Configurée' : 'Manquante'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Alertes si problèmes */}
      {hasIssues && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Problèmes détectés</AlertTitle>
          <AlertDescription className="mt-2 space-y-2">
            {!stats?.rlsEnabled && (
              <p>• RLS n'est pas activé sur la table marketplace_products</p>
            )}
            {!stats?.insertPolicyExists && (
              <p>• Aucune politique INSERT trouvée pour permettre aux vendeurs de créer des produits</p>
            )}
            <p className="mt-4 font-medium">
              Contactez un administrateur pour corriger ces problèmes.
            </p>
          </AlertDescription>
        </Alert>
      )}

      {/* Test de création */}
      <Card>
        <CardHeader>
          <CardTitle>Test de Création de Produit</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Testez si vous pouvez créer un produit avec vos permissions actuelles.
            Un produit de test sera créé puis immédiatement supprimé.
          </p>
          <Button 
            onClick={testProductCreation} 
            disabled={checking}
            className="w-full"
          >
            {checking ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Test en cours...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Lancer le test de création
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Informations supplémentaires */}
      {stats && stats.totalProducts > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Note :</strong> Tous les produits créés sont automatiquement mis en statut 
            "pending" et nécessitent une approbation par un administrateur avant d'apparaître sur la marketplace.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};
