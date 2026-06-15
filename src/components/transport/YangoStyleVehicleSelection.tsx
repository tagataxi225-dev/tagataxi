import React from 'react';
import { Car, Bike, Bus, Truck, Clock, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { usePricingRules } from '@/hooks/usePricingRules';

interface YangoVehicle {
  id: string;
  name: string;
  type: 'moto' | 'eco' | 'standard' | 'premium' | 'bus';
  icon: React.ComponentType<any>;
  estimatedTime: number;
  basePrice: number;
  multiplier: number;
  available: boolean;
  capacity: number;
}

interface YangoStyleVehicleSelectionProps {
  distance: number;
  onVehicleSelect: (vehicle: YangoVehicle & { price: number }) => void;
  selectedVehicleId?: string;
  onContinue?: () => void;
}

const YangoStyleVehicleSelection: React.FC<YangoStyleVehicleSelectionProps> = ({
  distance,
  onVehicleSelect,
  selectedVehicleId,
  onContinue
}) => {
  const { rules } = usePricingRules();
  const vehicles: YangoVehicle[] = [
    {
      id: 'moto',
      name: 'Moto',
      type: 'moto',
      icon: Bike,
      estimatedTime: 5,
      basePrice: 300,
      multiplier: 0.6,
      available: true,
      capacity: 1
    },
    {
      id: 'eco',
      name: 'Eco',
      type: 'eco',
      icon: Car,
      estimatedTime: 8,
      basePrice: 500,
      multiplier: 1.0,
      available: true,
      capacity: 4
    },
    {
      id: 'standard',
      name: 'Standard',
      type: 'standard',
      icon: Car,
      estimatedTime: 10,
      basePrice: 750,
      multiplier: 1.5,
      available: true,
      capacity: 4
    },
    {
      id: 'premium',
      name: 'Premium',
      type: 'premium',
      icon: Car,
      estimatedTime: 12,
      basePrice: 1200,
      multiplier: 2.0,
      available: true,
      capacity: 4
    },
    {
      id: 'bus',
      name: 'Bus',
      type: 'bus',
      icon: Bus,
      estimatedTime: 20,
      basePrice: 200,
      multiplier: 0.4,
      available: false,
      capacity: 12
    }
  ];

  const calculatePrice = (vehicle: YangoVehicle): number => {
    const distanceKm = Math.max(distance, 0);
    const rule = rules.find(r => r.service_type === 'transport' && r.vehicle_class === vehicle.id);
    if (rule) {
      return Math.round((Number(rule.base_price) || 0) + distanceKm * (Number(rule.price_per_km) || 0));
    }
    // Fallback legacy
    const pricePerKm = 150;
    return Math.round(vehicle.basePrice + (distanceKm * pricePerKm * vehicle.multiplier));
  };

  const getVehicleColor = (type: string, isSelected: boolean, available: boolean) => {
    if (!available) return 'bg-grey-100 border-grey-200';
    if (isSelected) return 'bg-primary border-primary';
    
    switch (type) {
      case 'moto': return 'bg-congo-yellow/10 border-congo-yellow/30 hover:border-congo-yellow';
      case 'eco': return 'bg-green-50 border-green-200 hover:border-green-400';
      case 'standard': return 'bg-blue-50 border-blue-200 hover:border-blue-400';
      case 'premium': return 'bg-purple-50 border-purple-200 hover:border-purple-400';
      case 'bus': return 'bg-orange-50 border-orange-200 hover:border-orange-400';
      default: return 'bg-grey-50 border-grey-200 hover:border-grey-400';
    }
  };

  const getIconColor = (type: string, isSelected: boolean, available: boolean) => {
    if (!available) return 'text-grey-400';
    if (isSelected) return 'text-white';
    
    switch (type) {
      case 'moto': return 'text-congo-yellow';
      case 'eco': return 'text-green-600';
      case 'standard': return 'text-blue-600';
      case 'premium': return 'text-purple-600';
      case 'bus': return 'text-orange-600';
      default: return 'text-grey-600';
    }
  };

  const getTextColor = (isSelected: boolean, available: boolean) => {
    if (!available) return 'text-grey-400';
    if (isSelected) return 'text-white';
    return 'text-grey-900';
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between px-0 mb-2">
        <h3 className="text-sm sm:text-base font-semibold text-grey-900">Choisir un véhicule</h3>
        {distance > 0 && (
          <span className="text-[10px] sm:text-xs font-medium text-grey-600 bg-grey-100 px-1.5 sm:px-2 py-0.5 rounded-full">
            {distance.toFixed(1)} km
          </span>
        )}
      </div>

      {/* Horizontal Vehicle Cards */}
      <div className="relative">
        {/* Scroll container with gradient fade */}
        <div className="overflow-x-auto scrollbar-hide pb-2">
          <div className="flex gap-3 px-1 min-w-max">
            {vehicles.map((vehicle) => {
              const price = calculatePrice(vehicle);
              const isSelected = selectedVehicleId === vehicle.id;
              const cardColorClass = getVehicleColor(vehicle.type, isSelected, vehicle.available);
              const iconColorClass = getIconColor(vehicle.type, isSelected, vehicle.available);
              const textColorClass = getTextColor(isSelected, vehicle.available);

              return (
                <div
                  key={vehicle.id}
                  onClick={() => vehicle.available && onVehicleSelect({ ...vehicle, price })}
                  className={`
                    relative flex-shrink-0 
                    w-16 sm:w-20 h-20 sm:h-24
                    p-2 sm:p-2.5 rounded-xl border-2 
                    transition-all duration-200 cursor-pointer touch-friendly
                    ${cardColorClass}
                    ${!vehicle.available ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md active:scale-95'}
                    ${isSelected ? 'shadow-lg scale-105' : ''}
                  `}
                >
                  {/* Icon - Plus compact sur mobile */}
                  <div className={`w-6 sm:w-7 h-6 sm:h-7 mx-auto mb-1 flex items-center justify-center rounded-lg
                    ${isSelected ? 'bg-white/20' : 'bg-transparent'}
                  `}>
                    <vehicle.icon className={`h-3.5 sm:h-4 w-3.5 sm:w-4 ${iconColorClass}`} strokeWidth={2.5} />
                  </div>

                  {/* Vehicle Name */}
                  <div className="text-center mb-1">
                    <p className={`text-[10px] sm:text-[11px] font-semibold ${textColorClass} leading-tight`}>
                      {vehicle.name}
                    </p>
                  </div>

                  {/* Time Badge - Ultra compact */}
                  <div className={`flex items-center justify-center mb-1 px-0.5 sm:px-1 py-0.5 rounded-full
                    ${isSelected ? 'bg-white/20' : 'bg-black/5'}
                  `}>
                    <Clock className={`h-1.5 sm:h-2 w-1.5 sm:w-2 mr-0.5 ${textColorClass}`} />
                    <span className={`text-[8px] sm:text-[9px] font-medium ${textColorClass}`}>
                      {vehicle.estimatedTime}m
                    </span>
                  </div>

                  {/* Price - Compact */}
                  <div className="text-center">
                    <p className={`text-[10px] sm:text-[11px] font-bold ${textColorClass} leading-tight`}>
                      {vehicle.available ? `${price.toLocaleString()} CDF` : 'N/A'}
                    </p>
                  </div>

                  {/* Selected Indicator */}
                  {isSelected && (
                    <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-primary rounded-full border-2 border-white flex items-center justify-center">
                      <div className="w-1 h-1 bg-white rounded-full"></div>
                    </div>
                  )}

                  {/* Unavailable Overlay */}
                  {!vehicle.available && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/50 rounded-xl">
                      <span className="text-[9px] font-medium text-grey-600 bg-white px-1.5 py-0.5 rounded">
                        Indispo
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute top-0 right-0 w-8 h-full bg-gradient-to-l from-white via-white/80 to-transparent pointer-events-none"></div>
      </div>

      {/* Selected Vehicle Details - Compact mobile */}
      {selectedVehicleId && (
        <div className="bg-gradient-to-r from-primary/5 to-primary/10 rounded-xl p-2.5 sm:p-3 border border-primary/20 mt-3">
          {(() => {
            const selectedVehicle = vehicles.find(v => v.id === selectedVehicleId);
            if (!selectedVehicle) return null;
            
            return (
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-7 sm:w-8 h-7 sm:h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <selectedVehicle.icon className="h-3.5 sm:h-4 w-3.5 sm:w-4 text-primary" strokeWidth={2.5} />
                  </div>
                  <div>
                    <p className="font-semibold text-xs sm:text-sm text-grey-900">{selectedVehicle.name}</p>
                    <p className="text-[10px] sm:text-xs text-grey-600">{selectedVehicle.capacity} places • ~{selectedVehicle.estimatedTime} min</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm sm:text-base font-bold text-primary">
                    {calculatePrice(selectedVehicle).toLocaleString()} CDF
                  </p>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Bouton Continuer flottant - Style moderne */}
      {selectedVehicleId && onContinue && (
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          whileTap={{ scale: 0.97 }}
          onClick={onContinue}
          className="w-full mt-4 py-3 sm:py-3.5 rounded-xl sm:rounded-2xl bg-primary text-white font-semibold text-sm sm:text-base shadow-lg hover:shadow-xl transition-all active:scale-98"
        >
          <span className="flex items-center justify-center gap-2">
            Continuer
            <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </span>
        </motion.button>
      )}
    </div>
  );
};

export default YangoStyleVehicleSelection;