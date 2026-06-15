import { useCallback, useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useEmblaCarousel from 'embla-carousel-react';
import { useAvailableTaxiServices } from '@/hooks/useAvailableTaxiServices';
import { VehicleType } from '@/types/vehicle';
import { getYangoTheme } from '@/utils/yangoVehicleThemes';
import { ArrowRight, Clock } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface YangoVehicleSelectorProps {
  distance: number;
  selectedVehicleId: string | null;
  onVehicleSelect: (vehicle: VehicleType) => void;
  city?: string;
  calculatingRoute?: boolean;
  onContinue?: () => void;
}

export default function YangoVehicleSelector({
  distance,
  selectedVehicleId,
  onVehicleSelect,
  city = 'Kinshasa',
  calculatingRoute = false,
  onContinue
}: YangoVehicleSelectorProps) {
  const { availableServices, loading } = useAvailableTaxiServices(city);
  
  // Convertir availableServices en VehicleType[]
  const vehicles: VehicleType[] = useMemo(() => {
    console.log('🔄 [YangoVehicleSelector] Converting services to vehicles:', {
      city,
      distance,
      servicesCount: availableServices.length,
      services: availableServices.map(s => s.vehicle_class)
    });
    
    return availableServices.map(service => {
      const calculatedPrice = service.base_price + (service.price_per_km * (distance / 1000));
      const eta = Math.max(5, Math.ceil(distance / 500)); // ~30km/h
      
      const vehicleTypeMap: Record<string, { name: string; icon: 'Car' | 'Bike' | 'Bus' | 'Truck'; features: string[] }> = {
        moto: { name: 'Moto', icon: 'Bike', features: ['Rapide', 'Économique'] },
        eco: { name: service.display_name || 'Éco', icon: 'Car', features: ['Abordable', 'Confortable'] },
        standard: { name: service.display_name || 'Standard', icon: 'Car', features: ['Confort', 'Climatisé'] },
        premium: { name: service.display_name || 'Premium', icon: 'Car', features: ['Luxe', 'VIP'] }
      };
      
      const config = vehicleTypeMap[service.vehicle_class] || vehicleTypeMap.eco;
      
      return {
        id: service.vehicle_class,
        name: config.name,
        description: service.description || config.features.join(' • '),
        icon: config.icon,
        gradient: '', // Géré par getYangoTheme
        basePrice: service.base_price,
        pricePerKm: service.price_per_km,
        calculatedPrice,
        eta,
        features: config.features,
        capacity: service.vehicle_class === 'moto' ? 1 : 4,
        available: true,
        isPopular: service.vehicle_class === 'eco'
      } as VehicleType;
    }).sort((a, b) => a.basePrice - b.basePrice);
  }, [availableServices, distance, city]);
  
  const isLoading = loading;
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'center',
    containScroll: 'trimSnaps',
    skipSnaps: false,
    startIndex: 1,
    dragFree: false,
    inViewThreshold: 0.7,
    duration: 25,
    watchDrag: true
  });
  const [selectedIndex, setSelectedIndex] = useState(1);

  // Sync selection with embla
  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    const index = emblaApi.selectedScrollSnap();
    setSelectedIndex(index);
    if (vehicles[index]) {
      onVehicleSelect(vehicles[index]);
    }
  }, [emblaApi, vehicles, onVehicleSelect]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on('select', onSelect);
    onSelect();
    return () => {
      emblaApi.off('select', onSelect);
    };
  }, [emblaApi, onSelect]);

  // Auto-select first vehicle when data loads
  useEffect(() => {
    if (vehicles.length > 0 && !selectedVehicleId && vehicles[1]) {
      onVehicleSelect(vehicles[1]);
    }
  }, [vehicles, selectedVehicleId, onVehicleSelect]);

  // Keyboard navigation
  useEffect(() => {
    if (!emblaApi) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') emblaApi.scrollPrev();
      if (e.key === 'ArrowRight') emblaApi.scrollNext();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [emblaApi]);

  if (isLoading && vehicles.length === 0) {
    return (
      <div className="py-8 px-4">
        <div className="flex items-center justify-center gap-6 overflow-hidden">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex flex-col items-center gap-3 animate-pulse">
              <div className="w-36 h-36 rounded-full bg-gradient-to-br from-muted to-muted-foreground/20" />
              <div className="w-24 h-4 bg-muted rounded-full" />
              <div className="w-16 h-3 bg-muted/50 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (vehicles.length === 0) {
    return (
      <div className="py-12 text-center space-y-3">
        <p className="text-muted-foreground text-sm">Aucun véhicule disponible pour le moment</p>
        <p className="text-xs text-muted-foreground/70">Vérifiez votre connexion ou réessayez</p>
      </div>
    );
  }

  const selectedVehicle = vehicles[selectedIndex];

  return (
    <div className="py-3">
      {/* Carousel */}
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex touch-pan-y">
          {vehicles.map((vehicle, index) => {
            const theme = getYangoTheme(vehicle.id);
            const isSelected = index === selectedIndex;

            return (
              <div
                key={vehicle.id}
                className="flex-[0_0_40%] min-w-0 px-3"
              >
                <motion.button
                  onClick={() => {
                    emblaApi?.scrollTo(index);
                    if ('vibrate' in navigator) {
                      navigator.vibrate(12);
                    }
                  }}
                  animate={{
                    scale: isSelected ? 1.05 : 0.85,
                    opacity: isSelected ? 1 : 0.5,
                    y: isSelected ? -4 : 0
                  }}
                  whileTap={{ scale: 0.93 }}
                  transition={{ 
                    type: "spring",
                    damping: 20,
                    stiffness: 200
                  }}
                  className="flex flex-col items-center gap-3 relative w-full"
                  role="button"
                  aria-label={`Sélectionner ${vehicle.name}`}
                  aria-selected={isSelected}
                >
                  {/* Badge Populaire */}
                  {vehicle.isPopular && (
                    <motion.div
                      initial={{ scale: 0, rotate: -15 }}
                      animate={{ scale: 1, rotate: 0 }}
                      className="absolute -top-2 -right-2 z-10 bg-gradient-to-br from-amber-400 via-yellow-400 to-orange-500 text-white text-[9px] px-2 py-1 rounded-full font-black shadow-lg ring-2 ring-white"
                    >
                      Populaire
                    </motion.div>
                  )}

                  {/* Circle with Icon */}
                  <motion.div
                    className={`relative w-32 h-32 md:w-36 md:h-36 rounded-3xl flex items-center justify-center transition-all duration-300 ${
                      isSelected ? 'ring-4 ring-opacity-25' : ''
                    }`}
                    whileHover={{ scale: 1.05 }}
                    style={{
                      background: isSelected 
                        ? `linear-gradient(135deg, ${theme.gradient})`
                        : theme.solidColor,
                      boxShadow: isSelected 
                        ? `0 0 45px ${theme.glowColor}, 0 20px 50px rgba(0, 0, 0, 0.15), inset 0 2px 20px rgba(255, 255, 255, 0.2)`
                        : `0 8px 20px rgba(0, 0, 0, 0.08)`,
                      ['--tw-ring-color' as string]: isSelected ? theme.solidColor : 'transparent'
                    }}
                  >
                    {/* Illustration SVG 2.5D */}
                    <AnimatePresence mode="wait">
                      <motion.img
                        key={vehicle.id}
                        src={theme.svgIcon}
                        alt={vehicle.name}
                        initial={{ opacity: 0, scale: 0.85 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.85 }}
                        whileHover={{ 
                          scale: 1.15, 
                          y: -5,
                          rotateY: 5,
                          transition: { duration: 0.4, ease: "easeOut" }
                        }}
                        transition={{ duration: 0.3 }}
                        className="w-24 h-16 md:w-28 md:h-20 object-contain"
                        style={{
                          filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.15))'
                        }}
                      />
                    </AnimatePresence>
                  </motion.div>

                  {/* Vehicle Name */}
                  <div className="text-center">
                    <motion.h3 
                      className={`font-bold text-base transition-colors duration-300 ${isSelected ? theme.labelColor : 'text-muted-foreground'}`}
                      animate={{ scale: isSelected ? 1.05 : 1 }}
                    >
                      {vehicle.name}
                    </motion.h3>
                  </div>
                </motion.button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Pagination Dots - Style Yango Pro */}
      <div className="flex justify-center gap-2 mt-6">
        {vehicles.map((vehicle, index) => {
          const theme = getYangoTheme(vehicle.id);
          return (
            <motion.button
              key={index}
              onClick={() => emblaApi?.scrollTo(index)}
              whileTap={{ scale: 0.9 }}
              className={`rounded-full transition-all duration-400`}
              style={{
                width: index === selectedIndex ? '20px' : '6px',
                height: '6px',
                background: index === selectedIndex ? theme.solidColor : 'hsl(var(--muted-foreground) / 0.25)'
              }}
              aria-label={`Sélectionner ${vehicle.name}`}
            />
          );
        })}
      </div>

      {/* Bouton "Continuer" - Apparaît uniquement quand un véhicule est sélectionné */}
      <AnimatePresence>
        {selectedVehicleId && onContinue && (
          <motion.button
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ 
              type: "spring",
              damping: 25,
              stiffness: 200
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              // Haptic feedback
              if ('vibrate' in navigator) {
                navigator.vibrate(15);
              }
              onContinue();
            }}
            className="w-full mt-4 py-3.5 rounded-2xl text-white font-semibold text-lg shadow-xl relative overflow-hidden"
            style={{
              background: getYangoTheme(selectedVehicleId).gradient,
              boxShadow: `0 10px 35px ${getYangoTheme(selectedVehicleId).glowColor}, 0 4px 12px rgba(0,0,0,0.12)`
            }}
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              Continuer
              <ArrowRight className="w-5 h-5" />
            </span>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
