import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Plus, Minus, Star, Store, ChevronRight, X, MapPin, MessageCircle, ShoppingCart, ShieldCheck, Heart, BadgeCheck, Check, Zap } from 'lucide-react';
import { useChat } from '@/components/chat/ChatProvider';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ProductVideoPlayer } from '@/components/ui/ProductVideoPlayer';
import { formatCurrency } from '@/utils/formatCurrency';
import { cn } from '@/lib/utils';
import { useSwipeable } from 'react-swipeable';

interface ProductDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: {
    id: string;
    name: string;
    price: number;
    originalPrice?: number;
    image: string;
    images?: string[];
    description?: string;
    rating?: number;
    reviewCount?: number;
    seller?: string;
    sellerId?: string;
    sellerLogoUrl?: string;
    isAvailable: boolean;
    stockCount?: number;
    condition?: string;
    location?: string;
    videoUrl?: string;
  };
  onAddToCart: (quantity: number, notes?: string) => void;
  onCreateOrder?: (quantity: number) => void;
  onSellerClick?: () => void;
}

const swipeVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 120 : -120, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -120 : 120, opacity: 0 }),
};

const fadeOnlyVariants = {
  enter: { opacity: 0 },
  center: { opacity: 1 },
  exit: { opacity: 0 },
};

