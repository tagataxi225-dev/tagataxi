import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useSubscriptionAlerts } from "@/hooks/useSubscriptionAlerts";
import { 
  AlertTriangle, 
  Info, 
  AlertCircle, 
  Check, 
  CheckCheck,
  Loader2 
} from "lucide-react";
import { cn } from "@/lib/utils";

export const SubscriptionAlertsList = () => {
  const { 
    alerts, 
    unacknowledgedAlerts,
    isLoading, 
    acknowledgeAlert,
    acknowledgeAll,
    hasUnacknowledgedAlerts 
  } = useSubscriptionAlerts();

  const getAlertIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-orange-600" />;
      default:
        return <Info className="h-5 w-5 text-blue-600" />;
    }
  };

  const getAlertColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'border-red-200 bg-red-50';
      case 'warning':
        return 'border-orange-200 bg-orange-50';
      default:
        return 'border-blue-200 bg-blue-50';
    }
  };

  const getSeverityBadge = (severity: string) => {
    const config = {
      critical: { label: 'Critique', className: 'bg-red-100 text-red-700 border-red-200' },
      warning: { label: 'Avertissement', className: 'bg-orange-100 text-orange-700 border-orange-200' },
      info: { label: 'Info', className: 'bg-blue-100 text-blue-700 border-blue-200' }
    };

    const { label, className } = config[severity as keyof typeof config] || config.info;

    return (
      <Badge variant="outline" className={className}>
        {label}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Chargement des alertes...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              Alertes d'Abonnement
              {hasUnacknowledgedAlerts && (
                <Badge className="bg-red-500">
                  {unacknowledgedAlerts.length} nouvelle{unacknowledgedAlerts.length > 1 ? 's' : ''}
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Notifications importantes concernant vos abonnements
            </CardDescription>
          </div>
          
          {hasUnacknowledgedAlerts && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => acknowledgeAll()}
              className="gap-2"
            >
              <CheckCheck className="h-4 w-4" />
              Tout marquer comme lu
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        {alerts.length === 0 ? (
          <div className="text-center py-8">
            <Info className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">Aucune alerte pour le moment</p>
            <p className="text-sm text-muted-foreground mt-1">
              Vous serez notifié ici des événements importants concernant vos abonnements
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className={cn(
                  "p-4 rounded-lg border transition-all",
                  getAlertColor(alert.severity),
                  alert.is_acknowledged && "opacity-60"
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1">
                    {getAlertIcon(alert.severity)}
                    
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        {getSeverityBadge(alert.severity)}
                        <span className="text-xs text-muted-foreground">
                          {new Date(alert.created_at).toLocaleString('fr-FR')}
                        </span>
                      </div>
                      
                      <p className="font-medium text-sm">
                        {alert.message}
                      </p>
                      
                      {alert.metadata && Object.keys(alert.metadata).length > 0 && (
                        <div className="text-xs text-muted-foreground bg-white/50 p-2 rounded">
                          {alert.metadata.days_remaining && (
                            <div>⏰ Jours restants: {alert.metadata.days_remaining}</div>
                          )}
                          {alert.metadata.rides_remaining !== undefined && (
                            <div>🎫 Courses restantes: {alert.metadata.rides_remaining}</div>
                          )}
                          {alert.metadata.failure_reason && (
                            <div>❌ Raison: {alert.metadata.failure_reason}</div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {!alert.is_acknowledged && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => acknowledgeAlert(alert.id)}
                      className="shrink-0"
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Marquer comme lu
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
