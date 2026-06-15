import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { AlertTriangle, Bell, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Alert {
  id: string;
  type: 'low_success_rate' | 'stuck_transactions' | 'no_activity';
  severity: 'warning' | 'critical';
  message: string;
  count?: number;
  timestamp: string;
}

export const OrangeMoneyAlerts = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [alertHistory, setAlertHistory] = useState<Alert[]>([]);
  const [playSound, setPlaySound] = useState(false);

  useEffect(() => {
    checkAlerts();
    const interval = setInterval(checkAlerts, 60000); // Vérifier toutes les minutes
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Jouer un son si alerte critique
    if (playSound && alerts.some(a => a.severity === 'critical')) {
      const audio = new Audio('/notification.mp3'); // À ajouter dans public/
      audio.play().catch(() => {
        // Silently fail si pas de fichier audio
      });
      setPlaySound(false);
    }
  }, [alerts, playSound]);

  const checkAlerts = async () => {
    const newAlerts: Alert[] = [];
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last1h = new Date(now.getTime() - 60 * 60 * 1000);

    try {
      // Récupérer les transactions des dernières 24h
      const { data: transactions } = await supabase
        .from('payment_transactions')
        .select('*')
        .eq('payment_provider', 'orange')
        .gte('created_at', last24h.toISOString());

      if (transactions) {
        // Vérifier taux de succès < 90%
        const successful = transactions.filter(t => t.status === 'completed').length;
        const total = transactions.length;
        if (total > 0) {
          const successRate = (successful / total) * 100;
          if (successRate < 90) {
            newAlerts.push({
              id: 'low-success-rate',
              type: 'low_success_rate',
              severity: successRate < 80 ? 'critical' : 'warning',
              message: `Taux de succès : ${successRate.toFixed(1)}% (${successful}/${total})`,
              timestamp: now.toISOString()
            });
          }
        }

        // Vérifier transactions bloquées > 10 min
        const tenMinAgo = new Date(now.getTime() - 10 * 60 * 1000);
        const stuck = transactions.filter(
          t => t.status === 'processing' && new Date(t.created_at) < tenMinAgo
        );
        if (stuck.length >= 5) {
          newAlerts.push({
            id: 'stuck-transactions',
            type: 'stuck_transactions',
            severity: stuck.length >= 10 ? 'critical' : 'warning',
            message: `${stuck.length} transaction(s) bloquée(s) depuis >10 min`,
            count: stuck.length,
            timestamp: now.toISOString()
          });
        }

        // Vérifier aucune transaction depuis 1h
        const recentTransactions = transactions.filter(
          t => new Date(t.created_at) > last1h
        );
        if (recentTransactions.length === 0 && total > 0) {
          newAlerts.push({
            id: 'no-activity',
            type: 'no_activity',
            severity: 'warning',
            message: 'Aucune transaction depuis plus d\'1 heure',
            timestamp: now.toISOString()
          });
        }
      }

      setAlerts(newAlerts);
      
      // Ajouter à l'historique si nouvelles alertes
      if (newAlerts.length > 0) {
        setAlertHistory(prev => [...newAlerts, ...prev].slice(0, 20));
        setPlaySound(true);
      }
    } catch (error) {
      console.error('Erreur vérification alertes:', error);
    }
  };

  const getAlertIcon = (severity: string) => {
    return severity === 'critical' ? (
      <AlertTriangle className="h-5 w-5 text-destructive" />
    ) : (
      <Bell className="h-5 w-5 text-orange-500" />
    );
  };

  const getSeverityBadge = (severity: string) => {
    return (
      <Badge variant={severity === 'critical' ? 'destructive' : 'default'}>
        {severity === 'critical' ? 'Critique' : 'Attention'}
      </Badge>
    );
  };

  if (alerts.length === 0 && alertHistory.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Alertes actives */}
      {alerts.length > 0 && (
        <Card className="border-orange-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-600">
              <Bell className="h-5 w-5" />
              Alertes actives ({alerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-4 rounded-lg border ${
                  alert.severity === 'critical'
                    ? 'bg-destructive/10 border-destructive'
                    : 'bg-orange-50 dark:bg-orange-950 border-orange-300'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    {getAlertIcon(alert.severity)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {getSeverityBadge(alert.severity)}
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(alert.timestamp), 'HH:mm:ss', { locale: fr })}
                        </span>
                      </div>
                      <p className="font-semibold">{alert.message}</p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open('https://supabase.com/dashboard/project/wddlktajnhwhyquwcdgf/functions/mobile-money-payment/logs', '_blank')}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Logs
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Historique des alertes */}
      {alertHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Historique des alertes (7 derniers jours)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {alertHistory.map((alert, idx) => (
                <div
                  key={`${alert.id}-${idx}`}
                  className="flex items-center justify-between p-3 bg-accent/30 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {getAlertIcon(alert.severity)}
                    <div>
                      <p className="text-sm font-medium">{alert.message}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(alert.timestamp), 'dd/MM/yyyy HH:mm', { locale: fr })}
                      </p>
                    </div>
                  </div>
                  {getSeverityBadge(alert.severity)}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};