import React, { memo, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Building2, Car, Sparkles, Calendar } from 'lucide-react';
import { getCategoryTheme } from '@/utils/categoryThemes';

interface Category {
  id: string;
  name: string;
}

interface ModernRentalNavigationV2Props {
  viewMode: 'partners' | 'vehicles' | 'promos' | 'my-rentals';
  onViewModeChange: (mode: 'partners' | 'vehicles' | 'promos' | 'my-rentals') => void;
  partnersCount: number;
  vehiclesCount: number;
  promosCount: number;
  myRentalsCount: number;
  categories: Category[];
  selectedCategory: string | null;
  onCategoryChange: (categoryId: string | null) => void;
  vehicleCounts: Record<string, number>;
}

const tabs = [
  { id: 'partners', label: 'Agences', icon: Building2 },
  { id: 'vehicles', label: 'Véhicules', icon: Car },
  { id: 'promos', label: 'Promos', icon: Sparkles },
  { id: 'my-rentals', label: 'Mes loc.', icon: Calendar },
] as const;

// Tab Button sobre
const TabButton = memo(({ 
  tab, 
  count, 
  isActive, 
  onClick 
}: { 
  tab: typeof tabs[number]; 
  count: number; 
  isActive: boolean;
  onClick: () => void;
}) => {
  const Icon = tab.icon;
  
  return (
    <button
      onClick={onClick}
      className={`
        flex flex-col items-center justify-center gap-1 py-2.5 px-1 rounded-xl
        transition-colors duration-200
        ${isActive 
          ? 'bg-primary text-primary-foreground' 
          : 'text-muted-foreground hover:text-foreground hover:bg-muted'
        }
      `}
    >
      <Icon className="h-5 w-5" />
      <span className="text-xs font-medium">{tab.label}</span>
      <Badge 
        variant={isActive ? "secondary" : "outline"}
        className={`
          text-[10px] px-1.5 min-w-[20px] h-5 justify-center
          ${isActive ? 'bg-primary-foreground/20 text-primary-foreground border-transparent' : ''}
        `}
      >
        {count}
      </Badge>
    </button>
  );
});

TabButton.displayName = 'TabButton';

export const ModernRentalNavigationV2: React.FC<ModernRentalNavigationV2Props> = memo(({
  viewMode,
  onViewModeChange,
  partnersCount,
  vehiclesCount,
  promosCount,
  myRentalsCount,
  categories,
  selectedCategory,
  onCategoryChange,
  vehicleCounts,
}) => {
  const counts = useMemo(() => ({
    partners: partnersCount,
    vehicles: vehiclesCount,
    promos: promosCount,
    'my-rentals': myRentalsCount,
  }), [partnersCount, vehiclesCount, promosCount, myRentalsCount]);

  const contextMessages: Record<string, string> = {
    partners: 'Explorez nos agences partenaires',
    vehicles: 'Découvrez les véhicules disponibles',
    promos: 'Offres spéciales et réductions',
    'my-rentals': 'Vos réservations',
  };

  const filteredCategories = useMemo(() => 
    categories.filter(cat => (vehicleCounts[cat.id] || 0) > 0),
    [categories, vehicleCounts]
  );

  return (
    <div className="max-w-7xl mx-auto px-4 pt-2">
      {/* Navigation principale sobre */}
      <div className="bg-muted/30 rounded-2xl p-1">
        <div className="grid grid-cols-4 gap-1">
          {tabs.map((tab) => (
            <TabButton
              key={tab.id}
              tab={tab}
              count={counts[tab.id]}
              isActive={viewMode === tab.id}
              onClick={() => onViewModeChange(tab.id)}
            />
          ))}
        </div>
      </div>

      {/* Message contextuel simple */}
      <p className="mt-2 text-sm text-muted-foreground">
        {contextMessages[viewMode]}
      </p>

      {/* Filtres de catégories pour les véhicules */}
      {viewMode === 'vehicles' && (
        <div className="mt-2">
          <div className="flex gap-2 pb-2 overflow-x-auto scrollbar-hide">
      <Button
              variant={selectedCategory === null ? "default" : "outline"}
              size="sm"
              onClick={() => onCategoryChange(null)}
              className="rounded-full shrink-0 h-8 text-xs"
            >
              Tous ({vehiclesCount})
            </Button>

            {filteredCategories.map((cat) => {
              const count = vehicleCounts[cat.id] || 0;
              const theme = getCategoryTheme(cat.name);
              const isSelected = selectedCategory === cat.id;
              
              return (
                <Button
                  key={cat.id}
                  variant={isSelected ? "default" : "outline"}
                  size="sm"
                  onClick={() => onCategoryChange(cat.id)}
                  className="rounded-full gap-1.5 shrink-0 h-8 text-xs"
                >
                  <span>{theme.icon}</span>
                  <span className="whitespace-nowrap">{cat.name}</span>
                  <Badge 
                    variant="secondary" 
                    className={`ml-0.5 text-xs ${isSelected ? 'bg-primary-foreground/20 text-primary-foreground' : ''}`}
                  >
                    {count}
                  </Badge>
                </Button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
});

ModernRentalNavigationV2.displayName = 'ModernRentalNavigationV2';
