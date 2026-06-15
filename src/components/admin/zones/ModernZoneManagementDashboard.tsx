import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  MapPin,
  Settings,
  BarChart3,
  Users,
  Plus,
  Download,
  Upload,
  AlertTriangle,
  CheckCircle,
  Clock,
  Map,
  List,
  DollarSign
} from 'lucide-react';
import { useZoneManagement } from '@/hooks/useZoneManagement';
import { InteractiveZoneMap } from './InteractiveZoneMap';
import { ZoneListView } from './ZoneListView';
import { ZonePricingEditor } from './ZonePricingEditor';
import { ZoneAnalyticsPanel } from './ZoneAnalyticsPanel';
import ZoneImportExport from './ZoneImportExport';
import { useToast } from '@/hooks/use-toast';

export const ModernZoneManagementDashboard: React.FC = () => {
  const {
    zones,
    zoneStatistics,
    zonePricingRules,
    loading,
    error,
    loadZones,
    loadZoneStatistics,
    loadZonePricingRules,
    createZone,
    updateZone,
    deleteZone,
    toggleZoneStatus,
    upsertPricingRule,
    calculateZoneStatistics,
  } = useZoneManagement();

  const [activeTab, setActiveTab] = useState('map');
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const [editingZoneId, setEditingZoneId] = useState<string | null>(null);
  const { toast } = useToast();

  // Charger les données supplémentaires quand une zone est sélectionnée
  useEffect(() => {
    if (selectedZoneId) {
      loadZoneStatistics(selectedZoneId);
      loadZonePricingRules(selectedZoneId);
    }
  }, [selectedZoneId]);

  const handleZoneSelect = (zoneId: string | null) => {
    setSelectedZoneId(zoneId);
  };

  const handleZoneCreate = async (zoneData: any) => {
    try {
      const newZone = await createZone(zoneData);
      setSelectedZoneId(newZone.id);
      toast({
        title: "Succès",
        description: "Zone créée avec succès",
      });
    } catch (error) {
      console.error('Erreur lors de la création:', error);
    }
  };

  const handleZoneUpdate = async (zoneId: string, updates: any) => {
    try {
      await updateZone(zoneId, updates);
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
    }
  };

  const handleZoneDelete = async (zoneId: string) => {
    try {
      await deleteZone(zoneId);
      if (selectedZoneId === zoneId) {
        setSelectedZoneId(null);
      }
      toast({
        title: "Succès",
        description: "Zone supprimée avec succès",
      });
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
    }
  };

  const handleZoneStatusChange = async (zoneId: string, status: string) => {
    try {
      await toggleZoneStatus(zoneId, status as any);
      toast({
        title: "Succès",
        description: `Statut de la zone mis à jour: ${status}`,
      });
    } catch (error) {
      console.error('Erreur lors du changement de statut:', error);
    }
  };

  const handlePricingRuleSave = async (rule: any) => {
    try {
      await upsertPricingRule(rule);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des prix:', error);
    }
  };

  const handleExportZones = () => {
    const exportData = {
      zones,
      statistics: zoneStatistics,
      pricing: zonePricingRules,
      exportedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `zones-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportZones = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        // Ici on pourrait implémenter la logique d'import
        console.log('Données à importer:', data);
        toast({
          title: "Import",
          description: "Fonctionnalité d'import en développement",
        });
      } catch (error) {
        toast({
          title: "Erreur",
          description: "Fichier invalide",
          variant: "destructive",
        });
      }
    };
    reader.readAsText(file);
  };

  const refreshZoneStatistics = async () => {
    if (selectedZoneId) {
      await calculateZoneStatistics(selectedZoneId);
    }
  };

  const selectedZone = zones.find(z => z.id === selectedZoneId);
  const selectedZoneStats = selectedZoneId ? zoneStatistics[selectedZoneId] : null;
  const selectedZonePricing = selectedZoneId ? zonePricingRules[selectedZoneId] || [] : [];

  // Statistiques globales
  const totalZones = zones.length;
  const activeZones = zones.filter(z => z.status === 'active').length;
  const inactiveZones = zones.filter(z => z.status === 'inactive').length;
  const maintenanceZones = zones.filter(z => z.status === 'maintenance').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Chargement des zones...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="m-6">
        <CardContent className="flex items-center justify-center h-96">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h3 className="text-lg font-semibold">Erreur de chargement</h3>
            <p className="text-muted-foreground">{error}</p>
            <Button onClick={loadZones} className="mt-4">
              Réessayer
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* En-tête avec statistiques globales */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-6 w-6" />
              Gestion des zones de service
            </CardTitle>
            
            <div className="flex items-center gap-2">
              <Button onClick={handleExportZones} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Exporter
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
              <div className="p-2 bg-primary rounded-lg">
                <MapPin className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <div className="text-2xl font-bold">{totalZones}</div>
                <div className="text-sm text-muted-foreground">Total zones</div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
              <div className="p-2 bg-success rounded-lg">
                <CheckCircle className="h-5 w-5 text-success-foreground" />
              </div>
              <div>
                <div className="text-2xl font-bold text-success">{activeZones}</div>
                <div className="text-sm text-muted-foreground">Actives</div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
              <div className="p-2 bg-destructive rounded-lg">
                <AlertTriangle className="h-5 w-5 text-destructive-foreground" />
              </div>
              <div>
                <div className="text-2xl font-bold text-destructive">{inactiveZones}</div>
                <div className="text-sm text-muted-foreground">Inactives</div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
              <div className="p-2 bg-warning rounded-lg">
                <Clock className="h-5 w-5 text-warning-foreground" />
              </div>
              <div>
                <div className="text-2xl font-bold text-warning">{maintenanceZones}</div>
                <div className="text-sm text-muted-foreground">Maintenance</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Interface principale avec onglets */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="map" className="flex items-center gap-2">
            <Map className="h-4 w-4" />
            Carte interactive
          </TabsTrigger>
          <TabsTrigger value="list" className="flex items-center gap-2">
            <List className="h-4 w-4" />
            Liste des zones
          </TabsTrigger>
          <TabsTrigger value="pricing" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Tarification
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="import-export" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Import/Export
          </TabsTrigger>
        </TabsList>

        <TabsContent value="map" className="space-y-6">
          <InteractiveZoneMap
            zones={zones}
            onZoneCreate={handleZoneCreate}
            onZoneUpdate={handleZoneUpdate}
            onZoneDelete={handleZoneDelete}
            selectedZoneId={selectedZoneId}
            onZoneSelect={handleZoneSelect}
          />
        </TabsContent>

        <TabsContent value="list" className="space-y-6">
          <ZoneListView
            zones={zones}
            zoneStatistics={zoneStatistics}
            onZoneSelect={handleZoneSelect}
            onZoneEdit={setEditingZoneId}
            onZoneDelete={handleZoneDelete}
            onZoneStatusChange={handleZoneStatusChange}
            onExport={handleExportZones}
            onImport={handleImportZones}
          />
        </TabsContent>

        <TabsContent value="pricing" className="space-y-6">
          {selectedZone ? (
            <ZonePricingEditor
              zone={selectedZone}
              pricingRules={selectedZonePricing}
              onSavePricingRule={handlePricingRuleSave}
              onDeletePricingRule={async (ruleId) => {
                // Implémenter la suppression de règle de tarification
                console.log('Supprimer règle:', ruleId);
              }}
            />
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-96">
                <div className="text-center">
                  <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold">Sélectionnez une zone</h3>
                  <p className="text-muted-foreground">
                    Choisissez une zone pour configurer sa tarification
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          {selectedZone && selectedZoneStats ? (
            <ZoneAnalyticsPanel
              zone={selectedZone}
              statistics={selectedZoneStats}
              onRefreshStats={refreshZoneStatistics}
            />
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-96">
                <div className="text-center">
                  <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold">Sélectionnez une zone</h3>
                  <p className="text-muted-foreground">
                    Choisissez une zone pour voir ses analytics détaillées
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="import-export" className="space-y-6">
          <ZoneImportExport
            zones={zones}
            onImport={handleZoneCreate}
            onExport={handleExportZones}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};