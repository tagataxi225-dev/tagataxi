/**
 * Centre de Supervision et Contrôle Mission-Critical
 * Vue d'ensemble complète pour les opérations critiques
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Shield,
  Activity,
  Bell,
  Users,
  Car,
  MapPin,
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap,
  Globe,
  Server,
  Database,
  ArrowLeft,
  RefreshCw,
  Settings,
  Download,
  Eye
} from 'lucide-react';
import { OperationalMonitoringDashboard } from './OperationalMonitoringDashboard';
import { IncidentManagementCenter } from './IncidentManagementCenter';

interface MissionControlCenterProps {
  onBack: () => void;
}

export const MissionControlCenter: React.FC<MissionControlCenterProps> = ({ onBack }) => {
  const [activeView, setActiveView] = useState<'overview' | 'monitoring' | 'incidents'>('overview');
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // Mock données critiques
  const criticalMetrics = {
    total_active_users: 2456,
    active_drivers: 187,
    rides_in_progress: 45,
    pending_requests: 23,
    system_health: 98.7,
    revenue_today: 456780,
    critical_alerts: 2,
    uptime: 99.97
  };

  const quickActions = [
    {
      title: 'Monitoring Système',
      description: 'Supervision temps réel infrastructure',
      icon: <Activity className="h-5 w-5" />,
      color: 'blue',
      action: () => setActiveView('monitoring')
    },
    {
      title: 'Gestion Incidents',
      description: 'Centre de résolution des incidents',
      icon: <AlertTriangle className="h-5 w-5" />,
      color: 'red',
      action: () => setActiveView('incidents')
    },
    {
      title: 'État des Services',
      description: 'Status page en temps réel',
      icon: <Server className="h-5 w-5" />,
      color: 'green',
      action: () => {}
    },
    {
      title: 'Analytics Business',
      description: 'Métriques commerciales critiques',
      icon: <TrendingUp className="h-5 w-5" />,
      color: 'purple',
      action: () => {}
    }
  ];

  const criticalServices = [
    { name: 'Database Primary', status: 'healthy', uptime: 99.98, response: 12 },
    { name: 'API Gateway', status: 'healthy', uptime: 99.95, response: 45 },
    { name: 'Edge Functions', status: 'warning', uptime: 99.87, response: 234 },
    { name: 'Payment Gateway', status: 'critical', uptime: 98.12, response: 1500 },
    { name: 'Google Maps API', status: 'healthy', uptime: 99.99, response: 89 },
    { name: 'Realtime System', status: 'healthy', uptime: 99.94, response: 67 }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'default';
      case 'warning': return 'secondary';
      case 'critical': return 'destructive';
      default: return 'outline';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'critical': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  if (activeView === 'monitoring') {
    return <OperationalMonitoringDashboard onBack={() => setActiveView('overview')} />;
  }

  if (activeView === 'incidents') {
    return (
      <div className="min-h-screen bg-background">
        <div className="sticky top-0 z-40 bg-background border-b">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => setActiveView('overview')}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-xl font-bold">Centre de Gestion des Incidents</h1>
                <p className="text-sm text-muted-foreground">
                  Gestion et résolution des incidents système
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="p-4">
          <IncidentManagementCenter />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background border-b">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-600" />
                Mission Control Center
              </h1>
              <p className="text-sm text-muted-foreground">
                Centre de supervision opérationnelle - Vue d'ensemble critique
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="text-xs text-muted-foreground">
              Dernière mise à jour: {lastUpdate.toLocaleTimeString()}
            </div>
            <Button variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-1" />
              Actualiser
            </Button>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-1" />
              Config
            </Button>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Alertes critiques */}
        {criticalMetrics.critical_alerts > 0 && (
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <strong>🚨 ALERTES CRITIQUES:</strong> {criticalMetrics.critical_alerts} incident(s) critiques nécessitent une intervention immédiate.
              <Button size="sm" variant="outline" className="ml-3" onClick={() => setActiveView('incidents')}>
                Voir les incidents
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Métriques de performance KPI */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
          <Card className="col-span-1">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium">Utilisateurs</span>
              </div>
              <p className="text-2xl font-bold">{criticalMetrics.total_active_users.toLocaleString()}</p>
              <p className="text-xs text-green-600 flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                +5.2%
              </p>
            </CardContent>
          </Card>

          <Card className="col-span-1">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Car className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium">Chauffeurs</span>
              </div>
              <p className="text-2xl font-bold">{criticalMetrics.active_drivers}</p>
              <p className="text-xs text-green-600 flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                +2.1%
              </p>
            </CardContent>
          </Card>

          <Card className="col-span-1">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="h-4 w-4 text-purple-500" />
                <span className="text-sm font-medium">Courses</span>
              </div>
              <p className="text-2xl font-bold">{criticalMetrics.rides_in_progress}</p>
              <p className="text-xs text-muted-foreground">en cours</p>
            </CardContent>
          </Card>

          <Card className="col-span-1">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4 text-orange-500" />
                <span className="text-sm font-medium">En attente</span>
              </div>
              <p className="text-2xl font-bold">{criticalMetrics.pending_requests}</p>
              <p className="text-xs text-muted-foreground">demandes</p>
            </CardContent>
          </Card>

          <Card className="col-span-1">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium">Santé</span>
              </div>
              <p className="text-2xl font-bold">{criticalMetrics.system_health}%</p>
              <p className="text-xs text-green-600">Excellent</p>
            </CardContent>
          </Card>

          <Card className="col-span-1">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">Revenus</span>
              </div>
              <p className="text-2xl font-bold">{(criticalMetrics.revenue_today / 1000).toFixed(0)}k</p>
              <p className="text-xs text-muted-foreground">aujourd'hui</p>
            </CardContent>
          </Card>

          <Card className="col-span-1">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                <span className="text-sm font-medium">Alertes</span>
              </div>
              <p className="text-2xl font-bold">{criticalMetrics.critical_alerts}</p>
              <p className="text-xs text-red-600">critiques</p>
            </CardContent>
          </Card>

          <Card className="col-span-1">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="h-4 w-4 text-yellow-500" />
                <span className="text-sm font-medium">Uptime</span>
              </div>
              <p className="text-2xl font-bold">{criticalMetrics.uptime}%</p>
              <p className="text-xs text-green-600">30 jours</p>
            </CardContent>
          </Card>
        </div>

        {/* Actions rapides */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Actions Rapides
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {quickActions.map((action, index) => (
                <div 
                  key={index}
                  className="p-4 border rounded-lg cursor-pointer hover:shadow-md transition-all hover:border-blue-300"
                  onClick={action.action}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`p-2 rounded-lg bg-${action.color}-100 text-${action.color}-600`}>
                      {action.icon}
                    </div>
                    <h4 className="font-medium">{action.title}</h4>
                  </div>
                  <p className="text-sm text-muted-foreground">{action.description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* État des services critiques */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5" />
                Services Critiques
              </CardTitle>
              <Button size="sm" variant="outline">
                <Eye className="h-4 w-4 mr-1" />
                Vue détaillée
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {criticalServices.map((service, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(service.status)}
                      <span className="font-medium">{service.name}</span>
                    </div>
                    <Badge variant={getStatusColor(service.status)}>
                      {service.status}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Uptime:</span>
                      <span className="font-mono">{service.uptime}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Response:</span>
                      <span className="font-mono">{service.response}ms</span>
                    </div>
                    <Progress 
                      value={service.uptime} 
                      className={`h-2 ${service.status === 'critical' ? 'text-red-500' : service.status === 'warning' ? 'text-yellow-500' : 'text-green-500'}`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Graphiques de monitoring */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Charge Système Temps Réel</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-48 flex items-center justify-center border-2 border-dashed rounded-lg">
                <div className="text-center">
                  <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">Graphique de charge système</p>
                  <p className="text-sm text-muted-foreground">CPU, Mémoire, Réseau en temps réel</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Activité Business</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-48 flex items-center justify-center border-2 border-dashed rounded-lg">
                <div className="text-center">
                  <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">Métriques business</p>
                  <p className="text-sm text-muted-foreground">Courses, revenus, conversions</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};