import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Car, Package, CheckCircle } from 'lucide-react';

export type ServiceCategory = 'taxi' | 'delivery';

interface ServiceCategorySelectorProps {
  selectedCategory: ServiceCategory | null;
  onCategorySelect: (category: ServiceCategory) => void;
  disabled?: boolean;
}

export const ServiceCategorySelector: React.FC<ServiceCategorySelectorProps> = ({
  selectedCategory,
  onCategorySelect,
  disabled = false,
}) => {
  const categories = [
    {
      id: 'taxi' as const,
      title: 'Chauffeur Taxi',
      description: 'Transport de passagers avec différents niveaux de service',
      icon: Car,
      services: ['Moto', 'Éco', 'Confort', 'Premium'],
      color: 'border-blue-200 hover:border-blue-300',
      selectedColor: 'border-blue-500 bg-blue-50',
    },
    {
      id: 'delivery' as const,
      title: 'Livreur',
      description: 'Service de livraison avec options express et standard',
      icon: Package,
      services: ['Flash', 'Flex', 'MaxiCharge'],
      color: 'border-green-200 hover:border-green-300',
      selectedColor: 'border-green-500 bg-green-50',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Choisissez votre type de service
        </h2>
        <p className="text-muted-foreground">
          Sélectionnez le type de service que vous souhaitez offrir
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {categories.map((category) => {
          const Icon = category.icon;
          const isSelected = selectedCategory === category.id;
          
          return (
            <Card
              key={category.id}
              className={`cursor-pointer transition-all duration-200 ${
                isSelected ? category.selectedColor : category.color
              } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={() => !disabled && onCategorySelect(category.id)}
            >
              <CardHeader className="text-center">
                <div className="flex items-center justify-center mb-4">
                  <div className={`p-3 rounded-full ${isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                    <Icon className="h-8 w-8" />
                  </div>
                  {isSelected && (
                    <CheckCircle className="h-6 w-6 text-green-500 ml-2" />
                  )}
                </div>
                <CardTitle className="text-xl">{category.title}</CardTitle>
                <CardDescription className="text-sm">
                  {category.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <h4 className="font-medium text-sm text-foreground">Services disponibles :</h4>
                  <div className="flex flex-wrap gap-2">
                    {category.services.map((service) => (
                      <span
                        key={service}
                        className="px-2 py-1 bg-secondary text-secondary-foreground rounded-md text-xs font-medium"
                      >
                        {service}
                      </span>
                    ))}
                  </div>
                  <Button
                    variant={isSelected ? "default" : "outline"}
                    className="w-full mt-4"
                    disabled={disabled}
                  >
                    {isSelected ? 'Sélectionné' : 'Choisir ce service'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};