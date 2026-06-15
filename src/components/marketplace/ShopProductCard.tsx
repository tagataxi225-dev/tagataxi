import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, Plus, Award, Heart, Check, Sparkles, Package } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { VideoThumbnail } from '@/components/shared/VideoThumbnail';

interface ShopProductCardProps {
  product: {
    id: string;
    title: string;
    price: number;
    image: string;
    rating: number;
    reviews: number;
    seller: { display_name: string };
    sellerLogo?: string;
    inStock: boolean;
    created_at?: string;
    videoUrl?: string;
    video_url?: string;
  };
  topPosition?: number;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  onAddToCart: () => void;
  onViewDetails: () => void;
  className?: string;
}

export const ShopProductCard = React.memo<ShopProductCardProps>(({
  product,
  topPosition,
  isFavorite = false,
  onToggleFavorite,
  onAddToCart,
  onViewDetails,
  className
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const { triggerHaptic } = useHapticFeedback();

  const formatCurrency = (amount: number) => `${amount.toLocaleString()} CDF`;

  // Check if product is new (created within last 7 days)
  const isNew = product.created_at && 
    new Date(product.created_at).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000;

  const handleAddToCart = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (!product.inStock) return;
    
    // Haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate(30);
    }
    triggerHaptic('medium');
    
    onAddToCart();
    setShowSuccess(true);
    
    setTimeout(() => {
      setShowSuccess(false);
    }, 1200);
  }, [onAddToCart, triggerHaptic, product.inStock]);

  const handleToggleFavorite = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHaptic('light');
    onToggleFavorite?.();
  }, [onToggleFavorite, triggerHaptic]);

  // Badge position styling - style sobre
  const getPositionStyle = (position: number) => {
    switch (position) {
      case 1:
        return 'bg-amber-500 text-white';
      case 2:
        return 'bg-slate-400 text-white';
      case 3:
        return 'bg-amber-700 text-white';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <motion.div
      data-product-id={product.id}
      whileTap={{ scale: 0.98 }}
      onClick={onViewDetails}
      className={cn('relative cursor-pointer', className)}
    >
      <div className={cn(
        "relative w-[200px] overflow-hidden rounded-2xl bg-card border border-border/30 shadow-md",
        !product.inStock && "opacity-60"
      )}>
        {/* Image section - style FoodDishCard h-28 */}
        <div className="relative h-28 overflow-hidden bg-muted">
          {/* Skeleton loader */}
          {!imageLoaded && !imageError && (
            <div className="absolute inset-0 bg-muted animate-pulse" />
          )}
          
          {(product.videoUrl || product.video_url) ? (
            <VideoThumbnail src={(product.videoUrl || product.video_url)!} className="w-full h-full object-cover" />
          ) : !imageError ? (
            <img
              src={product.image}
              alt={product.title}
              loading="lazy"
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
              className={cn(
                "w-full h-full object-cover transition-opacity duration-300",
                imageLoaded ? "opacity-100" : "opacity-0"
              )}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-muted/50">
              <Package className="h-10 w-10 text-muted-foreground/30" />
            </div>
          )}
          
          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />

          {/* Top Badges - sobre */}
          {topPosition && topPosition <= 3 && (
            <div className={cn(
              "absolute top-2 left-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shadow-sm z-10",
              getPositionStyle(topPosition)
            )}>
              {topPosition}
            </div>
          )}
          
          {/* New Badge */}
          {isNew && !topPosition && (
            <Badge className="absolute top-2 left-2 z-10 bg-emerald-500 text-white font-medium text-[10px] px-1.5 py-0.5 border-0">
              Nouveau
            </Badge>
          )}

          {/* Favorite Button */}
          {onToggleFavorite && (
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={handleToggleFavorite}
              className={cn(
                "absolute top-2 right-2 z-10 w-8 h-8 rounded-full shadow-sm hover:shadow-md transition-all flex items-center justify-center",
                isFavorite 
                  ? "bg-rose-50 text-rose-500" 
                  : "bg-background/90 text-muted-foreground/60"
              )}
            >
              <Heart className={cn("h-4 w-4", isFavorite && "fill-current")} />
            </motion.button>
          )}

          {/* Out of Stock Overlay */}
          {!product.inStock && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-20">
              <Badge variant="secondary" className="text-xs">
                Épuisé
              </Badge>
            </div>
          )}
        </div>

        {/* Content - style FoodDishCard */}
        <div className="p-3 space-y-1.5">
          {/* Nom du produit */}
          <h3 className="font-semibold text-sm text-foreground line-clamp-1">
            {product.title}
          </h3>

          {/* Vendeur */}
          <p className="text-xs text-muted-foreground line-clamp-1">
            {product.seller.display_name}
          </p>

          {/* Rating */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {product.rating > 0 && (
              <span className="flex items-center gap-0.5">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                {product.rating.toFixed(1)}
                {product.reviews > 0 && (
                  <span>({product.reviews})</span>
                )}
              </span>
            )}
            {product.inStock && (
              <span className="text-emerald-600">
                En stock
              </span>
            )}
          </div>

          {/* Prix et bouton - footer style FoodDishCard */}
          <div className="flex items-center justify-between pt-1.5 border-t border-border/30">
            <span className="text-base font-bold text-primary">
              {formatCurrency(product.price)}
            </span>

            {/* Bouton + style FoodDishCard - w-9 h-9 rounded-xl */}
            <Button
              size="icon"
              onClick={handleAddToCart}
              disabled={!product.inStock}
              className={cn(
                "w-9 h-9 rounded-xl shadow-sm transition-all active:scale-95",
                showSuccess 
                  ? "bg-emerald-500 hover:bg-emerald-500" 
                  : "bg-primary hover:bg-primary/90",
                "text-primary-foreground"
              )}
            >
              <AnimatePresence mode="wait">
                {showSuccess ? (
                  <motion.div
                    key="success"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                  >
                    <Check className="w-4 h-4 text-white" />
                  </motion.div>
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
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}, (prevProps, nextProps) => {
  return prevProps.product.id === nextProps.product.id &&
         prevProps.isFavorite === nextProps.isFavorite &&
         prevProps.topPosition === nextProps.topPosition;
});