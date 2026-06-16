import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Star, Check, Store } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/utils/formatCurrency';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { ProductDetailSheet } from './ProductDetailSheet';
import { VideoThumbnail } from '@/components/shared/VideoThumbnail';

interface UnifiedProduct {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  images?: string[];
  rating: number;
  reviewCount?: number;
  category?: string;
  seller: string;
  sellerId: string;
  isAvailable: boolean;
  discount?: number;
  description?: string;
  condition?: string;
  stockCount?: number;
  location?: string;
  videoUrl?: string;
}

interface UnifiedProductCardProps {
  product: UnifiedProduct;
  topPosition?: number;
  onAddToCart: (quantity?: number, notes?: string) => void;
  onSellerClick?: () => void;
  className?: string;
}

export const UnifiedProductCard = ({ 
  product, 
  topPosition, 
  onAddToCart, 
  onSellerClick,
  className 
}: UnifiedProductCardProps) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const formatPrice = (price: number) => formatCurrency(price, 'XOF');

  const handleAddClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if ('vibrate' in navigator) {
      navigator.vibrate(30);
    }
    
    onAddToCart(1);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 1500);
  };

  const handleCardClick = () => {
    setShowDetail(true);
  };

  const handleAddFromSheet = (quantity: number, notes?: string) => {
    onAddToCart(quantity, notes);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 1500);
  };

  const handleSellerClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSellerClick?.();
  };

  const isAvailable = product.isAvailable !== false && (product.stockCount === undefined || product.stockCount > 0);

  // Badge position styling - simple et sobre
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
    <>
      <motion.div
        whileTap={{ scale: 0.98 }}
        onClick={handleCardClick}
        className={cn('relative cursor-pointer', className)}
      >
      <div className={cn(
        "relative w-[200px] overflow-hidden rounded-2xl bg-card border border-border/30 shadow-md",
        !isAvailable && "opacity-60"
      )}>
        {/* Image section */}
        <div className="relative h-28 overflow-hidden bg-muted">
          {/* Skeleton loader */}
          {!imageLoaded && (
            <div className="absolute inset-0 bg-muted animate-pulse" />
          )}
          
          {product.videoUrl ? (
            <VideoThumbnail src={product.videoUrl} className="w-full h-full object-cover" />
          ) : (
            <img
              src={product.image || '/placeholder.svg'}
              alt={product.name}
              loading="lazy"
              onLoad={() => setImageLoaded(true)}
              className={cn(
                "w-full h-full object-cover transition-opacity duration-300",
                imageLoaded ? "opacity-100" : "opacity-0"
              )}
            />
          )}
          
          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />

          {/* Badge position - sobre */}
          {topPosition && topPosition <= 3 && (
            <div className={cn(
              "absolute top-2 left-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shadow-sm",
              getPositionStyle(topPosition)
            )}>
              {topPosition}
            </div>
          )}

          {/* Badge promo */}
          {product.discount && product.discount > 0 && (
            <Badge className="absolute top-2 right-2 bg-rose-500 text-white text-[10px] px-1.5 py-0.5">
              -{product.discount}%
            </Badge>
          )}

          {/* Unavailable overlay */}
          {!isAvailable && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <Badge variant="secondary" className="text-xs">
                Épuisé
              </Badge>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-3 space-y-1.5">
          {/* Nom du produit */}
          <h3 className="font-semibold text-sm text-foreground line-clamp-1">
            {product.name}
          </h3>

          {/* Description courte */}
          {product.description && (
            <p className="text-xs text-muted-foreground line-clamp-1">
              {product.description}
            </p>
          )}

          {/* Infos rapides */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {product.rating > 0 && (
              <span className="flex items-center gap-0.5">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                {product.rating.toFixed(1)}
              </span>
            )}
            {isAvailable && (
              <span className="text-emerald-600 font-medium">En stock</span>
            )}
            {product.condition && (
              <Badge variant="outline" className="text-[10px] px-1 py-0">
                {product.condition === 'new' ? 'Neuf' : 'Occasion'}
              </Badge>
            )}
          </div>

          {/* Seller link */}
          {product.seller && onSellerClick && (
            <button
              onClick={handleSellerClick}
              className="flex items-center gap-1 text-[11px] text-primary/80 hover:text-primary transition-colors truncate w-full text-left"
            >
              <Store className="w-3 h-3" />
              {product.seller}
            </button>
          )}

          {/* Prix et bouton */}
          <div className="pt-1.5 border-t border-border/30">
            <AnimatePresence mode="wait">
              {showSuccess ? (
                <motion.div
                  key="success-banner"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={{ duration: 0.2 }}
                  className="flex h-9 w-full items-center justify-center gap-2 rounded-lg bg-emerald-500 text-white shadow-sm"
                >
                  <Check className="w-4 h-4" strokeWidth={3} />
                  <span className="text-xs font-bold">Ajouté au panier</span>
                </motion.div>
              ) : (
                <motion.div
                  key="price-row"
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 5 }}
                  transition={{ duration: 0.15 }}
                  className="flex items-center justify-between"
                >
                  <div>
                    <span className="text-base font-bold text-primary">
                      {formatPrice(product.price)}
                    </span>
                    {product.originalPrice && product.originalPrice > product.price && (
                      <span className="text-xs text-muted-foreground line-through ml-1.5">
                        {formatPrice(product.originalPrice)}
                      </span>
                    )}
                  </div>
                  <Button
                    size="icon"
                    disabled={!isAvailable}
                    onClick={handleAddClick}
                    className={cn(
                      "w-9 h-9 rounded-full shadow-sm",
                      !isAvailable && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
      </motion.div>

      {/* Detail Sheet */}
      <ProductDetailSheet
        open={showDetail}
        onOpenChange={setShowDetail}
        product={{
          id: product.id,
          name: product.name,
          price: product.price,
          originalPrice: product.originalPrice,
          image: product.image,
          images: product.images,
          description: product.description,
          rating: product.rating,
          reviewCount: product.reviewCount,
          seller: product.seller,
          sellerId: product.sellerId,
          isAvailable,
          stockCount: product.stockCount,
          condition: product.condition,
          location: product.location,
          videoUrl: product.videoUrl,
        }}
        onAddToCart={handleAddFromSheet}
        onSellerClick={onSellerClick}
      />
    </>
  );
};
