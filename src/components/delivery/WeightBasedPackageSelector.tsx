// Composant de sélection de colis basé sur le poids
// Détermine automatiquement le service de livraison approprié

import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Bike, Car, Truck, Scale } from 'lucide-react';

interface PackageOption {
  id: string;
  icon: any;
  label: string;
  description: string;
  weightRange: string;
  maxWeight: number;
  vehicleType: string;
  basePrice: number;
}

interface WeightBasedPackageSelectorProps {
  selectedType: string;
  packageWeight: number;
  onTypeSelect: (type: string) => void;
  onWeightChange: (weight: number) => void;
}

const packageOptions: PackageOption[] = [
  { 
    id: 'flash', 
    icon: Bike, 
    label: 'Flash', 
    description: 'Livraison rapide en moto',
    weightRange: '1-5 kg',
    maxWeight: 5,
    vehicleType: 'Moto',
    basePrice: 5000
  },
  { 
    id: 'flex', 
    icon: Car, 
    label: 'Flex', 
    description: 'Livraison standard en camionnette',
    weightRange: '6-50 kg',
    maxWeight: 50,
    vehicleType: 'Camionnette',
    basePrice: 7000
  },
  { 
    id: 'maxicharge', 
    icon: Truck, 
    label: 'MaxiCharge', 
    description: 'Livraison lourde en camion',
    weightRange: '50+ kg',
    maxWeight: 999,
    vehicleType: 'Camion',
    basePrice: 12000
  }
];

// Fonction pour déterminer automatiquement le service basé sur le poids
const getServiceByWeight = (weight: number): string => {
  if (weight <= 5) return 'flash';
  if (weight <= 50) return 'flex';
  return 'maxicharge';
};

export const WeightBasedPackageSelector: React.FC<WeightBasedPackageSelectorProps> = ({
  selectedType,
  packageWeight,
  onTypeSelect,
  onWeightChange
}) => {
  // Détermine automatiquement le service recommandé basé sur le poids
  const recommendedService = getServiceByWeight(packageWeight);
  
  const handleWeightChange = (weight: number) => {
    onWeightChange(weight);
    // Sélection automatique du service approprié
    const autoService = getServiceByWeight(weight);
    if (autoService !== selectedType) {
      onTypeSelect(autoService);
    }
  };

  return (
    <div className="space-y-6">
      {/* Saisie du poids */}
      <div className="space-y-3">
        <Label className="flex items-center gap-2 text-base font-medium">
          <Scale className="h-4 w-4" />
          Poids estimé du colis
        </Label>
        <div className="flex items-center gap-3">
          <Input
            type="number"
            min="0.1"
            step="0.1"
            placeholder="Entrez le poids"
            value={packageWeight || ''}
            onChange={(e) => handleWeightChange(parseFloat(e.target.value) || 0)}
            className="flex-1"
          />
          <span className="text-sm font-medium text-muted-foreground">kg</span>
        </div>
        
        {packageWeight > 0 && (
          <div className="flex items-center gap-2 text-sm">
            <Badge variant="secondary" className="bg-primary/10 text-primary">
              Service recommandé: {packageOptions.find(p => p.id === recommendedService)?.label}
            </Badge>
          </div>
        )}
      </div>

      {/* Options de service */}
      <div className="space-y-3">
        <Label className="text-base font-medium">Service de livraison</Label>
        <div className="grid gap-3">
          {packageOptions.map((option) => {
            const Icon = option.icon;
            const isSelected = selectedType === option.id;
            const isRecommended = recommendedService === option.id && packageWeight > 0;
            const isDisabled = packageWeight > 0 && packageWeight > option.maxWeight && option.id !== 'maxicharge';
            
            return (
              <motion.div
                key={option.id}
                whileHover={{ scale: isDisabled ? 1 : 1.02 }}
                whileTap={{ scale: isDisabled ? 1 : 0.98 }}
              >
                <Card 
                  className={`cursor-pointer transition-all relative ${
                    isSelected 
                      ? 'ring-2 ring-primary bg-primary/5' 
                      : isDisabled 
                        ? 'opacity-50 cursor-not-allowed' 
                        : 'hover:shadow-md'
                  }`}
                  onClick={() => !isDisabled && onTypeSelect(option.id)}
                >
                  <CardContent className="flex items-center gap-4 p-4">
                    <div className={`p-3 rounded-full ${
                      isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted'
                    }`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{option.label}</h3>
                        <Badge variant="outline" className="text-xs">
                          {option.weightRange}
                        </Badge>
                        {isRecommended && (
                          <Badge className="text-xs bg-green-100 text-green-800">
                            Recommandé
                          </Badge>
                        )}
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-2">
                        {option.description}
                      </p>
                      
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>Véhicule: {option.vehicleType}</span>
                        <span>À partir de {option.basePrice.toLocaleString()} CDF</span>
                      </div>
                    </div>
                    
                    {isSelected && (
                      <div className="text-primary">
                        <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                          <div className="w-2 h-2 rounded-full bg-white" />
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Informations supplémentaires */}
      {packageWeight > 0 && (
        <div className="p-4 bg-muted/50 rounded-lg">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-primary/10 rounded-full">
              {React.createElement(packageOptions.find(p => p.id === recommendedService)?.icon || Scale, { className: "h-4 w-4 text-primary" })}
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-sm mb-1">
                Service {packageOptions.find(p => p.id === recommendedService)?.label}
              </h4>
              <p className="text-xs text-muted-foreground">
                Votre colis de {packageWeight}kg sera livré par {packageOptions.find(p => p.id === recommendedService)?.vehicleType.toLowerCase()}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WeightBasedPackageSelector;