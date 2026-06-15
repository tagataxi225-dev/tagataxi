/**
 * Panel de migration Google Maps optimisé
 * Migration sélective, prévisualisation, rollback, monitoring détaillé
 */

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  MapPin, 
  Database, 
  CheckCircle, 
  AlertCircle, 
  Play,
  Pause,
  RotateCcw,
  Eye,
  Filter,
  Download,
  Upload,
  ArrowLeft,
  Activity,
  Clock,
  TrendingUp,
  AlertTriangle,
  Info,
  Settings,
  Zap
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface MigrationStatus {
  table_name: string;
  total_records: number;
  processed_records: number;
  failed_records: number;
  is_running: boolean;
  completed: boolean;
  last_updated: string;
  progress_percentage: number;
  estimated_completion: string;
  error_messages: string[];
}

interface MigrationConfig {
  batch_size: number;
  delay_between_batches: number;
  auto_retry: boolean;
  max_retries: number;
  backup_before_migration: boolean;
  validate_after_migration: boolean;
}

interface PreviewData {
  table_name: string;
  sample_records: any[];
  migration_preview: any[];
  potential_issues: string[];
}

interface EnhancedGoogleMigrationPanelProps {
  onBack: () => void;
}

export const EnhancedGoogleMigrationPanel: React.FC<EnhancedGoogleMigrationPanelProps> = ({ onBack }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedTables, setSelectedTables] = useState<string[]>([]);
  const [migrationConfig, setMigrationConfig] = useState<MigrationConfig>({
    batch_size: 50,
    delay_between_batches: 1000,
    auto_retry: true,
    max_retries: 3,
    backup_before_migration: true,
    validate_after_migration: true
  });

  // Statut de migration en temps réel
  const { data: migrationStatus, isLoading } = useQuery({
    queryKey: ['enhanced-migration-status'],
    queryFn: async () => {
      const tables = ['driver_locations', 'transport_bookings', 'delivery_orders'];
      const statuses: MigrationStatus[] = [];

      for (const table of tables) {
        try {
          // Récupérer le statut de migration pour chaque table
          const { data: migrationData } = await supabase.functions.invoke('migration-status', {
            body: { table_name: table }
          });

          // Calculer les métriques
          const totalRecords = migrationData?.total_count || 0;
          const processedRecords = migrationData?.processed_count || 0;
          const failedRecords = migrationData?.failed_count || 0;
          const progressPercentage = totalRecords > 0 ? (processedRecords / totalRecords) * 100 : 0;

          statuses.push({
            table_name: table,
            total_records: totalRecords,
            processed_records: processedRecords,
            failed_records: failedRecords,
            is_running: migrationData?.is_running || false,
            completed: progressPercentage >= 100,
            last_updated: migrationData?.last_updated || new Date().toISOString(),
            progress_percentage: progressPercentage,
            estimated_completion: migrationData?.estimated_completion || '',
            error_messages: migrationData?.errors || []
          });
        } catch (error) {
          console.error(`Error fetching status for ${table}:`, error);
          statuses.push({
            table_name: table,
            total_records: 0,
            processed_records: 0,
            failed_records: 0,
            is_running: false,
            completed: false,
            last_updated: new Date().toISOString(),
            progress_percentage: 0,
            estimated_completion: '',
            error_messages: ['Erreur de récupération du statut']
          });
        }
      }

      return statuses;
    },
    refetchInterval: 5000 // Refresh toutes les 5 secondes
  });

  // Analytics de migration
  const { data: migrationAnalytics } = useQuery({
    queryKey: ['migration-analytics'],
    queryFn: async () => {
      try {
        const { data } = await supabase.functions.invoke('migration-analytics');
        return {
          totalRecordsMigrated: data?.total_migrated || 0,
          averageMigrationTime: data?.avg_time || 0,
          successRate: data?.success_rate || 0,
          apiCallsUsed: data?.api_calls || 0,
          costEstimation: data?.cost || 0,
          lastMigrationDate: data?.last_migration || null,
          failureReasons: data?.failure_reasons || []
        };
      } catch (error) {
        return {
          totalRecordsMigrated: 0,
          averageMigrationTime: 0,
          successRate: 0,
          apiCallsUsed: 0,
          costEstimation: 0,
          lastMigrationDate: null,
          failureReasons: []
        };
      }
    }
  });

  // Prévisualisation de migration
  const { data: previewData, refetch: fetchPreview } = useQuery({
    queryKey: ['migration-preview', selectedTables],
    queryFn: async () => {
      if (selectedTables.length === 0) return [];

      const previews: PreviewData[] = [];
      
      for (const table of selectedTables) {
        try {
          const { data } = await supabase.functions.invoke('migration-preview', {
            body: { table_name: table, limit: 5 }
          });

          previews.push({
            table_name: table,
            sample_records: data?.sample_records || [],
            migration_preview: data?.migration_preview || [],
            potential_issues: data?.potential_issues || []
          });
        } catch (error) {
          console.error(`Error fetching preview for ${table}:`, error);
        }
      }

      return previews;
    },
    enabled: selectedTables.length > 0
  });

  // Démarrer migration sélective
  const startMigrationMutation = useMutation({
    mutationFn: async ({ tables, config }: { tables: string[], config: MigrationConfig }) => {
      const { data, error } = await supabase.functions.invoke('enhanced-migration-start', {
        body: { 
          tables, 
          config,
          user_id: (await supabase.auth.getUser()).data.user?.id 
        }
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enhanced-migration-status'] });
      toast({
        title: 'Migration démarrée',
        description: 'La migration des tables sélectionnées a commencé'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erreur de migration',
        description: error.message || 'Impossible de démarrer la migration',
        variant: 'destructive'
      });
    }
  });

  // Arrêter migration
  const stopMigrationMutation = useMutation({
    mutationFn: async (tableName: string) => {
      const { data, error } = await supabase.functions.invoke('migration-stop', {
        body: { table_name: tableName }
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enhanced-migration-status'] });
      toast({
        title: 'Migration arrêtée',
        description: 'La migration a été interrompue'
      });
    }
  });

  // Rollback migration
  const rollbackMigrationMutation = useMutation({
    mutationFn: async (tableName: string) => {
      const { data, error } = await supabase.functions.invoke('migration-rollback', {
        body: { table_name: tableName }
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enhanced-migration-status'] });
      toast({
        title: 'Rollback effectué',
        description: 'Les données ont été restaurées à leur état précédent'
      });
    }
  });

  const getStatusIcon = (status: MigrationStatus) => {
    if (status.is_running) return <Activity className="w-4 h-4 text-blue-500 animate-pulse" />;
    if (status.completed) return <CheckCircle className="w-4 h-4 text-green-500" />;
    if (status.failed_records > 0) return <AlertTriangle className="w-4 h-4 text-orange-500" />;
    return <Clock className="w-4 h-4 text-gray-500" />;
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const totalProgress = migrationStatus ? 
    migrationStatus.reduce((sum, status) => sum + status.progress_percentage, 0) / migrationStatus.length : 0;

  const isAnyRunning = migrationStatus?.some(status => status.is_running) || false;

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
              <h1 className="text-xl font-bold">Migration Google Maps Avancée</h1>
              <p className="text-sm text-muted-foreground">
                Migration sélective avec prévisualisation et rollback
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={isAnyRunning ? "default" : "secondary"}>
              {isAnyRunning ? 'En cours' : 'Inactive'}
            </Badge>
            <div className="text-sm">
              Progression globale: {totalProgress.toFixed(1)}%
            </div>
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
            <TabsTrigger value="selective">
              <Database className="h-4 w-4 mr-1" />
              Migration Sélective
            </TabsTrigger>
            <TabsTrigger value="monitoring">
              <TrendingUp className="h-4 w-4 mr-1" />
              Monitoring
            </TabsTrigger>
            <TabsTrigger value="history">
              <Clock className="h-4 w-4 mr-1" />
              Historique
            </TabsTrigger>
            <TabsTrigger value="settings">
              <Settings className="h-4 w-4 mr-1" />
              Configuration
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {/* Statistiques globales */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Database className="h-4 w-4 text-blue-500" />
                    <div>
                      <p className="text-sm text-muted-foreground">Enregistrements</p>
                      <p className="text-2xl font-bold">{migrationAnalytics?.totalRecordsMigrated || 0}</p>
                      <p className="text-xs text-green-600">Migrés avec succès</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-500" />
                    <div>
                      <p className="text-sm text-muted-foreground">Taux de succès</p>
                      <p className="text-2xl font-bold">{(migrationAnalytics?.successRate || 0).toFixed(1)}%</p>
                      <p className="text-xs text-muted-foreground">Fiabilité</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-purple-500" />
                    <div>
                      <p className="text-sm text-muted-foreground">Temps moyen</p>
                      <p className="text-2xl font-bold">
                        {formatDuration(migrationAnalytics?.averageMigrationTime || 0)}
                      </p>
                      <p className="text-xs text-muted-foreground">Par enregistrement</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-orange-500" />
                    <div>
                      <p className="text-sm text-muted-foreground">Appels API</p>
                      <p className="text-2xl font-bold">{migrationAnalytics?.apiCallsUsed || 0}</p>
                      <p className="text-xs text-muted-foreground">Google Maps</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Progression par table */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {migrationStatus?.map((status) => (
                <Card key={status.table_name}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      {getStatusIcon(status)}
                      {status.table_name.replace('_', ' ').toUpperCase()}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progression</span>
                        <span>{status.processed_records} / {status.total_records}</span>
                      </div>
                      <Progress value={status.progress_percentage} className="h-2" />
                      <div className="text-xs text-muted-foreground">
                        {status.progress_percentage.toFixed(1)}% complété
                      </div>
                    </div>

                    {status.failed_records > 0 && (
                      <div className="flex items-center gap-2 text-xs text-orange-600">
                        <AlertTriangle className="h-3 w-3" />
                        {status.failed_records} échecs
                      </div>
                    )}

                    {status.is_running && (
                      <div className="flex items-center gap-2 text-xs text-blue-600">
                        <Activity className="h-3 w-3 animate-pulse" />
                        Temps estimé: {status.estimated_completion}
                      </div>
                    )}

                    <div className="flex gap-2">
                      {status.is_running ? (
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="flex-1"
                          onClick={() => stopMigrationMutation.mutate(status.table_name)}
                        >
                          <Pause className="h-3 w-3 mr-1" />
                          Arrêter
                        </Button>
                      ) : (
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="flex-1"
                          onClick={() => startMigrationMutation.mutate({ 
                            tables: [status.table_name], 
                            config: migrationConfig 
                          })}
                        >
                          <Play className="h-3 w-3 mr-1" />
                          Démarrer
                        </Button>
                      )}
                      
                      {status.processed_records > 0 && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => rollbackMigrationMutation.mutate(status.table_name)}
                        >
                          <RotateCcw className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
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
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <Button 
                    variant="outline" 
                    className="h-20 flex flex-col"
                    onClick={() => startMigrationMutation.mutate({ 
                      tables: ['driver_locations', 'transport_bookings', 'delivery_orders'], 
                      config: migrationConfig 
                    })}
                    disabled={isAnyRunning}
                  >
                    <Play className="h-6 w-6 mb-2" />
                    Migration Complète
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-20 flex flex-col"
                    onClick={() => setActiveTab('selective')}
                  >
                    <Filter className="h-6 w-6 mb-2" />
                    Migration Sélective
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-20 flex flex-col"
                    onClick={() => setActiveTab('monitoring')}
                  >
                    <Activity className="h-6 w-6 mb-2" />
                    Monitoring Live
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-20 flex flex-col"
                  >
                    <Download className="h-6 w-6 mb-2" />
                    Export Rapport
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="selective" className="space-y-4">
            {/* Sélection de tables */}
            <Card>
              <CardHeader>
                <CardTitle>Sélection des Tables à Migrer</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {['driver_locations', 'transport_bookings', 'delivery_orders'].map((table) => (
                    <div key={table} className="flex items-center space-x-2 p-3 border rounded-lg">
                      <Checkbox 
                        id={table}
                        checked={selectedTables.includes(table)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedTables([...selectedTables, table]);
                          } else {
                            setSelectedTables(selectedTables.filter(t => t !== table));
                          }
                        }}
                      />
                      <div className="flex-1">
                        <label htmlFor={table} className="font-medium cursor-pointer">
                          {table.replace('_', ' ').toUpperCase()}
                        </label>
                        <p className="text-sm text-muted-foreground">
                          {migrationStatus?.find(s => s.table_name === table)?.total_records || 0} enregistrements
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <Button 
                    onClick={() => fetchPreview()}
                    disabled={selectedTables.length === 0}
                    variant="outline"
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Prévisualiser
                  </Button>
                  <Button 
                    onClick={() => startMigrationMutation.mutate({ 
                      tables: selectedTables, 
                      config: migrationConfig 
                    })}
                    disabled={selectedTables.length === 0 || isAnyRunning}
                  >
                    <Play className="h-4 w-4 mr-1" />
                    Démarrer Migration
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Prévisualisation */}
            {previewData && previewData.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Prévisualisation de Migration</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {previewData.map((preview) => (
                      <div key={preview.table_name} className="border rounded-lg p-4">
                        <h4 className="font-medium mb-3">{preview.table_name}</h4>
                        
                        {preview.potential_issues.length > 0 && (
                          <div className="mb-3 p-3 bg-orange-50 border border-orange-200 rounded">
                            <div className="flex items-center gap-2 mb-2">
                              <AlertTriangle className="h-4 w-4 text-orange-600" />
                              <span className="font-medium text-orange-600">Issues potentielles</span>
                            </div>
                            <ul className="text-sm text-orange-700 space-y-1">
                              {preview.potential_issues.map((issue, index) => (
                                <li key={index}>• {issue}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <h5 className="font-medium mb-2">Données actuelles (échantillon)</h5>
                            <pre className="bg-gray-50 p-2 rounded text-xs overflow-x-auto">
                              {JSON.stringify(preview.sample_records.slice(0, 2), null, 2)}
                            </pre>
                          </div>
                          <div>
                            <h5 className="font-medium mb-2">Après migration (prévisualisation)</h5>
                            <pre className="bg-green-50 p-2 rounded text-xs overflow-x-auto">
                              {JSON.stringify(preview.migration_preview.slice(0, 2), null, 2)}
                            </pre>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="monitoring" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Monitoring en Temps Réel</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Monitoring détaillé avec logs en temps réel en cours d'implémentation...
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            {/* Configuration de migration */}
            <Card>
              <CardHeader>
                <CardTitle>Configuration de Migration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Taille des lots</label>
                    <Input 
                      type="number" 
                      value={migrationConfig.batch_size}
                      onChange={(e) => setMigrationConfig({
                        ...migrationConfig,
                        batch_size: parseInt(e.target.value) || 50
                      })}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Délai entre lots (ms)</label>
                    <Input 
                      type="number" 
                      value={migrationConfig.delay_between_batches}
                      onChange={(e) => setMigrationConfig({
                        ...migrationConfig,
                        delay_between_batches: parseInt(e.target.value) || 1000
                      })}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="auto-retry"
                      checked={migrationConfig.auto_retry}
                      onCheckedChange={(checked) => setMigrationConfig({
                        ...migrationConfig,
                        auto_retry: checked as boolean
                      })}
                    />
                    <label htmlFor="auto-retry" className="text-sm">Retry automatique en cas d'échec</label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="backup"
                      checked={migrationConfig.backup_before_migration}
                      onCheckedChange={(checked) => setMigrationConfig({
                        ...migrationConfig,
                        backup_before_migration: checked as boolean
                      })}
                    />
                    <label htmlFor="backup" className="text-sm">Sauvegarde avant migration</label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="validate"
                      checked={migrationConfig.validate_after_migration}
                      onCheckedChange={(checked) => setMigrationConfig({
                        ...migrationConfig,
                        validate_after_migration: checked as boolean
                      })}
                    />
                    <label htmlFor="validate" className="text-sm">Validation après migration</label>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};