import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { FilterDrawer } from '@/components/ui/FilterDrawer';
import { FilterBadge } from '@/components/ui/FilterBadge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAllRestaurants } from '@/hooks/useAllRestaurants';
import { RestaurantCard } from './RestaurantCard';
import { PaginationControls } from '@/components/common/PaginationControls';
import type { Restaurant } from '@/types/food';

interface AllRestaurantsViewProps {
  city: string;
  onBack: () => void;
  onSelectRestaurant: (restaurant: Restaurant) => void;
}

const CUISINE_TYPES = ['Africain', 'Fast-food', 'Européen', 'Asiatique', 'Pizza', 'Burger'];

export const AllRestaurantsView = ({ city, onBack, onSelectRestaurant }: AllRestaurantsViewProps) => {
  const {
    restaurants,
    totalCount,
    totalPages,
    currentPage,
    isLoading,
    filters,
    updateFilters,
    resetFilters,
    updateSort,
    setCurrentPage
  } = useAllRestaurants(city);

  const [searchInput, setSearchInput] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);

  const handleSearch = (value: string) => {
    setSearchInput(value);
    const timeoutId = setTimeout(() => {
      updateFilters({ search: value });
    }, 300);
    return () => clearTimeout(timeoutId);
  };

  const activeFiltersCount = 
    filters.cuisineTypes.length +
    (filters.minRating > 0 ? 1 : 0) +
    (filters.maxDeliveryTime < 60 ? 1 : 0) +
    (filters.priceRange ? 1 : 0) +
    (filters.deliveryAvailable !== null ? 1 : 0) +
    (filters.takeawayAvailable !== null ? 1 : 0);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="min-h-screen bg-background pb-6"
    >
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="px-4 py-4 space-y-4">
          {/* Top Bar */}
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold">Tous les Restos</h1>
              <p className="text-sm text-muted-foreground">{totalCount} restaurants disponibles</p>
            </div>
            <FilterDrawer
              onReset={resetFilters}
              activeFiltersCount={activeFiltersCount}
              open={filterOpen}
              onOpenChange={setFilterOpen}
            >
              {/* Cuisine Types */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">🍽️ Cuisine</Label>
                <div className="grid grid-cols-2 gap-3">
                  {CUISINE_TYPES.map(cuisine => (
                    <div key={cuisine} className="flex items-center space-x-2">
                      <Checkbox
                        id={`cuisine-${cuisine}`}
                        checked={filters.cuisineTypes.includes(cuisine)}
                        onCheckedChange={(checked) => {
                          updateFilters({
                            cuisineTypes: checked
                              ? [...filters.cuisineTypes, cuisine]
                              : filters.cuisineTypes.filter(c => c !== cuisine)
                          });
                        }}
                      />
                      <Label htmlFor={`cuisine-${cuisine}`} className="cursor-pointer">{cuisine}</Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Min Rating */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">⭐ Note minimum</Label>
                <RadioGroup
                  value={filters.minRating.toString()}
                  onValueChange={(value) => updateFilters({ minRating: parseFloat(value) })}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="0" id="rating-0" />
                    <Label htmlFor="rating-0" className="cursor-pointer">Toutes</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="3" id="rating-3" />
                    <Label htmlFor="rating-3" className="cursor-pointer">3+ ⭐</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="4" id="rating-4" />
                    <Label htmlFor="rating-4" className="cursor-pointer">4+ ⭐⭐</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="4.5" id="rating-4.5" />
                    <Label htmlFor="rating-4.5" className="cursor-pointer">4.5+ ⭐⭐⭐</Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Delivery Time */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">⏱️ Livraison</Label>
                <RadioGroup
                  value={filters.maxDeliveryTime.toString()}
                  onValueChange={(value) => updateFilters({ maxDeliveryTime: parseInt(value) })}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="20" id="time-20" />
                    <Label htmlFor="time-20" className="cursor-pointer">{"< 20 min"}</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="30" id="time-30" />
                    <Label htmlFor="time-30" className="cursor-pointer">{"< 30 min"}</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="45" id="time-45" />
                    <Label htmlFor="time-45" className="cursor-pointer">{"< 45 min"}</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="60" id="time-60" />
                    <Label htmlFor="time-60" className="cursor-pointer">Tous</Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Price Range */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">💰 Gamme de prix</Label>
                <RadioGroup
                  value={filters.priceRange || 'all'}
                  onValueChange={(value) => updateFilters({ priceRange: value === 'all' ? null : value as any })}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="all" id="price-all" />
                    <Label htmlFor="price-all" className="cursor-pointer">Toutes</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="economic" id="price-eco" />
                    <Label htmlFor="price-eco" className="cursor-pointer">Économique</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="medium" id="price-med" />
                    <Label htmlFor="price-med" className="cursor-pointer">Moyen</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="premium" id="price-prem" />
                    <Label htmlFor="price-prem" className="cursor-pointer">Premium</Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Options */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="delivery"
                    checked={filters.deliveryAvailable === true}
                    onCheckedChange={(checked) => updateFilters({ deliveryAvailable: checked ? true : undefined })}
                  />
                  <Label htmlFor="delivery" className="cursor-pointer">✅ Livraison disponible</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="takeaway"
                    checked={filters.takeawayAvailable === true}
                    onCheckedChange={(checked) => updateFilters({ takeawayAvailable: checked ? true : undefined })}
                  />
                  <Label htmlFor="takeaway" className="cursor-pointer">🏪 À emporter</Label>
                </div>
              </div>
            </FilterDrawer>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un restaurant..."
              value={searchInput}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Sort & Active Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            <Select
              defaultValue="rating"
              onValueChange={(value) => {
                if (value === 'rating') updateSort({ field: 'rating_average', direction: 'desc' });
                else if (value === 'time') updateSort({ field: 'average_preparation_time', direction: 'asc' });
                else if (value === 'name') updateSort({ field: 'restaurant_name', direction: 'asc' });
                else updateSort({ field: 'created_at', direction: 'desc' });
              }}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Trier par" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rating">Mieux notés</SelectItem>
                <SelectItem value="time">Livraison rapide</SelectItem>
                <SelectItem value="new">Nouveaux</SelectItem>
                <SelectItem value="name">A-Z</SelectItem>
              </SelectContent>
            </Select>

            {/* Active filter badges */}
            <AnimatePresence>
              {filters.cuisineTypes.map(cuisine => (
                <FilterBadge
                  key={cuisine}
                  label={cuisine}
                  onRemove={() => updateFilters({ 
                    cuisineTypes: filters.cuisineTypes.filter(c => c !== cuisine) 
                  })}
                />
              ))}
              {filters.minRating > 0 && (
                <FilterBadge
                  label={`⭐ ${filters.minRating}+`}
                  onRemove={() => updateFilters({ minRating: 0 })}
                />
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 mt-6">
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-64 rounded-lg" />
            ))}
          </div>
        ) : restaurants.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <p className="text-lg font-semibold">Aucun restaurant trouvé</p>
            <p className="text-sm text-muted-foreground mt-2">Essayez de modifier vos filtres</p>
            <Button onClick={resetFilters} variant="outline" className="mt-4">
              Réinitialiser les filtres
            </Button>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {restaurants.map((restaurant) => (
                <RestaurantCard
                  key={restaurant.id}
                  restaurant={restaurant}
                  onClick={() => onSelectRestaurant(restaurant)}
                />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="mt-8">
                <PaginationControls
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalCount={totalCount}
                  hasNextPage={currentPage < totalPages}
                  hasPreviousPage={currentPage > 1}
                  onNextPage={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                  onPreviousPage={() => setCurrentPage(p => Math.max(p - 1, 1))}
                  onPageChange={setCurrentPage}
                />
              </div>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
};
