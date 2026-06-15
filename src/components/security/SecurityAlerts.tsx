/**
 * Composant d'alertes de sécurité automatiques
 * Affiche et gère les alertes de sécurité en temps réel
 */

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  AlertTriangle, 
  Shield, 
  Eye, 
  Bell, 
  X, 
  Clock,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { useSecurityMonitoring } from '@/hooks/useSecurityMonitoring';
import { cn } from '@/lib/utils';

interface SecurityAlertsProps {
  enableAutoScroll?: boolean;
  maxAlerts?: number;
  showOnlyRecent?: boolean;
}

export const SecurityAlerts: React.FC<SecurityAlertsProps> = ({
  enableAutoScroll = true,
  maxAlerts = 20,
  showOnlyRecent = false
}) => {
  const {
    alerts,
    metrics,
    isMonitoring,
    startMonitoring,
    stopMonitoring,
    clearAlerts,
    resolveAlert,
    runSecurityScan
  } = useSecurityMonitoring({
    enableRealTimeAlerts: true,
    alertThreshold: 3,
    monitoringInterval: 15000 // 15 secondes
  });

  const [expandedAlert, setExpandedAlert] = useState<string | null>(null);

  // Démarrer le monitoring automatiquement
  useEffect(() => {
    if (!isMonitoring) {
      startMonitoring();
    }
  }, [isMonitoring, startMonitoring]);

  // Auto-scroll vers les nouvelles alertes
  useEffect(() => {
    if (enableAutoScroll && alerts.length > 0) {
      const alertElement = document.getElementById(`alert-${alerts[0].id}`);
      if (alertElement) {
        alertElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [alerts, enableAutoScroll]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 border-red-500 text-red-800';
      case 'high': return 'bg-orange-100 border-orange-500 text-orange-800';
      case 'medium': return 'bg-yellow-100 border-yellow-500 text-yellow-800';
      case 'low': return 'bg-blue-100 border-blue-500 text-blue-800';
      default: return 'bg-gray-100 border-gray-500 text-gray-800';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'high': return <AlertTriangle className="w-5 h-5 text-orange-500" />;
      case 'medium': return <Eye className="w-5 h-5 text-yellow-500" />;
      case 'low': return <Bell className="w-5 h-5 text-blue-500" />;
      default: return <Shield className="w-5 h-5 text-gray-500" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'access_violation': return 'Violation d\'accès';
      case 'failed_auth': return 'Authentification échouée';
      case 'suspicious_activity': return 'Activité suspecte';
      case 'data_breach': return 'Exposition de données';
      default: return 'Événement de sécurité';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `Il y a ${diffMins}min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays < 7) return `Il y a ${diffDays}j`;
    
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredAlerts = showOnlyRecent 
    ? alerts.filter(alert => {
        const alertTime = new Date(alert.timestamp);
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        return alertTime > oneDayAgo;
      }).slice(0, maxAlerts)
    : alerts.slice(0, maxAlerts);

  const criticalAlerts = filteredAlerts.filter(alert => 
    alert.severity === 'critical' || alert.severity === 'high'
  );

  return (
    <div className="space-y-4">
      {/* En-tête avec contrôles */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-6 h-6 text-primary" />
                Alertes de Sécurité
                {criticalAlerts.length > 0 && (
                  <Badge variant="destructive">
                    {criticalAlerts.length} critique{criticalAlerts.length > 1 ? 's' : ''}
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                Monitoring automatique des événements de sécurité
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={isMonitoring ? stopMonitoring : startMonitoring}
                className={cn(
                  isMonitoring && "bg-green-50 border-green-200 text-green-700"
                )}
              >
                <Bell className={cn(
                  "w-4 h-4 mr-2",
                  isMonitoring && "text-green-500"
                )} />
                {isMonitoring ? 'Monitoring ON' : 'Monitoring OFF'}
              </Button>
              {alerts.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearAlerts}
                >
                  Effacer tout
                </Button>
              )}
              <Button
                size="sm"
                onClick={runSecurityScan}
              >
                <Shield className="w-4 h-4 mr-2" />
                Scan Manuel
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Métriques rapides */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{metrics.totalAccesses}</p>
              <p className="text-sm text-muted-foreground">Accès (24h)</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600">{metrics.failedAttempts}</p>
              <p className="text-sm text-muted-foreground">Échecs</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">{metrics.suspiciousActivities}</p>
              <p className="text-sm text-muted-foreground">Suspects</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">{filteredAlerts.length}</p>
              <p className="text-sm text-muted-foreground">Alertes actives</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alertes critiques en haut */}
      {criticalAlerts.length > 0 && (
        <Alert className="border-red-500 bg-red-50">
          <AlertTriangle className="w-4 h-4 text-red-500" />
          <AlertDescription>
            <strong className="text-red-800">
              {criticalAlerts.length} alerte{criticalAlerts.length > 1 ? 's' : ''} critique{criticalAlerts.length > 1 ? 's' : ''} détectée{criticalAlerts.length > 1 ? 's' : ''}
            </strong>
            <p className="text-red-700 mt-1">
              Action immédiate requise pour sécuriser le système.
            </p>
          </AlertDescription>
        </Alert>
      )}

      {/* Liste des alertes */}
      <div className="space-y-3">
        {filteredAlerts.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-green-800 mb-2">
                Aucune alerte de sécurité
              </h3>
              <p className="text-green-600">
                Tous les systèmes fonctionnent normalement.
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredAlerts.map((alert) => (
            <Card 
              key={alert.id} 
              id={`alert-${alert.id}`}
              className={cn(
                "transition-all duration-200 hover:shadow-md",
                getSeverityColor(alert.severity),
                expandedAlert === alert.id && "ring-2 ring-offset-2 ring-primary"
              )}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    {getSeverityIcon(alert.severity)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{getTypeLabel(alert.type)}</h4>
                        <Badge 
                          variant="outline" 
                          className={cn(
                            "text-xs",
                            alert.severity === 'critical' && "border-red-500 text-red-700",
                            alert.severity === 'high' && "border-orange-500 text-orange-700",
                            alert.severity === 'medium' && "border-yellow-500 text-yellow-700",
                            alert.severity === 'low' && "border-blue-500 text-blue-700"
                          )}
                        >
                          {alert.severity.toUpperCase()}
                        </Badge>
                      </div>
                      <p className="text-sm mb-2">{alert.message}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatTimestamp(alert.timestamp)}
                        </span>
                        {alert.metadata && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-auto p-0 text-xs"
                            onClick={() => setExpandedAlert(
                              expandedAlert === alert.id ? null : alert.id
                            )}
                          >
                            {expandedAlert === alert.id ? 'Masquer détails' : 'Voir détails'}
                          </Button>
                        )}
                      </div>
                      
                      {/* Détails étendus */}
                      {expandedAlert === alert.id && alert.metadata && (
                        <div className="mt-3 p-3 bg-white/50 rounded border">
                          <h5 className="font-medium text-xs mb-2">Détails techniques:</h5>
                          <pre className="text-xs text-muted-foreground whitespace-pre-wrap">
                            {JSON.stringify(alert.metadata, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => resolveAlert(alert.id)}
                    className="h-auto p-1"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Footer avec informations de monitoring */}
      {isMonitoring && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-3">
            <div className="flex items-center justify-center gap-2 text-sm text-blue-700">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              Monitoring de sécurité actif - Vérification toutes les 15 secondes
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};