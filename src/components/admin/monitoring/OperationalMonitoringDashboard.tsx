/**
 * Dashboard de Monitoring Opérationnel en Temps Réel
 * Supervision complète de l'infrastructure et des services
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Monitor,
  Activity,
  Server,
  Database,
  Globe,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Zap,
  TrendingUp,
  TrendingDown,
  Users,
  Car,
  ShoppingBag,
  MapPin,
  RefreshCw,
  Bell,
  Settings,
  ArrowLeft,
  Eye,
  Download,
  Filter
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SystemMetrics {
  cpu_usage: number;
  memory_usage: number;
  disk_usage: number;
  network_latency: number;
  active_connections: number;
  requests_per_second: number;
  error_rate: number;
  uptime: number;
}

interface ServiceStatus {
  name: string;
  status: 'healthy' | 'warning' | 'critical' | 'offline';
  uptime: number;
  response_time: number;
  last_check: string;
  endpoints: Array<{
    name: string;
    status: string;
    response_time: number;
  }>;
}

interface RealTimeStats {
  active_users: number;
  active_drivers: number;
  pending_bookings: number;
  active_rides: number;
  marketplace_orders: number;
  system_alerts: number;
}

interface SystemAlert {
  id: string;
  type: 'critical' | 'warning' | 'info';
  service: string;
  message: string;
  timestamp: string;
  acknowledged: boolean;
  resolved: boolean;
}

interface OperationalMonitoringDashboardProps {
  onBack: () => void;
}

export const OperationalMonitoringDashboard: React.FC<OperationalMonitoringDashboardProps> = ({ onBack }) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [isAutoRefresh, setIsAutoRefresh] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // Mock data - remplacer par vraies métriques
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics>({
    cpu_usage: 45.2,
    memory_usage: 68.7,
    disk_usage: 23.1,
    network_latency: 12,
    active_connections: 1247,
    requests_per_second: 89,
    error_rate: 0.8,
    uptime: 99.97
  });

  const [realTimeStats, setRealTimeStats] = useState<RealTimeStats>({
    active_users: 2456,
    active_drivers: 187,
    pending_bookings: 23,
    active_rides: 45,
    marketplace_orders: 12,
    system_alerts: 3
  });

  const [services, setServices] = useState<ServiceStatus[]>([
    {
      name: 'Supabase Database',
      status: 'healthy',
      uptime: 99.98,
      response_time: 15,
      last_check: new Date().toISOString(),
      endpoints: [
        { name: 'Read Queries', status: 'healthy', response_time: 12 },
        { name: 'Write Queries', status: 'healthy', response_time: 18 },
        { name: 'Realtime', status: 'healthy', response_time: 8 }
      ]
    },
    {
      name: 'Edge Functions',
      status: 'warning',
      uptime: 99.85,
      response_time: 245,
      last_check: new Date().toISOString(),
      endpoints: [
        { name: 'notification-dispatcher', status: 'healthy', response_time: 156 },
        { name: 'geocode-proxy', status: 'warning', response_time: 340 },
        { name: 'mobile-money-payment', status: 'healthy', response_time: 89 }
      ]
    },
    {
      name: 'Google Maps API',
      status: 'healthy',
      uptime: 99.99,
      response_time: 89,
      last_check: new Date().toISOString(),
      endpoints: [
        { name: 'Geocoding', status: 'healthy', response_time: 78 },
        { name: 'Directions', status: 'healthy', response_time: 95 },
        { name: 'Places', status: 'healthy', response_time: 92 }
      ]
    },
    {
      name: 'Mapbox Services',
      status: 'healthy',
      uptime: 99.94,
      response_time: 67,
      last_check: new Date().toISOString(),
      endpoints: [
        { name: 'Vector Tiles', status: 'healthy', response_time: 45 },
        { name: 'Navigation', status: 'healthy', response_time: 89 }
      ]
    }
  ]);

  const [systemAlerts, setSystemAlerts] = useState<SystemAlert[]>([
    {
      id: '1',
      type: 'warning',
      service: 'Edge Functions',
      message: 'Response time élevé sur geocode-proxy (340ms)',
      timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      acknowledged: false,
      resolved: false
    },
    {
      id: '2',
      type: 'info',
      service: 'Database',
      message: 'Pic d\'activité détecté - 1200+ connexions simultanées',
      timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      acknowledged: true,
      resolved: false
    },
    {
      id: '3',
      type: 'critical',
      service: 'Payment System',
      message: 'Échec de connexion à Orange Money API',
      timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
      acknowledged: false,
      resolved: false
    }
  ]);

  // Auto-refresh logic
  useEffect(() => {
    if (!isAutoRefresh) return;

    const interval = setInterval(() => {
      // Simuler des mises à jour des métriques
      setSystemMetrics(prev => ({
        ...prev,
        cpu_usage: Math.max(10, Math.min(90, prev.cpu_usage + (Math.random() - 0.5) * 10)),
        memory_usage: Math.max(20, Math.min(95, prev.memory_usage + (Math.random() - 0.5) * 8)),
        network_latency: Math.max(5, Math.min(100, prev.network_latency + (Math.random() - 0.5) * 15)),
        requests_per_second: Math.max(20, Math.min(200, prev.requests_per_second + (Math.random() - 0.5) * 30))
      }));

      setRealTimeStats(prev => ({
        ...prev,
        active_users: Math.max(1000, Math.min(5000, prev.active_users + Math.floor((Math.random() - 0.5) * 100))),
        active_drivers: Math.max(50, Math.min(500, prev.active_drivers + Math.floor((Math.random() - 0.5) * 20))),
        pending_bookings: Math.max(0, Math.min(100, prev.pending_bookings + Math.floor((Math.random() - 0.5) * 10)))
      }));

      setLastUpdate(new Date());
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoRefresh]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'default';
      case 'warning': return 'secondary';
      case 'critical': return 'destructive';
      case 'offline': return 'outline';
      default: return 'outline';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'critical': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'offline': return <XCircle className="h-4 w-4 text-gray-500" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'critical': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'info': return <CheckCircle className="h-4 w-4 text-blue-500" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  const handleAcknowledgeAlert = (alertId: string) => {
    setSystemAlerts(prev => 
      prev.map(alert => 
        alert.id === alertId ? { ...alert, acknowledged: true } : alert
      )
    );
    toast({
      title: 'Alerte acquittée',
      description: 'L\'alerte a été marquée comme vue'
    });
  };

  const getMetricTrend = (current: number, threshold: number) => {
    if (current > threshold) return <TrendingUp className="h-4 w-4 text-red-500" />;
    return <TrendingDown className="h-4 w-4 text-green-500" />;
  };

  const formatUptime = (uptime: number) => {
    if (uptime >= 99.9) return `${uptime.toFixed(2)}%`;
    return `${uptime.toFixed(1)}%`;
  };

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
                <Monitor className="h-5 w-5" />
                Monitoring Opérationnel
              </h1>
              <p className="text-sm text-muted-foreground">
                Supervision temps réel des systèmes et services
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="text-xs text-muted-foreground">
              Dernière mise à jour: {lastUpdate.toLocaleTimeString()}
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setIsAutoRefresh(!isAutoRefresh)}
            >
              <RefreshCw className={`h-4 w-4 mr-1 ${isAutoRefresh ? 'animate-spin' : ''}`} />
              {isAutoRefresh ? 'Auto' : 'Manuel'}
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-1" />
              Rapport
            </Button>
          </div>
        </div>
      </div>

      <div className="p-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">
              <Activity className="h-4 w-4 mr-1" />
              Vue d'ensemble
            </TabsTrigger>
            <TabsTrigger value="infrastructure">
              <Server className="h-4 w-4 mr-1" />
              Infrastructure
            </TabsTrigger>
            <TabsTrigger value="services">
              <Globe className="h-4 w-4 mr-1" />
              Services ({services.length})
            </TabsTrigger>
            <TabsTrigger value="alerts">
              <Bell className="h-4 w-4 mr-1" />
              Alertes ({systemAlerts.filter(a => !a.acknowledged).length})
            </TabsTrigger>
            <TabsTrigger value="performance">
              <TrendingUp className="h-4 w-4 mr-1" />
              Performance
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Alertes critiques */}
            {systemAlerts.some(a => a.type === 'critical' && !a.acknowledged) && (
              <Alert className="border-red-200 bg-red-50">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  <strong>Attention :</strong> {systemAlerts.filter(a => a.type === 'critical' && !a.acknowledged).length} alerte(s) critique(s) nécessitent votre attention immédiate.
                </AlertDescription>
              </Alert>
            )}

            {/* Métriques temps réel */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="h-4 w-4 text-blue-500" />
                    <span className="text-sm font-medium">Utilisateurs</span>
                  </div>
                  <p className="text-2xl font-bold">{realTimeStats.active_users.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">actifs maintenant</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Car className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-medium">Chauffeurs</span>
                  </div>
                  <p className="text-2xl font-bold">{realTimeStats.active_drivers}</p>
                  <p className="text-xs text-muted-foreground">en ligne</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-4 w-4 text-orange-500" />
                    <span className="text-sm font-medium">En attente</span>
                  </div>
                  <p className="text-2xl font-bold">{realTimeStats.pending_bookings}</p>
                  <p className="text-xs text-muted-foreground">réservations</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="h-4 w-4 text-purple-500" />
                    <span className="text-sm font-medium">Courses</span>
                  </div>
                  <p className="text-2xl font-bold">{realTimeStats.active_rides}</p>
                  <p className="text-xs text-muted-foreground">en cours</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <ShoppingBag className="h-4 w-4 text-pink-500" />
                    <span className="text-sm font-medium">Commandes</span>
                  </div>
                  <p className="text-2xl font-bold">{realTimeStats.marketplace_orders}</p>
                  <p className="text-xs text-muted-foreground">marketplace</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                    <span className="text-sm font-medium">Alertes</span>
                  </div>
                  <p className="text-2xl font-bold">{realTimeStats.system_alerts}</p>
                  <p className="text-xs text-muted-foreground">système</p>
                </CardContent>
              </Card>
            </div>

            {/* Status des services principaux */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Server className="h-5 w-5" />
                  État des Services Critiques
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {services.slice(0, 4).map((service) => (
                    <div key={service.name} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(service.status)}
                        <div>
                          <p className="font-medium">{service.name}</p>
                          <p className="text-sm text-muted-foreground">
                            Uptime: {formatUptime(service.uptime)} • {service.response_time}ms
                          </p>
                        </div>
                      </div>
                      <Badge variant={getStatusColor(service.status)}>
                        {service.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Métriques système */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">CPU</span>
                    {getMetricTrend(systemMetrics.cpu_usage, 70)}
                  </div>
                  <div className="space-y-2">
                    <Progress value={systemMetrics.cpu_usage} />
                    <p className="text-xs text-muted-foreground">
                      {systemMetrics.cpu_usage.toFixed(1)}% utilisé
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Mémoire</span>
                    {getMetricTrend(systemMetrics.memory_usage, 80)}
                  </div>
                  <div className="space-y-2">
                    <Progress value={systemMetrics.memory_usage} />
                    <p className="text-xs text-muted-foreground">
                      {systemMetrics.memory_usage.toFixed(1)}% utilisée
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Latence</span>
                    {getMetricTrend(systemMetrics.network_latency, 50)}
                  </div>
                  <div className="space-y-2">
                    <p className="text-2xl font-bold">{systemMetrics.network_latency}ms</p>
                    <p className="text-xs text-muted-foreground">réseau moyen</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Requêtes/sec</span>
                    <Zap className="h-4 w-4 text-yellow-500" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-2xl font-bold">{systemMetrics.requests_per_second}</p>
                    <p className="text-xs text-muted-foreground">charge actuelle</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="infrastructure" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    Base de Données
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span>Connexions actives</span>
                    <span className="font-mono">{systemMetrics.active_connections}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Stockage utilisé</span>
                    <span className="font-mono">{systemMetrics.disk_usage.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Uptime</span>
                    <span className="font-mono text-green-600">{systemMetrics.uptime}%</span>
                  </div>
                  <Progress value={systemMetrics.disk_usage} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Server className="h-5 w-5" />
                    Edge Functions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span>Fonctions actives</span>
                    <span className="font-mono">7</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Invocations/min</span>
                    <span className="font-mono">156</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Taux d'erreur</span>
                    <span className="font-mono text-yellow-600">{systemMetrics.error_rate}%</span>
                  </div>
                  <Progress value={systemMetrics.error_rate * 10} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    APIs Externes
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span>Google Maps</span>
                    <Badge variant="default">Opérationnel</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Orange Money</span>
                    <Badge variant="destructive">Dégradé</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Mapbox</span>
                    <Badge variant="default">Opérationnel</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="services" className="space-y-4">
            <div className="space-y-4">
              {services.map((service) => (
                <Card key={service.name}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        {getStatusIcon(service.status)}
                        {service.name}
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge variant={getStatusColor(service.status)}>
                          {service.status}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {service.response_time}ms
                        </span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Uptime</p>
                        <p className="text-lg font-semibold">{formatUptime(service.uptime)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Temps de réponse</p>
                        <p className="text-lg font-semibold">{service.response_time}ms</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Dernière vérification</p>
                        <p className="text-lg font-semibold">
                          {new Date(service.last_check).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <h4 className="font-medium mb-2">Endpoints</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                        {service.endpoints.map((endpoint, index) => (
                          <div key={index} className="flex items-center justify-between p-2 border rounded">
                            <span className="text-sm">{endpoint.name}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">{endpoint.response_time}ms</span>
                              <Badge variant={getStatusColor(endpoint.status)} className="text-xs">
                                {endpoint.status}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="alerts" className="space-y-4">
            <div className="space-y-3">
              {systemAlerts.map((alert) => (
                <Card key={alert.id} className={`${alert.type === 'critical' ? 'border-red-200' : alert.type === 'warning' ? 'border-yellow-200' : 'border-blue-200'}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        {getAlertIcon(alert.type)}
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">{alert.service}</span>
                            <Badge variant={alert.type === 'critical' ? 'destructive' : alert.type === 'warning' ? 'secondary' : 'default'}>
                              {alert.type}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{alert.message}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(alert.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {alert.acknowledged && (
                          <Badge variant="outline" className="text-xs">Acquittée</Badge>
                        )}
                        {!alert.acknowledged && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleAcknowledgeAlert(alert.id)}
                          >
                            Acquitter
                          </Button>
                        )}
                        <Button size="sm" variant="outline">
                          <Eye className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="performance" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Métriques de Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center border-2 border-dashed rounded-lg">
                    <div className="text-center">
                      <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                      <p className="text-muted-foreground">Graphiques de performance</p>
                      <p className="text-sm text-muted-foreground">À implémenter avec Chart.js</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Analyse des Tendances</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>Charge CPU moyenne (24h)</span>
                      <span className="font-mono">42.3%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Mémoire max utilisée</span>
                      <span className="font-mono">78.9%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Pic de requêtes/sec</span>
                      <span className="font-mono">234</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Incidents résolus</span>
                      <span className="font-mono text-green-600">12/15</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};