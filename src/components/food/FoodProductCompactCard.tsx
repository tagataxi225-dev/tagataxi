import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Check, Store, Heart } from 'lucide-react';
import { formatCurrency } from '@/utils/formatCurrency';
import { cn } from '@/lib/utils';
import type { FoodProduct } from '@/types/food';
import { FoodDishDetailSheet } from './FoodDishDetailSheet';
import { useFavorites } from '@/context/FavoritesContext';
import { VideoThumbnail } from '@/components/shared/VideoThumbnail';

interface FoodProductCompactCardProps {
  product: FoodProduct;
  restaurant?: { 
    id: string; 
    restaurant_name: string; 
    logo_url?: string;
  };
  onAddToCart: (product: FoodProduct, quantity?: number, notes?: string) => void;
  onRestaurantClick?: (restaurantId: string) => void;
  cartQuantity?: number;
}

export const FoodProductCompactCard = ({ 
  product, 
  restaurant, 
  onAddToCart, 
  onRestaurantClick,
  cartQuantity = 0
}: FoodProductCompactCardProps) => {
  const [showDetail, setShowDetail] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const { isFavorite, toggleFavorite } = useFavorites();
  const isFav = isFavorite(product.id);

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavorite({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.main_image_url || '',
      seller: restaurant?.restaurant_name || '',
      sellerId: restaurant?.id || '',
      category: 'food',
      rating: 0,
    });
  };

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsAdding(true);
    onAddToCart(product, 1);
    setTimeout(() => setIsAdding(false), 600);
  };

  const handleAddFromSheet = (quantity: number, notes?: string) => {
    onAddToCart(product, quantity, notes);
  };

  const dishForSheet = {
    ...product,
    restaurant_name: restaurant?.restaurant_name,
    restaurant_logo_url: restaurant?.logo_url,
  };

  return (
    <>
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="w-[200px] flex-shrink-0 cursor-pointer"
        onClick={() => setShowDetail(true)}
      >
        <Card className="overflow-hidden h-full hover:shadow-lg transition-shadow">
          <CardContent className="p-3">
            {/* Image */}
            {product.main_image_url && (
              <div className="relative w-full h-32 mb-2 rounded-lg overflow-hidden bg-muted">
                {(product as any).video_url ? (
                  <VideoThumbnail src={(product as any).video_url} className="w-full h-full object-cover" />
                ) : (
                  <img 
                    src={product.main_image_url} 
                    alt={product.name} 
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                )}
                {/* Heart favorite */}
                <motion.button
                  onClick={handleToggleFavorite}
                  whileTap={{ scale: 0.75 }}
                  className="absolute top-2 right-2 z-10 w-7 h-7 rounded-full bg-black/20 backdrop-blur-sm flex items-center justify-center"
                >
                  <Heart className={cn("w-3.5 h-3.5 transition-colors", isFav ? "fill-red-500 text-red-500" : "text-white")} />
                </motion.button>
              </div>
            )}
            
            {/* Title and Description */}
            <h4 className="font-semibold text-sm line-clamp-1 mb-1">{product.name}</h4>
            {product.description && (
              <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                {product.description}
              </p>
            )}
            
            {/* Restaurant Link */}
            {restaurant && onRestaurantClick && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onRestaurantClick(restaurant.id);
                }}
                className="flex items-center gap-1.5 mt-2 mb-2 text-xs text-primary hover:underline group transition-all"
              >
                {restaurant.logo_url ? (
                  <img 
                    src={restaurant.logo_url} 
                    alt={restaurant.restaurant_name}
                    className="w-4 h-4 rounded-full object-cover" 
                  />
                ) : (
                  <Store className="w-3.5 h-3.5" />
                )}
                <span className="line-clamp-1 group-hover:text-primary/80">
                  {restaurant.restaurant_name}
                </span>
              </button>
            )}
            
            {/* Price and Add Button */}
            <div className="flex items-center justify-between mt-2 gap-2">
              <span className="font-bold text-sm">
                {formatCurrency(product.price)}
              </span>
              <motion.button 
                onClick={handleQuickAdd}
                disabled={isAdding}
                whileTap={{ scale: 0.85 }}
                className={cn(
                  "h-8 w-8 rounded-full flex items-center justify-center text-white font-bold text-sm transition-colors shadow-md",
                  cartQuantity > 0
                    ? "bg-green-500 hover:bg-green-600"
                    : "bg-primary hover:bg-primary/90"
                )}
              >
                <AnimatePresence mode="wait">
                  {isAdding ? (
                    <motion.div
                      key="check"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                    >
                      <Check className="w-4 h-4" />
                    </motion.div>
                  ) : cartQuantity > 0 ? (
                    <motion.span
                      key={`qty-${cartQuantity}`}
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: "spring", stiffness: 500, damping: 15 }}
                      className="text-xs font-bold"
                    >
                      {cartQuantity}
                    </motion.span>
                  ) : (
                    <motion.div
                      key="plus"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                    >
                      <Plus className="w-4 h-4" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <FoodDishDetailSheet
        open={showDetail}
        onOpenChange={setShowDetail}
        dish={dishForSheet}
        onAddToCart={handleAddFromSheet}
        onRestaurantClick={restaurant && onRestaurantClick 
          ? () => onRestaurantClick(restaurant.id) 
          : undefined
        }
      />
    </>
  );
};
