import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { calculateDistance } from '@/utils/locationValidation';
import type { UnifiedLocation } from '@/types/locationAdapter';
import { 
  Calculator, 
  Route, 
  Clock, 
  MapPin, 
  DollarSign,
  Zap,
  Car,
  Truck,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

interface PriceBreakdown {
  basePrice: number;
  distancePrice: number;
  cityMultiplier: number;
  totalPrice: number;
  distance: number;
  duration: number;
  currency: 'XOF';
}

interface RobustPriceCalculatorProps {
  pickup: UnifiedLocation | null;
  destination: UnifiedLocation | null;
  serviceType: 'flash' | 'flex' | 'maxicharge';
  onPriceCalculated: (breakdown: PriceBreakdown) => void;
  city?: string;
  className?: string;
}

const RobustPriceCalculator: React.FC<RobustPriceCalculatorProps> = ({
  pickup,
  destination,
  serviceType,
  onPriceCalculated,
  city = 'Kinshasa',
  className
}) => {
  const [priceBreakdown, setPriceBreakdown] = useState<PriceBreakdown | null>(null);
  const [calculating, setCalculating] = useState(false);

  // Configuration des prix par service
  const priceConfig = {
    flash: {
      basePrice: 5000,
      pricePerKm: 500,
      minDuration: 15,
      speed: 2.5, // km/min
      icon: Zap,
      label: 'Flash Express',
      description: 'Livraison rapide en moto'
    },
    flex: {
      basePrice: 7000,
      pricePerKm: 400,
      minDuration: 30,
      speed: 1.8,
      icon: Car,
      label: 'Flex Camionnette',
      description: 'Livraison en camionnette'
    },
    maxicharge: {
      basePrice: 12000,
      pricePerKm: 600,
      minDuration: 45,
      speed: 1.2,
      icon: Truck,
      label: 'MaxiCharge',
      description: 'Livraison lourde en camion'
    }
  };

  // Multiplicateurs par ville RDC
  const cityMultipliers = {
    'Kinshasa': { factor: 1.0, currency: 'XOF' as const },
    'Lubumbashi': { factor: 1.2, currency: 'XOF' as const }, // +20% pour conditions minières
    'Kolwezi': { factor: 1.1, currency: 'XOF' as const } // +10% ville minière
  };

  // Calcul stable et immédiat du prix
  const calculatePrice = useMemo(() => {
    if (!pickup || !destination || !pickup.lat || !pickup.lng || !destination.lat || !destination.lng) {
      return null;
    }

    try {
      // Distance en kilomètres
      const distance = calculateDistance(pickup.lat, pickup.lng, destination.lat, destination.lng);
      
      // Configuration du service
      const config = priceConfig[serviceType];
      const cityConfig = cityMultipliers[city as keyof typeof cityMultipliers] || cityMultipliers['Kinshasa'];
      
      // Calcul des prix
      const basePrice = config.basePrice;
      const distancePrice = distance * config.pricePerKm;
      const subtotal = basePrice + distancePrice;
      const totalPrice = Math.round(subtotal * cityConfig.factor);
      
      // Durée estimée
      const estimatedDuration = Math.max(
        config.minDuration,
        Math.round(distance / config.speed)
      );

      return {
        basePrice,
        distancePrice: Math.round(distancePrice),
        cityMultiplier: cityConfig.factor,
        totalPrice,
        distance: Math.round(distance * 10) / 10, // 1 décimale
        duration: estimatedDuration,
        currency: cityConfig.currency
      };
    } catch (error) {
      console.error('Price calculation error:', error);
      return null;
    }
  }, [pickup, destination, serviceType, city]);

  // Mise à jour immédiate et stable du prix calculé
  useEffect(() => {
    if (calculatePrice) {
      setCalculating(true);
      
      // Délai très court pour effet visuel minimal
      const timer = setTimeout(() => {
        setPriceBreakdown(calculatePrice);
        onPriceCalculated(calculatePrice);
        setCalculating(false);
      }, 100); // Réduit à 100ms pour plus de réactivité

      return () => clearTimeout(timer);
    } else {
      setPriceBreakdown(null);
      setCalculating(false);
    }
  }, [calculatePrice, onPriceCalculated]);

  const config = priceConfig[serviceType];
  const IconComponent = config.icon;

  // Formatage des prix en CDF
  const formatPrice = (amount: number, currency: 'XOF' = 'XOF') => {
    return new Intl.NumberFormat('fr-CD', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0
    }).format(amount);
  };

  if (!pickup || !destination) {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <div className="flex items-center gap-3 text-muted-foreground">
            <Calculator className="h-5 w-5" />
            <div>
              <p className="font-medium text-sm">Estimation du prix</p>
              <p className="text-xs">Sélectionnez les adresses pour voir le tarif</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardContent className="p-4 space-y-4">
        {/* Header avec service sélectionné */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <IconComponent className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-base">{config.label}</h3>
            <p className="text-sm text-muted-foreground">{config.description}</p>
          </div>
          {calculating && (
            <div className="ml-auto">
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>

        {/* Prix principal */}
        {priceBreakdown ? (
          <div className="space-y-4">
            {/* Prix total en évidence */}
            <div className="text-center p-4 bg-primary/5 rounded-lg border border-primary/20">
              <div className="text-3xl font-bold text-primary">
                {formatPrice(priceBreakdown.totalPrice, priceBreakdown.currency)}
              </div>
              <Badge variant="outline" className="mt-2">
                Service {serviceType.toUpperCase()}
              </Badge>
            </div>

            {/* Détails du trajet */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Route className="h-4 w-4 text-muted-foreground" />
                <div>
                  <span className="text-muted-foreground">Distance</span>
                  <div className="font-medium">{priceBreakdown.distance} km</div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <span className="text-muted-foreground">Durée</span>
                  <div className="font-medium">{priceBreakdown.duration} min</div>
                </div>
              </div>
            </div>

            {/* Décomposition du prix */}
            <div className="space-y-2 text-sm border-t pt-3">
              <div className="flex justify-between">
                <span>Prix de base:</span>
                <span>{formatPrice(priceBreakdown.basePrice, priceBreakdown.currency)}</span>
              </div>
              
              <div className="flex justify-between">
                <span>Distance ({priceBreakdown.distance} km):</span>
                <span>{formatPrice(priceBreakdown.distancePrice, priceBreakdown.currency)}</span>
              </div>
              
              {priceBreakdown.cityMultiplier !== 1.0 && (
                <div className="flex justify-between text-orange-600">
                  <span>Ajustement {city}:</span>
                  <span>×{priceBreakdown.cityMultiplier}</span>
                </div>
              )}
              
              <div className="flex justify-between font-medium border-t pt-2">
                <span>Total:</span>
                <span className="text-primary">
                  {formatPrice(priceBreakdown.totalPrice, priceBreakdown.currency)}
                </span>
              </div>
            </div>

            {/* Validation et note */}
            <div className="flex items-start gap-2 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
              <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-green-700 dark:text-green-300">
                <strong>Prix confirmé</strong> - Calculé automatiquement selon la distance et le service choisi.
                Pas de frais cachés.
              </div>
            </div>
          </div>
        ) : calculating ? (
          <div className="text-center py-6">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Calcul du prix en cours...</p>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-orange-600 bg-orange-50 dark:bg-orange-950/20 p-3 rounded-lg">
            <AlertTriangle className="h-4 w-4" />
            <p className="text-sm">Impossible de calculer le prix pour le moment</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RobustPriceCalculator;