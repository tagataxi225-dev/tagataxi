import React, { useState } from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Star, ShoppingCart, Heart, Eye } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';

interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  rating: number;
  reviews: number;
  seller: string;
  category: string;
  inStock: boolean;
}

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
  onViewDetails: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ 
  product, 
  onAddToCart, 
  onViewDetails 
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  return (
    <Card className="group overflow-hidden hover:shadow-elegant transition-all duration-300 hover:-translate-y-1 bg-card/50 backdrop-blur-sm border-0 shadow-sm">
      <div className="relative overflow-hidden">
        {!imageLoaded && (
          <Skeleton className="w-full h-48 md:h-52" />
        )}
        <img 
          src={product.image} 
          alt={product.name}
          className={`w-full h-48 md:h-52 object-cover transition-all duration-500 group-hover:scale-105 ${
            imageLoaded ? 'opacity-100' : 'opacity-0 absolute'
          }`}
          onLoad={() => setImageLoaded(true)}
          loading="lazy"
        />
        
        {/* Quick Actions Overlay */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3">
          <Button 
            size="sm" 
            variant="secondary"
            className="h-10 w-10 p-0 rounded-full bg-background/90 hover:bg-background dark:bg-card/90 dark:hover:bg-card"
            onClick={() => onViewDetails(product)}
          >
            <Eye className="w-4 h-4" />
          </Button>
          <Button 
            size="sm" 
            variant="secondary"
            className={`h-10 w-10 p-0 rounded-full transition-colors ${
              isWishlisted ? 'bg-congo-red text-white' : 'bg-background/90 hover:bg-background dark:bg-card/90 dark:hover:bg-card'
            }`}
            onClick={() => setIsWishlisted(!isWishlisted)}
          >
            <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} />
          </Button>
        </div>

        {/* Discount Badge */}
        {product.originalPrice && product.originalPrice > product.price && (
          <Badge variant="destructive" className="absolute top-3 left-3 bg-congo-red text-white font-semibold px-2 py-1 text-xs">
            -{Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}%
          </Badge>
        )}
        
        {/* Stock Status */}
        {!product.inStock && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm">
            <Badge variant="secondary" className="bg-background/90 dark:bg-card/90 text-foreground">Rupture de stock</Badge>
          </div>
        )}
      </div>
      
      <CardContent className="p-4 space-y-3">
        {/* Product Title */}
        <h3 className="font-semibold text-sm md:text-base leading-tight line-clamp-2 min-h-[2.5rem] group-hover:text-primary transition-colors">
          {product.name}
        </h3>
        
        {/* Rating */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 fill-congo-yellow text-congo-yellow" />
            <span className="text-sm font-medium">{product.rating}</span>
          </div>
          <span className="text-xs text-muted-foreground">({product.reviews})</span>
        </div>
        
        {/* Seller */}
        <p className="text-xs text-muted-foreground truncate">{product.seller}</p>
        
        {/* Price Section */}
        <div className="flex items-end justify-between">
          <div className="flex flex-col gap-1">
            <span className="font-bold text-lg text-foreground">{product.price.toLocaleString()} CDF</span>
            {product.originalPrice && (
              <span className="text-sm text-muted-foreground line-through">
                {product.originalPrice.toLocaleString()} CDF
              </span>
            )}
          </div>
          <Badge variant="outline" className="text-xs bg-muted/50">
            {product.category}
          </Badge>
        </div>
        
        {/* Action Button */}
        <Button 
          className="w-full h-12 mt-3 bg-primary hover:bg-primary/90 text-white font-medium touch-manipulation"
          disabled={!product.inStock || isAddingToCart}
          onClick={async () => {
            setIsAddingToCart(true);
            try {
              await onAddToCart(product);
            } finally {
              setTimeout(() => setIsAddingToCart(false), 800);
            }
          }}
        >
          {isAddingToCart ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
              Ajout en cours...
            </>
          ) : (
            <>
              <ShoppingCart className="w-4 h-4 mr-2" />
              {product.inStock ? 'Ajouter au panier' : 'Indisponible'}
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};