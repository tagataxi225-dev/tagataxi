import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Package, Plus, Check, Star, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { VideoThumbnail } from '@/components/shared/VideoThumbnail';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { useProductPromotions } from '@/hooks/useProductPromotions';

const _tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
const _xofZones = ['Abidjan', 'Dakar', 'Accra', 'Bamako', 'Conakry', 'Bissau', 'Lome', 'Cotonou', 'Niamey', 'Ouagadougou'];
const shopCurrency = _xofZones.some(z => _tz.includes(z)) ? 'XOF' : 'XOF';
const formatShopPrice = (amount: number) => `${amount.toLocaleString('fr-FR')} ${shopCurrency}`;
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface AiShopperProductCardProps {
  product: {
    id: string;
    title: string;
    price: number;
    originalPrice?: number;
    discount?: number;
    image: string;
    seller?: { display_name: string };
    seller_id: string;
    inStock: boolean;
    stockCount: number;
    rating?: number;
    reviews?: number;
    created_at?: string;
    video_url?: string;
  };
  cartQuantity?: number;
  onAddToCart: () => void;
  onQuickView: () => void;
  onToggleFavorite: () => void;
  onVisitShop?: (vendorId: string) => void;
  isFavorite: boolean;
  className?: string;
}

export const AiShopperProductCard = React.memo<AiShopperProductCardProps>(({
  product,
  cartQuantity = 0,
  onAddToCart,
  onQuickView,
  onToggleFavorite,
  onVisitShop,
  isFavorite,
  className
}) => {
  const { triggerHaptic } = useHapticFeedback();
  const { calculateDiscount, getOriginalPrice } = useProductPromotions();
  const { user } = useAuth();
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [localFav, setLocalFav] = useState(isFavorite);

  useEffect(() => {
    setLocalFav(isFavorite);
  }, [isFavorite]);

  // Calculer les promos dynamiques si pas fournies
  const actualDiscount = Math.min(50, product.discount || calculateDiscount({
    stockCount: product.stockCount,
    created_at: product.created_at,
    rating: product.rating || 0,
  } as any));

  const actualOriginalPrice = product.originalPrice || (actualDiscount > 0 ? getOriginalPrice(product.price, actualDiscount) : undefined);

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    setLocalFav(prev => !prev);
    triggerHaptic('light');
    onToggleFavorite();
  };

  const handleCardClick = () => {
    triggerHaptic('light');
    onQuickView();
  };

  const handleAddToCartButton = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (product.inStock) {
      // Haptic feedback
      if ('vibrate' in navigator) {
        navigator.vibrate(30);
      }
      triggerHaptic('medium');
      
      onAddToCart();
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 1500);
    }
  };

  const isNewProduct = (createdAt?: string) => {
    if (!createdAt) return false;
    const daysSinceCreation = Math.floor((Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24));
    return daysSinceCreation <= 7;
  };

  // Badge position styling - style sobre comme FoodDishCard
  const getPositionStyle = (isTop: boolean) => {
    return 'bg-amber-500 text-white';
  };


  return (
    <motion.div
      data-product-id={product.id}
      whileTap={{ scale: 0.98 }}
      onClick={handleCardClick}
      className={cn('relative cursor-pointer', className)}
    >
      <div className={cn(
        "relative w-full overflow-hidden rounded-2xl bg-card dark:bg-card border border-border/20 dark:border-border/40 shadow-sm",
        !product.inStock && "opacity-50"
      )}>
        {/* Image — aspect carré pour plus d'impact */}
        <div className="relative aspect-square overflow-hidden bg-muted rounded-t-2xl">
          {!imageLoaded && !imageError && (
            <div className="absolute inset-0 bg-muted animate-pulse" />
          )}
          
          {product.video_url ? (
            <VideoThumbnail src={product.video_url} className="w-full h-full object-cover" />
          ) : !imageError ? (
            <img
              src={product.image}
              alt={product.title}
              loading="lazy"
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
              className={cn(
                "w-full h-full object-cover transition-opacity duration-200",
                imageLoaded ? "opacity-100" : "opacity-0"
              )}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-neutral-100">
              <Package className="h-8 w-8 text-neutral-400" />
            </div>
          )}

          {/* Badge promo — pill arrondi bien visible */}
          {actualDiscount > 0 ? (
            <Badge className="absolute top-2 left-2 z-10 bg-destructive text-destructive-foreground text-[10px] px-2.5 py-0.5 rounded-full border-0 font-bold shadow-sm">
              -{actualDiscount}%
            </Badge>
          ) : isNewProduct(product.created_at) && (
            <Badge className="absolute top-2 left-2 z-10 bg-primary text-primary-foreground text-[10px] px-2.5 py-0.5 rounded-full border-0 font-bold shadow-sm">
              Nouveau
            </Badge>
          )}

          {/* Favoris */}
          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={handleToggleFavorite}
            className="absolute top-2 right-2 z-10 w-8 h-8 rounded-full bg-background/90 dark:bg-card/90 backdrop-blur-sm shadow-md flex items-center justify-center"
          >
            <Heart
              className={cn(
                "h-3.5 w-3.5 transition-colors",
                localFav ? "fill-rose-500 text-rose-500" : "text-muted-foreground"
              )}
            />
          </motion.button>

          {/* Épuisé */}
          {!product.inStock && (
            <div className="absolute inset-0 bg-background/60 backdrop-blur-[1px] flex items-center justify-center z-20">
              <span className="text-[10px] font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded">
                Épuisé
              </span>
            </div>
          )}
        </div>

        {/* Contenu — espacement amélioré */}
        <div className="p-2.5 space-y-1">
          {/* Titre */}
          <h3 className="font-medium text-sm text-foreground dark:text-foreground line-clamp-2 leading-snug">
            {product.title}
          </h3>

          {/* Vendeur — uppercase discret */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] uppercase tracking-wide text-muted-foreground truncate flex-1">
              {product.seller?.display_name || 'Vendeur'}
            </span>
            {product.rating !== undefined && product.rating > 0 && (
              <span className="flex items-center gap-0.5 shrink-0 text-[10px] text-muted-foreground">
                <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                {product.rating.toFixed(1)}
              </span>
            )}
          </div>

          {/* Footer: Prix + Bouton — plus grand */}
          <div className="pt-1.5 mt-0.5">
            <AnimatePresence mode="wait">
              {showSuccess ? (
                <motion.div
                  key="success-banner"
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.2 }}
                  className="flex h-8 w-full items-center justify-center gap-1.5 rounded-lg bg-emerald-500 text-white shadow-sm"
                >
                  <Check className="w-3.5 h-3.5" strokeWidth={3} />
                  <span className="text-[11px] font-bold">Ajouté au panier</span>
                </motion.div>
              ) : (
                <motion.div
                  key="price-row"
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 4 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center justify-between"
                >
                  <div className="flex flex-col min-w-0">
                    <span className="text-base font-bold text-primary leading-tight">
                      {formatShopPrice(product.price)}
                    </span>
                    {actualOriginalPrice && actualOriginalPrice > product.price && (
                      <span className="text-[10px] text-muted-foreground/60 line-through">
                        {formatShopPrice(actualOriginalPrice)}
                      </span>
                    )}
                  </div>

                  <div className="relative">
                    <Button
                      size="icon"
                      disabled={!product.inStock}
                      onClick={handleAddToCartButton}
                      className="w-8 h-8 rounded-full shadow-md active:scale-90 shrink-0 bg-red-600 hover:bg-red-700"
                    >
                      <Plus className="w-4 h-4 text-primary-foreground" strokeWidth={2.5} />
                    </Button>
                    
                    {cartQuantity > 0 && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full flex items-center justify-center shadow-sm border border-background"
                      >
                        <span className="text-[8px] font-bold text-white">
                          {cartQuantity > 9 ? '9+' : cartQuantity}
                        </span>
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  );
}, (prevProps, nextProps) => {
  return prevProps.product.id === nextProps.product.id &&
         prevProps.cartQuantity === nextProps.cartQuantity;
});