export const ProductDetailSheet = ({
  open,
  onOpenChange,
  product,
  onAddToCart,
  onCreateOrder,
  onSellerClick
}: ProductDetailSheetProps) => {
  const [quantity, setQuantity] = useState(1);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [swipeDir, setSwipeDir] = useState(1);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [fetchedLogoUrl, setFetchedLogoUrl] = useState<string | null>(null);
  const { openChat } = useChat();
  const shouldReduceMotion = useReducedMotion();

  // Fetch seller logo from vendor_profiles if not provided
  useEffect(() => {
    if (!open || product.sellerLogoUrl || !product.sellerId) {
      return;
    }
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from('vendor_profiles')
        .select('shop_logo_url')
        .eq('user_id', product.sellerId)
        .maybeSingle();
      if (!cancelled && data?.shop_logo_url) {
        setFetchedLogoUrl(data.shop_logo_url);
      }
    })();
    return () => { cancelled = true; };
  }, [open, product.sellerId, product.sellerLogoUrl]);

  const displayLogoUrl = product.sellerLogoUrl || fetchedLogoUrl;

  const allImages = product.images?.length ? product.images : [product.image || '/placeholder.svg'];
  const hasVideo = !!product.videoUrl;
  const totalMedia = (hasVideo ? 1 : 0) + allImages.length;
  const hasMultipleMedia = totalMedia > 1;
  const isVideoSlide = hasVideo && currentImageIndex === 0;
  const currentImageSrc = hasVideo
    ? (currentImageIndex === 0 ? '' : allImages[currentImageIndex - 1])
    : allImages[currentImageIndex];

  const handleAddToCart = () => {
    if ('vibrate' in navigator) navigator.vibrate(30);
    onAddToCart(quantity, undefined);
    onOpenChange(false);
    setTimeout(() => {
      setQuantity(1);
      setCurrentImageIndex(0);
      setShowFullDescription(false);
    }, 300);
  };

  const handleBuyNow = () => {
    if ('vibrate' in navigator) navigator.vibrate(30);
    if (onCreateOrder) {
      onCreateOrder(quantity);
    } else {
      onAddToCart(quantity, undefined);
    }
    onOpenChange(false);
    setTimeout(() => {
      setQuantity(1);
      setCurrentImageIndex(0);
      setShowFullDescription(false);
    }, 300);
  };

  const handleSellerClick = () => {
    onOpenChange(false);
    onSellerClick?.();
  };

  const navigateImage = useCallback((direction: 'prev' | 'next') => {
    setSwipeDir(direction === 'next' ? 1 : -1);
    setCurrentImageIndex(prev => {
      if (direction === 'prev') return prev === 0 ? totalMedia - 1 : prev - 1;
      return prev === totalMedia - 1 ? 0 : prev + 1;
    });
    setImageLoaded(false);
  }, [totalMedia]);

  const jumpToIndex = useCallback((nextIndex: number) => {
    setCurrentImageIndex(prev => {
      if (nextIndex === prev) return prev;
      setSwipeDir(nextIndex > prev ? 1 : -1);
      setImageLoaded(false);
      return nextIndex;
    });
  }, []);

  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => hasMultipleMedia && navigateImage('next'),
    onSwipedRight: () => hasMultipleMedia && navigateImage('prev'),
    trackMouse: false,
    preventScrollOnSwipe: true,
  });

  const totalPrice = product.price * quantity;
  const formatPrice = (price: number) => formatCurrency(price, 'XOF');
  const discount = product.originalPrice && product.originalPrice > product.price
    ? Math.round((1 - product.price / product.originalPrice) * 100)
    : 0;

  const getConditionLabel = (condition?: string) => {
    switch (condition) {
      case 'new': return 'Neuf';
      case 'used': return 'Occasion';
      case 'refurbished': return 'Reconditionné';
      default: return null;
    }
  };

  const descriptionLong = (product.description?.length || 0) > 120;
  const slideVariants = shouldReduceMotion ? fadeOnlyVariants : swipeVariants;
  const slideDuration = shouldReduceMotion ? 0 : 0.22;
  const qtyDuration = shouldReduceMotion ? 0 : 0.12;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[92vw] sm:max-w-md p-0 gap-0 overflow-hidden rounded-t-3xl border-0 bg-background shadow-2xl max-h-[90dvh] flex flex-col [&>button]:hidden">
        {/* Screen-reader title (Radix requirement) */}
        <DialogTitle className="sr-only">{product.name}</DialogTitle>

        {/* Top bar avec bouton fermer */}
        <div className="flex justify-end items-center px-3 py-2 bg-background shrink-0">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="w-11 h-11 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center text-muted-foreground active:scale-90 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
            aria-label="Fermer"
            style={{ touchAction: 'manipulation' }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 1) Hero ────────────────────────────────────────────────── */}
        <div
          {...swipeHandlers}
          className="relative h-56 bg-muted shrink-0 overflow-hidden"
        >
          {!imageLoaded && !isVideoSlide && (
            <div className="absolute inset-0 bg-muted-foreground/10 animate-pulse" />
          )}

          <AnimatePresence mode="wait" custom={swipeDir}>
            {isVideoSlide ? (
              <motion.div
                key="video"
                custom={swipeDir}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: slideDuration, ease: 'easeInOut' }}
                className="w-full h-full"
              >
                <ProductVideoPlayer
                  src={product.videoUrl!}
                  poster={allImages[0]}
                  className="w-full h-full"
                  aspectRatio=""
                />
              </motion.div>
            ) : (
              <motion.img
                key={currentImageIndex}
                src={currentImageSrc}
                alt={product.name}
                custom={swipeDir}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: slideDuration, ease: 'easeInOut' }}
                onLoad={() => setImageLoaded(true)}
                className="w-full h-full object-cover"
              />
            )}
          </AnimatePresence>

          {/* Bottom dark gradient */}
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />

          {/* Floating badges top-left */}
          <div className="absolute top-3 left-3 z-10 flex flex-col items-start gap-1.5">
            {product.condition === 'new' && (
              <span className="px-2.5 py-1 rounded-full bg-green-500 text-white text-xs font-bold shadow-md">
                Neuf
              </span>
            )}
            {product.stockCount !== undefined && product.stockCount > 0 && product.stockCount < 5 && (
              <span className="px-2.5 py-1 rounded-full bg-red-500 text-white text-xs font-bold shadow-md">
                🔥 Stock faible
              </span>
            )}
            {discount > 0 && (
              <span className="px-2.5 py-1 rounded-full bg-red-600 text-white text-xs font-bold shadow-md">
                -{discount}%
              </span>
            )}
          </div>

          {/* Wishlist button top-right */}
          <button
            type="button"
            onClick={() => setIsWishlisted(v => !v)}
            aria-label={isWishlisted ? 'Retirer des favoris' : 'Ajouter aux favoris'}
            aria-pressed={isWishlisted}
            className="absolute top-3 right-3 z-10 w-11 h-11 rounded-full bg-white/80 backdrop-blur-md shadow-lg flex items-center justify-center active:scale-90 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
            style={{ touchAction: 'manipulation' }}
          >
            <Heart className={cn('w-5 h-5', isWishlisted ? 'fill-red-500 text-red-500' : 'text-gray-700')} />
          </button>

          {/* Dots indicator + media counter */}
          {hasMultipleMedia && (
            <>
              <div
                className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-10"
                role="tablist"
                aria-label="Médias du produit"
              >
                {Array.from({ length: totalMedia }).map((_, idx) => {
                  const isActive = idx === currentImageIndex;
                  return (
                    <button
                      key={idx}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      aria-label={`Aller au média ${idx + 1} sur ${totalMedia}`}
                      onClick={() => jumpToIndex(idx)}
                      className={cn(
                        'h-2 rounded-full transition-all duration-200 active:scale-90',
                        isActive
                          ? 'w-6 bg-white shadow-md'
                          : 'w-2 bg-white/50 hover:bg-white/70'
                      )}
                      style={{ touchAction: 'manipulation' }}
                    />
                  );
                })}
              </div>
              <span
                className="absolute bottom-3 right-3 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-sm text-white text-xs font-medium tabular-nums"
                aria-hidden="true"
              >
                {currentImageIndex + 1}/{totalMedia}
              </span>
            </>
          )}
        </div>

        {/* 2) Contenu scrollable ──────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-5 pt-0 pb-56">
          {/* Drag handle */}
          <div className="w-10 h-1 bg-border rounded-full mx-auto mt-3 mb-2" />

          {/* Nom */}
          <h2 className="text-2xl font-black text-foreground leading-tight">
            {product.name}
          </h2>

          {/* Prix */}
          <div className="mt-2">
            <span className="text-4xl font-black text-red-600 dark:text-red-500">
              {formatPrice(product.price)}
            </span>
            {product.originalPrice && product.originalPrice > product.price && (
              <span className="text-lg text-muted-foreground line-through ml-2">
                {formatPrice(product.originalPrice)}
              </span>
            )}
          </div>

          {/* Économies */}
          {product.originalPrice && product.originalPrice > product.price && (
            <p className="text-sm font-semibold text-green-600 dark:text-green-400 mt-1">
              Vous économisez {formatPrice(product.originalPrice - product.price)}
            </p>
          )}

          {/* Urgence stock */}
          {product.stockCount !== undefined && product.stockCount > 0 && product.stockCount < 5 && (
            <div className="mt-3">
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-orange-50 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400 text-sm font-semibold">
                🔥 Plus que {product.stockCount} en stock
              </span>
            </div>
          )}

          {/* Badges : rating + stock + condition */}
          <div className="flex flex-wrap items-center gap-2 mt-3">
            {product.rating !== undefined && product.rating > 0 && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/30 text-xs text-amber-700 dark:text-amber-300 font-semibold">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                {product.rating.toFixed(1)}
                {product.reviewCount !== undefined && product.reviewCount > 0 && (
                  <span className="text-amber-600/70 dark:text-amber-400/70">({product.reviewCount})</span>
                )}
              </span>
            )}
            {product.isAvailable && (product.stockCount === undefined || product.stockCount > 0) && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-green-100 dark:bg-green-950/30 text-xs text-green-700 dark:text-green-300 font-semibold">
                En stock{product.stockCount !== undefined && ` · ${product.stockCount}`}
              </span>
            )}
            {!product.isAvailable && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-muted text-xs text-muted-foreground font-semibold">
                Indisponible
              </span>
            )}
            {getConditionLabel(product.condition) && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-muted text-xs text-muted-foreground font-medium">
                {getConditionLabel(product.condition)}
              </span>
            )}
          </div>

          {/* Bannière Escrow */}
          <div className="mt-4 bg-blue-50 dark:bg-blue-950/30 rounded-2xl p-4 border border-blue-100 dark:border-blue-900">
            <div className="flex gap-3 items-start">
              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-blue-900 dark:text-blue-100">Paiement 100% sécurisé</p>
                <p className="text-xs text-blue-700 dark:text-blue-300 mt-0.5">
                  Vous payez → vendeur livre → argent libéré
                </p>
                <div className="flex items-center gap-1 mt-2">
                  <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                  <span className="text-xs font-semibold text-blue-700 dark:text-blue-300">Produit vérifié TAGA</span>
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          {product.description && (
            <div className="mt-4">
              <p className={cn(
                "text-sm text-muted-foreground leading-relaxed",
                !showFullDescription && descriptionLong && "line-clamp-3"
              )}>
                {product.description}
              </p>
              {descriptionLong && (
                <button
                  type="button"
                  onClick={() => setShowFullDescription(v => !v)}
                  className="inline-flex items-center min-h-[44px] text-xs text-red-600 dark:text-red-500 font-medium hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 rounded"
                  style={{ touchAction: 'manipulation' }}
                >
                  {showFullDescription ? 'Voir moins' : 'Voir plus'}
                </button>
              )}
            </div>
          )}

          {/* Location */}
          {product.location && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-3">
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              <span>{product.location}</span>
            </div>
          )}

          {/* Carte Vendeur */}
          {product.seller && (
            <div className="mt-4 w-full flex items-center gap-3 bg-background rounded-2xl shadow-sm border border-border p-3">
              <button
                type="button"
                onClick={onSellerClick ? handleSellerClick : undefined}
                className="flex items-center gap-3 flex-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 rounded-xl"
                style={{ touchAction: 'manipulation' }}
              >
                {displayLogoUrl ? (
                  <img
                    src={displayLogoUrl}
                    alt={product.seller}
                    className="w-12 h-12 rounded-2xl object-cover shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-950/30 text-red-600 dark:text-red-400 font-black text-lg flex items-center justify-center shrink-0">
                    {product.seller.charAt(0).toUpperCase()}
                  </div>
                )}

                <div className="flex items-center gap-1 flex-1 text-left">
                  <span className="font-black text-base text-foreground">
                    {product.seller}
                  </span>
                  <BadgeCheck className="w-4 h-4 text-blue-500 shrink-0" />
                </div>
              </button>

              {product.sellerId && (
                <button
                  type="button"
                  onClick={() => {
                    onOpenChange(false);
                    openChat({
                      contextType: 'marketplace',
                      participantId: product.sellerId!,
                      contextId: product.id,
                      title: product.name
                    });
                  }}
                  className="inline-flex items-center min-h-[44px] px-3 -mr-1 text-sm font-semibold text-red-600 dark:text-red-500 hover:underline shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 rounded"
                  style={{ touchAction: 'manipulation' }}
                >
                  Contacter
                </button>
              )}
            </div>
          )}
        </div>

        {/* 3) Bottom bar — 3 rangées ─────────────────────────────── */}
        <div
          className="sticky bottom-0 left-0 right-0 bg-background border-t border-border px-4 py-3 flex flex-col gap-2"
          style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
        >
          {/* Rangée 1 : Quantité (- N +) centrée */}
          <div className="flex justify-center">
            <div className="flex items-center bg-muted rounded-2xl h-12">
              <button
                type="button"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
                aria-label="Diminuer la quantité"
                className="w-11 h-12 flex items-center justify-center text-foreground disabled:opacity-40 active:scale-90 transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 rounded-l-2xl"
                style={{ touchAction: 'manipulation' }}
              >
                <Minus className="w-4 h-4" />
              </button>
              <AnimatePresence mode="wait">
                <motion.span
                  key={quantity}
                  initial={shouldReduceMotion ? false : { scale: 0.7, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={shouldReduceMotion ? { opacity: 0 } : { scale: 0.7, opacity: 0 }}
                  transition={{ duration: qtyDuration }}
                  className="w-8 text-center text-sm font-bold tabular-nums text-foreground"
                  aria-live="polite"
                  aria-atomic="true"
                >
                  {quantity}
                </motion.span>
              </AnimatePresence>
              <button
                type="button"
                onClick={() => setQuantity(quantity + 1)}
                disabled={product.stockCount !== undefined && quantity >= product.stockCount}
                aria-label="Augmenter la quantité"
                className="w-11 h-12 flex items-center justify-center text-foreground disabled:opacity-40 active:scale-90 transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 rounded-r-2xl"
                style={{ touchAction: 'manipulation' }}
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Rangée 2 : Acheter maintenant */}
          <Button
            onClick={handleBuyNow}
            disabled={!product.isAvailable || (product.stockCount !== undefined && product.stockCount <= 0)}
            className="w-full h-14 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-black text-base shadow-sm gap-2"
          >
            <Zap className="w-5 h-5 shrink-0" />
            <span>Acheter maintenant</span>
          </Button>

          {/* Rangée 3 : Ajouter au panier */}
          <Button
            onClick={handleAddToCart}
            disabled={!product.isAvailable || (product.stockCount !== undefined && product.stockCount <= 0)}
            className="w-full h-12 rounded-2xl bg-muted hover:bg-muted/80 text-foreground font-semibold text-sm shadow-none gap-2 min-w-0"
          >
            <ShoppingCart className="w-4 h-4 shrink-0" />
            <span className="truncate">Ajouter au panier · {formatPrice(totalPrice)}</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
