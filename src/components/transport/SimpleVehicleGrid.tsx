import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useDriversCountByVehicle } from '@/hooks/useDriversCountByVehicle';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { getVehicleLucideIcon } from '@/utils/vehicleLucideIcons';

interface VehicleOption {
  id: string;
  name: string;
  icon: any;
  time?: string;
  driverEta?: number;
  tripDuration?: number;
  price: number;
  pricePerKm: string;
  available: boolean;
  recommended?: boolean;
}

interface SimpleVehicleGridProps {
  vehicles: VehicleOption[];
  selectedVehicleId: string;
  onVehicleSelect: (id: string) => void;
  city: string;
}

export default function SimpleVehicleGrid({
  vehicles,
  selectedVehicleId,
  onVehicleSelect,
  city
}: SimpleVehicleGridProps) {
  const { counts, loading } = useDriversCountByVehicle(city);
  const { triggerHaptic } = useHapticFeedback();

  return (
    <div className="grid grid-cols-2 gap-3">
      {vehicles.map((vehicle, index) => {
        const isSelected = selectedVehicleId === vehicle.id;
        const driverCount = counts[vehicle.id] || 0;
        const { icon: VehicleIcon, colorClass, bgClass, bgSelectedClass } = getVehicleLucideIcon(vehicle.id);

        return (
          <motion.button
            key={vehicle.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ 
              opacity: 1, 
              scale: 1,
              borderColor: isSelected ? "hsl(var(--primary))" : "hsl(var(--border) / 0.5)"
            }}
            transition={{ delay: index * 0.05 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              onVehicleSelect(vehicle.id);
              triggerHaptic('medium');
            }}
            className={cn(
              "relative p-4 rounded-2xl border-2 transition-all duration-300 text-left",
              isSelected
                ? "bg-primary/10 border-primary shadow-glow-green"
                : "bg-card/50 border-border/50 hover:border-primary/30 hover:shadow-md"
            )}
          >
            {/* Badge recommandé */}
            {vehicle.recommended && !isSelected && (
              <Badge className="absolute -top-2 -right-2 bg-amber-500/90 text-white text-[10px] px-2 py-0.5">
                ⭐ Top
              </Badge>
            )}

            {/* Badge sélectionné */}
            {isSelected && (
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                className="absolute -top-2 -right-2 bg-primary text-primary-foreground p-1.5 rounded-full shadow-lg"
              >
                <Check className="w-3.5 h-3.5" />
              </motion.div>
            )}

            {/* Ultra-light Lucide Vehicle Icon */}
            <div className={cn(
              "w-14 h-14 rounded-xl flex items-center justify-center mb-3 transition-colors",
              isSelected ? bgSelectedClass : bgClass
            )}>
              <VehicleIcon className={cn("w-7 h-7", colorClass)} strokeWidth={1.8} />
            </div>

            {/* Nom + Temps */}
            <div className="mb-2">
              <h3 className={cn(
                "font-bold text-sm mb-0.5",
                isSelected ? "text-primary" : "text-foreground"
              )}>
                {vehicle.name}
              </h3>
              <p className="text-[10px] text-muted-foreground">
                {vehicle.driverEta ? `${vehicle.driverEta} min` : vehicle.time}
              </p>
            </div>

            {/* Prix */}
            <div className="flex items-baseline justify-between">
              <div>
                <p className={cn(
                  "text-lg font-extrabold",
                  isSelected ? "text-primary" : "text-foreground"
                )}>
                  {vehicle.price.toLocaleString()}
                </p>
                <p className="text-[9px] text-muted-foreground">{vehicle.pricePerKm}/km</p>
              </div>

              {!loading && driverCount > 0 && (
                <Badge 
                  variant="outline" 
                  className={cn(
                    "text-[9px] px-1.5 py-0.5",
                    driverCount > 5 
                      ? "bg-green-500/10 text-green-600 border-green-500/20"
                      : "bg-amber-500/10 text-amber-600 border-amber-500/20"
                  )}
                >
                  {driverCount} 🚗
                </Badge>
              )}
            </div>

            {/* Pulse animation */}
            {isSelected && (
              <motion.div
                className="absolute inset-0 border-2 border-primary rounded-2xl pointer-events-none"
                animate={{ 
                  scale: [1, 1.03, 1], 
                  opacity: [0.5, 0, 0.5],
                  borderWidth: [2, 3, 2]
                }}
                transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
              />
            )}
          </motion.button>
        );
      })}
    </div>
  );
}
