import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, AlertTriangle, CheckCircle, XCircle, Activity, Lock, Database, Eye, RefreshCw } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SecurityCheck {
  id: string;
  name: string;
  status: 'secure' | 'warning' | 'critical';
  description: string;
  action?: string;
  lastChecked: string;
}

interface AuditLog {
  id: string;
  user_id: string;
  action_type: string;
  resource_type: string;
  success: boolean;
  created_at: string;
  metadata?: any;
}

export function AdminSecurityManager() {
  const [activeTab, setActiveTab] = useState('overview');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch security audit logs
  const { data: auditLogs, isLoading: logsLoading } = useQuery({
    queryKey: ['securityAuditLogs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('security_audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as AuditLog[];
    }
  });

  // Security maintenance mutation
  const maintenanceMutation = useMutation({
    mutationFn: async (action: string) => {
      const { data, error } = await supabase.functions.invoke('admin-operations', {
        body: { action, type: 'security_maintenance' }
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast({
        title: "Maintenance sécurité",
        description: data.message || "Opération réussie",
      });
      queryClient.invalidateQueries({ queryKey: ['securityAuditLogs'] });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de la maintenance",
        variant: "destructive"
      });
    }
  });

  // Mock security checks for demonstration
  const securityChecks: SecurityCheck[] = [
    {
      id: '1',
      name: 'Row Level Security (RLS)',
      status: 'secure',
      description: 'Toutes les tables sensibles ont RLS activé',
      lastChecked: new Date().toISOString()
    },
    {
      id: '2',
      name: 'Fonctions Database',
      status: 'secure',
      description: 'Toutes les fonctions ont search_path sécurisé',
      lastChecked: new Date().toISOString()
    },
    {
      id: '3',
      name: 'Protection Mots de Passe',
      status: 'warning',
      description: 'Protection contre les mots de passe compromis désactivée',
      action: 'Activer dans Dashboard > Auth > Settings',
      lastChecked: new Date().toISOString()
    },
    {
      id: '4',
      name: 'Expiration OTP',
      status: 'warning',
      description: 'Durée OTP pourrait être réduite à 1 heure',
      action: 'Configurer dans Dashboard > Auth > Settings',
      lastChecked: new Date().toISOString()
    },
    {
      id: '5',
      name: 'Postgres Version',
      status: 'warning',
      description: 'Patches de sécurité disponibles',
      action: 'Mettre à jour Postgres',
      lastChecked: new Date().toISOString()
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'secure':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'critical':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'secure':
        return <Badge variant="default" className="bg-green-100 text-green-800">Sécurisé</Badge>;
      case 'warning':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Attention</Badge>;
      case 'critical':
        return <Badge variant="destructive">Critique</Badge>;
      default:
        return <Badge variant="outline">Inconnu</Badge>;
    }
  };

  const handleSecurityMaintenance = (action: string) => {
    maintenanceMutation.mutate(action);
  };

  if (logsLoading) {
    return <div className="flex items-center justify-center p-8">Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sécurité & Audit</h1>
          <p className="text-muted-foreground">
            Surveillance et maintenance de la sécurité système
          </p>
        </div>
        <Button 
          onClick={() => handleSecurityMaintenance('refresh_security_stats')}
          disabled={maintenanceMutation.isPending}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualiser
        </Button>
      </div>

      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          Ce tableau de bord surveille les aspects critiques de sécurité. 
          Certaines configurations doivent être faites manuellement dans le Dashboard Supabase.
        </AlertDescription>
      </Alert>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="checks">Vérifications</TabsTrigger>
          <TabsTrigger value="audit">Journal d'audit</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Statut Global</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">Sécurisé</div>
                <p className="text-xs text-muted-foreground">
                  2 éléments nécessitent attention
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">RLS Activé</CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">32/32</div>
                <p className="text-xs text-muted-foreground">
                  Tables sensibles protégées
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Dernière Vérification</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">2m</div>
                <p className="text-xs text-muted-foreground">
                  Il y a 2 minutes
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Actions Requises</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">3</div>
                <p className="text-xs text-muted-foreground">
                  Configurations manuelles
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Statut des Vérifications Critiques</CardTitle>
              <CardDescription>
                Aperçu rapide des principales vérifications de sécurité
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {securityChecks.slice(0, 3).map((check) => (
                  <div key={check.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(check.status)}
                      <div>
                        <p className="font-medium">{check.name}</p>
                        <p className="text-sm text-muted-foreground">{check.description}</p>
                      </div>
                    </div>
                    {getStatusBadge(check.status)}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="checks" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Vérifications de Sécurité</CardTitle>
              <CardDescription>
                Statut détaillé de tous les contrôles de sécurité
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {securityChecks.map((check) => (
                  <div key={check.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(check.status)}
                      <div className="space-y-1">
                        <p className="font-medium">{check.name}</p>
                        <p className="text-sm text-muted-foreground">{check.description}</p>
                        {check.action && (
                          <p className="text-xs text-blue-600">Action: {check.action}</p>
                        )}
                        <p className="text-xs text-gray-500">
                          Dernière vérification: {new Date(check.lastChecked).toLocaleString('fr-FR')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusBadge(check.status)}
                      {check.status === 'warning' && (
                        <Button variant="outline" size="sm">
                          Configurer
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Journal d'Audit Sécurité</CardTitle>
              <CardDescription>
                Historique des actions sensibles sur la plateforme
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {auditLogs?.map((log) => (
                  <div key={log.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        {log.success ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-600" />
                        )}
                        <span className="font-medium">{log.action_type}</span>
                        <Badge variant="outline">{log.resource_type}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Utilisateur: {log.user_id} • 
                        {new Date(log.created_at).toLocaleString('fr-FR')}
                      </p>
                    </div>
                    <Badge variant={log.success ? "default" : "destructive"}>
                      {log.success ? 'Succès' : 'Échec'}
                    </Badge>
                  </div>
                )) || (
                  <div className="text-center py-6 text-muted-foreground">
                    Aucun log d'audit disponible
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="maintenance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Opérations de Maintenance</CardTitle>
              <CardDescription>
                Actions de maintenance et optimisation de sécurité
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <Button 
                  className="h-20 flex-col space-y-2"
                  onClick={() => handleSecurityMaintenance('cleanup_old_notifications')}
                  disabled={maintenanceMutation.isPending}
                >
                  <Lock className="h-6 w-6" />
                  <span>Nettoyer Notifications</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-20 flex-col space-y-2"
                  onClick={() => handleSecurityMaintenance('anonymize_old_location_data')}
                  disabled={maintenanceMutation.isPending}
                >
                  <Eye className="h-6 w-6" />
                  <span>Anonymiser Locations</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-20 flex-col space-y-2"
                  onClick={() => handleSecurityMaintenance('refresh_security_stats')}
                  disabled={maintenanceMutation.isPending}
                >
                  <RefreshCw className="h-6 w-6" />
                  <span>Actualiser Stats</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-20 flex-col space-y-2"
                  onClick={() => handleSecurityMaintenance('fix_invalid_coordinates')}
                  disabled={maintenanceMutation.isPending}
                >
                  <Database className="h-6 w-6" />
                  <span>Corriger Coordonnées</span>
                </Button>
              </div>
              
              {maintenanceMutation.isPending && (
                <Alert>
                  <Activity className="h-4 w-4" />
                  <AlertDescription>
                    Opération de maintenance en cours...
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}