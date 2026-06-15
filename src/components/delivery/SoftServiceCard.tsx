import React from 'react';
import { cn } from '@/lib/utils';
import { Check, Clock, Sparkles } from 'lucide-react';
import { getVehicle3dIcon } from '@/utils/vehicle3dIcons';
import { motion, AnimatePresence } from 'framer-motion';

interface SoftServiceCardProps {
  id: string;
  name: string;
  subtitle: string;
  icon: React.ComponentType<any>;
  estimatedTime: string;
  price?: number;
  distance?: number;
  duration?: number;
  isSelected: boolean;
  isLoading: boolean;
  onSelect: () => void;
}

const SoftServiceCard: React.FC<SoftServiceCardProps> = ({
  id,
  name,
  subtitle,
  icon: ServiceIcon,
  estimatedTime,
  price,
  distance,
  duration,
  isSelected,
  isLoading,
  onSelect
}) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-CD', {
      style: 'currency',
      currency: 'CDF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  const getServiceGlow = (serviceId: string) => {
    switch (serviceId) {
      case 'flash': return 'shadow-congo-red/20 ring-congo-red/30';
      case 'flex': return 'shadow-congo-yellow/20 ring-congo-yellow/30';
      case 'maxicharge': return 'shadow-congo-blue/20 ring-congo-blue/30';
      default: return 'shadow-primary/20 ring-primary/30';
    }
  };

  const icon3d = getVehicle3dIcon(id);

  return (
    <motion.div 
      whileTap={{ scale: 0.96 }}
      animate={{ 
        scale: isSelected ? 1.05 : 1,
        y: isSelected ? -4 : 0
      }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className={cn(
        "relative flex-shrink-0 w-[9.5rem] h-[10.5rem] cursor-pointer transition-all duration-300",
        "rounded-[2rem] backdrop-blur-xl overflow-hidden group select-none",
        isSelected 
          ? cn("bg-card ring-2 shadow-2xl z-20", getServiceGlow(id)) 
          : "bg-card/80 border border-border/50 shadow-sm hover:shadow-md hover:bg-card"
      )}
      onClick={onSelect}
    >
      {/* Dynamic Background */}
      {isSelected && (
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-60" />
      )}
      
      {/* Top Badge */}
      {id === 'flash' && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-20">
          <div className="px-2 py-0.5 rounded-full bg-emerald-500/90 text-[8px] text-white font-bold flex items-center gap-1 shadow-sm">
            <Sparkles className="w-2 h-2" /> Rapide
          </div>
        </div>
      )}

      {/* Selection Dot */}
      <AnimatePresence>
        {isSelected && (
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute top-3 right-3 z-20"
          >
            <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center shadow-lg">
              <Check className="w-3 h-3 text-primary-foreground stroke-[4]" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content Layout */}
      <div className="relative z-10 p-4 h-full flex flex-col items-center justify-between text-center">
        {/* 3D Visual - The Hero */}
        <div className={cn(
          "w-20 h-20 mt-1 flex items-center justify-center transition-transform duration-500",
          isSelected ? "scale-110 -translate-y-1" : "group-hover:scale-110"
        )}>
          <img 
            src={icon3d} 
            alt={name}
            className="w-full h-full object-contain filter drop-shadow-xl"
            draggable={false}
          />
        </div>

        {/* Info Block */}
        <div className="flex flex-col items-center gap-0.5 w-full">
          <h3 className={cn(
            "font-black text-[13px] leading-tight transition-colors",
            isSelected ? "text-primary" : "text-foreground"
          )}>
            {name.replace('Tembea ', '')}
          </h3>
          
          <div className="flex items-center gap-1 opacity-70">
            <Clock className="w-2.5 h-2.5 text-muted-foreground" />
            <span className="text-[10px] font-bold text-muted-foreground">{estimatedTime}</span>
          </div>
        </div>

        {/* Price Tag */}
        <div className="w-full pt-1 border-t border-border/10">
          {isLoading ? (
            <div className="flex items-center justify-center gap-1.5 py-1">
              {[0, 1, 2].map(i => (
                <div key={i} className="w-1 h-1 bg-primary/40 rounded-full animate-pulse" style={{ animationDelay: `${i*0.2}s` }} />
              ))}
            </div>
          ) : price ? (
            <div className={cn(
              "text-sm font-black transition-colors",
              isSelected ? "text-primary" : "text-foreground"
            )}>
              {formatPrice(price).replace('CDF', '')}
              <span className="text-[9px] font-bold ml-0.5 opacity-60">CDF</span>
            </div>
          ) : (
            <div className="text-[10px] font-bold text-destructive/80">
              Indisponible
            </div>
          )}
        </div>
      </div>

      {/* Hover Glass Effect */}
      <div className="absolute inset-0 bg-gradient-to-t from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    </motion.div>
  );
};

export default SoftServiceCard;
