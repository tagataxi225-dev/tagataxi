import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Percent, Save, Settings, TrendingUp, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CommissionSettings {
  id: string;
  service_type: string;
  admin_rate: number;
  driver_rate: number;
  platform_rate: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface DeliveryFees {
  id: string;
  service_type: string;
  base_fee: number;
  currency: string;
  is_active: boolean;
}

export const MarketplaceCommissionManager: React.FC = () => {
  const [commissionSettings, setCommissionSettings] = useState<CommissionSettings | null>(null);
  const [deliveryFees, setDeliveryFees] = useState<DeliveryFees | null>(null);
  const [newRates, setNewRates] = useState({
    admin_rate: 15,
    platform_rate: 85,
    driver_rate: 0
  });
  const [newDeliveryFee, setNewDeliveryFee] = useState(7000);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const fetchSettings = async () => {
    try {
      setLoading(true);

      // Récupérer les paramètres de commission marketplace
      const { data: commission, error: commissionError } = await supabase
        .from('commission_settings')
        .select('*')
        .eq('service_type', 'marketplace')
        .eq('is_active', true)
        .single();

      if (commissionError && commissionError.code !== 'PGRST116') throw commissionError;

      if (commission) {
        setCommissionSettings(commission);
        setNewRates({
          admin_rate: commission.admin_rate,
          platform_rate: commission.platform_rate,
          driver_rate: commission.driver_rate
        });
      }

      // Récupérer les frais de livraison
      const { data: delivery, error: deliveryError } = await supabase
        .from('delivery_fees')
        .select('*')
        .eq('service_type', 'marketplace')
        .eq('is_active', true)
        .single();

      if (deliveryError && deliveryError.code !== 'PGRST116') throw deliveryError;

      if (delivery) {
        setDeliveryFees(delivery);
        setNewDeliveryFee(delivery.base_fee);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des paramètres:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les paramètres de commission",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const validateRates = () => {
    const total = newRates.admin_rate + newRates.platform_rate + newRates.driver_rate;
    return total === 100 && newRates.admin_rate >= 0 && newRates.platform_rate >= 0 && newRates.driver_rate >= 0;
  };

  const saveCommissionSettings = async () => {
    if (!validateRates()) {
      toast({
        title: "Erreur de validation",
        description: "Les taux doivent totaliser 100% et être positifs",
        variant: "destructive"
      });
      return;
    }

    try {
      setSaving(true);

      // Désactiver l'ancien paramètre
      if (commissionSettings) {
        await supabase
          .from('commission_settings')
          .update({ is_active: false })
          .eq('id', commissionSettings.id);
      }

      // Créer le nouveau paramètre
      const { data, error } = await supabase
        .from('commission_settings')
        .insert({
          service_type: 'marketplace',
          admin_rate: newRates.admin_rate,
          driver_rate: newRates.driver_rate,
          platform_rate: newRates.platform_rate,
          is_active: true
        })
        .select()
        .single();

      if (error) throw error;

      setCommissionSettings(data);
      toast({
        title: "Paramètres sauvegardés",
        description: "Les nouveaux taux de commission ont été appliqués"
      });
    } catch (error: any) {
      console.error('Erreur lors de la sauvegarde:', error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de sauvegarder les paramètres",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const saveDeliveryFees = async () => {
    if (newDeliveryFee < 0) {
      toast({
        title: "Erreur de validation",
        description: "Les frais de livraison doivent être positifs",
        variant: "destructive"
      });
      return;
    }

    try {
      setSaving(true);

      if (deliveryFees) {
        // Mettre à jour les frais existants
        const { data, error } = await supabase
          .from('delivery_fees')
          .update({ base_fee: newDeliveryFee })
          .eq('id', deliveryFees.id)
          .select()
          .single();

        if (error) throw error;
        setDeliveryFees(data);
      } else {
        // Créer de nouveaux frais
        const { data, error } = await supabase
          .from('delivery_fees')
          .insert({
            service_type: 'marketplace',
            base_fee: newDeliveryFee,
            currency: 'XOF',
            is_active: true
          })
          .select()
          .single();

        if (error) throw error;
        setDeliveryFees(data);
      }

      toast({
        title: "Frais de livraison mis à jour",
        description: `Nouveau tarif: ${newDeliveryFee.toLocaleString()} CDF`
      });
    } catch (error: any) {
      console.error('Erreur lors de la sauvegarde:', error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de sauvegarder les frais de livraison",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('fr-CD', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0
    }).format(amount).replace('XOF', 'XOF');
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4">
          {[...Array(2)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse space-y-3">
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                  <div className="h-8 bg-muted rounded w-3/4"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const isRateValid = validateRates();
  const totalRate = newRates.admin_rate + newRates.platform_rate + newRates.driver_rate;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <Settings className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Configuration Marketplace</h1>
          <p className="text-muted-foreground">Gestion des commissions et frais</p>
        </div>
      </div>

      {/* Paramètres de commission */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Percent className="h-5 w-5" />
            <span>Taux de commission Marketplace</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <Label htmlFor="admin_rate">Commission Tembea (%)</Label>
              <Input
                id="admin_rate"
                type="number"
                min="0"
                max="100"
                value={newRates.admin_rate}
                onChange={(e) => setNewRates(prev => ({
                  ...prev,
                  admin_rate: parseFloat(e.target.value) || 0
                }))}
                className="mt-1"
              />
              <p className="text-sm text-muted-foreground mt-1">
                Frais retenus par Tembea par vente
              </p>
            </div>

            <div>
              <Label htmlFor="platform_rate">Part vendeur (%)</Label>
              <Input
                id="platform_rate"
                type="number"
                min="0"
                max="100"
                value={newRates.platform_rate}
                onChange={(e) => setNewRates(prev => ({
                  ...prev,
                  platform_rate: parseFloat(e.target.value) || 0
                }))}
                className="mt-1"
              />
              <p className="text-sm text-muted-foreground mt-1">
                Montant reversé au vendeur
              </p>
            </div>

            <div>
              <Label htmlFor="driver_rate">Part livreur (%)</Label>
              <Input
                id="driver_rate"
                type="number"
                min="0"
                max="100"
                value={newRates.driver_rate}
                onChange={(e) => setNewRates(prev => ({
                  ...prev,
                  driver_rate: parseFloat(e.target.value) || 0
                }))}
                className="mt-1"
                disabled
              />
              <p className="text-sm text-muted-foreground mt-1">
                Réservé pour usage futur
              </p>
            </div>
          </div>

          <div className="bg-muted p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="font-medium">Total des taux:</span>
              <Badge variant={isRateValid ? "default" : "destructive"}>
                {totalRate}%
              </Badge>
            </div>
            {!isRateValid && (
              <Alert className="mt-3">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Le total doit être exactement 100% et tous les taux doivent être positifs
                </AlertDescription>
              </Alert>
            )}
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">Exemple sur une vente de 50 000 CDF:</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Prix payé par le client:</span>
                <span className="font-medium">50 000 CDF</span>
              </div>
              <div className="flex justify-between">
                <span>Commission Tembea ({newRates.admin_rate}%):</span>
                <span className="text-red-600 font-medium">-{formatAmount(50000 * newRates.admin_rate / 100)}</span>
              </div>
              <div className="flex justify-between">
                <span>Montant vendeur ({newRates.platform_rate}%):</span>
                <span className="text-green-600 font-medium">{formatAmount(50000 * newRates.platform_rate / 100)}</span>
              </div>
            </div>
          </div>

          <Button
            onClick={saveCommissionSettings}
            disabled={!isRateValid || saving}
            className="w-full"
          >
            <Save className="mr-2 h-4 w-4" />
            {saving ? 'Sauvegarde...' : 'Sauvegarder les taux de commission'}
          </Button>
        </CardContent>
      </Card>

      {/* Frais de livraison */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5" />
            <span>Frais de livraison standard</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="delivery_fee">Frais de livraison (CDF)</Label>
            <Input
              id="delivery_fee"
              type="number"
              min="0"
              value={newDeliveryFee}
              onChange={(e) => setNewDeliveryFee(parseFloat(e.target.value) || 0)}
              className="mt-1"
            />
            <p className="text-sm text-muted-foreground mt-1">
              Frais fixe payé par le client pour la livraison
            </p>
          </div>

          <div className="bg-yellow-50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">Information importante:</h4>
            <p className="text-sm text-muted-foreground">
              Les frais de livraison sont payés par le client en plus du prix du produit. 
              Ces frais ne sont pas soumis à la commission Tembea.
            </p>
          </div>

          <Button
            onClick={saveDeliveryFees}
            disabled={saving || newDeliveryFee < 0}
            className="w-full"
          >
            <Save className="mr-2 h-4 w-4" />
            {saving ? 'Sauvegarde...' : 'Sauvegarder les frais de livraison'}
          </Button>
        </CardContent>
      </Card>

      {/* Paramètres actuels */}
      {commissionSettings && (
        <Card>
          <CardHeader>
            <CardTitle>Paramètres actuels</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h4 className="font-medium mb-2">Commission Marketplace</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Commission Tembea:</span>
                    <Badge variant="outline">{commissionSettings.admin_rate}%</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Part vendeur:</span>
                    <Badge variant="outline">{commissionSettings.platform_rate}%</Badge>
                  </div>
                </div>
              </div>
              
              {deliveryFees && (
                <div>
                  <h4 className="font-medium mb-2">Frais de livraison</h4>
                  <div className="text-sm">
                    <div className="flex justify-between">
                      <span>Tarif standard:</span>
                      <Badge variant="outline">{formatAmount(deliveryFees.base_fee)}</Badge>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <Separator className="my-4" />
            
            <p className="text-xs text-muted-foreground">
              Dernière modification: {new Date(commissionSettings.updated_at).toLocaleDateString('fr-FR')}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};