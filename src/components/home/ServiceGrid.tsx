import { useMemo, memo } from 'react';
import { Car, Truck, CarFront, ShoppingBag, UtensilsCrossed, LayoutGrid } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
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

const SERVICE_STYLES: Record<string, { gradient: string; shadow: string; Icon: any }> = {
  transport: { gradient: 'bg-gradient-to-br from-red-500 to-red-600', shadow: 'shadow-red-500/30', Icon: Car },
  delivery: { gradient: 'bg-gradient-to-br from-amber-400 to-amber-500', shadow: 'shadow-amber-400/30', Icon: Truck },
  rental: { gradient: 'bg-gradient-to-br from-green-500 to-green-600', shadow: 'shadow-green-500/30', Icon: CarFront },
  marketplace: { gradient: 'bg-gradient-to-br from-sky-500 to-sky-600', shadow: 'shadow-sky-500/30', Icon: ShoppingBag },
  food: { gradient: 'bg-gradient-to-br from-orange-400 to-orange-500', shadow: 'shadow-orange-400/30', Icon: UtensilsCrossed },
  more: { gradient: 'bg-gradient-to-br from-gray-500 to-gray-600', shadow: 'shadow-gray-500/30', Icon: LayoutGrid },
};

export const ServiceGrid = memo<ServiceGridProps>(({ onServiceSelect, serviceNotifications }) => {
  const { t } = useLanguage();
  const { configurations, loading } = useServiceConfigurations();
  
  const mainServices = useMemo(() => {
    const names: Record<string, string> = {
      taxi: 'Taxi',
      delivery: t('home.services.delivery'),
      rental: t('home.services.rental'),
      marketplace: t('home.services.shopping'),
      food: t('home.services.food'),
      more: t('home.services.more')
    };
    
    const defaultList = [
      { id: 'transport', name: names.taxi, isLoading: loading },
      { id: 'delivery', name: names.delivery, isLoading: loading },
      { id: 'rental', name: names.rental, isLoading: loading },
      { id: 'marketplace', name: names.marketplace, isLoading: loading },
      { id: 'food', name: names.food, isLoading: loading },
      { id: 'more', name: names.more, isLoading: false },
    ];

    if (loading) return defaultList;
    
    const categories: Array<'taxi' | 'delivery' | 'rental' | 'marketplace' | 'food'> = 
      ['taxi', 'delivery', 'rental', 'marketplace', 'food'];
    
    const servicesList = categories.map(category => {
      const service = configurations.find(
        c => c.service_category === category && c.is_active
      );
      if (!service) return null;
      const serviceId = category === 'taxi' ? 'transport' : category;
      return {
        id: serviceId,
        name: category === 'taxi' ? 'Taxi' : (category === 'food' ? 'Food' : (service.display_name || names[category])),
        available: service.is_active,
        isLoading: false
      };
    }).filter(Boolean);

    return [...servicesList, { id: 'more', name: names.more, available: true, isLoading: false }];
  }, [configurations, loading, t]);

  return (
    <div className="pt-2">
      <div className="grid grid-cols-3 justify-items-center gap-y-7 gap-x-2 px-2">
        {mainServices.map((service, index) => {
          if (!service) return null;
          const notificationCount = serviceNotifications?.[service.id as keyof typeof serviceNotifications] || 0;
          const style = SERVICE_STYLES[service.id] || SERVICE_STYLES.more;
          const IconComponent = style.Icon;

          return (
            <motion.button
              key={service.id}
              onClick={() => !service.isLoading && onServiceSelect(service.id)}
              className={cn(
                "flex flex-col items-center gap-2",
                service.isLoading && "pointer-events-none opacity-60"
              )}
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: index * 0.05, type: "spring", stiffness: 400, damping: 25 }}
              whileTap={{ scale: 0.92 }}
            >
              {/* Icon */}
              <div
                className={cn(
                  "relative flex items-center justify-center w-16 h-16 rounded-2xl",
                  style.gradient,
                  service.isLoading && "animate-pulse",
                )}
              >
                <IconComponent className="w-8 h-8 text-white" strokeWidth={1.8} />

                {/* Notification badge */}
                {notificationCount > 0 && (
                  <div className="absolute -top-1 -right-1 min-w-[20px] h-[20px] px-1 bg-primary text-white rounded-full flex items-center justify-center text-[10px] font-black border-2 border-background z-10">
                    {notificationCount > 9 ? '9+' : notificationCount}
                  </div>
                )}
              </div>

              <span className="text-[12px] font-semibold text-center leading-tight text-foreground">
                {service.name}
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
});

ServiceGrid.displayName = 'ServiceGrid';
