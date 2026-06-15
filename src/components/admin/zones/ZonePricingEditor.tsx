import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  DollarSign,
  Clock,
  Car,
  Save,
  Plus,
  Trash2,
  Copy,
  AlertTriangle,
} from 'lucide-react';
import { Zone, ZonePricingRule } from '@/hooks/useZoneManagement';

interface ZonePricingEditorProps {
  zone: Zone;
  pricingRules: ZonePricingRule[];
  onSavePricingRule: (rule: Partial<ZonePricingRule>) => Promise<void>;
  onDeletePricingRule: (ruleId: string) => Promise<void>;
  className?: string;
}

interface TimeBasedRule {
  start_hour: number;
  end_hour: number;
  multiplier: number;
  label: string;
}

export const ZonePricingEditor: React.FC<ZonePricingEditorProps> = ({
  zone,
  pricingRules,
  onSavePricingRule,
  onDeletePricingRule,
  className,
}) => {
  const [selectedVehicleClass, setSelectedVehicleClass] = useState('standard');
  const [editingRule, setEditingRule] = useState<Partial<ZonePricingRule> | null>(null);
  const [timeBasedRules, setTimeBasedRules] = useState<TimeBasedRule[]>([]);
  const [showTimeBasedEditor, setShowTimeBasedEditor] = useState(false);

  const vehicleClasses = [
    { value: 'economy', label: 'Économique' },
    { value: 'standard', label: 'Standard' },
    { value: 'premium', label: 'Premium' },
    { value: 'moto', label: 'Moto' },
    { value: 'truck', label: 'Camion' },
  ];

  const getCurrentRule = () => {
    return pricingRules.find(rule => 
      rule.vehicle_class === selectedVehicleClass && rule.is_active
    );
  };

  const initializeEditingRule = () => {
    const currentRule = getCurrentRule();
    if (currentRule) {
      setEditingRule(currentRule);
      setTimeBasedRules((currentRule.time_based_pricing as unknown as TimeBasedRule[]) || []);
    } else {
      setEditingRule({
        zone_id: zone.id,
        vehicle_class: selectedVehicleClass,
        base_price: 2000,
        price_per_km: 300,
        price_per_minute: 50,
        surge_multiplier: 1.0,
        minimum_fare: 1000,
        maximum_fare: undefined,
        time_based_pricing: [],
        special_pricing: {},
        is_active: true,
      });
      setTimeBasedRules([]);
    }
  };

  useEffect(() => {
    initializeEditingRule();
  }, [selectedVehicleClass, pricingRules]);

  const handleSaveRule = async () => {
    if (!editingRule) return;

    const ruleToSave = {
      ...editingRule,
      time_based_pricing: timeBasedRules as any,
    };

    try {
      await onSavePricingRule(ruleToSave);
      setShowTimeBasedEditor(false);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
    }
  };

  const addTimeBasedRule = () => {
    setTimeBasedRules(prev => [...prev, {
      start_hour: 0,
      end_hour: 24,
      multiplier: 1.0,
      label: 'Nouvelle règle',
    }]);
  };

  const updateTimeBasedRule = (index: number, updates: Partial<TimeBasedRule>) => {
    setTimeBasedRules(prev => prev.map((rule, i) => 
      i === index ? { ...rule, ...updates } : rule
    ));
  };

  const removeTimeBasedRule = (index: number) => {
    setTimeBasedRules(prev => prev.filter((_, i) => i !== index));
  };

  const calculateEstimatedPrice = (distance: number = 5, duration: number = 15) => {
    if (!editingRule) return 0;

    let basePrice = editingRule.base_price || 0;
    let kmPrice = (editingRule.price_per_km || 0) * distance;
    let timePrice = (editingRule.price_per_minute || 0) * duration;
    let total = basePrice + kmPrice + timePrice;

    // Appliquer le multiplicateur de surge
    total = total * (editingRule.surge_multiplier || 1);

    // Appliquer les limites
    if (editingRule.minimum_fare && total < editingRule.minimum_fare) {
      total = editingRule.minimum_fare;
    }
    if (editingRule.maximum_fare && total > editingRule.maximum_fare) {
      total = editingRule.maximum_fare;
    }

    return total;
  };

  const duplicateRule = async (sourceClass: string, targetClass: string) => {
    const sourceRule = pricingRules.find(rule => 
      rule.vehicle_class === sourceClass && rule.is_active
    );
    
    if (sourceRule) {
      const duplicatedRule = {
        ...sourceRule,
        id: undefined,
        vehicle_class: targetClass,
      };
      
      await onSavePricingRule(duplicatedRule);
    }
  };

  if (!editingRule) return null;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Configuration des tarifs - {zone.name}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Sélection du type de véhicule */}
        <div className="space-y-2">
          <Label>Type de véhicule</Label>
          <Select value={selectedVehicleClass} onValueChange={setSelectedVehicleClass}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {vehicleClasses.map(vehicleClass => {
                const hasRule = pricingRules.some(rule => 
                  rule.vehicle_class === vehicleClass.value && rule.is_active
                );
                
                return (
                  <SelectItem key={vehicleClass.value} value={vehicleClass.value}>
                    <div className="flex items-center justify-between w-full">
                      <span>{vehicleClass.label}</span>
                      {hasRule && <Badge variant="secondary" className="ml-2">Configuré</Badge>}
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic">Tarification de base</TabsTrigger>
            <TabsTrigger value="time">Tarification horaire</TabsTrigger>
            <TabsTrigger value="preview">Aperçu</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Prix de base (CDF)</Label>
                <Input
                  type="number"
                  value={editingRule.base_price || 0}
                  onChange={(e) => setEditingRule(prev => ({
                    ...prev!,
                    base_price: parseFloat(e.target.value)
                  }))}
                />
              </div>

              <div className="space-y-2">
                <Label>Prix par kilomètre (CDF)</Label>
                <Input
                  type="number"
                  value={editingRule.price_per_km || 0}
                  onChange={(e) => setEditingRule(prev => ({
                    ...prev!,
                    price_per_km: parseFloat(e.target.value)
                  }))}
                />
              </div>

              <div className="space-y-2">
                <Label>Prix par minute (CDF)</Label>
                <Input
                  type="number"
                  value={editingRule.price_per_minute || 0}
                  onChange={(e) => setEditingRule(prev => ({
                    ...prev!,
                    price_per_minute: parseFloat(e.target.value)
                  }))}
                />
              </div>

              <div className="space-y-2">
                <Label>Multiplicateur de surge</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={editingRule.surge_multiplier || 1}
                  onChange={(e) => setEditingRule(prev => ({
                    ...prev!,
                    surge_multiplier: parseFloat(e.target.value)
                  }))}
                />
              </div>

              <div className="space-y-2">
                <Label>Prix minimum (CDF)</Label>
                <Input
                  type="number"
                  value={editingRule.minimum_fare || 0}
                  onChange={(e) => setEditingRule(prev => ({
                    ...prev!,
                    minimum_fare: parseFloat(e.target.value)
                  }))}
                />
              </div>

              <div className="space-y-2">
                <Label>Prix maximum (CDF) - Optionnel</Label>
                <Input
                  type="number"
                  value={editingRule.maximum_fare || ''}
                  onChange={(e) => setEditingRule(prev => ({
                    ...prev!,
                    maximum_fare: e.target.value ? parseFloat(e.target.value) : undefined
                  }))}
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                checked={editingRule.is_active}
                onCheckedChange={(checked) => setEditingRule(prev => ({
                  ...prev!,
                  is_active: checked
                }))}
              />
              <Label>Règle active</Label>
            </div>
          </TabsContent>

          <TabsContent value="time" className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Tarification selon l'heure</h4>
              <Button onClick={addTimeBasedRule} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Ajouter une règle
              </Button>
            </div>

            {timeBasedRules.length > 0 && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Période</TableHead>
                    <TableHead>Heure début</TableHead>
                    <TableHead>Heure fin</TableHead>
                    <TableHead>Multiplicateur</TableHead>
                    <TableHead className="w-10">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {timeBasedRules.map((rule, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Input
                          value={rule.label}
                          onChange={(e) => updateTimeBasedRule(index, { label: e.target.value })}
                          placeholder="Ex: Heures de pointe"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="0"
                          max="23"
                          value={rule.start_hour}
                          onChange={(e) => updateTimeBasedRule(index, { start_hour: parseInt(e.target.value) })}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="1"
                          max="24"
                          value={rule.end_hour}
                          onChange={(e) => updateTimeBasedRule(index, { end_hour: parseInt(e.target.value) })}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          step="0.1"
                          value={rule.multiplier}
                          onChange={(e) => updateTimeBasedRule(index, { multiplier: parseFloat(e.target.value) })}
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeTimeBasedRule(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            {timeBasedRules.length === 0 && (
              <div className="text-center py-6 text-muted-foreground">
                Aucune règle horaire configurée
              </div>
            )}
          </TabsContent>

          <TabsContent value="preview" className="space-y-4">
            <div className="grid grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Simulation de prix</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm">Course de 5km - 15min</Label>
                      <div className="text-2xl font-bold text-primary">
                        {Math.round(calculateEstimatedPrice(5, 15))} CDF
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm">Course de 10km - 25min</Label>
                      <div className="text-2xl font-bold text-primary">
                        {Math.round(calculateEstimatedPrice(10, 25))} CDF
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Prix de base:</span>
                      <span>{editingRule.base_price} CDF</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Prix par km:</span>
                      <span>{editingRule.price_per_km} CDF</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Prix par minute:</span>
                      <span>{editingRule.price_per_minute} CDF</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Multiplicateur surge:</span>
                      <span>{editingRule.surge_multiplier}x</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Actions rapides</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => duplicateRule('standard', selectedVehicleClass)}
                    disabled={selectedVehicleClass === 'standard'}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copier depuis Standard
                  </Button>

                  {getCurrentRule() && (
                    <Button
                      variant="destructive"
                      className="w-full justify-start"
                      onClick={() => {
                        if (confirm('Supprimer cette règle de tarification ?')) {
                          onDeletePricingRule(getCurrentRule()!.id);
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Supprimer la règle
                    </Button>
                  )}

                  <div className="mt-4 p-3 bg-warning/10 rounded-lg">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-warning mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium">Attention</p>
                        <p className="text-muted-foreground">
                          Les modifications prennent effet immédiatement pour toutes les nouvelles courses.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => initializeEditingRule()}
          >
            Réinitialiser
          </Button>
          <Button onClick={handleSaveRule}>
            <Save className="h-4 w-4 mr-2" />
            Enregistrer
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};