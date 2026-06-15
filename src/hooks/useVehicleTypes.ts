import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { VehicleType } from '@/types/vehicle';
import { getVehicleConfig } from '@/utils/vehicleMapper';
import { getVehicleClass } from '@/utils/pricingMapper';
import { getCityOrDefault } from '@/config/coveredCities';

// Normalise 'moto' → 'taxi_moto', 'eco' → 'taxi_eco', etc.
const normalizeServiceType = (raw: string): string => {
  if (raw.startsWith('taxi_')) return raw;
  const map: Record<string, string> = {
    'moto': 'taxi_moto',
    'eco': 'taxi_eco',
    'confort': 'taxi_confort',
    'standard': 'taxi_confort',
    'premium': 'taxi_premium',
  };
  return map[raw] || `taxi_${raw}`;
};

// vehicle_class pour pricing_rules — accepte les deux formats
const getVehicleClassFixed = (serviceType: string): string => {
  const directMap: Record<string, string> = {
    'moto': 'moto', 'eco': 'eco', 'confort': 'standard',
    'standard': 'standard', 'premium': 'premium',
  };
  if (directMap[serviceType]) return directMap[serviceType];
  return getVehicleClass(serviceType);
};

interface UseVehicleTypesOptions {
  distance?: number;
  city?: string;
}

