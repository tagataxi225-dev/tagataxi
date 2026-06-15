import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { UserPlus, Users, Trash2, Phone, User, Car, Percent, Settings, TrendingUp, Wallet } from 'lucide-react';
import { usePartnerDrivers } from '@/hooks/usePartnerDrivers';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { DriverCommissionRateDialog } from './DriverCommissionRateDialog';

export const PartnerDriverManager = () => {
  const { t } = useLanguage();
  const { 
    loading, 
    drivers, 
    addingDriver, 
    addDriverByCode, 
    removeDriver,
    fetchPartnerDrivers
  } = usePartnerDrivers();

  const [newDriverCode, setNewDriverCode] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [assignedVehicles, setAssignedVehicles] = useState<Record<string, any>>({});
  const [commissionDialogDriver, setCommissionDialogDriver] = useState<{
    id: string;
    driver_id: string;
    driver_name: string;
    commission_rate?: number;
  } | null>(null);

  // Charger les véhicules assignés
  useEffect(() => {
    loadAssignedVehicles();
  }, [drivers]);

  const loadAssignedVehicles = async () => {
    if (drivers.length === 0) return;

    const driverIds = drivers.map(d => d.id);
    const { data } = await supabase
      .from('partner_taxi_vehicles')
      .select('assigned_driver_id, name, license_plate')
      .in('assigned_driver_id', driverIds);

    if (data) {
      const vehicleMap: Record<string, any> = {};
      data.forEach(v => {
        if (v.assigned_driver_id) {
          vehicleMap[v.assigned_driver_id] = v;
        }
      });
      setAssignedVehicles(vehicleMap);
    }
  };

  const handleAddDriver = async () => {
    if (newDriverCode.length !== 8) {
      return;
    }

    const success = await addDriverByCode(newDriverCode);
    if (success) {
      setNewDriverCode('');
      setShowAddDialog(false);
    }
  };

  const handleRemoveDriver = async (assignmentId: string, driverId: string) => {
    await removeDriver(assignmentId, driverId);
  };

  return (
    <div className="space-y-4">
      {/* Compact add button - no redundant header */}
      <div className="flex justify-end">
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button size="sm" className="rounded-xl gap-2">
              <UserPlus className="h-4 w-4" />
              Ajouter
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ajouter un nouveau chauffeur</DialogTitle>
              <DialogDescription>
                Entrez le code unique du chauffeur pour l'ajouter à votre flotte
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="driver-code">Code Chauffeur (8 caractères)</Label>
                <Input
                  id="driver-code"
                  placeholder="Ex: ABC123XY"
                  value={newDriverCode}
                  onChange={(e) => setNewDriverCode(e.target.value.toUpperCase())}
                  maxLength={8}
                  className="font-mono"
                />
                <p className="text-xs text-muted-foreground">
                  Le chauffeur doit vous communiquer son code unique
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                Annuler
              </Button>
              <Button 
                onClick={handleAddDriver}
                disabled={newDriverCode.length !== 8 || addingDriver}
              >
                {addingDriver ? 'Ajout...' : 'Ajouter'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stat cards - modern design */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-card border border-border/50 rounded-2xl p-4 shadow-sm">
          <div className="flex flex-col items-center text-center gap-2">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/10 flex items-center justify-center">
              <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-xl font-bold">{drivers.filter(d => d.status === 'active').length}</p>
              <p className="text-xs text-muted-foreground font-medium">Actifs</p>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border/50 rounded-2xl p-4 shadow-sm">
          <div className="flex flex-col items-center text-center gap-2">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-xl font-bold">0</p>
              <p className="text-xs text-muted-foreground font-medium">Gains CDF</p>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border/50 rounded-2xl p-4 shadow-sm">
          <div className="flex flex-col items-center text-center gap-2">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500/20 to-violet-600/10 flex items-center justify-center">
              <Wallet className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <p className="text-xl font-bold">0</p>
              <p className="text-xs text-muted-foreground font-medium">Revenus CDF</p>
            </div>
          </div>
        </div>
      </div>

      {/* Drivers List - simplified container */}
      <div className="pt-2">
        <h4 className="font-semibold text-sm text-foreground mb-3">Mes Chauffeurs</h4>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground mt-2 text-sm">Chargement...</p>
          </div>
        ) : drivers.length === 0 ? (
          <div className="text-center py-10">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500/20 to-violet-500/20 flex items-center justify-center mx-auto mb-4">
              <Users className="h-7 w-7 text-blue-600 dark:text-blue-400" />
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Aucun chauffeur dans votre flotte
            </p>
            <Button variant="outline" size="sm" className="rounded-xl" onClick={() => setShowAddDialog(true)}>
              <UserPlus className="h-4 w-4 mr-2" />
              Ajouter votre premier chauffeur
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {drivers.map((driver) => (
              <div
                key={driver.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 border border-border/50 rounded-2xl bg-card hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center space-x-3 mb-3 sm:mb-0">
                  <div className="h-10 w-10 bg-gradient-to-br from-blue-500/20 to-blue-600/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm truncate">{driver.driver_name}</p>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-xs text-muted-foreground">
                      <span className="font-mono">Code: {driver.driver_code}</span>
                      {driver.driver_phone && (
                        <>
                          <span className="hidden sm:inline">•</span>
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            <span className="truncate">{driver.driver_phone}</span>
                          </span>
                        </>
                      )}
                    </div>
                    {assignedVehicles[driver.id] && (
                      <div className="flex items-center gap-1 mt-1 text-xs text-emerald-600 dark:text-emerald-400">
                        <Car className="h-3 w-3" />
                        <span>{assignedVehicles[driver.id].name} ({assignedVehicles[driver.id].license_plate})</span>
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Ajouté le {new Date(driver.added_at).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
                  <button 
                    onClick={() => setCommissionDialogDriver({
                      id: driver.id,
                      driver_id: driver.driver_id,
                      driver_name: driver.driver_name || 'Chauffeur',
                      commission_rate: driver.commission_rate
                    })}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 transition-colors cursor-pointer"
                  >
                    <Percent className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                      {driver.commission_rate ?? 2.5}%
                    </span>
                    <Settings className="h-3 w-3 text-emerald-600/50 dark:text-emerald-400/50" />
                  </button>
                  
                  <div className="flex items-center justify-between sm:justify-end gap-3">
                    <Badge 
                      variant={driver.status === 'active' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {driver.status === 'active' ? 'Actif' : 'Inactif'}
                    </Badge>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRemoveDriver(driver.id, driver.driver_id)}
                      className="h-8 w-8 p-0 rounded-xl"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Dialog de configuration du taux de commission */}
      <DriverCommissionRateDialog
        open={!!commissionDialogDriver}
        onOpenChange={(open) => !open && setCommissionDialogDriver(null)}
        driver={commissionDialogDriver}
        onSuccess={fetchPartnerDrivers}
      />
    </div>
  );
};
