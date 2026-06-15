import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Percent, DollarSign, Save, Plus, Trash2 } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface CommissionConfig {
  id: string;
  service_type: string;
  commission_rate: number;
  fixed_fee: number;
  currency: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const MarketplaceCommissionSettings: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<CommissionConfig | null>(null);
  const [serviceType, setServiceType] = useState('marketplace');
  const [commissionRate, setCommissionRate] = useState('5.00');
  const [fixedFee, setFixedFee] = useState('0');

  // Récupérer les configurations de commission
  const { data: configs, isLoading } = useQuery({
    queryKey: ['marketplace-commission-configs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('marketplace_commission_config')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as CommissionConfig[];
    }
  });

  // Mutation pour créer/modifier
  const saveMutation = useMutation({
    mutationFn: async () => {
      const configData = {
        service_type: serviceType,
        commission_rate: parseFloat(commissionRate),
        fixed_fee: parseFloat(fixedFee),
        currency: 'CDF',
        is_active: true
      };

      if (editingConfig) {
        const { data, error } = await supabase
          .from('marketplace_commission_config')
          .update(configData)
          .eq('id', editingConfig.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('marketplace_commission_config')
          .insert(configData)
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketplace-commission-configs'] });
      toast({
        title: editingConfig ? 'Configuration mise à jour' : 'Configuration créée',
        description: 'Les nouveaux taux de commission seront appliqués aux prochaines ventes',
      });
      closeDialog();
    },
    onError: (error) => {
      toast({
        title: 'Erreur',
        description: `Impossible de sauvegarder: ${error.message}`,
        variant: 'destructive',
      });
    }
  });

  // Mutation pour désactiver
  const deactivateMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('marketplace_commission_config')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketplace-commission-configs'] });
      toast({
        title: 'Configuration désactivée',
        description: 'La configuration a été désactivée',
      });
    }
  });

  const openDialog = (config?: CommissionConfig) => {
    if (config) {
      setEditingConfig(config);
      setServiceType(config.service_type);
      setCommissionRate(config.commission_rate.toString());
      setFixedFee(config.fixed_fee.toString());
    } else {
      setEditingConfig(null);
      setServiceType('marketplace');
      setCommissionRate('5.00');
      setFixedFee('0');
    }
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingConfig(null);
  };

  const calculateExample = () => {
    const amount = 10000;
    const rate = parseFloat(commissionRate) || 0;
    const fee = parseFloat(fixedFee) || 0;
    const commission = (amount * rate / 100) + fee;
    const net = amount - commission;

    return { amount, commission: commission.toFixed(2), net: net.toFixed(2) };
  };

  const example = calculateExample();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Percent className="w-5 h-5" />
                Configuration des commissions marketplace
              </CardTitle>
              <CardDescription>
                Gérez les taux de commission prélevés sur les ventes des vendeurs
              </CardDescription>
            </div>
            <Button onClick={() => openDialog()}>
              <Plus className="w-4 h-4 mr-2" />
              Nouvelle config
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Info box */}
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              💡 <strong>Fonctionnement automatique :</strong> Lorsqu'une commande passe au statut "completed" ou "delivered", 
              la commission est automatiquement calculée et déduite du montant total. Le vendeur reçoit le montant net.
            </p>
          </div>

          {isLoading ? (
            <div className="text-center p-8">Chargement...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Service</TableHead>
                  <TableHead>Taux de commission</TableHead>
                  <TableHead>Frais fixes</TableHead>
                  <TableHead>Devise</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Créé le</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {configs?.map((config) => (
                  <TableRow key={config.id}>
                    <TableCell className="font-medium">
                      {config.service_type}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {config.commission_rate}%
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {config.fixed_fee > 0 ? `${config.fixed_fee} ${config.currency}` : '-'}
                    </TableCell>
                    <TableCell>{config.currency}</TableCell>
                    <TableCell>
                      <Badge variant={config.is_active ? 'default' : 'secondary'}>
                        {config.is_active ? 'Actif' : 'Inactif'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(config.created_at).toLocaleDateString('fr-FR')}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openDialog(config)}
                        >
                          Modifier
                        </Button>
                        {config.is_active && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => deactivateMutation.mutate(config.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}

                {configs?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center p-8 text-muted-foreground">
                      Aucune configuration trouvée
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingConfig ? 'Modifier la configuration' : 'Nouvelle configuration de commission'}
            </DialogTitle>
            <DialogDescription>
              Définissez le taux de commission et les frais fixes pour ce service
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Type de service</Label>
              <Input
                value={serviceType}
                onChange={(e) => setServiceType(e.target.value)}
                placeholder="marketplace"
              />
            </div>

            <div>
              <Label>Taux de commission (%)</Label>
              <div className="relative">
                <Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={commissionRate}
                  onChange={(e) => setCommissionRate(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <Label>Frais fixes (CDF)</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={fixedFee}
                  onChange={(e) => setFixedFee(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Exemple de calcul */}
            <div className="p-4 bg-muted rounded-lg space-y-2">
              <p className="text-sm font-medium">Exemple de calcul (vente de 10 000 CDF)</p>
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Montant brut:</span>
                  <span className="font-medium">{example.amount} CDF</span>
                </div>
                <div className="flex justify-between text-red-600">
                  <span>Commission déduite:</span>
                  <span className="font-medium">- {example.commission} CDF</span>
                </div>
                <div className="flex justify-between pt-2 border-t font-semibold text-green-600">
                  <span>Montant net vendeur:</span>
                  <span>{example.net} CDF</span>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Annuler
            </Button>
            <Button 
              onClick={() => saveMutation.mutate()} 
              disabled={saveMutation.isPending}
            >
              <Save className="w-4 h-4 mr-2" />
              {editingConfig ? 'Mettre à jour' : 'Créer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
