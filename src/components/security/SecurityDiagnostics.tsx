import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useSecurityDiagnostics } from '@/hooks/useSecurityDiagnostics';
import { Shield, AlertTriangle, CheckCircle, Wrench, ExternalLink } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

export const SecurityDiagnostics = () => {
  const { securityFixes, applyFix, applyAllAutoFixes, isFixing } = useSecurityDiagnostics();

  const autoFixableCount = securityFixes.filter(f => f.autoFixable).length;
  const manualCount = securityFixes.filter(f => !f.autoFixable).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            Diagnostic de Sécurité
          </h2>
          <p className="text-muted-foreground mt-1">
            {autoFixableCount} corrections automatiques • {manualCount} actions manuelles
          </p>
        </div>
        {autoFixableCount > 0 && (
          <Button 
            onClick={applyAllAutoFixes}
            disabled={isFixing}
            size="lg"
          >
            <Wrench className="h-4 w-4 mr-2" />
            Tout corriger automatiquement
          </Button>
        )}
      </div>

      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Les corrections automatiques vont modifier la base de données. 
          Assurez-vous d'avoir une sauvegarde avant de continuer.
        </AlertDescription>
      </Alert>

      <div className="grid gap-4">
        {securityFixes.map((fix) => (
          <Card key={fix.id} className="p-6">
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-lg">{fix.title}</h3>
                    {fix.autoFixable ? (
                      <Badge variant="default" className="gap-1">
                        <Wrench className="h-3 w-3" />
                        Auto
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="gap-1">
                        <ExternalLink className="h-3 w-3" />
                        Manuel
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {fix.description}
                  </p>
                </div>

                {fix.autoFixable && (
                  <Button
                    onClick={() => applyFix(fix.id)}
                    disabled={isFixing}
                    variant="outline"
                    size="sm"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Corriger
                  </Button>
                )}
              </div>

              {fix.sqlFix && (
                <details className="text-sm">
                  <summary className="cursor-pointer font-medium mb-2 hover:text-primary">
                    Voir le SQL
                  </summary>
                  <pre className="bg-muted p-4 rounded-lg overflow-x-auto">
                    <code>{fix.sqlFix}</code>
                  </pre>
                </details>
              )}

              {fix.manualSteps && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Étapes manuelles :</h4>
                    <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                      {fix.manualSteps.map((step, idx) => (
                        <li key={idx}>{step}</li>
                      ))}
                    </ol>
                  </div>
                </>
              )}
            </div>
          </Card>
        ))}
      </div>

      <Alert variant="default" className="bg-primary/5 border-primary/20">
        <Shield className="h-4 w-4 text-primary" />
        <AlertDescription className="text-primary">
          Après avoir appliqué les corrections, actualisez cette page pour vérifier 
          que tous les problèmes ont été résolus.
        </AlertDescription>
      </Alert>
    </div>
  );
};
