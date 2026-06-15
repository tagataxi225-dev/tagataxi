import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { RestaurantCard } from '@/components/food/RestaurantCard';
import { Skeleton } from '@/components/ui/skeleton';
import { FoodFooterNav } from '@/components/food/FoodFooterNav';
import { FoodBackToTop } from '@/components/food/FoodBackToTop';
import { 
  ArrowLeft, 
  Search, 
  SlidersHorizontal, 
  X,
  DollarSign,
  Star,
  Clock,
  Truck,
  Store,
  UtensilsCrossed,
  Plus,
  MapPin
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAllDishes } from '@/hooks/useAllDishes';
import { useAllRestaurants } from '@/hooks/useAllRestaurants';
import { useSmartCitySelection } from '@/hooks/useSmartCitySelection';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatCurrency } from '@/lib/utils';

const CUISINE_CATEGORIES = [
  { value: 'african', label: 'Africain', emoji: '🌍' },
  { value: 'fast-food', label: 'Fast-food', emoji: '🍔' },
  { value: 'asian', label: 'Asiatique', emoji: '🍜' },
  { value: 'italian', label: 'Italien', emoji: '🍕' },
  { value: 'grillades', label: 'Grillades', emoji: '🥩' },
  { value: 'desserts', label: 'Desserts', emoji: '🍰' },
  { value: 'boissons', label: 'Boissons', emoji: '🥤' },
  { value: 'breakfast', label: 'Petit-déj', emoji: '🍳' },
];

