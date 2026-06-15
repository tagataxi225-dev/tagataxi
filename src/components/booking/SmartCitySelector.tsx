/**
 * Sélecteur de ville intelligent pour les formulaires de booking
 * Intègre détection automatique et sélection manuelle
 */

import React from 'react';
import { MapPin, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useSmartCitySelection } from '@/hooks/useSmartCitySelection';
import { type CityConfig } from '@/types/unifiedLocation';

interface SmartCitySelectorProps {
  selectedCity?: CityConfig | null;
  onCityChange: (city: CityConfig) => void;
  className?: string;
  autoDetect?: boolean;
  showDetectionInfo?: boolean;
}

export const SmartCitySelector: React.FC<SmartCitySelectorProps> = ({
  selectedCity,
  onCityChange,
  className = '',
  autoDetect = true,
  showDetectionInfo = true
}) => {
  const {
    currentCity,
    detectionResult,
    isDetecting,
    availableCities,
    pricingConfig,
    selectCity,
    detectCityAutomatically,
    isConfidentDetection,
    detectionSource
  } = useSmartCitySelection({ autoDetect });

  const [isOpen, setIsOpen] = React.useState(false);

  // Synchroniser la ville sélectionnée avec le parent
  React.useEffect(() => {
    if (currentCity && (!selectedCity || selectedCity.code !== currentCity.code)) {
      onCityChange(currentCity);
    }
  }, [currentCity, selectedCity, onCityChange]);

  const handleCitySelect = (city: CityConfig) => {
    selectCity(city);
    onCityChange(city);
    setIsOpen(false);
  };

  const handleDetect = () => {
    detectCityAutomatically();
  };

  const displayCity = selectedCity || currentCity;

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Header avec titre */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Ville de service</h3>
        </div>
        
        {/* Bouton de détection automatique */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDetect}
          disabled={isDetecting}
          className="text-sm"
        >
          {isDetecting ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <MapPin className="h-4 w-4 mr-2" />
          )}
          Détecter
        </Button>
      </div>

      {/* Sélecteur principal */}
      <div className="relative">
        <Button
          variant="outline"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full justify-between h-auto p-4"
        >
          <div className="flex items-center gap-3">
            <div className="flex-1 text-left">
              <div className="font-medium">
                {displayCity?.name || 'Sélectionner une ville'}
              </div>
              {displayCity && (
                <div className="text-sm text-muted-foreground">
                  {displayCity.countryCode} • {displayCity.currency}
                  {pricingConfig && pricingConfig.basePriceMultiplier !== 1.0 && (
                    <span className="ml-2">
                      {pricingConfig.basePriceMultiplier > 1 
                        ? `+${Math.round((pricingConfig.basePriceMultiplier - 1) * 100)}%`
                        : `-${Math.round((1 - pricingConfig.basePriceMultiplier) * 100)}%`
                      }
                    </span>
                  )}
                </div>
              )}
            </div>
            
            {/* Badge de statut */}
            {detectionResult && showDetectionInfo && (
              <Badge 
                variant={isConfidentDetection ? "default" : "secondary"}
                className="text-xs"
              >
                {detectionSource === 'coordinates' ? '📍 GPS' :
                 detectionSource === 'address' ? '📍 Adresse' :
                 detectionSource === 'user_selection' ? '👤 Manuel' : '🏠 Défaut'}
              </Badge>
            )}
          </div>
        </Button>

        {/* Dropdown des villes */}
        {isOpen && (
          <>
            <div 
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            <Card className="absolute top-full mt-2 left-0 right-0 z-50 shadow-lg border border-border/20">
              <div className="p-2 space-y-1">
                {availableCities.map((city) => {
                  const cityPricing = pricingConfig && city.code === displayCity?.code 
                    ? pricingConfig 
                    : null;
                  
                  return (
                    <Button
                      key={city.code}
                      variant="ghost"
                      onClick={() => handleCitySelect(city)}
                      className="w-full justify-between text-left h-auto p-3"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{city.name}</span>
                          {displayCity?.code === city.code && (
                            <Check className="h-4 w-4 text-primary" />
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {city.countryCode} • {city.currency}
                          {city.name === 'Lubumbashi' && ' • +20% tarifs'}
                          {city.name === 'Kolwezi' && ' • +10% tarifs'}
                        </div>
                      </div>
                    </Button>
                  );
                })}
              </div>
            </Card>
          </>
        )}
      </div>

      {/* Informations de détection */}
      {detectionResult && showDetectionInfo && (
        <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
          <div className="flex items-center gap-2">
            <span>
              {detectionSource === 'coordinates' ? '📍 Détectée par GPS' :
               detectionSource === 'address' ? '📍 Détectée par adresse' :
               detectionSource === 'user_selection' ? '👤 Sélectionnée manuellement' : 
               '🏠 Ville par défaut'}
            </span>
            <Badge variant="outline" className="text-xs">
              {Math.round(detectionResult.confidence * 100)}% confiance
            </Badge>
          </div>
          
          {pricingConfig && (
            <div className="mt-2 text-xs">
              💰 Tarifs: {pricingConfig.currency}
              {pricingConfig.basePriceMultiplier !== 1.0 && (
                <span className="ml-1 text-primary">
                  ({pricingConfig.basePriceMultiplier > 1 ? '+' : ''}{Math.round((pricingConfig.basePriceMultiplier - 1) * 100)}%)
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};