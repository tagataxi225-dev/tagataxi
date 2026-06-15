import React from 'react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '../ui/sheet';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Slider } from '../ui/slider';
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';
import { Separator } from '../ui/separator';
import { Input } from '../ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { 
  Filter, 
  X, 
  Star, 
  MapPin, 
  Package, 
  Heart,
  Zap,
  RefreshCw
} from 'lucide-react';

interface FilterState {
  searchQuery: string;
  selectedCategory: string;
  priceRange: [number, number];
  minRating: number;
  conditions: string[];
  maxDistance: number;
  availability: 'all' | 'available' | 'unavailable';
  sortBy: string;
  showOnlyFavorites: boolean;
}

interface AdvancedFiltersProps {
  isOpen: boolean;
  onClose: () => void;
  filters: FilterState;
  onUpdateFilter: <K extends keyof FilterState>(key: K, value: FilterState[K]) => void;
  onResetFilters: () => void;
  onApplyQuickFilter: (preset: string) => void;
  hasActiveFilters: boolean;
  filterStats: {
    totalProducts: number;
    filteredCount: number;
    averagePrice: number;
  };
}

const categories = [
  { id: 'all', name: 'Toutes catégories', icon: <Package className="w-4 h-4" /> },
  { id: 'electronics', name: 'Électronique', icon: <Zap className="w-4 h-4" /> },
  { id: 'fashion', name: 'Mode & Vêtements', icon: <Package className="w-4 h-4" /> },
  { id: 'food', name: 'Alimentation', icon: <Package className="w-4 h-4" /> },
  { id: 'home', name: 'Maison & Jardin', icon: <Package className="w-4 h-4" /> },
  { id: 'beauty', name: 'Beauté & Santé', icon: <Package className="w-4 h-4" /> },
  { id: 'sports', name: 'Sports & Loisirs', icon: <Package className="w-4 h-4" /> },
  { id: 'books', name: 'Livres & Média', icon: <Package className="w-4 h-4" /> },
];

const conditions = [
  { id: 'new', name: 'Neuf', color: 'bg-green-500' },
  { id: 'used', name: 'Occasion', color: 'bg-orange-500' },
  { id: 'refurbished', name: 'Reconditionné', color: 'bg-blue-500' },
];

const quickFilters = [
  { id: 'nearby', name: 'À proximité', icon: <MapPin className="w-4 h-4" /> },
  { id: 'cheap', name: 'Bon marché', icon: <Package className="w-4 h-4" /> },
  { id: 'premium', name: 'Premium', icon: <Star className="w-4 h-4" /> },
  { id: 'new', name: 'Nouveautés', icon: <Zap className="w-4 h-4" /> },
  { id: 'deals', name: 'Bonnes affaires', icon: <Package className="w-4 h-4" /> },
];