export default function FoodExplore() {
  const navigate = useNavigate();
  const { currentCity } = useSmartCitySelection();
  const city = currentCity?.name || 'Kinshasa';
  
  const [activeTab, setActiveTab] = useState<'restaurants' | 'dishes'>('restaurants');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 50000]);
  const [minRating, setMinRating] = useState<number>(0);
  const [maxDeliveryTime, setMaxDeliveryTime] = useState<number>(60);
  const [freeDeliveryOnly, setFreeDeliveryOnly] = useState(false);
  const [openNow, setOpenNow] = useState(false);
  const [sortBy, setSortBy] = useState<string>('popularity');

  const { 
    restaurants, 
    isLoading: restaurantsLoading,
    isShowingAllCities: restaurantsAllCities,
    updateFilters: updateRestaurantFilters,
    resetFilters: resetRestaurantFilters
  } = useAllRestaurants(city);

  const { 
    dishes, 
    isLoading: dishesLoading,
    isShowingAllCities: dishesAllCities,
    updateFilters: updateDishFilters,
    resetFilters: resetDishFilters
  } = useAllDishes(city);

  const isShowingAllCities = activeTab === 'restaurants' ? restaurantsAllCities : dishesAllCities;

  const [showAllCitiesBadge, setShowAllCitiesBadge] = useState(false);
  useEffect(() => {
    if (isShowingAllCities) {
      setShowAllCitiesBadge(true);
      const timer = setTimeout(() => setShowAllCitiesBadge(false), 3000);
      return () => clearTimeout(timer);
    } else {
      setShowAllCitiesBadge(false);
    }
  }, [isShowingAllCities, city]);

  // Local filters
  const filteredRestaurants = restaurants.filter(r => {
    const matchesSearch = !searchQuery || 
      r.restaurant_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.address?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRating = (r.rating_average || 0) >= minRating;
    const matchesDeliveryTime = !r.average_preparation_time || r.average_preparation_time <= maxDeliveryTime;
    return matchesSearch && matchesRating && matchesDeliveryTime;
  });

  const filteredDishes = dishes.filter((d: any) => {
    const matchesSearch = !searchQuery || 
      d.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.restaurant_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategories.length === 0 || 
      selectedCategories.includes(d.category?.toLowerCase() || '');
    const matchesPrice = d.price >= priceRange[0] && d.price <= priceRange[1];
    return matchesSearch && matchesCategory && matchesPrice;
  });

  const toggleCategory = (category: string) => {
    setSelectedCategories(prev =>
      prev.includes(category) ? prev.filter(c => c !== category) : [...prev, category]
    );
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategories([]);
    setPriceRange([0, 50000]);
    setMinRating(0);
    setMaxDeliveryTime(60);
    setFreeDeliveryOnly(false);
    setOpenNow(false);
    setSortBy('popularity');
    resetRestaurantFilters();
    resetDishFilters();
  };

  const hasActiveFilters = 
    searchQuery || selectedCategories.length > 0 || priceRange[0] > 0 || 
    priceRange[1] < 50000 || minRating > 0 || maxDeliveryTime < 60 || 
    freeDeliveryOnly || openNow;

  const loading = restaurantsLoading || dishesLoading;

  if (loading && restaurants.length === 0 && dishes.length === 0) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <div className="container max-w-2xl mx-auto px-4 pt-16 space-y-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-52 w-full rounded-2xl" />
          ))}
        </div>
        <FoodFooterNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Compact sticky header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-lg border-b border-border/40">
        <div className="container max-w-2xl mx-auto px-4">
          {/* Row 1: Back + Title + Filter */}
          <div className="flex items-center gap-2 h-12">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/food')}
              className="h-8 w-8 rounded-xl -ml-1"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <h1 className="text-lg font-semibold text-foreground flex-1">Explorer</h1>
            
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl relative">
                  <SlidersHorizontal className="w-4 h-4" />
                  {hasActiveFilters && (
                    <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-primary rounded-full" />
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-[75vh] overflow-y-auto bg-card rounded-t-2xl">
                <SheetHeader>
                  <SheetTitle>Filtres</SheetTitle>
                  <SheetDescription>Affinez votre recherche</SheetDescription>
                </SheetHeader>
                <div className="space-y-6 py-4">
                  <div>
                    <Label className="text-sm font-medium mb-2 block">Trier par</Label>
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="popularity">Popularité</SelectItem>
                        <SelectItem value="rating">Note</SelectItem>
                        <SelectItem value="delivery-time">Temps de livraison</SelectItem>
                        <SelectItem value="price-asc">Prix croissant</SelectItem>
                        <SelectItem value="price-desc">Prix décroissant</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-sm font-medium mb-2 flex items-center gap-1.5">
                      <DollarSign className="w-3.5 h-3.5" />
                      Prix ({priceRange[0].toLocaleString()} - {priceRange[1].toLocaleString()} CDF)
                    </Label>
                    <Slider value={priceRange} onValueChange={(v) => setPriceRange(v as [number, number])} min={0} max={50000} step={1000} />
                  </div>
                  <div>
                    <Label className="text-sm font-medium mb-2 flex items-center gap-1.5">
                      <Star className="w-3.5 h-3.5" />
                      Note minimum ({minRating}⭐)
                    </Label>
                    <Slider value={[minRating]} onValueChange={(v) => setMinRating(v[0])} min={0} max={5} step={0.5} />
                  </div>
                  <div>
                    <Label className="text-sm font-medium mb-2 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      Livraison max ({maxDeliveryTime} min)
                    </Label>
                    <Slider value={[maxDeliveryTime]} onValueChange={(v) => setMaxDeliveryTime(v[0])} min={15} max={90} step={5} />
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="flex items-center gap-1.5 text-sm"><Truck className="w-3.5 h-3.5" />Livraison gratuite</Label>
                      <Switch checked={freeDeliveryOnly} onCheckedChange={setFreeDeliveryOnly} />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Ouvert maintenant</Label>
                      <Switch checked={openNow} onCheckedChange={setOpenNow} />
                    </div>
                  </div>
                  {hasActiveFilters && (
                    <Button variant="outline" onClick={clearFilters} className="w-full">
                      <X className="w-4 h-4 mr-2" />Réinitialiser
                    </Button>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Row 2: Search */}
          <div className="pb-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher restaurant ou plat..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-8 h-9 text-sm bg-muted/50 border-0 rounded-xl"
              />
              {searchQuery && (
                <Button variant="ghost" size="icon" className="absolute right-0.5 top-1/2 -translate-y-1/2 h-7 w-7" onClick={() => setSearchQuery('')}>
                  <X className="w-3.5 h-3.5" />
                </Button>
              )}
            </div>
          </div>

          {/* Row 3: Category chips */}
          <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1">
            {CUISINE_CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                onClick={() => toggleCategory(cat.value)}
                className={`flex items-center gap-1 whitespace-nowrap text-xs px-2.5 py-1 rounded-full transition-colors ${
                  selectedCategories.includes(cat.value)
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted/60 text-muted-foreground hover:bg-muted'
                }`}
              >
                <span>{cat.emoji}</span>
                <span>{cat.label}</span>
              </button>
            ))}
          </div>

          {/* Row 4: City indicator + Tabs */}
          <div className="flex items-center gap-2 pb-2">
            <AnimatePresence>
              {showAllCitiesBadge && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                >
                  <Badge variant="outline" className="text-[10px] gap-1 py-0.5 px-2 shrink-0 border-primary/30 text-primary">
                    <MapPin className="w-2.5 h-2.5" />
                    Toutes les villes
                  </Badge>
                </motion.div>
              )}
            </AnimatePresence>
            <div className="flex bg-muted/50 rounded-lg p-0.5 flex-1">
              <button
                onClick={() => setActiveTab('restaurants')}
                className={`flex-1 flex items-center justify-center gap-1.5 text-xs font-medium py-1.5 rounded-md transition-colors ${
                  activeTab === 'restaurants'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground'
                }`}
              >
                <Store className="w-3 h-3" />
                Restos ({filteredRestaurants.length})
              </button>
              <button
                onClick={() => setActiveTab('dishes')}
                className={`flex-1 flex items-center justify-center gap-1.5 text-xs font-medium py-1.5 rounded-md transition-colors ${
                  activeTab === 'dishes'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground'
                }`}
              >
                <UtensilsCrossed className="w-3 h-3" />
                Plats ({filteredDishes.length})
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="container max-w-2xl mx-auto px-4 py-4">
        {/* Active filter badges */}
        {hasActiveFilters && (
          <div className="mb-3 flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Filtres:</span>
            {searchQuery && (
              <Badge variant="secondary" className="text-[10px] gap-1 py-0">
                "{searchQuery}" <X className="w-2.5 h-2.5 cursor-pointer" onClick={() => setSearchQuery('')} />
              </Badge>
            )}
            {selectedCategories.map(cat => (
              <Badge key={cat} variant="secondary" className="text-[10px] gap-1 py-0">
                {CUISINE_CATEGORIES.find(c => c.value === cat)?.emoji} {cat}
                <X className="w-2.5 h-2.5 cursor-pointer" onClick={() => toggleCategory(cat)} />
              </Badge>
            ))}
            {minRating > 0 && <Badge variant="secondary" className="text-[10px] py-0">≥{minRating}⭐</Badge>}
          </div>
        )}

        {/* Restaurants tab */}
        {activeTab === 'restaurants' && (
          <AnimatePresence mode="popLayout">
            {filteredRestaurants.length === 0 ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16 px-6">
                <div className="text-5xl mb-4">🍽️</div>
                <h3 className="text-lg font-semibold text-foreground mb-1">
                  {restaurants.length === 0 ? 'Bientôt disponible' : 'Aucun résultat'}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {restaurants.length === 0
                    ? 'Les restaurants arrivent bientôt dans votre ville !'
                    : 'Essayez d\'ajuster vos filtres'
                  }
                </p>
                {hasActiveFilters && (
                  <Button variant="outline" size="sm" onClick={clearFilters}>Réinitialiser</Button>
                )}
              </motion.div>
            ) : (
              <div className="space-y-3">
                {filteredRestaurants.map((restaurant, index) => (
                  <motion.div
                    key={restaurant.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ delay: index * 0.04 }}
                  >
                    <RestaurantCard
                      restaurant={restaurant}
                      onClick={() => navigate(`/food?restaurant=${restaurant.id}`)}
                      showCityBadge={restaurantsAllCities}
                    />
                  </motion.div>
                ))}
              </div>
            )}
          </AnimatePresence>
        )}

        {/* Dishes tab */}
        {activeTab === 'dishes' && (
          <AnimatePresence mode="popLayout">
            {filteredDishes.length === 0 ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16 px-6">
                <div className="text-5xl mb-4">🍜</div>
                <h3 className="text-lg font-semibold text-foreground mb-1">
                  {dishes.length === 0 ? 'Bientôt disponible' : 'Aucun résultat'}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {dishes.length === 0
                    ? 'Les plats arrivent bientôt dans votre ville !'
                    : 'Essayez d\'ajuster vos filtres'
                  }
                </p>
                {hasActiveFilters && (
                  <Button variant="outline" size="sm" onClick={clearFilters}>Réinitialiser</Button>
                )}
              </motion.div>
            ) : (
              <div className="space-y-2.5">
                {filteredDishes.map((dish: any, index: number) => (
                  <motion.div
                    key={dish.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ delay: index * 0.03 }}
                  >
                    <Card 
                      className="overflow-hidden border border-border/40 hover:border-primary/30 transition-all cursor-pointer bg-card rounded-2xl"
                      onClick={() => navigate(`/food?restaurant=${dish.restaurant_id}`)}
                    >
                      <div className="flex gap-3 p-3">
                        <div className="relative w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-muted">
                          {dish.main_image_url ? (
                            <img src={dish.main_image_url} alt={dish.name} className="w-full h-full object-cover" loading="lazy" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-3xl">🍽️</div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col justify-between">
                          <div>
                            <h3 className="font-semibold text-sm text-foreground truncate">{dish.name}</h3>
                            <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                              <Store className="w-2.5 h-2.5" />
                              {dish.restaurant_name || 'Restaurant'}
                              {dishesAllCities && dish.restaurant_city && (
                                <span className="text-primary/70">· {dish.restaurant_city}</span>
                              )}
                            </p>
                          </div>
                          <div className="flex items-center justify-between mt-1">
                            <p className="text-sm font-bold text-primary">
                              {formatCurrency(dish.price, 'CDF')}
                            </p>
                            <Button 
                              size="sm" 
                              variant="ghost"
                              className="h-7 text-xs text-primary hover:text-primary px-2"
                              onClick={(e) => { e.stopPropagation(); navigate(`/food?restaurant=${dish.restaurant_id}`); }}
                            >
                              Voir <Plus className="w-3 h-3 ml-0.5" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </AnimatePresence>
        )}
      </div>

      <FoodBackToTop />
      <FoodFooterNav />
    </div>
  );
}
