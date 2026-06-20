import React, { useMemo, useCallback, memo, useEffect } from 'react';
import { Car } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAvailableTaxiServices } from '@/hooks/useAvailableTaxiServices';
import { cn } from '@/lib/utils';
import { getVehicle3dIcon } from '@/utils/vehicle3dIcons';

interface YangoVehicle {
  id: string;
  name: string;
  icon3d: string;
  estimatedTime: number;
  basePrice: number;
  pricePerKm: number;
  available: boolean;
  gradient: string;
  borderColor: string;
  bgColor: string;
}

interface YangoVerticalVehicleCardsProps {
  distance: number;
  selectedVehicleId: string;
  onVehicleSelect: (vehicleId: string) => void;
  city?: string;
}

const YangoVerticalVehicleCards = memo<YangoVerticalVehicleCardsProps>(({
  distance,
  selectedVehicleId,
  onVehicleSelect,
  city = 'Abidjan'
}) => {
  const { availableServices, loading } = useAvailableTaxiServices(city);

  // Configuration visuelle des véhicules
  const getVehicleDisplayConfig = useCallback((vehicleClass: string) => {
    const configs: Record<string, any> = {
      moto: {
        name: 'Moto',
        estimatedTime: 5,
        gradient: 'from-yellow-50/80 to-yellow-100/80',
        borderColor: 'border-l-congo-yellow',
        bgColor: 'bg-yellow-50',
      },
      eco: {
        name: 'Eco',
        estimatedTime: 8,
        gradient: 'from-green-50/80 to-green-100/80',
        borderColor: 'border-l-congo-green',
        bgColor: 'bg-green-50',
      },
      standard: {
        name: 'Standard',
        estimatedTime: 10,
        gradient: 'from-blue-50/80 to-blue-100/80',
        borderColor: 'border-l-congo-blue',
        bgColor: 'bg-blue-50',
      },
      premium: {
        name: 'Premium',
        estimatedTime: 12,
        gradient: 'from-purple-50/80 to-purple-100/80',
        borderColor: 'border-l-purple-500',
        bgColor: 'bg-purple-50',
      }
    };
    return configs[vehicleClass] || configs.standard;
  }, []);

  // Charger dynamiquement les véhicules depuis availableServices
  const vehicles: YangoVehicle[] = useMemo(() => {
    const processedVehicles = availableServices.map(service => {
      const config = getVehicleDisplayConfig(service.vehicle_class);
      const iconKey = service.vehicle_class === 'standard' ? 'taxi_confort' : `taxi_${service.vehicle_class}`;
      
      return {
        id: service.vehicle_class,
        name: config.name,
        icon3d: getVehicle3dIcon(iconKey),
        estimatedTime: config.estimatedTime,
        basePrice: Number(service.base_price),
        pricePerKm: Number(service.price_per_km),
        available: true,
        gradient: config.gradient,
        borderColor: config.borderColor,
        bgColor: config.bgColor,
      };
    }).sort((a, b) => a.basePrice - b.basePrice);
    
    return processedVehicles;
  }, [availableServices, getVehicleDisplayConfig]);

  // ✅ Sélectionner automatiquement le premier véhicule si aucun n'est sélectionné
  useEffect(() => {
    if (!selectedVehicleId && vehicles.length > 0) {
      onVehicleSelect(vehicles[0].id);
    }
  }, [vehicles, selectedVehicleId, onVehicleSelect]);

  // Message si aucun véhicule disponible
  if (!loading && vehicles.length === 0) {
    return (
      <div className="p-6 text-center space-y-3 bg-muted/20 rounded-xl border border-dashed border-muted-foreground/30">
        <Car className="w-16 h-16 mx-auto text-muted-foreground/40" />
        <div className="space-y-1">
          <p className="text-destructive font-semibold text-base">⚠️ Aucun véhicule disponible</p>
          <p className="text-sm text-muted-foreground font-medium">
            Ville sélectionnée : <span className="font-bold text-foreground">{city}</span>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3" style={{ willChange: 'transform' }}>
      {vehicles.map((vehicle, index) => {
        const isSelected = selectedVehicleId === vehicle.id;

        return (
          <motion.div
            key={vehicle.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => vehicle.available && onVehicleSelect(vehicle.id)}
            className={cn(
              "relative flex items-center gap-4 p-4 rounded-3xl border-l-[6px] cursor-pointer transition-all duration-300",
              vehicle.borderColor,
              isSelected 
                ? "bg-card shadow-xl ring-2 ring-primary/20 scale-[1.02]"
                : "bg-card/60 hover:bg-card border-transparent shadow-sm hover:shadow-md"
            )}
          >
            {/* 3D Icon Visual */}
            <div className="flex-shrink-0 w-16 h-16 flex items-center justify-center">
              <img 
                src={vehicle.icon3d} 
                alt={vehicle.name}
                className="w-full h-full object-contain filter drop-shadow-lg"
              />
            </div>

            {/* Infos */}
            <div className="flex-1 min-w-0">
              <h4 className="font-black text-base text-foreground leading-tight">{vehicle.name}</h4>
              <p className="text-xs font-bold text-muted-foreground mt-0.5">{vehicle.estimatedTime} min • Chauffeur proche</p>
            </div>

            {/* Pricing */}
            <div className="flex-shrink-0 text-right">
              <p className="text-lg font-black text-foreground">
                {vehicle.basePrice.toLocaleString()}
                <span className="text-[10px] font-bold ml-1">CDF</span>
              </p>
              <p className="text-[10px] font-bold text-muted-foreground">Base + {vehicle.pricePerKm} /km</p>
            </div>

            {isSelected && (
              <motion.div
                layoutId="active-check"
                className="absolute -top-1 -right-1 w-6 h-6 bg-primary rounded-full flex items-center justify-center shadow-lg border-2 border-background"
              >
                <svg className="w-3.5 h-3.5 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" />
                </svg>
              </motion.div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
});

YangoVerticalVehicleCards.displayName = 'YangoVerticalVehicleCards';
export default YangoVerticalVehicleCards;
