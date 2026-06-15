import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Building2, Mountain, Plane } from 'lucide-react';

interface CitySelectorProps {
  selectedCity: string;
  onCityChange: (city: string) => void;
  className?: string;
}

const cities = [
  { 
    id: 'Kinshasa', 
    name: 'Kinshasa', 
    icon: Building2, 
    description: 'Capitale - Transport rapide',
    currency: 'CDF'
  },
  { 
    id: 'Lubumbashi', 
    name: 'Lubumbashi', 
    icon: Mountain, 
    description: 'Ville minière - Tarifs +20%',
    currency: 'CDF'
  },
  { 
    id: 'Kolwezi', 
    name: 'Kolwezi', 
    icon: Mountain, 
    description: 'Zone minière - Tarifs +10%',
    currency: 'CDF'
  }
];

export const CitySelector: React.FC<CitySelectorProps> = ({
  selectedCity,
  onCityChange,
  className = ''
}) => {
  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <MapPin className="h-5 w-5 text-primary" />
        <h3 className="font-semibold">Choisir votre ville</h3>
      </div>
      
      <div className="grid gap-2">
        {cities.map((city) => {
          const IconComponent = city.icon;
          const isSelected = selectedCity === city.id;
          
          return (
            <Button
              key={city.id}
              variant={isSelected ? "default" : "outline"}
              onClick={() => onCityChange(city.id)}
              className={`justify-start h-auto p-4 ${
                isSelected ? 'bg-primary text-primary-foreground' : ''
              }`}
            >
              <div className="flex items-center gap-3 w-full">
                <IconComponent className="h-5 w-5" />
                <div className="flex-1 text-left">
                  <div className="font-medium">{city.name}</div>
                  <div className={`text-sm ${
                    isSelected ? 'text-primary-foreground/80' : 'text-muted-foreground'
                  }`}>
                    {city.description}
                  </div>
                </div>
                <Badge variant={isSelected ? "secondary" : "outline"} className="text-xs">
                  {city.currency}
                </Badge>
              </div>
            </Button>
          );
        })}
      </div>
      
      <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
        💡 Les tarifs sont adaptés selon les spécificités de chaque ville
      </div>
    </div>
  );
};

export default CitySelector;