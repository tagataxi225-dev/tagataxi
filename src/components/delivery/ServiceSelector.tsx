import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bike, Car, Truck } from 'lucide-react';

interface Service {
  id: string;
  icon: React.ComponentType<any>;
  label: string;
  subtitle: string;
  price: string;
  weightLimit: string;
  basePrice: number;
}

interface ServiceSelectorProps {
  selectedService: string;
  onServiceSelect: (serviceId: string) => void;
}

// ✅ TARIFS 2025 - Synchronisés avec pricing_rules
const services: Service[] = [
  { 
    id: 'flash', 
    icon: Bike, 
    label: 'Flash', 
    subtitle: 'Livraison express en moto',
    price: 'À partir de 7 000 CDF',
    weightLimit: '1-5 kg',
    basePrice: 7000
  },
  { 
    id: 'flex', 
    icon: Car, 
    label: 'Flex', 
    subtitle: 'Livraison standard en camionnette',
    price: 'À partir de 55 000 CDF',
    weightLimit: '6-50 kg',
    basePrice: 55000
  },
  { 
    id: 'maxicharge', 
    icon: Truck, 
    label: 'MaxiCharge', 
    subtitle: 'Livraison lourde en camion',
    price: 'À partir de 100 000 CDF',
    weightLimit: '50+ kg',
    basePrice: 100000
  }
];

const ServiceSelector = ({ selectedService, onServiceSelect }: ServiceSelectorProps) => {
  return (
    <div className="grid gap-3">
      {services.map((service) => {
        const Icon = service.icon;
        const isSelected = selectedService === service.id;
        
        return (
          <Card 
            key={service.id}
            className={`cursor-pointer transition-all duration-200 ${
              isSelected 
                ? 'ring-2 ring-primary border-primary bg-primary/5' 
                : 'hover:border-primary/50 hover:shadow-md'
            }`}
            onClick={() => onServiceSelect(service.id)}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted'
                }`}>
                  <Icon className="h-6 w-6" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-foreground">{service.label}</h3>
                    <Badge variant="secondary" className="text-xs">
                      {service.weightLimit}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">
                    {service.subtitle}
                  </p>
                  <p className="text-sm font-medium text-primary">
                    {service.price}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default ServiceSelector;