import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Car, Package, Zap } from 'lucide-react';

export type ServiceType = 'taxi' | 'delivery' | 'both';

interface ServiceTypeSelectorProps {
  value: ServiceType;
  onChange: (serviceType: ServiceType) => void;
  disabled?: boolean;
}

const serviceOptions = [
  {
    value: 'taxi' as ServiceType,
    title: 'Chauffeur Taxi',
    description: 'Transport de passagers avec différents types de véhicules',
    icon: Car,
    benefits: ['Courses régulières', 'Pourboires clients', 'Horaires flexibles'],
    color: 'bg-blue-500'
  },
  {
    value: 'delivery' as ServiceType,
    title: 'Livreur',
    description: 'Livraison de colis et marketplace',
    icon: Package,
    benefits: ['Livraisons multiples', 'Zones définies', 'Commissions attractives'],
    color: 'bg-green-500'
  },
  {
    value: 'both' as ServiceType,
    title: 'Service Complet',
    description: 'Taxi et livraison selon votre disponibilité',
    icon: Zap,
    benefits: ['Maximum de revenus', 'Flexibilité totale', 'Opportunités variées'],
    color: 'bg-purple-500'
  }
];

export const ServiceTypeSelector = ({ value, onChange, disabled }: ServiceTypeSelectorProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {serviceOptions.map((option) => {
        const Icon = option.icon;
        const isSelected = value === option.value;
        
        return (
          <Card 
            key={option.value}
            className={`cursor-pointer transition-all duration-200 ${
              isSelected 
                ? 'ring-2 ring-primary border-primary bg-primary/5' 
                : 'hover:border-primary/50 hover:shadow-md'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={() => !disabled && onChange(option.value)}
          >
            <CardHeader className="text-center pb-2">
              <div className={`w-12 h-12 ${option.color} rounded-lg flex items-center justify-center mx-auto mb-2`}>
                <Icon className="h-6 w-6 text-white" />
              </div>
              <CardTitle className="text-lg">{option.title}</CardTitle>
              <CardDescription className="text-sm">
                {option.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                {option.benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                    <span className="text-sm text-muted-foreground">{benefit}</span>
                  </div>
                ))}
              </div>
              {isSelected && (
                <Badge variant="default" className="w-full mt-3 justify-center">
                  Sélectionné
                </Badge>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};