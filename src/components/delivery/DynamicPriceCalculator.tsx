import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Calculator, MapPin, Route } from 'lucide-react';
import { secureLocation, isValidLocation, calculateBasePrice } from '@/utils/locationValidation';
import type { LocationData } from '@/types/location';

interface DynamicPriceCalculatorProps {
  pickup: LocationData | null;
  destination: LocationData | null;
  serviceType: 'flash' | 'flex' | 'maxicharge';
  onPriceCalculated: (price: number) => void;
}

// Cache pour éviter les recalculs identiques
const priceCache = new Map<string, { price: number; distance: number; duration: number }>();

const DynamicPriceCalculator: React.FC<DynamicPriceCalculatorProps> = React.memo(({
  pickup,
  destination,
  serviceType,
  onPriceCalculated
}) => {
  const [calculating, setCalculating] = useState(false);
  const [priceDetails, setPriceDetails] = useState<{
    price: number;
    distance: number;
    duration: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<NodeJS.Timeout>();
  const [lastCalculatedKey, setLastCalculatedKey] = useState<string>('');

  // Clé de cache stable basée sur les coordonnées et le service
  const cacheKey = useMemo(() => {
    if (!pickup || !destination) return '';
    return `${pickup.lat}-${pickup.lng}-${destination.lat}-${destination.lng}-${serviceType}`;
  }, [pickup?.lat, pickup?.lng, destination?.lat, destination?.lng, serviceType]);

  // Fonction de calcul optimisée sans dépendance circulaire
  const calculatePrice = useCallback(async () => {
    if (!pickup || !destination || calculating) return;
    
    const currentCacheKey = cacheKey;
    
    // Éviter les recalculs redondants avec vérification stricte
    if (lastCalculatedKey === currentCacheKey && priceDetails) {
      return;
    }
    
    // Vérifier le cache en premier
    const cachedResult = priceCache.get(currentCacheKey);
    if (cachedResult) {
      setPriceDetails(cachedResult);
      setError(null);
      setLastCalculatedKey(currentCacheKey);
      onPriceCalculated?.(cachedResult.price);
      return;
    }

    setCalculating(true);
    setError(null);

    try {
      // Validation et sécurisation des locations
      const securePickup = secureLocation(pickup);
      const secureDestination = secureLocation(destination);

      if (!isValidLocation(securePickup) || !isValidLocation(secureDestination)) {
        throw new Error('Coordonnées invalides');
      }

      const result = calculateBasePrice(securePickup, secureDestination, serviceType);
      
      // Mise en cache
      priceCache.set(currentCacheKey, result);
      
      setPriceDetails(result);
      setLastCalculatedKey(currentCacheKey);
      onPriceCalculated?.(result.price);
    } catch (err) {
      console.error('Error calculating price:', err);
      setError('Calcul en cours...');
      
      // Prix de fallback intelligent
      const getFallbackPrice = () => {
        const basePrices = { flash: 5000, flex: 7000, maxicharge: 12000 };
        const city = pickup?.address?.includes('Lubumbashi') ? 'Lubumbashi' :
                    pickup?.address?.includes('Kolwezi') ? 'Kolwezi' :
                    pickup?.address?.includes('Abidjan') ? 'Abidjan' : 'Kinshasa';
        
        const multipliers = { 'Kinshasa': 1.0, 'Lubumbashi': 1.2, 'Kolwezi': 1.1, 'Abidjan': 1.0 };
        const multiplier = multipliers[city as keyof typeof multipliers] || 1.0;
        
        return Math.round(basePrices[serviceType as keyof typeof basePrices] * multiplier);
      };
      
      const fallbackResult = {
        price: getFallbackPrice(),
        distance: 5,
        duration: 20
      };
      
      // Cache aussi le fallback pour éviter les recalculs
      priceCache.set(currentCacheKey, fallbackResult);
      setPriceDetails(fallbackResult);
      setLastCalculatedKey(currentCacheKey);
      onPriceCalculated?.(fallbackResult.price);
    } finally {
      setCalculating(false);
    }
  }, [pickup?.lat, pickup?.lng, pickup?.address, destination?.lat, destination?.lng, destination?.address, serviceType, calculating]);

  // Debounced effect pour éviter les calculs trop fréquents
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      calculatePrice();
    }, 1500); // Debounce augmenté à 1.5 seconde pour plus de stabilité

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [calculatePrice]);

  if (!pickup || !destination) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calculator className="w-4 h-4" />
            <span className="text-sm">Sélectionnez les adresses pour voir le prix</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Calculator className="w-4 h-4 text-primary" />
          <span className="font-medium text-sm">Estimation du prix</span>
          {calculating && <Loader2 className="w-4 h-4 animate-spin" />}
        </div>

        {error && (
          <div className="text-sm text-amber-600 bg-amber-50 p-2 rounded">
            ⚠️ {error}
          </div>
        )}

        {priceDetails && (
          <div className="space-y-3">
            <div className="text-center">
            <div className="text-2xl font-bold text-primary">
                {priceDetails.price.toLocaleString()} CDF
              </div>
              <Badge variant="outline" className="mt-1">
                Service {serviceType.toUpperCase()}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2">
                <Route className="w-4 h-4 text-muted-foreground" />
                <div>
                  <span className="text-muted-foreground">Distance</span>
                  <div className="font-medium">
                    {priceDetails.distance > 0 ? `${priceDetails.distance} km` : 'Estimée'}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <div>
                  <span className="text-muted-foreground">Durée</span>
                  <div className="font-medium">{priceDetails.duration} min</div>
                </div>
              </div>
            </div>

            <div className="border-t pt-3 space-y-2 text-xs">
            <div className="flex justify-between font-medium">
                <span>Total:</span>
                <span className="text-primary">{priceDetails.price.toLocaleString()} CDF</span>
              </div>
            </div>

            <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
              💡 Prix indicatif. Le tarif final peut varier selon les conditions de circulation.
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

DynamicPriceCalculator.displayName = 'DynamicPriceCalculator';

export default DynamicPriceCalculator;