import { motion } from 'framer-motion';
import { Star, Clock, Heart, MapPin, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { FoodProduct } from '@/types/food';
import { formatCurrency } from '@/utils/formatCurrency';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { FoodDishDetailSheet } from './FoodDishDetailSheet';
import { useFavorites } from '@/context/FavoritesContext';
import { VideoThumbnail } from '@/components/shared/VideoThumbnail';

interface FoodDishCardProps {
  dish: FoodProduct & {
    restaurant_name?: string;
    restaurant_logo_url?: string;
    preparation_time?: number;
    rating?: number;
  };
  onAddToCart: (quantity?: number, notes?: string) => void;
  onRestaurantClick?: () => void;
  className?: string;
  cartQuantity?: number;
}

export const FoodDishCard = ({
  dish,
  onAddToCart,
  onRestaurantClick,
  className,
  cartQuantity = 0,
}: FoodDishCardProps) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const { isFavorite, toggleFavorite } = useFavorites();
  const formatPrice = (price: number) => formatCurrency(price);
  const isFav = isFavorite(dish.id);
  const isAvailable = dish.is_available !== false;

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavorite({
      id: dish.id,
      name: dish.name,
      price: dish.price,
      image: dish.main_image_url || '',
      seller: dish.restaurant_name || '',
      sellerId: dish.restaurant_id || '',
      category: dish.category || 'food',
      rating: (dish as any).rating || 0,
    });
  };

  const handleAddFromSheet = (quantity: number, notes?: string) => {
    onAddToCart(quantity, notes);
  };

  const handleRestaurantClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRestaurantClick?.();
  };

  return (
    <>
      <motion.div
        whileTap={{ scale: 0.97 }}
        onClick={() => setShowDetail(true)}
        className={cn('relative cursor-pointer', className)}
      >
        <div className={cn(
          'w-60 overflow-hidden rounded-2xl bg-white border border-neutral-100 shadow-sm',
          !isAvailable && 'opacity-60',
        )}>

          {/* ── Image ──────────────────────────────────────────────── */}
          <div className="relative h-32 overflow-hidden bg-neutral-100">
            {!imageLoaded && (
              <div className="absolute inset-0 bg-neutral-200 animate-pulse" />
            )}

            {(dish as any).video_url ? (
              <VideoThumbnail src={(dish as any).video_url} className="w-full h-full object-cover" />
            ) : (
              <img
                src={dish.main_image_url || '/placeholder.svg'}
                alt={dish.name}
                loading="lazy"
                onLoad={() => setImageLoaded(true)}
                className={cn(
                  'w-full h-full object-cover transition-opacity duration-300',
                  imageLoaded ? 'opacity-100' : 'opacity-0',
                )}
              />
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-black/25 to-transparent pointer-events-none" />

            {/* Badge promo */}
            {(dish as any).discount_percentage > 0 && (
              <Badge className="absolute top-2 left-2 bg-red-600 text-white text-[10px] px-1.5 py-0.5 border-0">
                -{(dish as any).discount_percentage}%
              </Badge>
            )}

            {/* Coeur favori — haut droite */}
            <motion.button
              type="button"
              onClick={handleToggleFavorite}
              whileTap={{ scale: 0.75 }}
              className="absolute top-2 right-2 z-10 w-8 h-8 rounded-full bg-black/25 backdrop-blur-sm flex items-center justify-center"
              style={{ touchAction: 'manipulation' }}
            >
              <Heart className={cn(
                'w-4 h-4 transition-colors',
                isFav ? 'fill-red-500 text-red-500' : 'text-white',
              )} />
            </motion.button>

            {/* Indisponible */}
            {!isAvailable && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <Badge variant="secondary" className="text-xs">Indisponible</Badge>
              </div>
            )}
          </div>

          {/* ── Contenu ────────────────────────────────────────────── */}
          <div className="p-3 space-y-1">

            {/* Nom bold */}
            <h3 className="font-bold text-sm text-gray-900 line-clamp-1">
              {dish.name}
            </h3>

            {/* Description tronquée */}
            {dish.description && (
              <p className="text-xs text-neutral-400 line-clamp-2 leading-relaxed">
                {dish.description}
              </p>
            )}

            {/* Rating + temps */}
            <div className="flex items-center gap-2 text-xs text-neutral-400">
              {(dish as any).rating ? (
                <span className="flex items-center gap-0.5">
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  {(dish as any).rating.toFixed(1)}
                </span>
              ) : null}
              {(dish as any).preparation_time ? (
                <>
                  {(dish as any).rating && <span className="text-neutral-200">·</span>}
                  <span className="flex items-center gap-0.5">
                    <Clock className="w-3 h-3" />
                    {(dish as any).preparation_time}min
                  </span>
                </>
              ) : null}
            </div>

            {/* Restaurant en rouge */}
            {dish.restaurant_name && (
              <button
                type="button"
                onClick={handleRestaurantClick}
                className="flex items-center gap-0.5 text-[11px] text-red-500 hover:text-red-600 transition-colors truncate w-full text-left"
                style={{ touchAction: 'manipulation' }}
              >
                <MapPin className="w-3 h-3 flex-shrink-0" />
                {dish.restaurant_name}
              </button>
            )}

            {/* Prix rouge bold + bouton "+" rounded-full */}
            <div className="flex items-center justify-between pt-1.5 border-t border-neutral-100">
              <div className="flex items-baseline gap-1.5">
                <span className="text-sm font-bold text-red-600">
                  {formatPrice(dish.price)}
                </span>
                {(dish as any).original_price > dish.price && (
                  <span className="text-[11px] text-neutral-400 line-through">
                    {formatPrice((dish as any).original_price)}
                  </span>
                )}
              </div>
              <button
                type="button"
                disabled={!isAvailable}
                onClick={(e) => { e.stopPropagation(); onAddToCart(1); }}
                className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center active:scale-90 transition-transform shrink-0 disabled:opacity-40 shadow-sm"
                style={{ touchAction: 'manipulation' }}
              >
                <Plus className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Detail Sheet */}
      <FoodDishDetailSheet
        open={showDetail}
        onOpenChange={setShowDetail}
        dish={dish}
        onAddToCart={handleAddFromSheet}
        onRestaurantClick={onRestaurantClick}
      />
    </>
  );
};
