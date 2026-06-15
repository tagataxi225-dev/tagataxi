import { useState, useRef, useEffect } from 'react';
import { RestaurantSlider } from './RestaurantSlider';
import { ModernFoodPromoBanner } from './ModernFoodPromoBanner';
import { PopularDishesSection } from './PopularDishesSection';
import { CategoryIconsSection } from './CategoryIconsSection';
import { Skeleton } from '@/components/ui/skeleton';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RefreshCw, Clock, Zap, Star, WifiOff, Info, UtensilsCrossed, Search, Truck } from 'lucide-react';
import { FOOD_CATEGORIES } from '@/config/foodCategories';
import { cn } from '@/lib/utils';
import type { Restaurant, FoodProduct, FoodCartItem } from '@/types/food';

interface RestaurantListProps {
  restaurants: Restaurant[];
  loading: boolean;
  error?: Error | null;
  isShowingAllCities?: boolean;
  onSelectRestaurant: (restaurant: Restaurant) => void;
  onForceRefresh?: () => void;
  selectedCity: string;
  onAddToCart?: (product: FoodProduct) => void;
  onViewAllDishes?: () => void;
  onViewAllRestaurants?: () => void;
  onRestaurantClick?: (restaurantId: string) => void;
  cart?: FoodCartItem[];
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.03
    }
  }
};

const itemVariants = {
  hidden: { y: 12, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { duration: 0.35, ease: 'easeOut' as const }
  }
};

const SectionWithParallax = ({ children }: { children: React.ReactNode }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });
  
  return (
    <motion.div
      ref={ref}
      initial={{ y: 30, opacity: 0 }}
      animate={isInView ? { y: 0, opacity: 1 } : {}}
      transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
    >
      {children}
    </motion.div>
  );
};

