import React, { useState } from 'react';
import { MapPin, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { SUPPORTED_CITIES, type CityConfig } from '@/services/universalGeolocation';

interface CitySelectorProps {
  currentCity: CityConfig | null;
  onCityChange: (city: CityConfig) => void;
  className?: string;
}

const CitySelector: React.FC<CitySelectorProps> = ({ 
  currentCity, 
  onCityChange, 
  className = '' 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const cities = Object.values(SUPPORTED_CITIES);
  
  const handleCitySelect = (city: CityConfig) => {
    onCityChange(city);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-sm"
      >
        <MapPin className="h-4 w-4" />
        <span>{currentCity?.name || 'Sélectionner ville'}</span>
      </Button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <Card className="absolute top-full mt-2 left-0 z-50 min-w-[200px] p-2 shadow-lg border border-border/20">
            <div className="space-y-1">
              {cities.map((city) => (
                <Button
                  key={city.code}
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCitySelect(city)}
                  className="w-full justify-between text-left"
                >
                  <div>
                    <div className="font-medium">{city.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {city.countryCode} • {city.currency}
                    </div>
                  </div>
                  {currentCity?.code === city.code && (
                    <Check className="h-4 w-4 text-primary" />
                  )}
                </Button>
              ))}
            </div>
          </Card>
        </>
      )}
    </div>
  );
};

export default CitySelector;