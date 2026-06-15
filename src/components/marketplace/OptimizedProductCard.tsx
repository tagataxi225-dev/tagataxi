import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, ShoppingCart, Heart, Star, MapPin, Store, Sparkles, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { MarketplaceProduct } from '@/types/marketplace';
import { useProductPromotions } from '@/hooks/useProductPromotions';
import { formatCurrency } from '@/utils/formatCurrency';
import { VideoThumbnail } from '@/components/shared/VideoThumbnail';
type Product = MarketplaceProduct;

interface OptimizedProductCardProps {
  product: Product;
  variant?: 'grid' | 'list' | 'minimal';
  onQuickView?: (product: Product) => void;
  onViewDetails?: (product: Product) => void;
  onBuyNow?: (product: Product) => void;
  cartQuantity?: number;
  showSeller?: boolean;
  showDistance?: boolean;
  userLocation?: { lat: number; lng: number };
}

export const OptimizedProductCard = ({
  product,
  variant = 'grid',
  onQuickView,
  onViewDetails,
  onBuyNow,
  cartQuantity = 0,
  showSeller = true,
  showDistance = false,
  userLocation
}: OptimizedProductCardProps) => {
  const [isWishlisted, setIsWishlisted] = useState(false);
  const { calculateDiscount, getOriginalPrice, getPromotionLabel } = useProductPromotions();
  
  // Calculer la réduction pour ce produit
  const discount = calculateDiscount(product);
  const originalPrice = discount > 0 ? getOriginalPrice(product.price, discount) : 0;
  const promoLabel = getPromotionLabel(discount);
  
  const mainImage = product.image || '/placeholder.svg';
  const inStock = product.inStock;

  const formatPrice = (price: number) => formatCurrency(price, 'CDF');

  const calculateDistance = () => {
    if (!userLocation || !product.coordinates) return null;
    const R = 6371;
    const dLat = (product.coordinates.lat - userLocation.lat) * Math.PI / 180;
    const dLon = (product.coordinates.lng - userLocation.lng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(userLocation.lat * Math.PI / 180) * Math.cos(product.coordinates.lat * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return (R * c).toFixed(1);
  };

  const distance = calculateDistance();

  // Vue liste (horizontale)
  if (variant === 'list') {
    return (
      <motion.div
        whileHover={{ x: 4 }}
        transition={{ duration: 0.2 }}
        className="w-full"
      >
        <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
          <div className="flex gap-4 p-4">
            {/* Image compacte */}
            <div className="relative w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-muted">
              {product.video_url ? (
                <VideoThumbnail src={product.video_url} className="w-full h-full object-cover" />
              ) : (
                <img
                  src={mainImage}
                  alt={product.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              )}
              {!inStock && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <span className="text-xs text-white font-medium">Rupture</span>
                </div>
              )}
            </div>

            {/* Infos */}
            <div className="flex-1 min-w-0 flex flex-col justify-between">
              <div>
                <h3 className="font-semibold line-clamp-1 text-sm">{product.title}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex items-center gap-1">
                    <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                    <span className="text-xs font-medium">{product.rating > 0 ? product.rating.toFixed(1) : '0.0'}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">({product.reviews})</span>
                  {showDistance && distance && (
                    <>
                      <span className="text-muted-foreground">•</span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {distance} km
                      </span>
                    </>
                  )}
                </div>
                {showSeller && (
                  <p className="text-xs text-muted-foreground mt-1 truncate">
                    {product.seller?.display_name || 'Vendeur'}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-destructive text-white font-bold">
                  {formatPrice(product.price)}
                </Badge>
                {cartQuantity > 0 && (
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    Au panier ({cartQuantity})
                  </Badge>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2 justify-center">
              <Button
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onBuyNow?.(product);
                }}
                disabled={!inStock}
                className="min-w-[120px] bg-gradient-to-r from-red-500 to-yellow-500 hover:from-red-600 hover:to-yellow-600 text-white font-bold shadow-congo transition-all duration-300 hover:scale-105"
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                Acheter
              </Button>
              {onViewDetails && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewDetails(product);
                  }}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  Voir
                </Button>
              )}
            </div>
          </div>
        </Card>
      </motion.div>
    );
  }

  // Vue minimal (pour scrolls horizontaux)
  if (variant === 'minimal') {
    return (
      <motion.div
        whileHover={{ y: -4, scale: 1.02 }}
        transition={{ duration: 0.2 }}
        className="w-40 flex-shrink-0"
      >
        <Card className="overflow-hidden h-full hover:shadow-lg transition-shadow">
          <div className="relative aspect-square overflow-hidden bg-muted">
            {product.video_url ? (
              <VideoThumbnail src={product.video_url} className="w-full h-full object-cover" />
            ) : (
              <img
                src={mainImage}
                alt={product.title}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            )}
            {cartQuantity > 0 && (
              <Badge className="absolute top-2 right-2 bg-green-600 text-white">
                {cartQuantity}
              </Badge>
            )}
          </div>
          <CardContent className="p-2 space-y-1">
            <h3 className="font-medium text-xs line-clamp-2 min-h-[2rem]">{product.title}</h3>
            <Badge className="w-full bg-destructive text-white text-xs font-bold py-1 justify-center">
              {formatPrice(product.price)}
            </Badge>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // Vue grille (par défaut) - Design moderne Congo
  return (
    <motion.div
      whileHover={{ 
        y: -12, 
        scale: 1.03,
        rotateX: 2,
      }}
      transition={{ 
        type: "spring", 
        stiffness: 300, 
        damping: 20 
      }}
      className="group h-full cursor-pointer hover-lift-3d"
      onClick={() => onViewDetails?.(product)}
      data-product-id={product.id}
    >
      <Card className="relative overflow-hidden bg-card hover:shadow-congo-lg transition-all duration-300 h-full flex flex-col border-2 border-border/50 hover:border-primary/20">
        {/* Image Container - aspect-square avec gradient overlay */}
        <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-muted to-muted/50">
          {product.video_url ? (
            <VideoThumbnail src={product.video_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
          ) : (
            <img
              src={mainImage}
              alt={product.title}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
              loading="lazy"
            />
          )}
          
          {/* Gradient overlay permanent mais subtil */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-50 group-hover:opacity-70 transition-opacity duration-300 image-overlay-gradient" />
          
          {/* Quick View Button - Design Congo moderne */}
          {onQuickView && (
            <motion.button
              className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10"
              onClick={(e) => {
                e.stopPropagation();
                onQuickView(product);
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="quick-view-overlay px-6 py-3 rounded-full shadow-congo flex items-center gap-2 font-semibold text-foreground">
                <Eye className="h-5 w-5 text-primary" />
                <span className="text-sm">Aperçu rapide</span>
              </div>
            </motion.button>
          )}
          
          {/* Wishlist Heart - Position top-right */}
          <motion.button
            className="absolute top-3 right-3 w-10 h-10 rounded-full bg-background/95 dark:bg-card/90 backdrop-blur-sm shadow-lg flex items-center justify-center z-20 hover:scale-110 transition-transform"
            onClick={(e) => {
              e.stopPropagation();
              setIsWishlisted(!isWishlisted);
            }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <Heart className={cn(
              "h-5 w-5 transition-all wishlist-heart",
              isWishlisted ? "active" : "text-muted-foreground"
            )} />
          </motion.button>

          {/* Badge Réduction Dynamique - Position top-left */}
          {discount > 0 && (
            <motion.div
              initial={{ scale: 0, rotate: -45 }}
              animate={{ scale: 1, rotate: 0 }}
              className="absolute top-3 left-3 z-20"
            >
              <div className="relative">
                {/* Badge avec effet glow pulsé */}
                <Badge className="discount-badge shadow-congo text-sm font-black px-3 py-1.5 glow-congo-pulse">
                  -{discount}%
                </Badge>
                {/* Label promo (Méga Promo, Super Deal, etc.) */}
                {promoLabel && (
                  <div className="absolute -bottom-6 left-0 text-[10px] font-bold text-white bg-black/70 px-2 py-0.5 rounded-full whitespace-nowrap">
                    {promoLabel}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Badge Nouveau (si produit récent ET pas de promo) */}
          {discount === 0 && product.created_at && new Date(product.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) && (
            <motion.div
              initial={{ scale: 0, rotate: -45 }}
              animate={{ scale: 1, rotate: 0 }}
              className="absolute top-3 left-3 z-10"
            >
              <Badge className="badge-congo-new shadow-lg">
                ✨ Nouveau
              </Badge>
            </motion.div>
          )}

          {/* Badge Rupture */}
          {!inStock && (
            <Badge className="absolute top-3 left-3 bg-black/80 text-white backdrop-blur-sm font-bold shadow-lg z-10">
              Rupture de stock
            </Badge>
          )}

          {/* Cart Quantity Badge - Bottom left */}
          {cartQuantity > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute bottom-3 left-3 z-10"
            >
              <Badge className="bg-green-600 text-white font-bold shadow-lg px-3 py-1">
                🛒 {cartQuantity} au panier
              </Badge>
            </motion.div>
          )}

          {/* FAB Add to Cart - Ultra moderne et soft */}
          <motion.button
            className="fab-cart-modern absolute bottom-3 right-3 z-20 group/fab"
            onClick={(e) => {
              e.stopPropagation();
              onBuyNow?.(product);
            }}
            disabled={!inStock}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ 
              type: "spring", 
              stiffness: 260, 
              damping: 20,
              delay: 0.1 
            }}
            whileHover={{ 
              scale: 1.15,
              rotate: [0, -5, 5, 0],
              transition: { 
                rotate: { duration: 0.5, repeat: Infinity, repeatDelay: 2 }
              }
            }}
            whileTap={{ 
              scale: 0.9,
              rotate: 0
            }}
          >
            {/* Icône panier avec animation */}
            <motion.div
              whileHover={{ y: -2 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              <ShoppingCart className="h-5 w-5 text-white drop-shadow-lg" />
            </motion.div>
            
            {/* Badge quantité au panier */}
            {cartQuantity > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center shadow-lg border-2 border-white"
              >
                <span className="text-[10px] font-bold text-white">
                  {cartQuantity}
                </span>
              </motion.div>
            )}
          </motion.button>
        </div>
        
        {/* Product Info - Design Congo moderne */}
        <CardContent className="flex-1 flex flex-col p-4 space-y-3 bg-card">
          {/* Store Badge */}
          {showSeller && product.seller && (
            <motion.div 
              whileHover={{ scale: 1.03, y: -1 }}
              whileTap={{ scale: 0.98 }}
              className="store-badge-modern flex items-center gap-2 p-2.5 rounded-xl cursor-pointer group"
              onClick={(e) => {
                e.stopPropagation();
                // Handle vendor click
              }}
            >
              <div className="flex items-center gap-1.5 flex-1 min-w-0">
                <Store className="h-4 w-4 text-blue-600 flex-shrink-0 group-hover:scale-110 transition-transform" />
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-bold text-blue-600 truncate">
                    {product.seller.display_name}
                  </span>
                </div>
              </div>
              
              {/* Icône flèche */}
              <ChevronRight className="h-3.5 w-3.5 text-blue-400 group-hover:translate-x-0.5 transition-transform" />
            </motion.div>
          )}

          {/* Title - 2 lignes max */}
          <h3 className="font-bold text-sm line-clamp-2 min-h-[2.5rem] group-hover:text-primary transition-colors leading-tight">
            {product.title}
          </h3>
          
          {/* Rating - Afficher seulement si > 0 */}
          {product.rating > 0 && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={cn(
                      "h-4 w-4 transition-all",
                      i < Math.floor(product.rating)
                        ? "star-filled"
                        : "star-empty"
                    )}
                  />
                ))}
              </div>
              <span className="text-sm font-bold">{product.rating.toFixed(1)}</span>
              <span className="text-xs text-muted-foreground">({product.reviews})</span>
            </div>
          )}

          {/* Afficher un placeholder élégant si pas de rating */}
          {product.rating === 0 && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground/60">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Nouveau produit</span>
            </div>
          )}
          
          {/* Prix Badge Congo - Effet glow avec promo */}
          <div className="relative w-full space-y-2">
            {/* Prix barré si promo */}
            {discount > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground line-through">
                  {formatPrice(originalPrice)}
                </span>
                <Badge variant="destructive" className="text-[10px] py-0.5 px-2">
                  -{discount}%
                </Badge>
              </div>
            )}
            
            {/* Prix actuel avec effet glow */}
            <Badge className="price-badge-congo w-full text-white text-lg font-black py-3 justify-center shadow-congo badge-congo-primary">
              {formatPrice(product.price)}
            </Badge>
          </div>

          {/* Distance (si disponible) */}
          {showDistance && userLocation && product.coordinates && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" />
              <span>{calculateDistance()} km</span>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};
