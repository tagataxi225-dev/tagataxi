import { useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Sparkles, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getVehicle3dIcon } from "@/utils/vehicle3dIcons";

interface VehicleOption {
  id: string;
  name: string;
  icon: any;
  driverEta: number;
  tripDuration?: number;
  price: number;
  pricePerKm: string;
  available: boolean;
  recommended?: boolean;
  currency?: string;
}

interface PremiumVehicleCarouselProps {
  vehicles: VehicleOption[];
  selectedVehicleId: string;
  onVehicleSelect: (id: string) => void;
  city: string;
}

export default function PremiumVehicleCarousel({
  vehicles,
  selectedVehicleId,
  onVehicleSelect,
}: PremiumVehicleCarouselProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const lastTapRef = useRef<Record<string, number>>({});

  const handleSelect = useCallback(
    (id: string) => {
      const now = Date.now();
      if (now - (lastTapRef.current[id] || 0) < 300) return;
      lastTapRef.current[id] = now;
      onVehicleSelect(id);
      try {
        if ("vibrate" in navigator) navigator.vibrate(10);
      } catch {}
    },
    [onVehicleSelect],
  );

  return (
    <div className="relative -mx-4 px-4">
      <div
        ref={scrollContainerRef}
        className="flex gap-2.5 overflow-x-auto scroll-smooth snap-x snap-proximity scrollbar-hide pb-3 pt-1"
        style={{
          overscrollBehaviorX: "contain",
          WebkitOverflowScrolling: "touch",
          touchAction: "pan-x",
        } as React.CSSProperties}
      >
        {vehicles.map((vehicle) => {
          const isSelected = selectedVehicleId === vehicle.id;
          const svgSrc = getVehicle3dIcon(vehicle.id);

          return (
            <button
              key={vehicle.id}
              type="button"
              onClick={() => handleSelect(vehicle.id)}
              onTouchEnd={(e) => {
                e.stopPropagation();
                e.preventDefault();
                handleSelect(vehicle.id);
              }}
              className={cn(
                "relative flex-shrink-0 w-[4.5rem] h-[7rem] snap-start",
                "p-2 rounded-2xl transition-all duration-300",
                "flex flex-col items-center justify-between",
                "outline-none border-2",
                "select-none overflow-hidden",
                isSelected
                  ? "bg-primary/10 dark:bg-primary/20 border-primary shadow-md ring-1 ring-primary/20 scale-[1.05]"
                  : "bg-card border-transparent shadow-sm hover:shadow-md",
              )}
              style={{ touchAction: "manipulation", WebkitTapHighlightColor: "transparent" } as React.CSSProperties}
            >
              {isSelected && (
                <div className="absolute inset-0 bg-primary/5 blur-xl pointer-events-none" />
              )}

              {vehicle.recommended && (
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 z-10">
                  <Badge className="bg-emerald-500/90 text-white text-[8px] px-1.5 py-0 font-medium border-0 shadow-sm animate-pulse">
                    <Sparkles className="w-2 h-2 mr-0.5" />
                    Top
                  </Badge>
                </div>
              )}

              <AnimatePresence>
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    className="absolute top-1 right-1 w-3.5 h-3.5 bg-primary rounded-full flex items-center justify-center shadow-md z-20"
                  >
                    <Check className="w-2 h-2 text-primary-foreground" strokeWidth={4} />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Vehicle Icon */}
              <div
                className={cn(
                  "w-14 h-10 flex items-center justify-center transition-transform duration-300 z-10",
                  isSelected ? "scale-110 -translate-y-0.5" : "",
                )}
              >
                <img src={svgSrc} className="w-14 h-10 object-contain select-none" alt="" />
              </div>

              <div className="flex flex-col items-center gap-0 z-10">
                <p
                  className={cn(
                    "font-bold text-[10px] text-center leading-tight transition-colors line-clamp-1",
                    isSelected ? "text-primary" : "text-foreground",
                  )}
                >
                  {vehicle.name}
                </p>
                <div className="flex items-center gap-0.5 opacity-80">
                  <Clock className="w-2 h-2 text-muted-foreground" />
                  <p className="text-[8px] font-medium text-muted-foreground">{vehicle.driverEta} min</p>
                </div>
              </div>

              <p
                className={cn(
                  "text-xs font-black leading-none transition-colors z-10",
                  isSelected ? "text-primary" : "text-foreground",
                )}
              >
                {vehicle.price.toLocaleString()}
                <span className="text-[8px] font-bold ml-0.5 opacity-70">{vehicle.currency || "CDF"}</span>
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
