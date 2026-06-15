import React from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Building2, Car, Sparkles, Info, Calendar } from 'lucide-react';
import { getCategoryTheme } from '@/utils/categoryThemes';

interface Category {
  id: string;
  name: string;
}

interface ModernRentalNavigationProps {
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

export const ModernRentalNavigation: React.FC<ModernRentalNavigationProps> = ({
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
  return (
    <div className="max-w-7xl mx-auto px-4 pt-4">
      <Tabs value={viewMode} onValueChange={(v) => onViewModeChange(v as any)}>
        <TabsList className="w-full grid grid-cols-4 h-auto p-1">
          <TabsTrigger value="partners" className="flex-col gap-1 py-3">
            <Building2 className="h-5 w-5" />
            <span className="text-xs font-medium">Agences</span>
            <Badge variant="secondary" className="mt-1 text-xs px-2">{partnersCount}</Badge>
          </TabsTrigger>
          
          <TabsTrigger value="vehicles" className="flex-col gap-1 py-3">
            <Car className="h-5 w-5" />
            <span className="text-xs font-medium">Véhicules</span>
            <Badge variant="secondary" className="mt-1 text-xs px-2">{vehiclesCount}</Badge>
          </TabsTrigger>
          
          <TabsTrigger value="promos" className="flex-col gap-1 py-3">
            <Sparkles className="h-5 w-5" />
            <span className="text-xs font-medium">Promos</span>
            {promosCount > 0 && <Badge variant="destructive" className="mt-1 text-xs px-2">{promosCount}</Badge>}
          </TabsTrigger>

          <TabsTrigger value="my-rentals" className="flex-col gap-1 py-3">
            <Calendar className="h-5 w-5" />
            <span className="text-xs font-medium">Mes locations</span>
            <Badge variant="secondary" className="mt-1 text-xs px-2">{myRentalsCount}</Badge>
          </TabsTrigger>
        </TabsList>

        {/* Filtres contextuels sous les tabs */}
        <div className="mt-4">
          {viewMode === 'vehicles' && (
            <div className="relative -mx-4 px-4">
              <div className="flex gap-2 pb-3 overflow-x-auto scrollbar-hide snap-x snap-mandatory scroll-smooth">
                <Button
                  variant={selectedCategory === null ? "default" : "outline"}
                  size="sm"
                  onClick={() => onCategoryChange(null)}
                  className="rounded-full shrink-0 snap-start"
                >
                  Tous ({vehiclesCount})
                </Button>
                {categories.map(cat => {
                  const count = vehicleCounts[cat.id] || 0;
                  if (count === 0) return null;
                  const theme = getCategoryTheme(cat.name);
                  return (
                    <Button
                      key={cat.id}
                      variant={selectedCategory === cat.id ? "default" : "outline"}
                      size="sm"
                      onClick={() => onCategoryChange(cat.id)}
                      className="rounded-full gap-1 shrink-0 snap-start"
                    >
                      <span>{theme.icon}</span>
                      <span className="whitespace-nowrap">{cat.name}</span>
                      <Badge variant="secondary" className="ml-1 text-xs shrink-0">{count}</Badge>
                    </Button>
                  );
                })}
              </div>
            </div>
          )}
          
          {viewMode === 'partners' && (
            <div className="flex gap-2 text-sm text-muted-foreground">
              <Info className="h-4 w-4 flex-shrink-0" />
              <span>Explorez nos agences partenaires de confiance</span>
            </div>
          )}

          {viewMode === 'promos' && (
            <div className="flex gap-2 text-sm text-muted-foreground">
              <Sparkles className="h-4 w-4 flex-shrink-0 text-amber-500" />
              <span>Profitez de nos offres spéciales et réductions</span>
            </div>
          )}

          {viewMode === 'my-rentals' && (
            <div className="flex gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4 flex-shrink-0" />
              <span>Gérez vos réservations en cours et passées</span>
            </div>
          )}
        </div>
      </Tabs>
    </div>
  );
};
