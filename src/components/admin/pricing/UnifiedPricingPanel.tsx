import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Edit2, Save, X, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface PricingRule {
  id: string;
  city: string;
  vehicle_class: string;
  base_price: number;
  price_per_km: number;
  minimum_fare: number;
  currency: string;
  is_active: boolean;
}

interface EditingState {
  id: string;
  base_price: number;
  price_per_km: number;
  minimum_fare: number;
}

const VEHICLE_LABELS: Record<string, string> = {
  'moto': 'Moto-taxi',
  'eco': 'Éco',
  'standard': 'Confort',
  'premium': 'Premium'
};

const CITIES = ['Kinshasa', 'Lubumbashi', 'Kolwezi', 'Abidjan'];

export const UnifiedPricingPanel = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingRow, setEditingRow] = useState<EditingState | null>(null);

  // Fetch pricing rules
  const { data: pricingRules, isLoading } = useQuery({
    queryKey: ['unified-pricing-rules'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pricing_rules')
        .select('*')
        .eq('service_type', 'transport')
        .eq('is_active', true)
        .order('city', { ascending: true })
        .order('vehicle_class', { ascending: true });

      if (error) throw error;
      return data as PricingRule[];
    }
  });

  // Update pricing mutation
  const updatePricingMutation = useMutation({
    mutationFn: async (updatedRule: EditingState) => {
      const { error } = await supabase
        .from('pricing_rules')
        .update({
          base_price: updatedRule.base_price,
          price_per_km: updatedRule.price_per_km,
          minimum_fare: updatedRule.minimum_fare,
          updated_at: new Date().toISOString()
        })
        .eq('id', updatedRule.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unified-pricing-rules'] });
      queryClient.invalidateQueries({ queryKey: ['vehicle-types'] });
      toast({
        title: "Tarifs mis à jour",
        description: "Les modifications ont été enregistrées avec succès"
      });
      setEditingRow(null);
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de mettre à jour les tarifs",
        variant: "destructive"
      });
    }
  });

  const handleEdit = (rule: PricingRule) => {
    setEditingRow({
      id: rule.id,
      base_price: rule.base_price,
      price_per_km: rule.price_per_km,
      minimum_fare: rule.minimum_fare
    });
  };

  const handleSave = () => {
    if (editingRow) {
      updatePricingMutation.mutate(editingRow);
    }
  };

  const handleCancel = () => {
    setEditingRow(null);
  };

  const updateEditingField = (field: keyof Omit<EditingState, 'id'>, value: number) => {
    if (editingRow) {
      setEditingRow({ ...editingRow, [field]: value });
    }
  };

  const isEditing = (ruleId: string) => editingRow?.id === ruleId;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">Chargement des tarifs...</p>
        </CardContent>
      </Card>
    );
  }

  // Group rules by city
  const rulesByCity = CITIES.map(city => ({
    city,
    rules: pricingRules?.filter(r => r.city === city) || []
  }));

  return (
    <div className="space-y-6">
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Système basé sur abonnements :</strong> Les commissions ont été remplacées par un système d'abonnements pour les chauffeurs.
          Gérez uniquement les tarifs de base ici.
        </AlertDescription>
      </Alert>

      {rulesByCity.map(({ city, rules }) => (
        <Card key={city}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{city}</CardTitle>
                <CardDescription>
                  {rules[0]?.currency || 'CDF'} - {rules.length} types de véhicules
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-sm">
                {rules[0]?.currency === 'XOF' ? 'Franc CFA' : 'Franc Congolais'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type de véhicule</TableHead>
                  <TableHead>Prix de base</TableHead>
                  <TableHead>Prix/km</TableHead>
                  <TableHead>Tarif minimum</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rules.map((rule) => (
                  <TableRow key={rule.id}>
                    <TableCell className="font-medium">
                      {VEHICLE_LABELS[rule.vehicle_class] || rule.vehicle_class}
                    </TableCell>
                    <TableCell>
                      {isEditing(rule.id) ? (
                        <Input
                          type="number"
                          value={editingRow.base_price}
                          onChange={(e) => updateEditingField('base_price', parseFloat(e.target.value))}
                          className="w-24"
                        />
                      ) : (
                        <span>{rule.base_price.toLocaleString()} {rule.currency}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {isEditing(rule.id) ? (
                        <Input
                          type="number"
                          value={editingRow.price_per_km}
                          onChange={(e) => updateEditingField('price_per_km', parseFloat(e.target.value))}
                          className="w-24"
                        />
                      ) : (
                        <span>{rule.price_per_km.toLocaleString()} {rule.currency}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {isEditing(rule.id) ? (
                        <Input
                          type="number"
                          value={editingRow.minimum_fare}
                          onChange={(e) => updateEditingField('minimum_fare', parseFloat(e.target.value))}
                          className="w-24"
                        />
                      ) : (
                        <span>{rule.minimum_fare.toLocaleString()} {rule.currency}</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {isEditing(rule.id) ? (
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            onClick={handleSave}
                            disabled={updatePricingMutation.isPending}
                          >
                            <Save className="h-4 w-4 mr-1" />
                            Sauvegarder
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleCancel}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEdit(rule)}
                        >
                          <Edit2 className="h-4 w-4 mr-1" />
                          Modifier
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
