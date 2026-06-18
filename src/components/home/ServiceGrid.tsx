import { memo } from 'react';
import { Car, Truck } from 'lucide-react';
import { useServiceConfigurations } from '@/hooks/useServiceConfigurations';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface ServiceGridProps {
  onServiceSelect: (service: string) => void;
  serviceNotifications?: {
    transport: number;
    delivery: number;
    marketplace: number;
    food: number;
    rental: number;
  };
}

// Catégories disponibles, cercles centrés (style TAGA).
// Mapping conservé : la catégorie « taxi » correspond à l'id 'transport'.
const CATEGORIES: Array<{ id: string; name: string; Icon: any; bg: string; color: string }> = [
  { id: 'transport', name: 'Taxi',      Icon: Car,   bg: 'hsl(var(--primary) / 0.12)',   color: 'hsl(var(--primary))' },
  { id: 'delivery',  name: 'Livraison', Icon: Truck, bg: 'hsl(var(--secondary) / 0.10)', color: 'hsl(var(--secondary))' },
];

export const ServiceGrid = memo<ServiceGridProps>(({ onServiceSelect, serviceNotifications }) => {
  // Hook conservé (la config taxi reste mappée vers l'id 'transport' ci-dessus).
  const { loading } = useServiceConfigurations();

  return (
    <div className="flex items-start justify-center gap-12">
      {CATEGORIES.map((service, index) => {
        const notificationCount = serviceNotifications?.[service.id as keyof typeof serviceNotifications] || 0;
        const IconComponent = service.Icon;

        return (
          <motion.button
            key={service.id}
            type="button"
            onClick={() => onServiceSelect(service.id)}
            className="flex flex-col items-center gap-2"
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: index * 0.05, type: "spring", stiffness: 400, damping: 25 }}
            whileTap={{ scale: 0.92 }}
          >
            {/* Cercle + icône */}
            <div
              className={cn(
                "relative flex items-center justify-center w-16 h-16 rounded-full",
                loading && "animate-pulse",
              )}
              style={{ backgroundColor: service.bg }}
            >
              <IconComponent className="w-8 h-8" strokeWidth={1.9} style={{ color: service.color }} />

              {/* Badge de notification — vert primaire */}
              {notificationCount > 0 && (
                <div className="absolute -top-1 -right-1 min-w-[20px] h-[20px] px-1 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-[10px] font-black border-2 border-white z-10">
                  {notificationCount > 9 ? '9+' : notificationCount}
                </div>
              )}
            </div>

            <span className="text-[12px] font-bold text-center leading-tight tracking-tight text-foreground">
              {service.name}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
});

ServiceGrid.displayName = 'ServiceGrid';
