import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Wifi, Baby, Navigation, Briefcase, Armchair, Snowflake, Music, Shield, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Equipment {
  id: string;
  name: string;
  price: number;
  icon?: string;
}

interface SoftEquipmentSelectorProps {
  equipment: Equipment[];
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  formatPrice: (price: number) => string;
  days: number;
}

const getEquipmentIcon = (name: string) => {
  const lowerName = name.toLowerCase();
  if (lowerName.includes('wifi') || lowerName.includes('internet')) return Wifi;
  if (lowerName.includes('siège') || lowerName.includes('bébé') || lowerName.includes('enfant')) return Baby;
  if (lowerName.includes('gps') || lowerName.includes('navigation')) return Navigation;
  if (lowerName.includes('valise') || lowerName.includes('porte-bagage')) return Briefcase;
  if (lowerName.includes('siège') || lowerName.includes('confort')) return Armchair;
  if (lowerName.includes('clim') || lowerName.includes('froid')) return Snowflake;
  if (lowerName.includes('sono') || lowerName.includes('musique') || lowerName.includes('audio')) return Music;
  if (lowerName.includes('assurance') || lowerName.includes('protection')) return Shield;
  return Plus;
};

export const SoftEquipmentSelector = ({
  equipment,
  selectedIds,
  onSelectionChange,
  formatPrice,
  days
}: SoftEquipmentSelectorProps) => {
  const toggleEquipment = (id: string) => {
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter(i => i !== id));
    } else {
      onSelectionChange([...selectedIds, id]);
    }
  };

  const totalEquipmentPrice = equipment
    .filter(e => selectedIds.includes(e.id))
    .reduce((sum, e) => sum + (e.price * days), 0);

  if (equipment.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Plus className="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p>Aucun équipement disponible</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Equipment Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {equipment.map((item, index) => {
          const isSelected = selectedIds.includes(item.id);
          const Icon = getEquipmentIcon(item.name);
          
          return (
            <motion.button
              key={item.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.03 }}
              onClick={() => toggleEquipment(item.id)}
              className={cn(
                "relative p-3 rounded-xl border-2 text-left transition-all duration-200",
                "flex flex-col items-center gap-2",
                isSelected
                  ? "border-primary bg-primary/5 shadow-md shadow-primary/10"
                  : "border-border/50 bg-card hover:border-primary/30 hover:bg-muted/30"
              )}
            >
              {/* Selection badge */}
              <AnimatePresence>
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-primary flex items-center justify-center"
                  >
                    <Check className="w-3 h-3 text-primary-foreground" />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Icon */}
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                isSelected 
                  ? "bg-primary/15 text-primary" 
                  : "bg-muted text-muted-foreground"
              )}>
                <Icon className="w-5 h-5" />
              </div>

              {/* Name */}
              <span className={cn(
                "text-xs font-medium text-center line-clamp-2",
                isSelected ? "text-primary" : "text-foreground"
              )}>
                {item.name}
              </span>

              {/* Price */}
              <span className={cn(
                "text-[10px]",
                isSelected ? "text-primary/80" : "text-muted-foreground"
              )}>
                +{formatPrice(item.price)}/j
              </span>
            </motion.button>
          );
        })}
      </div>

      {/* Total Equipment Cost */}
      <AnimatePresence>
        {selectedIds.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-gradient-to-r from-primary/5 to-emerald-500/5 rounded-xl p-3 border border-primary/10"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  {selectedIds.length} équipement{selectedIds.length > 1 ? 's' : ''} sélectionné{selectedIds.length > 1 ? 's' : ''}
                </p>
                <p className="text-xs text-muted-foreground">
                  pour {days} jour{days > 1 ? 's' : ''}
                </p>
              </div>
              <p className="font-semibold text-primary">
                +{formatPrice(totalEquipmentPrice)}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