export const RestaurantList = ({ 
  restaurants, 
  loading, 
  error,
  isShowingAllCities,
  onSelectRestaurant, 
  onForceRefresh,
  selectedCity,
  onAddToCart,
  onViewAllDishes,
  onViewAllRestaurants,
  onRestaurantClick,
  cart = []
}: RestaurantListProps) => {
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    if (isShowingAllCities) {
      setShowBanner(true);
      const timer = setTimeout(() => setShowBanner(false), 3000);
      return () => clearTimeout(timer);
    } else {
      setShowBanner(false);
    }
  }, [isShowingAllCities, selectedCity]);

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="px-4">
          <Skeleton className="h-24 w-full rounded-2xl mb-4" />
          <div className="flex gap-2 overflow-hidden">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-16 rounded-xl flex-shrink-0" />
            ))}
          </div>
        </div>
        <div className="px-4">
          <div className="flex gap-3 overflow-hidden">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-44 w-48 rounded-2xl flex-shrink-0" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <div className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center mb-3">
          <WifiOff className="w-7 h-7 text-destructive" />
        </div>
        <p className="text-foreground font-semibold">Erreur de connexion</p>
        <p className="text-sm text-muted-foreground mt-1">Vérifiez votre connexion internet</p>
        {onForceRefresh && (
          <Button onClick={onForceRefresh} className="mt-4" variant="default" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Réessayer
          </Button>
        )}
      </div>
    );
  }

  if (restaurants.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <div className="w-14 h-14 rounded-full bg-muted/50 flex items-center justify-center mb-3">
          <UtensilsCrossed className="w-7 h-7 text-muted-foreground/60" />
        </div>
        <p className="text-muted-foreground font-medium">Aucun restaurant disponible</p>
        <p className="text-sm text-muted-foreground/70 mt-0.5">Revenez bientôt !</p>
        {onForceRefresh && (
          <Button onClick={onForceRefresh} className="mt-4" variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualiser
          </Button>
        )}
      </div>
    );
  }

  const mostOrdered = [...restaurants]
    .sort((a, b) => ((b as any).total_orders || 0) - ((a as any).total_orders || 0) 
                  || (b.rating_average || 0) - (a.rating_average || 0))
    .slice(0, 8);
  const recentRestaurants = [...restaurants]
    .sort((a, b) => new Date(b.updated_at || 0).getTime() - new Date(a.updated_at || 0).getTime())
    .slice(0, 6);
  const fastDelivery = [...restaurants]
    .filter(r => r.average_preparation_time != null)
    .sort((a, b) => (a.average_preparation_time || 60) - (b.average_preparation_time || 60))
    .slice(0, 6);

  const tabConfig = [
    { value: 'top', label: 'Les plus commandés', icon: Star, data: mostOrdered },
    { value: 'fast', label: 'Express', icon: Zap, data: fastDelivery },
    { value: 'new', label: 'Nouveaux', icon: Clock, data: recentRestaurants },
  ];

  const chipCategories = [
    { id: 'fast-food', emoji: '🍔', label: 'Fast Food' },
    { id: 'pizza', emoji: '🍕', label: 'Pizza' },
    { id: 'grillades', emoji: '🍗', label: 'Grillades' },
    { id: 'salades', emoji: '🥗', label: 'Salades' },
    { id: 'boissons', emoji: '🥤', label: 'Boissons' },
    { id: 'desserts', emoji: '🍰', label: 'Desserts' },
  ];

  return (
    <motion.div
      className="space-y-4 pb-24 md:pb-6"
      style={{ paddingTop: 8 }}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >


      {/* Category chips */}
      <motion.div variants={itemVariants} className="mt-4">
        <div className="flex gap-4 overflow-x-auto overflow-y-visible px-4 pt-1 pb-2 scrollbar-hide">
          {chipCategories.map((cat) => {
            const active = categoryFilter === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategoryFilter(active ? null : cat.id)}
                aria-pressed={active}
                aria-label={`Filtrer par ${cat.label}`}
                className="flex flex-col items-center gap-1.5 shrink-0 active:scale-95 transition-transform"
                style={{ touchAction: 'manipulation' }}
              >
                <span className={cn('w-14 h-14 rounded-full flex items-center justify-center text-2xl transition-all', active ? 'bg-red-500 ring-2 ring-red-500 ring-offset-2 ring-offset-background' : 'bg-neutral-100')}>{cat.emoji}</span>
                <span className={cn('text-[11px] font-medium leading-tight', active ? 'text-red-600' : 'text-neutral-600')}>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* Promo banner */}
      <motion.div variants={itemVariants} className="px-4 pt-3">
        <div className="rounded-2xl bg-gradient-to-r from-red-500 to-red-600 p-4 flex justify-between items-center overflow-hidden relative">
          <div className="flex flex-col gap-1">
            <p className="text-white font-bold text-base">🔥 Offres du jour</p>
            <p className="text-white/90 text-sm">Jusqu'à 30% réduction</p>
            <button
              type="button"
              onClick={onViewAllDishes}
              aria-label="Voir les offres du jour"
              className="mt-2 self-start bg-white text-red-600 text-xs font-semibold px-4 rounded-full active:scale-95 transition-transform inline-flex items-center min-h-[36px]"
              style={{ touchAction: 'manipulation' }}
            >
              Voir
            </button>
          </div>
          <span className="text-6xl absolute right-4 bottom-0 opacity-90">🍔</span>
        </div>
      </motion.div>

      {/* Popular dishes */}
      {onAddToCart && (
        <SectionWithParallax>
          <div>
            <PopularDishesSection
              city={selectedCity}
              onAddToCart={onAddToCart}
              onViewAll={onViewAllDishes}
              onRestaurantClick={(restaurantId) => {
                const restaurant = restaurants.find(r => r.id === restaurantId);
                if (restaurant) onSelectRestaurant(restaurant);
              }}
              cart={cart}
              categoryId={categoryFilter}
              categoryName={categoryFilter ? FOOD_CATEGORIES.find(c => c.id === categoryFilter)?.name : undefined}
            />
          </div>
        </SectionWithParallax>
      )}

      {/* Restaurants — horizontal circular avatars */}
      <SectionWithParallax>
        <div>
          <div className="flex items-center justify-between px-4 mb-2">
            <h3 className="font-bold text-lg text-gray-900 dark:text-white">Restaurants</h3>
            <button
              type="button"
              onClick={onViewAllRestaurants}
              className="text-sm font-medium text-red-600 dark:text-red-400 active:opacity-70 inline-flex items-center min-h-[44px] px-2 -mr-2"
              style={{ touchAction: 'manipulation' }}
            >
              Voir tout
            </button>
          </div>
          <div className="flex overflow-x-auto gap-4 px-4 hide-scrollbar">
            {restaurants.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => onSelectRestaurant(r)}
                aria-label={`Voir ${r.restaurant_name}`}
                className="flex flex-col items-center w-20 shrink-0 active:scale-95 transition-transform"
                style={{ touchAction: 'manipulation' }}
              >
                {r.logo_url || r.banner_url ? (
                  <img
                    src={r.logo_url || r.banner_url}
                    alt={r.restaurant_name}
                    className="w-14 h-14 rounded-2xl object-cover border border-gray-100 shadow-sm"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-2xl bg-gray-100 border border-gray-100 flex items-center justify-center">
                    <UtensilsCrossed className="w-6 h-6 text-gray-300 dark:text-gray-600" aria-hidden="true" />
                  </div>
                )}
                <span className="text-xs text-center truncate max-w-[72px] mt-1.5 text-gray-700 dark:text-gray-300">
                  {r.restaurant_name}
                </span>
              </button>
            ))}
          </div>
        </div>
      </SectionWithParallax>
    </motion.div>
  );
};
