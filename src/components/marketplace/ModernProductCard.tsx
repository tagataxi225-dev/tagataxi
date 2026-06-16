import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, ShoppingCart, Heart, Star, Store, MessageCircle, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { toast } from 'sonner';
import { formatCurrency } from '@/utils/formatCurrency';
interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  images: string[];
  category: string;
  moderation_status: string;
  seller_id: string;
  seller?: {
    display_name: string;
  };
  rating_average?: number;
  review_count?: number;
  discount_percentage?: number;
  stock_quantity?: number;
}

interface ModernProductCardProps {
  product: Product;
  onViewDetails: (product: Product) => void;
  onAddToCart: (product: Product) => void;
  userLocation?: { lat: number; lng: number };
}

export const ModernProductCard = ({
  product,
  onViewDetails,
  onAddToCart,
  userLocation
}: ModernProductCardProps) => {
  const [isWishlisted, setIsWishlisted] = useState(false);
  
  // Normalisation des images
  const mainImage = Array.isArray(product.images) && product.images.length > 0 
    ? product.images[0] 
    : '/placeholder.svg';
  
  const discount = product.discount_percentage || 0;
  const inStock = (product.stock_quantity ?? 1) > 0;
  const rating = product.rating_average || 0;
  const reviewCount = product.review_count || 0;

  const formatPrice = (price: number) => formatCurrency(price, 'XOF');

  const originalPrice = discount > 0 ? product.price / (1 - discount / 100) : null;

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsWishlisted(!isWishlisted);
  };

  return (
    <motion.div
      whileHover={{ y: -8, scale: 1.02 }}
      transition={{ duration: 0.3 }}
      className="group h-full"
    >
      <Card className="group relative overflow-hidden bg-card/90 backdrop-blur-xl border-2 border-transparent hover:border-primary/30 shadow-xl hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 h-full flex flex-col">
        {/* Image Container avec overlay moderne */}
        <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-muted to-muted/50">
          <img
            src={mainImage}
            alt={product.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
            loading="lazy"
          />
          
          {/* Dark gradient overlay on hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          {/* Chat icon en overlay - Plus visible */}
          <motion.button 
            className="absolute bottom-3 right-3 bg-gradient-to-br from-primary to-orange-500 text-white rounded-full p-3 opacity-0 group-hover:opacity-100 shadow-2xl ring-2 ring-white/30"
            whileHover={{ scale: 1.15, rotate: 10 }}
            whileTap={{ scale: 0.95 }}
            onClick={(e) => {
              e.stopPropagation();
              toast.info('Chat avec le vendeur à venir');
            }}
          >
            <MessageCircle className="h-5 w-5" />
          </motion.button>
          
          {/* Quick View button (visible on hover) */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <Button
              size="lg"
              variant="secondary"
              className="bg-background/95 hover:bg-background shadow-xl"
              onClick={(e) => {
                e.stopPropagation();
                onViewDetails(product);
              }}
            >
              <Eye className="h-5 w-5 mr-2" />
              Voir détails
            </Button>
          </div>
          
          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-2">
            {discount > 0 && (
              <Badge className="bg-gradient-to-r from-destructive to-orange-600 text-white font-bold shadow-lg">
                -{discount}%
              </Badge>
            )}
            {!inStock && (
              <Badge variant="secondary" className="bg-black/60 text-white backdrop-blur-sm">
                Rupture de stock
              </Badge>
            )}
          </div>
          
          {/* Wishlist Button */}
          <Button
            size="icon"
            variant="ghost"
            className="absolute top-3 right-3 bg-background/90 hover:bg-background backdrop-blur-sm shadow-lg"
            onClick={handleToggleWishlist}
          >
            <Heart className={cn(
              "h-5 w-5 transition-all",
              isWishlisted ? "fill-destructive text-destructive" : "text-muted-foreground"
            )} />
          </Button>
        </div>
        
        {/* Product Info - Design moderne conforme à l'image */}
        <CardContent className="flex-1 flex flex-col p-4 space-y-3">
          {/* Title */}
          <h3 className="font-semibold text-lg line-clamp-2 min-h-[3rem] group-hover:text-primary transition-colors">
            {product.title}
          </h3>
          
          {/* Rating */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
              <span className="text-sm font-medium">{rating > 0 ? rating.toFixed(1) : '0.0'}</span>
            </div>
            <span className="text-xs text-muted-foreground">
              ({reviewCount} avis)
            </span>
          </div>
          
          {/* Prix Badge (style image de référence) */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <Badge className="w-full bg-destructive hover:bg-destructive text-white text-xl font-bold py-2 justify-center shadow-lg">
              {formatPrice(product.price)}
            </Badge>
          </motion.div>
          
          {/* Seller & Distance */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span className="truncate flex-1 flex items-center gap-1">
              <Store className="h-3 w-3" />
              {product.seller?.display_name || 'Vendeur'}
            </span>
          </div>
          
          {/* Bouton Acheter (style moderne orange) */}
          <Button 
            className="w-full bg-primary hover:bg-primary/90 font-semibold shadow-lg"
            onClick={(e) => {
              e.stopPropagation();
              onAddToCart(product);
            }}
            disabled={!inStock}
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            {inStock ? 'Acheter' : 'Rupture de stock'}
          </Button>
          
          {/* Bouton Voir détails (ghost) */}
          <Button 
            variant="ghost" 
            className="w-full"
            onClick={(e) => {
              e.stopPropagation();
              window.location.href = `/marketplace/product/${product.id}`;
            }}
          >
            <Eye className="h-4 w-4 mr-2" />
            Voir détails
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
};
