import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useDynamicDeliveryPricing } from '@/hooks/useDynamicDeliveryPricing';
import { toast } from 'sonner';
import { Settings, Plus, Save, Bike, Car, Truck, MapPin } from 'lucide-react';

const DeliveryPricingManagement = () => {
  const { 
    loading, 
    pricingConfigs, 
    updatePricingConfig, 
    createPricingConfig,
    formatPrice,
    loadPricingConfigs 
  } = useDynamicDeliveryPricing();

  const [editingConfig, setEditingConfig] = useState<string | null>(null);
  const [newConfig, setNewConfig] = useState({
    service_type: 'flash' as 'flash' | 'flex' | 'maxicharge',
    base_price: 5000,
    price_per_km: 500,
    minimum_fare: 3000,
    maximum_fare: '',
    city: 'Kinshasa',
    surge_multiplier: 1.0,
    currency: 'CDF'
  });

  const [tempConfigs, setTempConfigs] = useState<Record<string, any>>({});

  const serviceIcons = {
    flash: <Bike className="h-4 w-4" />,
    flex: <Car className="h-4 w-4" />,
    maxicharge: <Truck className="h-4 w-4" />
  };

  const serviceLabels = {
    flash: 'Flash (Moto)',
    flex: 'Flex (Camionnette)', 
    maxicharge: 'MaxiCharge (Camion)'
  };

  const handleEdit = (configId: string) => {
    const config = pricingConfigs.find(c => c.id === configId);
    if (config) {
      setTempConfigs({
        ...tempConfigs,
        [configId]: { ...config }
      });
      setEditingConfig(configId);
    }
  };

  const handleSave = async (configId: string) => {
    const updates = tempConfigs[configId];
    if (updates) {
      const success = await updatePricingConfig(configId, updates);
      if (success) {
        setEditingConfig(null);
        setTempConfigs(prev => {
          const newConfigs = { ...prev };
          delete newConfigs[configId];
          return newConfigs;
        });
        loadPricingConfigs();
      }
    }
  };

  const handleCancel = (configId: string) => {
    setEditingConfig(null);
    setTempConfigs(prev => {
      const newConfigs = { ...prev };
      delete newConfigs[configId];
      return newConfigs;
    });
  };

  const handleCreateNew = async () => {
    if (!newConfig.service_type || !newConfig.city) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    const configData = {
      ...newConfig,
      maximum_fare: newConfig.maximum_fare ? parseFloat(newConfig.maximum_fare) : null,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const success = await createPricingConfig(configData);
    if (success) {
      setNewConfig({
        service_type: 'flash',
        base_price: 5000,
        price_per_km: 500,
        minimum_fare: 3000,
        maximum_fare: '',
        city: 'Kinshasa',
        surge_multiplier: 1.0,
        currency: 'CDF'
      });
      loadPricingConfigs();
    }
  };

  const updateTempConfig = (configId: string, field: string, value: any) => {
    setTempConfigs(prev => ({
      ...prev,
      [configId]: {
        ...prev[configId],
        [field]: value
      }
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Settings className="h-5 w-5" />
        <h2 className="text-xl font-semibold">Gestion des Tarifs de Livraison</h2>
      </div>

      {/* Configuration existantes */}
      <div className="grid gap-4">
        {pricingConfigs.map(config => {
          const isEditing = editingConfig === config.id;
          const tempConfig = tempConfigs[config.id] || config;

          return (
            <Card key={config.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {serviceIcons[config.service_type]}
                    {serviceLabels[config.service_type]}
                    <Badge variant="outline">
                      <MapPin className="h-3 w-3 mr-1" />
                      {config.city}
                    </Badge>
                  </div>
                  {!isEditing ? (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleEdit(config.id)}
                    >
                      Modifier
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleCancel(config.id)}
                      >
                        Annuler
                      </Button>
                      <Button 
                        size="sm" 
                        onClick={() => handleSave(config.id)}
                        disabled={loading}
                      >
                        <Save className="h-4 w-4 mr-2" />
                        Sauvegarder
                      </Button>
                    </div>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <Label>Prix de base ({config.currency})</Label>
                    {isEditing ? (
                      <Input
                        type="number"
                        value={tempConfig.base_price}
                        onChange={(e) => updateTempConfig(config.id, 'base_price', parseFloat(e.target.value))}
                      />
                    ) : (
                      <div className="font-medium">{formatPrice(config.base_price)}</div>
                    )}
                  </div>

                  <div>
                    <Label>Prix par km ({config.currency})</Label>
                    {isEditing ? (
                      <Input
                        type="number"
                        value={tempConfig.price_per_km}
                        onChange={(e) => updateTempConfig(config.id, 'price_per_km', parseFloat(e.target.value))}
                      />
                    ) : (
                      <div className="font-medium">{formatPrice(config.price_per_km)}</div>
                    )}
                  </div>

                  <div>
                    <Label>Tarif minimum ({config.currency})</Label>
                    {isEditing ? (
                      <Input
                        type="number"
                        value={tempConfig.minimum_fare}
                        onChange={(e) => updateTempConfig(config.id, 'minimum_fare', parseFloat(e.target.value))}
                      />
                    ) : (
                      <div className="font-medium">{formatPrice(config.minimum_fare)}</div>
                    )}
                  </div>

                  <div>
                    <Label>Tarif maximum (optionnel)</Label>
                    {isEditing ? (
                      <Input
                        type="number"
                        value={tempConfig.maximum_fare || ''}
                        onChange={(e) => updateTempConfig(config.id, 'maximum_fare', e.target.value ? parseFloat(e.target.value) : null)}
                      />
                    ) : (
                      <div className="font-medium">
                        {config.maximum_fare ? formatPrice(config.maximum_fare) : 'Aucun'}
                      </div>
                    )}
                  </div>

                  <div>
                    <Label>Multiplicateur de pointe</Label>
                    {isEditing ? (
                      <Input
                        type="number"
                        step="0.1"
                        value={tempConfig.surge_multiplier}
                        onChange={(e) => updateTempConfig(config.id, 'surge_multiplier', parseFloat(e.target.value))}
                      />
                    ) : (
                      <div className="font-medium">x{config.surge_multiplier}</div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Separator />

      {/* Création d'une nouvelle configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Nouvelle Configuration de Tarif
          </CardTitle>
          <CardDescription>
            Créer une nouvelle configuration de tarification pour un service ou une ville
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Service</Label>
              <Select 
                value={newConfig.service_type} 
                onValueChange={(value: 'flash' | 'flex' | 'maxicharge') => 
                  setNewConfig(prev => ({ ...prev, service_type: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="flash">Flash (Moto)</SelectItem>
                  <SelectItem value="flex">Flex (Camionnette)</SelectItem>
                  <SelectItem value="maxicharge">MaxiCharge (Camion)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Ville</Label>
              <Select 
                value={newConfig.city} 
                onValueChange={(value) => setNewConfig(prev => ({ ...prev, city: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Kinshasa">Kinshasa</SelectItem>
                  <SelectItem value="Lubumbashi">Lubumbashi</SelectItem>
                  <SelectItem value="Kolwezi">Kolwezi</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Prix de base (CDF)</Label>
              <Input
                type="number"
                value={newConfig.base_price}
                onChange={(e) => setNewConfig(prev => ({ ...prev, base_price: parseFloat(e.target.value) }))}
              />
            </div>

            <div>
              <Label>Prix par km (CDF)</Label>
              <Input
                type="number"
                value={newConfig.price_per_km}
                onChange={(e) => setNewConfig(prev => ({ ...prev, price_per_km: parseFloat(e.target.value) }))}
              />
            </div>

            <div>
              <Label>Tarif minimum (CDF)</Label>
              <Input
                type="number"
                value={newConfig.minimum_fare}
                onChange={(e) => setNewConfig(prev => ({ ...prev, minimum_fare: parseFloat(e.target.value) }))}
              />
            </div>

            <div>
              <Label>Tarif maximum (optionnel)</Label>
              <Input
                type="number"
                value={newConfig.maximum_fare}
                onChange={(e) => setNewConfig(prev => ({ ...prev, maximum_fare: e.target.value }))}
                placeholder="Laissez vide pour aucun maximum"
              />
            </div>
          </div>

          <Button onClick={handleCreateNew} disabled={loading} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Créer la Configuration
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default DeliveryPricingManagement;