import React from 'react';
import { cn } from '@/lib/utils';
import { Check, Clock } from 'lucide-react';
import SoftServiceCard from './SoftServiceCard';

interface DeliveryService {
  id: 'flash' | 'flex' | 'maxicharge';
  name: string;
  subtitle: string;
  icon: any;
  estimatedTime: string;
}

interface DeliveryPricing {
  price: number;
  distance: number;
  duration: number;
}

interface HorizontalServiceSelectorProps {
  services: DeliveryService[];
  selectedService: DeliveryService | null;
  pricing: Record<string, DeliveryPricing>;
  loadingPricing: boolean;
  onServiceSelect: (service: DeliveryService) => void;
  className?: string;
}

const HorizontalServiceSelector: React.FC<HorizontalServiceSelectorProps> = ({
  services,
  selectedService,
  pricing,
  loadingPricing,
  onServiceSelect,
  className
}) => {
  return (
    <div className={cn("w-full px-4", className)}>
      {/* Horizontal scroll container with better styling */}
      <div className="relative -mx-4">
        {/* Gradient fade edges */}
        <div className="absolute left-0 top-0 bottom-0 w-10 bg-gradient-to-r from-background via-background/20 to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-10 bg-gradient-to-l from-background via-background/20 to-transparent z-10 pointer-events-none" />
        
        {/* Services container - Modern look with padding and gap */}
        <div className="flex gap-4 pb-6 pt-2 px-6 overflow-x-auto scroll-smooth snap-x snap-proximity scrollbar-hide">
          {services.map((service) => (
            <div key={service.id} className="snap-start flex-shrink-0">
              <SoftServiceCard
                id={service.id}
                name={service.name}
                subtitle={service.subtitle}
                icon={service.icon}
                estimatedTime={service.estimatedTime}
                price={pricing[service.id]?.price}
                distance={pricing[service.id]?.distance}
                duration={pricing[service.id]?.duration}
                isSelected={selectedService?.id === service.id}
                isLoading={loadingPricing}
                onSelect={() => onServiceSelect(service)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Modern status indicator below carousel */}
      {selectedService && (
        <div className="mt-2 flex items-center justify-center animate-fade-in">
          <div className="px-4 py-2 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-md flex items-center gap-2 shadow-sm">
            <Check className="w-3.5 h-3.5 text-primary stroke-[3]" />
            <span className="text-[13px] font-bold text-primary">
              {selectedService.name.replace('Tembea ', '')}
              {pricing[selectedService.id] && !loadingPricing && (
                <span className="ml-2 px-2 py-0.5 bg-primary/20 rounded-md">
                  {new Intl.NumberFormat('fr-CD', {
                    style: 'currency',
                    currency: 'XOF',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0
                  }).format(pricing[selectedService.id].price)}
                </span>
              )}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default HorizontalServiceSelector;
