import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { MapPin, Plus, Copy } from 'lucide-react';
import { ServicePricing, ServiceCategory } from '@/hooks/useServiceConfigurations';

interface CityPricingManagerProps {
  serviceType: string;
  serviceCategory: ServiceCategory;
  existingPricing: ServicePricing[];
  onCreatePricing: (pricing: Omit<ServicePricing, 'id'>) => void;
  onUpdatePricing: (pricing: Partial<ServicePricing> & { id: string }) => void;
}

const AVAILABLE_CITIES = [
  { value: 'Kinshasa', label: 'Kinshasa (RDC)', currency: 'CDF' },
  { value: 'Lubumbashi', label: 'Lubumbashi (RDC)', currency: 'CDF' },
  { value: 'Kolwezi', label: 'Kolwezi (RDC)', currency: 'CDF' },
  { value: 'Abidjan', label: 'Abidjan (Côte d\'Ivoire)', currency: 'XOF' }
];

export const CityPricingManager: React.FC<CityPricingManagerProps> = ({
  serviceType,
  serviceCategory,
  existingPricing,
  onCreatePricing,
  onUpdatePricing
}) => {
  const [selectedCity, setSelectedCity] = useState('');
  const [newPricingForm, setNewPricingForm] = useState({
    base_price: 0,
    price_per_km: 0,
    price_per_minute: 0,
    minimum_fare: 0,
    maximum_fare: 0,
    surge_multiplier: 1,
    commission_rate: 15
  });
  const [copyFromCity, setCopyFromCity] = useState('');

  const availableCities = AVAILABLE_CITIES.filter(city => 
    !existingPricing.find(p => p.city === city.value)
  );

  const handleCreatePricing = () => {
    if (!selectedCity) return;

    const cityInfo = AVAILABLE_CITIES.find(c => c.value === selectedCity);
    if (!cityInfo) return;

    onCreatePricing({
      service_type: serviceType,
      service_category: serviceCategory,
      city: selectedCity,
      currency: cityInfo.currency,
      is_active: true,
      ...newPricingForm
    });

    // Reset form
    setSelectedCity('');
    setNewPricingForm({
      base_price: 0,
      price_per_km: 0,
      price_per_minute: 0,
      minimum_fare: 0,
      maximum_fare: 0,
      surge_multiplier: 1,
      commission_rate: 15
    });
  };

  const copyPricingFromCity = () => {
    const sourcePricing = existingPricing.find(p => p.city === copyFromCity);
    if (sourcePricing) {
      setNewPricingForm({
        base_price: sourcePricing.base_price,
        price_per_km: sourcePricing.price_per_km,
        price_per_minute: sourcePricing.price_per_minute || 0,
        minimum_fare: sourcePricing.minimum_fare,
        maximum_fare: sourcePricing.maximum_fare || 0,
        surge_multiplier: sourcePricing.surge_multiplier,
        commission_rate: sourcePricing.commission_rate
      });
    }
  };

  const getCityMultiplier = (city: string) => {
    const multipliers: Record<string, number> = {
      'Kinshasa': 1.0,
      'Lubumbashi': 1.2,
      'Kolwezi': 1.1,
      'Abidjan': 0.8 // XOF conversion factor
    };
    return multipliers[city] || 1.0;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <MapPin className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Tarification par ville</h3>
      </div>

      {/* Existing pricing per city */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {existingPricing.map((pricing) => {
          const cityInfo = AVAILABLE_CITIES.find(c => c.value === pricing.city);
          return (
            <Card key={pricing.id}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center justify-between">
                  {pricing.city}
                  <Badge variant="outline" className="text-xs">
                    {pricing.currency}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Base:</span>
                    <span className="font-medium">
                      {pricing.base_price.toLocaleString()} {pricing.currency}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Par km:</span>
                    <span className="font-medium">
                      {pricing.price_per_km.toLocaleString()} {pricing.currency}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Commission:</span>
                    <span className="font-medium">{pricing.commission_rate}%</span>
                  </div>
                </div>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="w-full mt-2"
                  onClick={() => {
                    // Edit functionality can be added here
                  }}
                >
                  Modifier
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Add new city pricing */}
      {availableCities.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Ajouter une nouvelle ville
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Ville</Label>
                <Select value={selectedCity} onValueChange={setSelectedCity}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une ville" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCities.map(city => (
                      <SelectItem key={city.value} value={city.value}>
                        {city.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {existingPricing.length > 0 && (
                <div>
                  <Label>Copier depuis</Label>
                  <div className="flex gap-2">
                    <Select value={copyFromCity} onValueChange={setCopyFromCity}>
                      <SelectTrigger>
                        <SelectValue placeholder="Ville source" />
                      </SelectTrigger>
                      <SelectContent>
                        {existingPricing.map(p => (
                          <SelectItem key={p.id} value={p.city}>
                            {p.city}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button 
                      type="button" 
                      size="sm" 
                      variant="outline"
                      onClick={copyPricingFromCity}
                      disabled={!copyFromCity}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-xs">Prix de base</Label>
                <Input
                  type="number"
                  value={newPricingForm.base_price}
                  onChange={(e) => setNewPricingForm(prev => ({
                    ...prev,
                    base_price: Number(e.target.value)
                  }))}
                />
              </div>
              <div>
                <Label className="text-xs">Prix/km</Label>
                <Input
                  type="number"
                  value={newPricingForm.price_per_km}
                  onChange={(e) => setNewPricingForm(prev => ({
                    ...prev,
                    price_per_km: Number(e.target.value)
                  }))}
                />
              </div>
              <div>
                <Label className="text-xs">Commission (%)</Label>
                <Input
                  type="number"
                  value={newPricingForm.commission_rate}
                  onChange={(e) => setNewPricingForm(prev => ({
                    ...prev,
                    commission_rate: Number(e.target.value)
                  }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-xs">Minimum</Label>
                <Input
                  type="number"
                  value={newPricingForm.minimum_fare}
                  onChange={(e) => setNewPricingForm(prev => ({
                    ...prev,
                    minimum_fare: Number(e.target.value)
                  }))}
                />
              </div>
              <div>
                <Label className="text-xs">Maximum</Label>
                <Input
                  type="number"
                  value={newPricingForm.maximum_fare}
                  onChange={(e) => setNewPricingForm(prev => ({
                    ...prev,
                    maximum_fare: Number(e.target.value)
                  }))}
                />
              </div>
              <div>
                <Label className="text-xs">Multiplicateur surge</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={newPricingForm.surge_multiplier}
                  onChange={(e) => setNewPricingForm(prev => ({
                    ...prev,
                    surge_multiplier: Number(e.target.value)
                  }))}
                />
              </div>
            </div>

            <Button 
              onClick={handleCreatePricing}
              disabled={!selectedCity}
              className="w-full"
            >
              Ajouter la tarification pour {selectedCity}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
