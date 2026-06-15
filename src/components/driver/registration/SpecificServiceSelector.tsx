import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Bike, Car, Truck, Zap, Clock, Package2 } from 'lucide-react';
import { useServiceConfigurations, ServiceCategory } from '@/hooks/useServiceConfigurations';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface SpecificServiceSelectorProps {
  serviceCategory: ServiceCategory;
  selectedService: string | null;
  onServiceSelect: (serviceType: string) => void;
  disabled?: boolean;
}

export const SpecificServiceSelector: React.FC<SpecificServiceSelectorProps> = ({
  serviceCategory,
  selectedService,
  onServiceSelect,
  disabled = false,
}) => {
  const { configurations, getServicePricing, formatPrice, loading } = useServiceConfigurations();

  const getServiceIcon = (serviceType: string) => {
    const iconMap: Record<string, any> = {
      moto: Bike,
      eco: Car,
      confort: Car,
      premium: Car,
      flash: Zap,
      flex: Clock,
      maxicharge: Truck,
    };
    return iconMap[serviceType] || Package2;
  };

  const getServiceBadgeColor = (serviceType: string) => {
    const colorMap: Record<string, string> = {
      moto: 'bg-orange-100 text-orange-800',
      eco: 'bg-green-100 text-green-800',
      confort: 'bg-blue-100 text-blue-800',
      premium: 'bg-purple-100 text-purple-800',
      flash: 'bg-red-100 text-red-800',
      flex: 'bg-yellow-100 text-yellow-800',
      maxicharge: 'bg-gray-100 text-gray-800',
    };
    return colorMap[serviceType] || 'bg-gray-100 text-gray-800';
  };

  const services = configurations.filter(config => config.service_category === serviceCategory);
  const categoryTitle = serviceCategory === 'taxi' ? 'Taxi' : 'Livraison';

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-64 mb-2"></div>
          <div className="h-4 bg-muted rounded w-96"></div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <Card>
                <CardHeader>
                  <div className="h-6 bg-muted rounded w-24"></div>
                  <div className="h-4 bg-muted rounded w-32"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-20 bg-muted rounded"></div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {services.map((service) => {
          const Icon = getServiceIcon(service.service_type);
          const isSelected = selectedService === service.service_type;
          const pricing = getServicePricing(service.service_type, service.service_category);
          
          return (
            <motion.div
              key={service.id}
              whileHover={{ scale: 1.02, y: -4 }}
              whileTap={{ scale: 0.98 }}
            >
              <Card
                className={cn(
                  "relative overflow-hidden cursor-pointer transition-all duration-300",
                  "hover:shadow-2xl hover:shadow-amber-500/20",
                  "dark:bg-zinc-900/50 dark:border-zinc-800",
                  isSelected && "border-2 border-amber-500 shadow-xl shadow-amber-500/30",
                  disabled && "opacity-50 cursor-not-allowed"
                )}
                onClick={() => !disabled && onServiceSelect(service.service_type)}
              >
                {/* Badge corner */}
                {isSelected && (
                  <div className="absolute top-3 right-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-white" />
                    </div>
                  </div>
                )}
                
                {/* Icon avec gradient */}
                <div className="flex items-center justify-center pt-6 pb-4">
                  <div className={cn(
                    "w-16 h-16 rounded-2xl flex items-center justify-center",
                    "bg-gradient-to-br from-amber-100 to-orange-100",
                    "dark:from-amber-900/30 dark:to-orange-900/30"
                  )}>
                    <Icon className="w-8 h-8 text-amber-600 dark:text-amber-400" />
                  </div>
                </div>
                
                <CardHeader className="text-center pb-2">
                  <CardTitle className="text-xl font-bold">{service.display_name}</CardTitle>
                  <CardDescription className="text-sm line-clamp-2">
                    {service.description}
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-3">
                  {/* Tarification */}
                  {pricing && (
                    <div className="p-3 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-zinc-800 dark:to-zinc-900 rounded-xl border border-amber-100 dark:border-amber-900/30">
                      <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-1">Tarif de base</p>
                      <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 leading-none">
                        {formatPrice(pricing.base_price)}
                      </p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                        + {formatPrice(pricing.price_per_km)}/km
                      </p>
                    </div>
                  )}
                  
                  {/* Features avec icônes */}
                  <div className="space-y-2">
                    {service.features?.slice(0, 3).map((feature, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                        <span className="line-clamp-1">{feature}</span>
                      </div>
                    ))}
                  </div>
                  
                  {/* Bouton */}
                  <Button
                    onClick={() => !disabled && onServiceSelect(service.service_type)}
                    className={cn(
                      "w-full h-11 rounded-xl font-semibold transition-all",
                      isSelected
                        ? "bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-lg shadow-amber-500/30"
                        : "bg-amber-50 dark:bg-amber-950/30 border-2 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/40"
                    )}
                    disabled={disabled}
                  >
                    {isSelected ? (
                      <>
                        <CheckCircle className="w-5 h-5 mr-2" />
                        Sélectionné
                      </>
                    ) : (
                      'Choisir ce service'
                    )}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};