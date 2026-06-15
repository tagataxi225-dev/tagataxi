/**
 * Centre de Gestion des Incidents et Maintenance
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  AlertTriangle,
  Plus,
  Eye,
  Edit,
  CheckCircle,
  Clock,
  Users,
  MessageSquare,
  Calendar,
  Search,
  Filter,
  Download,
  Settings,
  Wrench,
  RefreshCw,
  Bell,
  TrendingUp
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Incident {
  id: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'investigating' | 'identified' | 'monitoring' | 'resolved';
  affected_services: string[];
  reported_by: string;
  assigned_to?: string;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
  estimated_resolution?: string;
  updates: IncidentUpdate[];
}

interface IncidentUpdate {
  id: string;
  incident_id: string;
  message: string;
  status: string;
  created_by: string;
  created_at: string;
}

interface MaintenanceWindow {
  id: string;
  title: string;
  description: string;
  scheduled_start: string;
  scheduled_end: string;
  actual_start?: string;
  actual_end?: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  affected_services: string[];
  impact_level: 'none' | 'minimal' | 'partial' | 'major';
  notification_sent: boolean;
}

export const IncidentManagementCenter: React.FC = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('incidents');
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Mock data
  const [incidents, setIncidents] = useState<Incident[]>([
    {
      id: '1',
      title: 'Lenteur Edge Function geocode-proxy',
      description: 'Response time élevé sur l\'edge function geocode-proxy, impactant la géolocalisation',
      severity: 'medium',
      status: 'investigating',
      affected_services: ['geocode-proxy', 'google-maps'],
      reported_by: 'Système automatique',
      assigned_to: 'Équipe DevOps',
      created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      estimated_resolution: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
      updates: [
        {
          id: '1',
          incident_id: '1',
          message: 'Investigation en cours. Analyse des logs de performance.',
          status: 'investigating',
          created_by: 'Admin DevOps',
          created_at: new Date(Date.now() - 15 * 60 * 1000).toISOString()
        }
      ]
    },
    {
      id: '2',
      title: 'Indisponibilité Orange Money API',
      description: 'Perte de connexion avec l\'API Orange Money, affectant les paiements mobiles',
      severity: 'critical',
      status: 'identified',
      affected_services: ['orange-money', 'mobile-payments'],
      reported_by: 'Client Support',
      assigned_to: 'Équipe Payments',
      created_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
      estimated_resolution: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      updates: [
        {
          id: '2',
          incident_id: '2',
          message: 'Problème identifié côté Orange Money. Contact avec leur équipe technique.',
          status: 'identified',
          created_by: 'Lead Payments',
          created_at: new Date(Date.now() - 10 * 60 * 1000).toISOString()
        }
      ]
    }
  ]);

  const [maintenanceWindows, setMaintenanceWindows] = useState<MaintenanceWindow[]>([
    {
      id: '1',
      title: 'Mise à jour base de données',
      description: 'Migration des index pour améliorer les performances',
      scheduled_start: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      scheduled_end: new Date(Date.now() + 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString(),
      status: 'scheduled',
      affected_services: ['database', 'api'],
      impact_level: 'minimal',
      notification_sent: false
    },
    {
      id: '2',
      title: 'Maintenance Edge Functions',
      description: 'Déploiement des optimisations de performance',
      scheduled_start: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      scheduled_end: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000).toISOString(),
      status: 'scheduled',
      affected_services: ['edge-functions'],
      impact_level: 'none',
      notification_sent: true
    }
  ]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'destructive';
      case 'investigating': return 'secondary';
      case 'identified': return 'secondary';
      case 'monitoring': return 'default';
      case 'resolved': return 'default';
      default: return 'outline';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open': return <AlertTriangle className="h-4 w-4" />;
      case 'investigating': return <Search className="h-4 w-4" />;
      case 'identified': return <Eye className="h-4 w-4" />;
      case 'monitoring': return <Clock className="h-4 w-4" />;
      case 'resolved': return <CheckCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'major': return 'destructive';
      case 'partial': return 'secondary';
      case 'minimal': return 'default';
      case 'none': return 'outline';
      default: return 'outline';
    }
  };

  const formatDuration = (start: string, end?: string) => {
    const startTime = new Date(start);
    const endTime = end ? new Date(end) : new Date();
    const diff = endTime.getTime() - startTime.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const createIncident = async (incidentData: Partial<Incident>) => {
    const newIncident: Incident = {
      id: Date.now().toString(),
      title: incidentData.title || '',
      description: incidentData.description || '',
      severity: incidentData.severity || 'medium',
      status: 'open',
      affected_services: incidentData.affected_services || [],
      reported_by: 'Admin',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      updates: []
    };

    setIncidents(prev => [newIncident, ...prev]);
    toast({
      title: 'Incident créé',
      description: 'Le nouvel incident a été enregistré'
    });
  };

  const addIncidentUpdate = (incidentId: string, message: string, status: string) => {
    const update: IncidentUpdate = {
      id: Date.now().toString(),
      incident_id: incidentId,
      message,
      status,
      created_by: 'Admin',
      created_at: new Date().toISOString()
    };

    setIncidents(prev => 
      prev.map(incident => 
        incident.id === incidentId 
          ? { 
              ...incident, 
              status: status as any,
              updated_at: new Date().toISOString(),
              updates: [update, ...incident.updates] 
            }
          : incident
      )
    );

    toast({
      title: 'Mise à jour ajoutée',
      description: 'L\'incident a été mis à jour'
    });
  };

  const filteredIncidents = incidents.filter(incident =>
    incident.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    incident.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    incident.affected_services.some(service => 
      service.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Gestion des Incidents
          </h3>
          <p className="text-sm text-muted-foreground">
            Suivi et résolution des incidents système
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-1" />
            Rapport
          </Button>
          <Button onClick={() => setShowCreateForm(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Incident
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="incidents">
            <AlertTriangle className="h-4 w-4 mr-1" />
            Incidents ({incidents.filter(i => i.status !== 'resolved').length})
          </TabsTrigger>
          <TabsTrigger value="maintenance">
            <Wrench className="h-4 w-4 mr-1" />
            Maintenance ({maintenanceWindows.filter(m => m.status !== 'completed').length})
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <TrendingUp className="h-4 w-4 mr-1" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="incidents" className="space-y-4">
          {/* Barre de recherche */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un incident..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-1" />
              Filtres
            </Button>
          </div>

          {/* Liste des incidents */}
          <div className="space-y-3">
            {filteredIncidents.map((incident) => (
              <Card key={incident.id} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getStatusIcon(incident.status)}
                        <h4 className="font-medium">{incident.title}</h4>
                        <Badge variant={getSeverityColor(incident.severity)}>
                          {incident.severity}
                        </Badge>
                        <Badge variant={getStatusColor(incident.status)}>
                          {incident.status}
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-3">
                        {incident.description}
                      </p>
                      
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>Créé: {new Date(incident.created_at).toLocaleString()}</span>
                        <span>Durée: {formatDuration(incident.created_at, incident.resolved_at)}</span>
                        <span>Services: {incident.affected_services.join(', ')}</span>
                        {incident.assigned_to && <span>Assigné: {incident.assigned_to}</span>}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => setSelectedIncident(incident)}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        Voir
                      </Button>
                      <Button size="sm" variant="outline">
                        <Edit className="h-3 w-3 mr-1" />
                        Modifier
                      </Button>
                    </div>
                  </div>
                  
                  {incident.updates.length > 0 && (
                    <div className="mt-3 pt-3 border-t">
                      <div className="flex items-center gap-2 text-sm">
                        <MessageSquare className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Dernière mise à jour:</span>
                        <span>{incident.updates[0].message}</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredIncidents.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Aucun incident actif</h3>
                <p className="text-muted-foreground">
                  {searchQuery ? 'Aucun incident ne correspond à votre recherche.' : 'Tous les systèmes fonctionnent normalement.'}
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="maintenance" className="space-y-4">
          <div className="space-y-3">
            {maintenanceWindows.map((maintenance) => (
              <Card key={maintenance.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Wrench className="h-4 w-4" />
                        <h4 className="font-medium">{maintenance.title}</h4>
                        <Badge variant={getStatusColor(maintenance.status)}>
                          {maintenance.status}
                        </Badge>
                        <Badge variant={getImpactColor(maintenance.impact_level)}>
                          {maintenance.impact_level} impact
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-3">
                        {maintenance.description}
                      </p>
                      
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>Début: {new Date(maintenance.scheduled_start).toLocaleString()}</span>
                        <span>Fin: {new Date(maintenance.scheduled_end).toLocaleString()}</span>
                        <span>Services: {maintenance.affected_services.join(', ')}</span>
                        {maintenance.notification_sent && (
                          <Badge variant="outline" className="text-xs">
                            <Bell className="h-3 w-3 mr-1" />
                            Notifié
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline">
                        <Eye className="h-3 w-3 mr-1" />
                        Voir
                      </Button>
                      {maintenance.status === 'scheduled' && (
                        <Button size="sm" variant="outline">
                          <RefreshCw className="h-3 w-3 mr-1" />
                          Démarrer
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  <span className="font-medium">Incidents ce mois</span>
                </div>
                <p className="text-3xl font-bold">12</p>
                <p className="text-sm text-muted-foreground">-25% vs mois dernier</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-4 w-4 text-blue-500" />
                  <span className="font-medium">MTTR moyen</span>
                </div>
                <p className="text-3xl font-bold">2.4h</p>
                <p className="text-sm text-muted-foreground">-15% vs mois dernier</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="font-medium">Uptime</span>
                </div>
                <p className="text-3xl font-bold">99.95%</p>
                <p className="text-sm text-muted-foreground">+0.05% vs mois dernier</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Tendances des Incidents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center border-2 border-dashed rounded-lg">
                <div className="text-center">
                  <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">Graphique des tendances</p>
                  <p className="text-sm text-muted-foreground">À implémenter avec Chart.js</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};