export const useVehicleTypes = ({ distance = 0, city = 'Kinshasa' }: UseVehicleTypesOptions = {}) => {
  const queryClient = useQueryClient();

  // stableDistance change souvent (recalcul de route) mais ne doit PAS déclencher
  // un nouvel appel Supabase — les configs et tarifs ne dépendent pas de la distance.
  const stableDistance = Math.round(distance || 0);
  const effectiveCity = getCityOrDefault(city);

  // ── Fetch uniquement les configs de base (sans distance dans la queryKey) ──
  // staleTime 5 min : les configs véhicules changent rarement.
  // La distance est gérée client-side via useMemo ci-dessous.
  const { data: baseVehicles, isLoading, error } = useQuery({
    queryKey: ['vehicle-configs', effectiveCity],
    queryFn: async () => {
      console.log('🔍 [useVehicleTypes] Fetching vehicles for:', { city, effectiveCity, distance });

      // 1. Fetch service configurations for taxi services
      const { data: configs, error: configError } = await supabase
        .from('service_configurations')
        .select('*')
        .eq('service_category', 'taxi')
        .eq('is_active', true);

      if (configError) {
        console.error('❌ [useVehicleTypes] Config error:', configError);
        throw configError;
      }
      if (!configs || configs.length === 0) {
        console.warn('⚠️ [useVehicleTypes] Aucune config DB → fallback statique pour', city);
        const isAbidjan = city.toLowerCase().includes('abidjan');
        return [
          { id: 'taxi_moto', name: 'Moto-taxi', icon: 'Bike',
            gradient: 'from-amber-500 to-amber-600', description: 'Rapide et économique',
            color: '#F59E0B', basePrice: isAbidjan ? 500 : 1000,
            pricePerKm: isAbidjan ? 100 : 200,
            calculatedPrice: isAbidjan ? 500 : 1000,
            eta: 3, driverEta: 3, features: [], capacity: 1, available: true, isPopular: true },
          { id: 'taxi_eco', name: 'Éco', icon: 'Car',
            gradient: 'from-green-500 to-green-600', description: 'Option économique',
            color: '#10B981', basePrice: isAbidjan ? 800 : 1500,
            pricePerKm: isAbidjan ? 150 : 250,
            calculatedPrice: isAbidjan ? 800 : 1500,
            eta: 5, driverEta: 5, features: [], capacity: 4, available: true, isPopular: false },
          { id: 'taxi_confort', name: 'Confort', icon: 'Car',
            gradient: 'from-blue-500 to-blue-600', description: 'Confort et qualité',
            color: '#3B82F6', basePrice: isAbidjan ? 1200 : 2500,
            pricePerKm: isAbidjan ? 200 : 400,
            calculatedPrice: isAbidjan ? 1200 : 2500,
            eta: 7, driverEta: 7, features: [], capacity: 4, available: true, isPopular: true },
          { id: 'taxi_premium', name: 'Premium', icon: 'Car',
            gradient: 'from-purple-500 to-purple-600', description: 'Luxe et confort',
            color: '#8B5CF6', basePrice: isAbidjan ? 2000 : 3500,
            pricePerKm: isAbidjan ? 300 : 600,
            calculatedPrice: isAbidjan ? 2000 : 3500,
            eta: 10, driverEta: 10, features: [], capacity: 4, available: true, isPopular: false },
        ].sort((a, b) => a.basePrice - b.basePrice);
      }
      
      console.log('✅ [useVehicleTypes] Configs trouvées:', configs.length);

      // 2. Fetch pricing rules using normalized city
      const { data: pricingRules, error: pricingError } = await supabase
        .from('pricing_rules')
        .select('*')
        .eq('service_type', 'transport')
        .ilike('city', effectiveCity)
        .eq('is_active', true);

      if (pricingError) {
        console.error('❌ [useVehicleTypes] Pricing error:', pricingError);
        throw pricingError;
      }
      
      console.log('💰 [useVehicleTypes] Pricing rules trouvées:', pricingRules?.length || 0);

      // 3. Map configs with pricing_rules
      const mappedVehicles: VehicleType[] = configs.map(config => {
        const normalizedType = normalizeServiceType(config.service_type);
        const vehicleClass = getVehicleClassFixed(config.service_type);
        const pricing = pricingRules?.find(p => p.vehicle_class === vehicleClass);

        const vehicleConfig = getVehicleConfig(normalizedType);
        const basePrice = pricing?.base_price || 2500;
        const pricePerKm = pricing?.price_per_km || 300;
        // calculatedPrice est recalculé client-side dans le useMemo — on stocke basePrice ici
        const calculatedPrice = basePrice;

        // ETA intelligent par type de véhicule
        const getSmartEta = (serviceType: string): number => {
          const baseEtaMap: Record<string, number> = {
            'taxi_moto': 3,
            'taxi_eco': 5,
            'taxi_confort': 7,
            'taxi_premium': 10
          };
          
          const baseEta = baseEtaMap[serviceType] || 5;
          
          // Ajustement heure de pointe (7-9h et 17-19h)
          const hour = new Date().getHours();
          const isRushHour = (hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19);
          const rushMultiplier = isRushHour ? 1.5 : 1;
          
          // Deterministic variation based on type hash to avoid re-render spikes
          let hash = 0;
          for (let i = 0; i < serviceType.length; i++) hash = ((hash << 5) - hash + serviceType.charCodeAt(i)) | 0;
          const variation = Math.abs(hash) % 2;
          
          return Math.round(baseEta * rushMultiplier) + variation;
        };

        // 1. Temps d'arrivée chauffeur (toujours par type de véhicule)
        const driverEta = getSmartEta(normalizedType);
        
        // 2. Durée du trajet (si route calculée) - vitesse moyenne réaliste par ville
        const avgSpeedMap: Record<string, number> = {
          'taxi_moto': 25,     // Motos plus rapides en ville
          'taxi_eco': 20,      // Vitesse standard
          'taxi_confort': 22,  // Légèrement plus rapide
          'taxi_premium': 22   // Similar au confort
        };
        const avgSpeed = avgSpeedMap[normalizedType] || 20;
        const tripDuration = distance > 0 
          ? Math.round((distance / avgSpeed) * 60)
          : undefined;

        // ETA affiché = driverEta (backward compat)
        const eta = driverEta;

        return {
          id: normalizedType,
          name: vehicleConfig.displayName,
          description: vehicleConfig.description,
          icon: vehicleConfig.icon,
          gradient: vehicleConfig.gradient,
          basePrice,
          pricePerKm,
          calculatedPrice,
          eta,
          driverEta,
          tripDuration,
          features: Array.isArray(config.features) 
            ? config.features.filter((f): f is string => typeof f === 'string')
            : [],
          capacity: 4,
          available: true,
          isPopular: normalizedType === 'taxi_confort' || normalizedType === 'taxi_moto'
        };
      });

      // Deduplicate by normalized ID (defensive guard)
      const deduped = Array.from(
        new Map(mappedVehicles.map(v => [v.id, v])).values()
      );

      // Sort by price (cheapest first)
      const sortedVehicles = deduped.sort((a, b) => a.calculatedPrice - b.calculatedPrice);
      
      console.log('🚗 [useVehicleTypes] Véhicules mappés:', {
        count: sortedVehicles.length,
        vehicles: sortedVehicles.map(v => ({ id: v.id, name: v.name, price: v.calculatedPrice }))
      });
      
      return sortedVehicles;
    },
    enabled: true,
    staleTime: 5 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 1,
    retryDelay: 3000,
    refetchOnWindowFocus: false,
    // Immediate placeholder so cards are interactive before DB fetch completes
    placeholderData: (previousData) => previousData ?? (() => {
      const isAbidjan = city.toLowerCase().includes('abidjan');
      return [
        { id: 'taxi_moto', name: 'Moto-taxi', icon: 'Bike', gradient: 'from-amber-500 to-amber-600', description: 'Rapide', color: '#F59E0B', basePrice: isAbidjan ? 500 : 1000, pricePerKm: isAbidjan ? 100 : 200, calculatedPrice: isAbidjan ? 500 : 1000, eta: 3, driverEta: 3, features: [], capacity: 1, available: true, isPopular: true },
        { id: 'taxi_eco', name: 'Éco', icon: 'Car', gradient: 'from-green-500 to-green-600', description: 'Économique', color: '#10B981', basePrice: isAbidjan ? 800 : 1500, pricePerKm: isAbidjan ? 150 : 250, calculatedPrice: isAbidjan ? 800 : 1500, eta: 5, driverEta: 5, features: [], capacity: 4, available: true, isPopular: false },
        { id: 'taxi_confort', name: 'Confort', icon: 'Car', gradient: 'from-blue-500 to-blue-600', description: 'Confort', color: '#3B82F6', basePrice: isAbidjan ? 1200 : 2500, pricePerKm: isAbidjan ? 200 : 400, calculatedPrice: isAbidjan ? 1200 : 2500, eta: 7, driverEta: 7, features: [], capacity: 4, available: true, isPopular: true },
        { id: 'taxi_premium', name: 'Premium', icon: 'Car', gradient: 'from-purple-500 to-purple-600', description: 'Luxe', color: '#8B5CF6', basePrice: isAbidjan ? 2000 : 3500, pricePerKm: isAbidjan ? 300 : 600, calculatedPrice: isAbidjan ? 2000 : 3500, eta: 10, driverEta: 10, features: [], capacity: 4, available: true, isPopular: false },
      ].sort((a, b) => a.basePrice - b.basePrice) as VehicleType[];
    })(),
  });

  // Calcul des prix client-side — ne déclenche PAS de refetch Supabase quand distance change
  const vehicles = useMemo(() => {
    if (!baseVehicles) return [];
    return baseVehicles
      .map(v => ({
        ...v,
        calculatedPrice: Math.round(v.basePrice + stableDistance * v.pricePerKm),
      }))
      .sort((a, b) => a.calculatedPrice - b.calculatedPrice);
  }, [baseVehicles, stableDistance]);

  return {
    vehicles,
    isLoading,
    error
  };
};
