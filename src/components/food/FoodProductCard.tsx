import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Check, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { FoodProduct } from '@/types/food';
import { formatCurrency } from '@/utils/formatCurrency';
import { FoodDishDetailSheet } from './FoodDishDetailSheet';
import { useFavorites } from '@/context/FavoritesContext';
import { cn } from '@/lib/utils';
import { VideoThumbnail } from '@/components/shared/VideoThumbnail';

interface FoodProductCardProps {
  product: FoodProduct;
  cartQuantity: number;
  onAddToCart: (product: FoodProduct, quantity?: number, notes?: string) => void;
  restaurant?: {
    id: string;
    restaurant_name: string;
    logo_url?: string;
  };
  onRestaurantClick?: (restaurantId: string) => void;
}

export const FoodProductCard = ({ 
  product, 
  cartQuantity, 
  onAddToCart,
  restaurant,
  onRestaurantClick 
}: FoodProductCardProps) => {
  const [isAdding, setIsAdding] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
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
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        onClick={() => setShowDetail(true)}
        className="cursor-pointer"
      >
        <Card className="overflow-hidden bg-card border border-border/40 shadow-sm hover:shadow-md transition-shadow duration-300">
          <CardContent className="p-0">
            <div className="flex gap-3 p-3">
              {/* Image */}
              <div className="relative w-24 h-24 flex-shrink-0 rounded-xl overflow-hidden bg-muted">
                {(product as any).video_url ? (
                  <VideoThumbnail src={(product as any).video_url} className="w-full h-full object-cover" />
                ) : product.main_image_url ? (
                  <motion.img
                    src={product.main_image_url}
                    alt={product.name}
                    className="w-full h-full object-cover"
                    whileHover={{ scale: 1.03 }}
                    transition={{ duration: 0.2 }}
                  />
                ) : (
                  <div className="w-full h-full bg-muted flex items-center justify-center">
                    <span className="text-3xl">🍽️</span>
                  </div>
                )}

                {/* Heart favorite */}
                <motion.button
                  onClick={handleToggleFavorite}
                  whileTap={{ scale: 0.75 }}
                  className="absolute top-1.5 right-1.5 z-10 w-7 h-7 rounded-full bg-black/20 backdrop-blur-sm flex items-center justify-center"
                >
                  <Heart className={cn("w-3.5 h-3.5 transition-colors", isFav ? "fill-red-500 text-red-500" : "text-white")} />
                </motion.button>

                {/* Cart Badge */}
                <AnimatePresence>
                  {cartQuantity > 0 && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="absolute top-1.5 left-1.5 w-5 h-5 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold shadow-sm"
                    >
                      {cartQuantity}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Out of stock overlay */}
                {!product.is_available && (
                  <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center">
                    <span className="text-xs font-medium text-muted-foreground">Indisponible</span>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                <div>
                  <h4 className="font-semibold text-foreground text-sm leading-tight line-clamp-1">
                    {product.name}
                  </h4>
                  {product.description && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                      {product.description}
                    </p>
                  )}
                </div>

                {/* Price and Add Button */}
                <div className="flex items-center justify-between mt-2">
                  <span className="text-base font-bold text-foreground">
                    {formatCurrency(product.price)}
                  </span>

                  <Button
                    size="sm"
                    onClick={handleQuickAdd}
                    disabled={!product.is_available || isAdding}
                    className="h-8 px-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-xs font-medium shadow-sm"
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
                      ) : (
                        <motion.div
                          key="plus"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0 }}
                          className="flex items-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Ajouter</span>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Button>
                </div>
              </div>
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
