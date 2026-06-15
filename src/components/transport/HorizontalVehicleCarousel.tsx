import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Check, ChevronRight, ChevronLeft } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useDriversCountByVehicle } from '@/hooks/useDriversCountByVehicle';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { getVehicleConfig } from '@/utils/vehicleMapper';
import { getVehicle3dIcon } from '@/utils/vehicle3dIcons';

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

interface HorizontalVehicleCarouselProps {
  vehicles: VehicleOption[];
  selectedVehicleId: string;
  onVehicleSelect: (id: string) => void;
  city: string;
}

export default function HorizontalVehicleCarousel({
  vehicles,
  selectedVehicleId,
  onVehicleSelect,
  city
}: HorizontalVehicleCarouselProps) {
  const { counts, loading } = useDriversCountByVehicle(city);
  const { triggerHaptic } = useHapticFeedback();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Tracking scroll indicators
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const checkScroll = () => {
      setCanScrollLeft(container.scrollLeft > 10);
      setCanScrollRight(
        container.scrollLeft < container.scrollWidth - container.clientWidth - 10
      );
    };

    container.addEventListener('scroll', checkScroll);
    checkScroll();
    
    return () => container.removeEventListener('scroll', checkScroll);
  }, [vehicles]);

  // Navigation clavier
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!scrollContainerRef.current) return;

      if (e.key === 'ArrowRight') {
        e.preventDefault();
        scrollContainerRef.current.scrollBy({ left: 170, behavior: 'smooth' });
        triggerHaptic('light');
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        scrollContainerRef.current.scrollBy({ left: -170, behavior: 'smooth' });
        triggerHaptic('light');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [triggerHaptic]);

  const handleVehicleSelect = (id: string) => {
    onVehicleSelect(id);
    triggerHaptic('medium');
  };

  return (
    <div className="relative -mx-4 px-4">
      {/* Gradient fade left */}
      <div className="absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-background to-transparent pointer-events-none z-10" />
      
      {/* Gradient fade right */}
      <div className="absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-background to-transparent pointer-events-none z-10" />

      {/* Scroll indicators subtils */}
      {canScrollLeft && (
        <div className="absolute left-1 top-1/2 -translate-y-1/2 z-20">
          <div className="w-7 h-7 rounded-full bg-background/90 backdrop-blur-sm flex items-center justify-center shadow-md border border-border/50">
            <ChevronLeft className="w-4 h-4 text-muted-foreground" />
          </div>
        </div>
      )}

      {canScrollRight && (
        <div className="absolute right-1 top-1/2 -translate-y-1/2 z-20">
          <div className="w-7 h-7 rounded-full bg-background/90 backdrop-blur-sm flex items-center justify-center shadow-md border border-border/50">
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </div>
        </div>
      )}

      {/* Scroll container */}
      <div
        ref={scrollContainerRef}
        className="flex gap-3 overflow-x-auto scroll-smooth snap-x snap-mandatory scrollbar-hide pb-2"
        style={{
          overscrollBehaviorX: 'contain',
          WebkitOverflowScrolling: 'touch'
        }}
      >
        {vehicles.map((vehicle, index) => {
          const svgSrc = getVehicle3dIcon(vehicle.id);
          const isSelected = selectedVehicleId === vehicle.id;
          const driverCount = counts[vehicle.id] || 0;
          const config = getVehicleConfig(vehicle.id);

          return (
            <motion.button
              key={vehicle.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ 
                opacity: 1,
                y: 0,
                scale: isSelected ? 1.02 : 1
              }}
              transition={{ 
                delay: index * 0.06,
                duration: 0.3,
                scale: { type: "spring", stiffness: 400, damping: 25 }
              }}
              whileHover={{ scale: isSelected ? 1.02 : 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleVehicleSelect(vehicle.id)}
              className={cn(
                "relative flex-shrink-0 w-[9.5rem] h-[11rem] snap-start",
                "p-4 rounded-3xl border-2 transition-all duration-300",
                "flex flex-col items-center justify-center gap-2",
                isSelected
                  ? cn(config.bgSelected, config.borderSelected, "shadow-lg")
                  : cn(config.bgSoft, "border-transparent hover:border-border/50 hover:shadow-md")
              )}
            >
              {/* Badge recommandé */}
              {vehicle.recommended && !isSelected && (
                <div className="absolute top-2.5 left-2.5 z-10">
                  <Badge className="bg-gradient-to-r from-amber-400 to-orange-400 text-white text-[9px] px-2 py-0.5 shadow-sm font-medium">
                    ⭐ Top
                  </Badge>
                </div>
              )}

              {/* Badge sélectionné */}
              {isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 500, damping: 25 }}
                  className={cn(
                    "absolute top-2.5 right-2.5 p-1.5 rounded-full shadow-md z-20",
                    config.iconBgSelected
                  )}
                >
                  <Check className={cn("w-3.5 h-3.5", config.textColor)} />
                </motion.div>
              )}

              {/* Icône dans cercle arrondi */}
              <div className={cn(
                "w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300",
                isSelected ? config.iconBgSelected : config.iconBg
              )}>
                <img src={svgSrc} className="w-9 h-9 object-contain" alt="" />
              </div>

              {/* Nom du véhicule */}
              <h3 className={cn(
                "font-bold text-base leading-tight transition-colors duration-300",
                isSelected ? config.textColor : "text-foreground"
              )}>
                {vehicle.name}
              </h3>

              {/* ETA compact */}
              <p className="text-[10px] text-muted-foreground font-medium">
                {vehicle.driverEta ? `${vehicle.driverEta} min` : vehicle.time}
              </p>

              {/* Prix principal */}
              <p className={cn(
                "text-xl font-extrabold leading-none transition-colors duration-300",
                isSelected ? config.textColor : "text-foreground"
              )}>
                {vehicle.price.toLocaleString()}
              </p>

              {/* Prix par km */}
              <p className="text-[10px] text-muted-foreground">
                {vehicle.pricePerKm}/km
              </p>

              {/* Nombre de chauffeurs disponibles */}
              {!loading && driverCount > 0 && (
                <Badge 
                  variant="outline" 
                  className={cn(
                    "text-[9px] px-1.5 py-0.5 mt-0.5",
                    driverCount > 5 
                      ? "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-800"
                      : "bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-950/50 dark:text-amber-400 dark:border-amber-800"
                  )}
                >
                  {driverCount} 🚗
                </Badge>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
