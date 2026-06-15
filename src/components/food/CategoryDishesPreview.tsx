import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { FoodProductCompactCard } from './FoodProductCompactCard';
import type { FoodCategory } from '@/config/foodCategories';
import type { FoodProduct, FoodCartItem } from '@/types/food';

interface CategoryDishesPreviewProps {
  category: FoodCategory;
  city: string;
  onAddToCart: (product: FoodProduct) => void;
  onViewAll: (categoryId: string) => void;
  onRestaurantClick?: (restaurantId: string) => void;
  cart?: FoodCartItem[];
}

export const CategoryDishesPreview = ({ 
  category, 
  city, 
  onAddToCart, 
  onViewAll,
  onRestaurantClick,
  cart = []
}: CategoryDishesPreviewProps) => {
  const { data: dishes, isLoading } = useQuery({
    queryKey: ['category-dishes', category.id, city],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('food_products')
        .select(`
          *,
          restaurant:restaurant_profiles!inner(
            id, 
            restaurant_name, 
            logo_url, 
            city
          )
        `)
        .eq('category', category.id)
        .eq('restaurant.city', city)
        .eq('is_available', true)
        .eq('moderation_status', 'approved')
        .limit(6);

      if (error) {
        console.error('Error fetching category dishes:', error);
        return [];
      }

      return (data || []).map((item: any) => ({
        ...item,
        restaurant: Array.isArray(item.restaurant) ? item.restaurant[0] : item.restaurant
      }));
    },
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <section className="py-4">
        <div className="px-4 mb-3">
          <Skeleton className="h-6 w-48" />
        </div>
        <div className="flex gap-3 px-4 overflow-hidden">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-48 w-[200px] rounded-xl flex-shrink-0" />
          ))}
        </div>
      </section>
    );
  }

  if (!dishes || dishes.length === 0) {
    return null;
  }

  return (
    <section className="py-4">
      <div className="px-4 mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{category.emoji}</span>
          <h3 className="text-lg font-bold">{category.name}</h3>
          <Badge variant="secondary" className="ml-1">
            {dishes.length}
          </Badge>
        </div>
        <Button 
          variant="link" 
          onClick={() => onViewAll(category.id)}
          className="text-primary"
        >
          Voir tout →
        </Button>
      </div>
      
      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex gap-3 px-4 pb-2">
          {dishes.map((dish: any) => {
            const cartQty = cart.reduce((sum, item) => item.id === dish.id ? sum + item.quantity : sum, 0);
            return (
              <FoodProductCompactCard 
                key={dish.id}
                product={dish}
                restaurant={dish.restaurant}
                onAddToCart={onAddToCart}
                onRestaurantClick={onRestaurantClick}
                cartQuantity={cartQty}
              />
            );
          })}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </section>
  );
};
