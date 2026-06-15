import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Activity, Server, AlertCircle, CheckCircle, RefreshCw, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface FunctionHealth {
  name: string;
  status: 'healthy' | 'degraded' | 'down';
  responseTime: number;
  lastChecked: string;
  errorRate: number;
}

const MonitoringDashboard = () => {
  const [functions, setFunctions] = useState<FunctionHealth[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const edgeFunctions = [
    'geocode-proxy',
    'partner-driver-earnings', 
    'delivery-dispatcher',
    'push-notifications',
    'notification-dispatcher',
    'send-sms-notification'
  ];

  const checkFunctionHealth = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('function-monitor', {
        body: { action: 'health_check' }
      });

      if (error) throw error;

      if (data?.results) {
        const healthData = edgeFunctions.map(funcName => {
          const result = data.results.find((r: any) => r.function === funcName);
          return {
            name: funcName,
            status: result?.status || 'down',
            responseTime: result?.responseTime || 0,
            lastChecked: new Date().toLocaleString('fr-FR'),
            errorRate: result?.errorRate || 0
          };
        });
        setFunctions(healthData);
      }

      toast({
        title: "Monitoring mis à jour",
        description: "État des fonctions vérifié avec succès",
      });
    } catch (error) {
      console.error('Erreur monitoring:', error);
      toast({
        title: "Erreur de monitoring",
        description: "Impossible de vérifier l'état des fonctions",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'degraded':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'down':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Server className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      healthy: 'bg-green-100 text-green-800',
      degraded: 'bg-yellow-100 text-yellow-800', 
      down: 'bg-red-100 text-red-800'
    };
    
    return (
      <Badge className={variants[status as keyof typeof variants] || 'bg-gray-100 text-gray-800'}>
        {status.toUpperCase()}
      </Badge>
    );
  };

  useEffect(() => {
    checkFunctionHealth();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="h-6 w-6" />
          <h2 className="text-2xl font-bold">Monitoring des Edge Functions</h2>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={checkFunctionHealth}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
          <Button
            variant="outline" 
            size="sm"
            onClick={() => window.open('https://supabase.com/dashboard/project/wddlktajnhwhyquwcdgf/functions', '_blank')}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Dashboard
          </Button>
        </div>
      </div>

      <div className="grid gap-4">
        {functions.length > 0 ? functions.map((func) => (
          <Card key={func.name}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-base font-medium flex items-center gap-2">
                {getStatusIcon(func.status)}
                {func.name}
              </CardTitle>
              {getStatusBadge(func.status)}
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Temps de réponse</span>
                  <div className="font-medium">{func.responseTime}ms</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Taux d'erreur</span>
                  <div className="font-medium">{func.errorRate}%</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Dernière vérification</span>
                  <div className="font-medium">{func.lastChecked}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )) : (
          <Card>
            <CardContent className="flex items-center justify-center py-8">
              <div className="text-center">
                <Server className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground">Aucune donnée de monitoring disponible</p>
                <Button onClick={checkFunctionHealth} className="mt-2" disabled={loading}>
                  {loading ? 'Vérification...' : 'Lancer la vérification'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default MonitoringDashboard;