export const AdvancedFilters: React.FC<AdvancedFiltersProps> = ({
  isOpen,
  onClose,
  filters,
  onUpdateFilter,
  onResetFilters,
  onApplyQuickFilter,
  hasActiveFilters,
  filterStats,
}) => {
  const toggleCondition = (condition: string) => {
    const newConditions = filters.conditions.includes(condition)
      ? filters.conditions.filter(c => c !== condition)
      : [...filters.conditions, condition];
    onUpdateFilter('conditions', newConditions);
  };

  const formatPrice = (price: number) => `${(price / 1000).toFixed(0)}k`;

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-lg flex flex-col">
        <SheetHeader className="border-b pb-4">
          <SheetTitle className="flex items-center gap-3 text-xl">
            <Filter className="w-6 h-6" />
            Filtres avancés
            {hasActiveFilters && (
              <Badge variant="secondary" className="ml-2">
                {filterStats.filteredCount}
              </Badge>
            )}
          </SheetTitle>
          <SheetDescription>
            Affinez votre recherche pour trouver exactement ce que vous cherchez
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto py-6 space-y-6">
          {/* Quick Filters */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold">Filtres rapides</Label>
            <div className="flex flex-wrap gap-2">
              {quickFilters.map((filter) => (
                <Button
                  key={filter.id}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                  onClick={() => onApplyQuickFilter(filter.id)}
                >
                  {filter.icon}
                  {filter.name}
                </Button>
              ))}
            </div>
          </div>

          <Separator />

          {/* Category Filter */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold">Catégorie</Label>
            <Select 
              value={filters.selectedCategory} 
              onValueChange={(value) => onUpdateFilter('selectedCategory', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner une catégorie" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    <div className="flex items-center gap-2">
                      {category.icon}
                      {category.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Price Range */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold">
              Gamme de prix: {formatPrice(filters.priceRange[0])} - {formatPrice(filters.priceRange[1])} CDF
            </Label>
            <Slider
              value={filters.priceRange}
              onValueChange={(value) => onUpdateFilter('priceRange', value as [number, number])}
              max={2000000}
              min={0}
              step={10000}
              className="w-full"
            />
            <div className="flex gap-2">
              <div className="flex-1">
                <Label className="text-xs text-muted-foreground">Min</Label>
                <Input
                  type="number"
                  value={filters.priceRange[0]}
                  onChange={(e) => {
                    const value = Math.min(Number(e.target.value), filters.priceRange[1]);
                    onUpdateFilter('priceRange', [value, filters.priceRange[1]]);
                  }}
                  className="mt-1"
                />
              </div>
              <div className="flex-1">
                <Label className="text-xs text-muted-foreground">Max</Label>
                <Input
                  type="number"
                  value={filters.priceRange[1]}
                  onChange={(e) => {
                    const value = Math.max(Number(e.target.value), filters.priceRange[0]);
                    onUpdateFilter('priceRange', [filters.priceRange[0], value]);
                  }}
                  className="mt-1"
                />
              </div>
            </div>
          </div>

          {/* Rating Filter */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold">
              Note minimum: {filters.minRating > 0 ? `${filters.minRating}+ ⭐` : 'Toutes notes'}
            </Label>
            <Slider
              value={[filters.minRating]}
              onValueChange={(value) => onUpdateFilter('minRating', value[0])}
              max={5}
              min={0}
              step={0.5}
              className="w-full"
            />
            <div className="flex gap-1">
              {[0, 3, 3.5, 4, 4.5, 5].map((rating) => (
                <Button
                  key={rating}
                  variant={filters.minRating === rating ? "default" : "outline"}
                  size="sm"
                  onClick={() => onUpdateFilter('minRating', rating)}
                  className="flex-1"
                >
                  {rating === 0 ? 'Tous' : `${rating}+`}
                </Button>
              ))}
            </div>
          </div>

          {/* Condition Filter */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold">État du produit</Label>
            <div className="flex flex-wrap gap-2">
              {conditions.map((condition) => (
                <Button
                  key={condition.id}
                  variant={filters.conditions.includes(condition.id) ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleCondition(condition.id)}
                  className="flex items-center gap-2"
                >
                  <div className={`w-2 h-2 rounded-full ${condition.color}`} />
                  {condition.name}
                </Button>
              ))}
            </div>
          </div>

          {/* Distance Filter */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold">
              <MapPin className="w-4 h-4 inline mr-1" />
              Distance max: {filters.maxDistance === 50 ? 'Illimitée' : `${filters.maxDistance}km`}
            </Label>
            <Slider
              value={[filters.maxDistance]}
              onValueChange={(value) => onUpdateFilter('maxDistance', value[0])}
              max={50}
              min={1}
              step={1}
              className="w-full"
            />
            <div className="flex gap-1">
              {[1, 5, 10, 25, 50].map((distance) => (
                <Button
                  key={distance}
                  variant={filters.maxDistance === distance ? "default" : "outline"}
                  size="sm"
                  onClick={() => onUpdateFilter('maxDistance', distance)}
                  className="flex-1 text-xs"
                >
                  {distance === 50 ? 'Tout' : `${distance}km`}
                </Button>
              ))}
            </div>
          </div>

          {/* Availability Filter */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold">Disponibilité</Label>
            <Select 
              value={filters.availability} 
              onValueChange={(value) => onUpdateFilter('availability', value as any)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les produits</SelectItem>
                <SelectItem value="available">Disponibles seulement</SelectItem>
                <SelectItem value="unavailable">Non disponibles</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Sort By */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold">Trier par</Label>
            <Select 
              value={filters.sortBy} 
              onValueChange={(value) => onUpdateFilter('sortBy', value as any)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="popularity">Popularité</SelectItem>
                <SelectItem value="price_low">Prix croissant</SelectItem>
                <SelectItem value="price_high">Prix décroissant</SelectItem>
                <SelectItem value="rating">Mieux notés</SelectItem>
                <SelectItem value="distance">Distance</SelectItem>
                <SelectItem value="newest">Plus récents</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Favorites Only */}
          <div className="flex items-center justify-between">
            <Label className="text-sm font-semibold flex items-center gap-2">
              <Heart className="w-4 h-4" />
              Favoris uniquement
            </Label>
            <Switch
              checked={filters.showOnlyFavorites}
              onCheckedChange={(checked) => onUpdateFilter('showOnlyFavorites', checked)}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="border-t pt-4 space-y-4">
          {/* Stats */}
          <div className="bg-muted/50 rounded-lg p-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Produits trouvés:</span>
              <span className="font-semibold">{filterStats.filteredCount}</span>
            </div>
            {filterStats.averagePrice > 0 && (
              <div className="flex justify-between mt-1">
                <span className="text-muted-foreground">Prix moyen:</span>
                <span className="font-semibold">{formatPrice(filterStats.averagePrice)}k CDF</span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={onResetFilters}
              disabled={!hasActiveFilters}
              className="flex-1"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Réinitialiser
            </Button>
            <Button
              onClick={onClose}
              className="flex-1"
            >
              Appliquer ({filterStats.filteredCount})
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};