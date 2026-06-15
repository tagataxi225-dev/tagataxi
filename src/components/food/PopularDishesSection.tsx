import { motion } from 'framer-motion';
import { FoodDishCard } from './FoodDishCard';
import { usePopularDishes } from '@/hooks/usePopularDishes';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ChevronRight, UtensilsCrossed } from 'lucide-react';
import type { FoodProduct, FoodCartItem } from '@/types/food';

interface PopularDishesSectionProps {
  city: string;
  onAddToCart: (product: FoodProduct) => void;
  onViewAll?: () => void;
  onRestaurantClick?: (restaurantId: string) => void;
  cart?: FoodCartItem[];
  categoryId?: string | null;
  categoryName?: string;
}

export const PopularDishesSection = ({
  city,
  onAddToCart,
  onViewAll,
  onRestaurantClick,
  cart = [],
  categoryId,
  categoryName,
}: PopularDishesSectionProps) => {
  const { data: dishes, isLoading, error } = usePopularDishes(city);

  // Filtrage par catégorie si activeCategory défini
  const filteredDishes = (dishes || []).filter(d =>
    !categoryId ? true : (d.category || '').toLowerCase() === categoryId.toLowerCase()
  );
  const displayedDishes = filteredDishes.slice(0, 8);

  const headerTitle = categoryId && categoryName ? categoryName : 'Populaires';

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="px-4 flex items-center justify-between">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-16" />
        </div>
        <div className="overflow-x-auto scrollbar-hide">
          <div className="flex gap-3 px-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-[220px] w-[200px] flex-shrink-0 rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return null;
  }

  // Empty state — quand catégorie filtrée n'a pas de plats, ou tout vide
  if (displayedDishes.length === 0) {
    return (
      <div className="space-y-3">
        <div className="px-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-foreground">{headerTitle}</h2>
        </div>
        <div className="px-4 py-10 flex flex-col items-center justify-center text-center">
          <div className="w-14 h-14 rounded-full bg-neutral-100 flex items-center justify-center mb-3">
            <UtensilsCrossed className="w-6 h-6 text-neutral-400" />
          </div>
          <p className="text-sm text-neutral-500">
            {categoryId
              ? 'Aucun plat dans cette catégorie pour le moment'
              : 'Aucun plat disponible pour le moment'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header épuré */}
      <div className="px-4 flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-foreground">{headerTitle}</h2>
        </div>
        {onViewAll && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onViewAll}
            className="text-xs text-primary h-8 px-2"
          >
            Voir tout
            <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
          </Button>
        )}
      </div>

      {/* Carousel horizontal */}
      <div className="relative">
        {/* Masques de fondu */}
        <div className="absolute left-0 top-0 bottom-0 w-4 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-4 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

        <div className="overflow-x-auto scrollbar-hide scroll-smooth">
          <div
            className="flex gap-3 px-4 pb-1"
            style={{ scrollSnapType: 'x mandatory' }}
          >
            {displayedDishes.map((dish, index) => {
              const cartQty = cart.reduce((sum, item) => item.id === dish.id ? sum + item.quantity : sum, 0);
              return (
                <motion.div
                  key={dish.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  style={{ scrollSnapAlign: 'start' }}
                >
                  <FoodDishCard
                    dish={dish}
                    cartQuantity={cartQty}
                    onAddToCart={(quantity = 1, notes) => {
                      for (let i = 0; i < quantity; i++) {
                        onAddToCart(dish);
                      }
                      if ('vibrate' in navigator) {
                        navigator.vibrate(30);
                      }
                    }}
                    onRestaurantClick={
                      onRestaurantClick && dish.restaurant_id
                        ? () => onRestaurantClick(dish.restaurant_id!)
                        : undefined
                    }
                  />
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
