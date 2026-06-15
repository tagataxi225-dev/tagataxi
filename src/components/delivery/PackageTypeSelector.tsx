import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Package, Weight, Ruler, Clock, Truck } from 'lucide-react';

interface PackageType {
  id: string;
  name: string;
  description: string;
  maxWeight: string;
  maxDimensions: string;
  basePrice: number;
  estimatedTime: string;
  icon: string;
  popular?: boolean;
  examples: string[];
}

interface PackageTypeSelectorProps {
  onPackageSelect: (packageType: PackageType) => void;
  selectedPackageId?: string;
}

const PackageTypeSelector = ({ onPackageSelect, selectedPackageId }: PackageTypeSelectorProps) => {
  const [packageTypes] = useState<PackageType[]>([
    {
      id: 'small',
      name: 'Petit colis',
      description: 'Documents, petits objets légers',
      maxWeight: 'Jusqu\'à 5kg',
      maxDimensions: '30x30x15 cm',
      basePrice: 1000,
      estimatedTime: '1-2 heures',
      icon: '📦',
      popular: true,
      examples: ['Documents', 'Téléphone', 'Bijoux', 'Médicaments', 'Clés USB']
    },
    {
      id: 'medium',
      name: 'Moyen colis',
      description: 'Vêtements, équipements moyens',
      maxWeight: '5kg - 15kg',
      maxDimensions: '50x40x30 cm',
      basePrice: 2500,
      estimatedTime: '2-4 heures',
      icon: '📫',
      examples: ['Vêtements', 'Chaussures', 'Livres', 'Ordinateur portable', 'Équipements sport']
    },
    {
      id: 'large',
      name: 'Grand colis',
      description: 'Appareils électroménagers, gros équipements',
      maxWeight: '15kg - 50kg',
      maxDimensions: '80x60x50 cm',
      basePrice: 5000,
      estimatedTime: '4-8 heures',
      icon: '📋',
      examples: ['Électroménager', 'TV', 'Matériel bureautique', 'Meubles', 'Appareils fitness']
    }
  ]);

  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold text-grey-900 mb-2">Quel type de colis ?</h3>
        <p className="text-grey-600">Sélectionnez la taille qui correspond à votre envoi</p>
      </div>

      <div className="grid gap-4">
        {packageTypes.map((packageType) => {
          const isSelected = selectedPackageId === packageType.id;
          
          return (
            <Card
              key={packageType.id}
              className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                isSelected 
                  ? 'border-primary bg-primary/5 ring-2 ring-primary/20' 
                  : 'border-grey-100 hover:border-grey-200'
              }`}
              onClick={() => onPackageSelect(packageType)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className={`w-16 h-16 rounded-xl flex items-center justify-center text-2xl ${
                      isSelected ? 'bg-primary/20' : 'bg-grey-100'
                    }`}>
                      {packageType.icon}
                    </div>
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold text-grey-900">{packageType.name}</h4>
                      {packageType.popular && (
                        <span className="text-xs bg-primary text-white px-2 py-1 rounded-md">
                          Populaire
                        </span>
                      )}
                    </div>
                    
                    <p className="text-sm text-grey-600 mb-3">{packageType.description}</p>
                    
                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div className="flex items-center gap-2">
                        <Weight className="w-4 h-4 text-grey-500" />
                        <span className="text-xs text-grey-600">{packageType.maxWeight}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Ruler className="w-4 h-4 text-grey-500" />
                        <span className="text-xs text-grey-600">{packageType.maxDimensions}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-grey-500" />
                        <span className="text-xs text-grey-600">{packageType.estimatedTime}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Truck className="w-4 h-4 text-grey-500" />
                        <span className="text-xs text-primary font-medium">
                          À partir de {packageType.basePrice.toLocaleString()} CDF
                        </span>
                      </div>
                    </div>
                    
                    {isSelected && (
                      <div className="mt-3 pt-3 border-t border-grey-100">
                        <p className="text-xs text-grey-600 mb-2">Exemples d'objets :</p>
                        <div className="flex flex-wrap gap-1">
                          {packageType.examples.map((example, index) => (
                            <span
                              key={index}
                              className="text-xs bg-grey-100 text-grey-700 px-2 py-1 rounded"
                            >
                              {example}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-shrink-0 text-right">
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                      isSelected 
                        ? 'border-primary bg-primary' 
                        : 'border-grey-300'
                    }`}>
                      {isSelected && <div className="w-2 h-2 bg-white rounded-full" />}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="bg-blue-50 rounded-xl p-4 mt-6">
        <div className="flex items-start gap-3">
          <Package className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-900 mb-1">Conseils pour l'emballage</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Emballez soigneusement les objets fragiles</li>
              <li>• Indiquez "FRAGILE" si nécessaire</li>
              <li>• Vérifiez que l'adresse est complète</li>
              <li>• Gardez une photo de votre colis</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PackageTypeSelector;