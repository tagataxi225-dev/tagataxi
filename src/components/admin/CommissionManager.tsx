import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Settings, Percent, History, Save, Plus } from 'lucide-react';

interface CommissionSetting {
  id: string;
  service_type: string;
  admin_rate: number;
  driver_rate: number;
  platform_rate: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

interface CommissionHistory {
  id: string;
  service_type: string;
  old_rates: any;
  new_rates: any;
  changed_by: string;
  changed_at: string;
  reason?: string;
}

export const CommissionManager = () => {
  const [commissionSettings, setCommissionSettings] = useState<CommissionSetting[]>([]);
  const [commissionHistory, setCommissionHistory] = useState<CommissionHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedService, setSelectedService] = useState('transport');
  const [rates, setRates] = useState({
    admin_rate: 10,
    driver_rate: 85,
    platform_rate: 5
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchCommissionSettings();
    fetchCommissionHistory();
  }, []);

  const fetchCommissionSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('commission_settings')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCommissionSettings(data || []);
    } catch (error: any) {
      console.error('Error fetching commission settings:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les paramètres de commission",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCommissionHistory = async () => {
    try {
      // Note: This would require a commission_history table to be created
      // For now, we'll show a placeholder
      setCommissionHistory([]);
    } catch (error: any) {
      console.error('Error fetching commission history:', error);
    }
  };

  const validateRates = () => {
    if (selectedService === 'wallet_topup') {
      // Pour wallet_topup, seul admin_rate compte (frais de rechargement)
      if (rates.admin_rate < 0 || rates.admin_rate > 10) {
        throw new Error('Les frais doivent être entre 0% et 10%');
      }
      return;
    }
    
    // Validation classique pour les autres services
    const total = rates.admin_rate + rates.driver_rate + rates.platform_rate;
    if (Math.abs(total - 100) > 0.01) {
      throw new Error('La somme des taux doit être égale à 100%');
    }
    if (rates.admin_rate < 0 || rates.driver_rate < 0 || rates.platform_rate < 0) {
      throw new Error('Les taux ne peuvent pas être négatifs');
    }
  };

  const saveCommissionSettings = async () => {
    try {
      setSaving(true);
      validateRates();

      // Check if setting already exists for this service
      const existingSetting = commissionSettings.find(
        setting => setting.service_type === selectedService && setting.is_active
      );

      if (existingSetting) {
        // Deactivate old setting
        await supabase
          .from('commission_settings')
          .update({ is_active: false })
          .eq('id', existingSetting.id);
      }

      // Create new setting
      const { error } = await supabase
        .from('commission_settings')
        .insert({
          service_type: selectedService,
          admin_rate: rates.admin_rate,
          driver_rate: rates.driver_rate,
          platform_rate: rates.platform_rate,
          is_active: true
        });

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Paramètres de commission sauvegardés avec succès",
      });

      fetchCommissionSettings();
    } catch (error: any) {
      console.error('Error saving commission settings:', error);
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de la sauvegarde",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const loadExistingRates = (service: string) => {
    const existingSetting = commissionSettings.find(
      setting => setting.service_type === service && setting.is_active
    );
    
    if (existingSetting) {
      setRates({
        admin_rate: existingSetting.admin_rate,
        driver_rate: existingSetting.driver_rate,
        platform_rate: existingSetting.platform_rate
      });
    } else {
      // Default rates based on service type
      if (service === 'wallet_topup') {
        setRates({
          admin_rate: 1,
          driver_rate: 0,
          platform_rate: 99
        });
      } else {
        setRates({
          admin_rate: 10,
          driver_rate: 85,
          platform_rate: 5
        });
      }
    }
  };

  useEffect(() => {
    loadExistingRates(selectedService);
  }, [selectedService, commissionSettings]);

  const rateLabels: Record<string, { admin: string; driver: string; platform: string }> = {
    transport: { admin: 'Taux Admin (%)', driver: 'Taux Chauffeur (%)', platform: 'Taux Plateforme (%)' },
    delivery: { admin: 'Taux Admin (%)', driver: 'Taux Livreur (%)', platform: 'Taux Plateforme (%)' },
    marketplace: { admin: 'Commission Plateforme (%)', driver: 'Commission Livreur (%)', platform: 'Part Vendeur (%)' },
    rental: { admin: 'Commission Plateforme (%)', driver: 'Non utilisé (%)', platform: 'Part Partenaire (%)' },
  };
  const currentLabels = rateLabels[selectedService] || { admin: 'Taux Admin (%)', driver: 'Taux Chauffeur (%)', platform: 'Taux Plateforme (%)' };

  const totalRate = selectedService === 'wallet_topup'
    ? rates.admin_rate
    : rates.admin_rate + rates.driver_rate + rates.platform_rate;
  const isValidTotal = selectedService === 'wallet_topup'
    ? rates.admin_rate >= 0 && rates.admin_rate <= 10
    : Math.abs(totalRate - 100) < 0.01;

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Settings className="h-6 w-6" />
          Gestion des Commissions
        </h2>
      </div>

      <Tabs defaultValue="settings" className="space-y-4">
        <TabsList>
          <TabsTrigger value="settings">Paramètres</TabsTrigger>
          <TabsTrigger value="current">Taux Actuels</TabsTrigger>
          <TabsTrigger value="history">Historique</TabsTrigger>
        </TabsList>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Percent className="h-5 w-5" />
                Configuration des Taux de Commission
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="service_type">Type de Service</Label>
                <Select value={selectedService} onValueChange={setSelectedService}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un service" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="transport">Transport VTC</SelectItem>
                    <SelectItem value="delivery">Livraison</SelectItem>
                    <SelectItem value="wallet_topup">Rechargement Wallet</SelectItem>
                    <SelectItem value="marketplace">Marketplace</SelectItem>
                    <SelectItem value="rental">Location Véhicules</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {selectedService === 'wallet_topup' ? (
                <div className="space-y-2">
                  <Label htmlFor="admin_rate">Frais de rechargement (%)</Label>
                  <Input
                    id="admin_rate"
                    type="number"
                    min="0"
                    max="10"
                    step="0.1"
                    value={rates.admin_rate}
                    onChange={(e) => setRates(prev => ({
                      admin_rate: parseFloat(e.target.value) || 0,
                      driver_rate: 0,
                      platform_rate: 100 - (parseFloat(e.target.value) || 0)
                    }))}
                  />
                  <p className="text-sm text-muted-foreground">
                    Frais prélevés sur chaque rechargement de wallet TAGAPay
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="admin_rate">{currentLabels.admin}</Label>
                    <Input
                      id="admin_rate"
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={rates.admin_rate}
                      onChange={(e) => setRates(prev => ({
                        ...prev,
                        admin_rate: parseFloat(e.target.value) || 0
                      }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="driver_rate">{currentLabels.driver}</Label>
                    <Input
                      id="driver_rate"
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={rates.driver_rate}
                      onChange={(e) => setRates(prev => ({
                        ...prev,
                        driver_rate: parseFloat(e.target.value) || 0
                      }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="platform_rate">{currentLabels.platform}</Label>
                    <Input
                      id="platform_rate"
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={rates.platform_rate}
                      onChange={(e) => setRates(prev => ({
                        ...prev,
                        platform_rate: parseFloat(e.target.value) || 0
                      }))}
                    />
                  </div>
                </div>
              )}

              {selectedService !== 'wallet_topup' && (
                <>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <span className="font-medium">Total des taux:</span>
                    <Badge variant={isValidTotal ? "default" : "destructive"}>
                      {totalRate.toFixed(2)}%
                    </Badge>
                  </div>

                  {!isValidTotal && (
                    <Alert>
                      <AlertDescription>
                        Le total des taux doit être égal à 100%. Actuellement: {totalRate.toFixed(2)}%
                      </AlertDescription>
                    </Alert>
                  )}
                </>
              )}
              
              {selectedService === 'wallet_topup' && !isValidTotal && (
                <Alert>
                  <AlertDescription>
                    Les frais doivent être entre 0% et 10%. Actuellement: {totalRate.toFixed(2)}%
                  </AlertDescription>
                </Alert>
              )}

              <Button 
                onClick={saveCommissionSettings}
                disabled={saving || !isValidTotal}
                className="w-full"
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Sauvegarde...' : 'Sauvegarder les Paramètres'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="current">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {commissionSettings
              .filter(setting => setting.is_active)
              .map((setting) => (
                <Card key={setting.id}>
                  <CardHeader>
                    <CardTitle className="capitalize flex items-center justify-between">
                      {setting.service_type}
                      <Badge variant="default">Actif</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {setting.service_type === 'wallet_topup' ? (
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span>Frais de rechargement:</span>
                          <span className="font-semibold text-lg">{setting.admin_rate}%</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Prélevés sur chaque rechargement de wallet
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span>Admin:</span>
                          <span className="font-semibold">{setting.admin_rate}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Chauffeur:</span>
                          <span className="font-semibold">{setting.driver_rate}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Plateforme:</span>
                          <span className="font-semibold">{setting.platform_rate}%</span>
                        </div>
                        <div className="border-t pt-2">
                          <div className="flex justify-between">
                            <span className="font-medium">Total:</span>
                            <span className="font-bold">
                              {(setting.admin_rate + setting.driver_rate + setting.platform_rate).toFixed(2)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
          </div>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Historique des Modifications
              </CardTitle>
            </CardHeader>
            <CardContent>
              {commissionHistory.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Aucun historique disponible
                </div>
              ) : (
                <div className="space-y-4">
                  {commissionHistory.map((history) => (
                    <div key={history.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-medium capitalize">{history.service_type}</span>
                        <span className="text-sm text-muted-foreground">
                          {new Date(history.changed_at).toLocaleDateString()}
                        </span>
                      </div>
                      {/* History details would go here */}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};