import React from 'react';
import { motion } from 'framer-motion';
import { Users, Settings, Fuel, Gauge, MapPin, Star, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface VehicleSpecificationsProps {
  vehicle: any;
}

const specConfig = [
  {
    icon: Users,
    label: 'Places',
    getValue: (v: any) => `${v.seats} passagers`,
    gradient: 'from-blue-500 to-cyan-400',
    bgGlow: 'group-hover:shadow-blue-500/30'
  },
  {
    icon: Settings,
    label: 'Transmission',
    getValue: (v: any) => v.transmission === 'automatic' ? 'Automatique' : 'Manuelle',
    gradient: 'from-purple-500 to-pink-400',
    bgGlow: 'group-hover:shadow-purple-500/30'
  },
  {
    icon: Fuel,
    label: 'Carburant',
    getValue: (v: any) => v.fuel_type === 'gasoline' ? 'Essence' : v.fuel_type === 'diesel' ? 'Diesel' : 'Hybride',
    gradient: 'from-green-500 to-emerald-400',
    bgGlow: 'group-hover:shadow-green-500/30'
  },
  {
    icon: Gauge,
    label: 'Année',
    getValue: (v: any) => v.year?.toString() || 'N/A',
    gradient: 'from-orange-500 to-amber-400',
    bgGlow: 'group-hover:shadow-orange-500/30'
  },
  {
    icon: MapPin,
    label: 'Localisation',
    getValue: (v: any) => v.city || 'Non spécifié',
    gradient: 'from-red-500 to-rose-400',
    bgGlow: 'group-hover:shadow-red-500/30'
  },
  {
    icon: Star,
    label: 'Confort',
    getValue: (v: any) => v.comfort_level || 'Standard',
    gradient: 'from-yellow-500 to-orange-400',
    bgGlow: 'group-hover:shadow-yellow-500/30'
  }
];

export const VehicleSpecifications: React.FC<VehicleSpecificationsProps> = ({ vehicle }) => {
  return (
    <div className="space-y-5">
      {/* Header avec icône animée */}
      <div className="flex items-center gap-3">
        <motion.div
          initial={{ rotate: 0 }}
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
          className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg"
        >
          <Sparkles className="h-5 w-5 text-primary-foreground" />
        </motion.div>
        <h3 className="font-bold text-lg">Caractéristiques</h3>
      </div>
      
      {/* Grille des spécifications - Design Glassmorphism */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {specConfig.map((spec, index) => {
          const IconComponent = spec.icon;
          const value = spec.getValue(vehicle);
          
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ 
                delay: index * 0.08,
                type: "spring",
                stiffness: 200,
                damping: 20
              }}
              className={cn(
                "group relative p-4 rounded-2xl cursor-default overflow-hidden",
                "bg-gradient-to-br from-background/80 to-muted/40",
                "backdrop-blur-sm border border-border/50",
                "hover:border-primary/30 transition-all duration-500",
                "hover:shadow-xl hover:-translate-y-1",
                spec.bgGlow
              )}
            >
              {/* Shine effect overlay */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
                <div className="absolute inset-[-100%] bg-gradient-to-r from-transparent via-white/10 to-transparent rotate-12 translate-x-[-100%] group-hover:translate-x-[200%] transition-transform duration-1000" />
              </div>
              
              <div className="relative flex flex-col items-center text-center gap-3">
                {/* Icône avec gradient */}
                <div className={cn(
                  "h-12 w-12 rounded-xl flex items-center justify-center",
                  "bg-gradient-to-br shadow-lg",
                  spec.gradient,
                  "group-hover:scale-110 group-hover:rotate-3 transition-all duration-300"
                )}>
                  <IconComponent className="h-6 w-6 text-white drop-shadow-md" />
                </div>
                
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {spec.label}
                  </p>
                  <p className="text-sm font-bold text-foreground line-clamp-1">
                    {value}
                  </p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Équipements inclus - Design moderne */}
      {vehicle.features && vehicle.features.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="pt-5 border-t border-border/50"
        >
          <h4 className="font-semibold text-sm mb-4 flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-gradient-to-r from-primary to-primary/60" />
            Équipements inclus
          </h4>
          <div className="flex flex-wrap gap-2">
            {vehicle.features.map((feature: string, index: number) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 + index * 0.05 }}
              >
                <Badge 
                  variant="secondary" 
                  className="text-xs px-3 py-1.5 rounded-full bg-gradient-to-r from-muted to-muted/60 hover:from-primary/10 hover:to-primary/5 transition-all duration-300 border border-border/30"
                >
                  {feature}
                </Badge>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Villes disponibles - Design moderne */}
      {vehicle.available_cities && vehicle.available_cities.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="pt-5 border-t border-border/50"
        >
          <h4 className="font-semibold text-sm mb-4 flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-gradient-to-r from-red-500 to-rose-400" />
            Disponible dans
          </h4>
          <div className="flex flex-wrap gap-2">
            {vehicle.available_cities.map((city: string, index: number) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.8 + index * 0.05 }}
              >
                <Badge 
                  variant="outline" 
                  className="text-xs px-3 py-1.5 rounded-full border-primary/30 hover:bg-primary/5 transition-all duration-300"
                >
                  <MapPin className="h-3 w-3 mr-1.5 text-primary" />
                  {city}
                </Badge>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};
