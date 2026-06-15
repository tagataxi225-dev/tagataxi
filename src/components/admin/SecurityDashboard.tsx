import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, AlertTriangle, CheckCircle, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

const SecurityDashboard = () => {
  const securityItems = [
    {
      name: 'Row Level Security (RLS)',
      status: 'SECURED',
      description: 'Toutes les tables sensibles ont RLS activé et policies sécurisées',
      action: 'Aucune action requise',
      variant: 'success' as const
    },
    {
      name: 'Function Security',
      status: 'SECURED', 
      description: 'Fonctions critiques sécurisées avec search_path',
      action: 'Aucune action requise',
      variant: 'success' as const
    },
    {
      name: 'Views Security',
      status: 'SECURED',
      description: 'Vues SECURITY DEFINER dangereuses supprimées',
      action: 'Aucune action requise',
      variant: 'success' as const
    },
    {
      name: 'User Roles Policies',
      status: 'SECURED',
      description: 'Policies RLS non-récursives corrigées',
      action: 'Aucune action requise',
      variant: 'success' as const
    },
    {
      name: 'Protection des Mots de Passe',
      status: 'MANUEL',
      description: 'Protection contre les mots de passe compromis désactivée',
      action: 'Activer dans Supabase Dashboard > Auth > Settings',
      variant: 'warning' as const,
      link: 'https://supabase.com/dashboard/project/wddlktajnhwhyquwcdgf/auth/providers'
    },
    {
      name: 'Version PostgreSQL',
      status: 'MANUEL',
      description: 'Patches de sécurité disponibles',
      action: 'Mettre à jour PostgreSQL via Dashboard',
      variant: 'warning' as const,
      link: 'https://supabase.com/dashboard/project/wddlktajnhwhyquwcdgf/settings/infrastructure'
    },
    {
      name: 'Audit de Sécurité',
      status: 'ACTIF',
      description: 'Logs de sécurité enrichis et nettoyage automatique',
      action: 'Surveillance continue active',
      variant: 'success' as const
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'SECURED':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'MANUEL':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default:
        return <Shield className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string, variant: 'success' | 'warning') => {
    return (
      <Badge variant={variant === 'success' ? 'default' : 'secondary'} className={
        variant === 'success' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
      }>
        {status}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Shield className="h-6 w-6" />
        <h2 className="text-2xl font-bold">Tableau de Bord Sécurité</h2>
      </div>

      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          La plupart des éléments de sécurité sont automatiquement sécurisés. 
          Les éléments marqués "MANUEL" nécessitent une configuration via le Dashboard Supabase.
        </AlertDescription>
      </Alert>

      <div className="grid gap-4">
        {securityItems.map((item) => (
          <Card key={item.name}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-base font-medium flex items-center gap-2">
                {getStatusIcon(item.status)}
                {item.name}
              </CardTitle>
              {getStatusBadge(item.status, item.variant)}
            </CardHeader>
            <CardContent>
              <CardDescription className="mb-2">
                {item.description}
              </CardDescription>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {item.action}
                </span>
                {item.link && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(item.link, '_blank')}
                    className="ml-2"
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Configurer
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default SecurityDashboard;