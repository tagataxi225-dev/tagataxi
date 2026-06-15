import React from 'react';
import { Truck, Snowflake, Container } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TruckCategory {
  id: string;
  name: string;
  icon: React.ReactNode;
  tonnage: string;
}

const TRUCK_CATEGORIES: TruckCategory[] = [
  { id: 'camion-leger', name: 'Camion Léger', icon: <Truck className="h-5 w-5" />, tonnage: '3.5T - 7.5T' },
  { id: 'camion-moyen', name: 'Camion Moyen', icon: <Truck className="h-6 w-6" />, tonnage: '7.5T - 16T' },
  { id: 'camion-lourd', name: 'Camion Lourd', icon: <Truck className="h-7 w-7" />, tonnage: '16T+' },
  { id: 'semi-remorque', name: 'Semi-Remorque', icon: <Container className="h-6 w-6" />, tonnage: '25T+' },
  { id: 'camion-special', name: 'Camion Spécial', icon: <Snowflake className="h-5 w-5" />, tonnage: 'Frigo/Citerne' }
];

interface TruckCategorySelectorProps {
  selectedCategory: string | null;
  onCategoryChange: (categoryId: string | null) => void;
  vehicleCounts: Record<string, number>;
}

export const TruckCategorySelector: React.FC<TruckCategorySelectorProps> = ({
  selectedCategory,
  onCategoryChange,
  vehicleCounts
}) => {
  const hasTrucks = TRUCK_CATEGORIES.some(cat => (vehicleCounts[cat.name] || 0) > 0);
  if (!hasTrucks) return null;

  return (
    <div className="py-4 px-4 bg-background border-b border-border/50">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-2 mb-3">
          <Truck className="h-5 w-5 text-muted-foreground" />
          <h3 className="font-semibold text-sm">Camions & Transport Lourd</h3>
        </div>
        
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {TRUCK_CATEGORIES.map((cat) => {
            const count = vehicleCounts[cat.name] || 0;
            if (count === 0) return null;
            
            const isSelected = selectedCategory === cat.name;
            
            return (
              <button
                key={cat.id}
                onClick={() => onCategoryChange(isSelected ? null : cat.name)}
                className={cn(
                  "flex flex-col items-center gap-1 px-4 py-3 rounded-xl min-w-[100px]",
                  "transition-all duration-200 border",
                  isSelected
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-muted/30 border-border/40 hover:bg-muted/50"
                )}
              >
                <div className={cn(
                  "p-2 rounded-lg",
                  isSelected ? "bg-primary-foreground/20" : "bg-muted"
                )}>
                  {cat.icon}
                </div>
                <span className="text-xs font-medium whitespace-nowrap">
                  {cat.name.replace('Camion ', '')}
                </span>
                <span className={cn(
                  "text-[10px]",
                  isSelected ? "text-primary-foreground/80" : "text-muted-foreground"
                )}>
                  {cat.tonnage}
                </span>
                <span className={cn(
                  "px-2 py-0.5 rounded-full text-[10px] font-bold",
                  isSelected 
                    ? "bg-primary-foreground/20 text-primary-foreground" 
                    : "bg-primary/10 text-primary"
                )}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
