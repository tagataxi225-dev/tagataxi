import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { Star, ShoppingCart, Heart, Share2, Truck, Shield, MessageCircle } from 'lucide-react';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '../ui/carousel';

interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  images: string[];
  rating: number;
  reviews: number;
  seller: string;
  category: string;
  description: string;
  specifications: Record<string, string>;
  inStock: boolean;
  stockCount: number;
}

interface ProductDetailsProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (product: Product, quantity: number) => void;
  onContactSeller?: (productId: string, sellerId: string) => void;
  onStartOrder?: () => void;
}

export const ProductDetails: React.FC<ProductDetailsProps> = ({
  product,
  isOpen,
  onClose,
  onAddToCart,
  onContactSeller,
  onStartOrder,
}) => {
  const [quantity, setQuantity] = useState(1);
  const [isFavorite, setIsFavorite] = useState(false);

  if (!product) return null;

  const discount = product.originalPrice 
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-left">{product.name}</DialogTitle>
          <DialogDescription className="text-left">
            Vendu par {product.seller}
          </DialogDescription>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Product Images */}
          <div>
            <Carousel className="w-full">
              <CarouselContent>
                {product.images.map((image, index) => (
                  <CarouselItem key={index}>
                    <div className="relative">
                      <img 
                        src={image} 
                        alt={`${product.name} ${index + 1}`}
                        className="w-full h-80 object-cover rounded-lg"
                      />
                      {discount > 0 && index === 0 && (
                        <Badge variant="destructive" className="absolute top-4 left-4">
                          -{discount}%
                        </Badge>
                      )}
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious />
              <CarouselNext />
            </Carousel>
          </div>

          {/* Product Info */}
          <div className="space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="flex items-center">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="ml-1 font-medium">{product.rating}</span>
                  <span className="text-muted-foreground ml-1">({product.reviews} avis)</span>
                </div>
                <Badge variant="outline">{product.category}</Badge>
              </div>
              
              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-2xl font-bold text-primary">
                  {product.price.toLocaleString()} CDF
                </span>
                {product.originalPrice && (
                  <span className="text-lg text-muted-foreground line-through">
                    {product.originalPrice.toLocaleString()} CDF
                  </span>
                )}
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Truck className="w-4 h-4 text-primary" />
                <span>Livraison gratuite à partir de 50,000 FC</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Shield className="w-4 h-4 text-primary" />
                <span>Garantie vendeur - Retour sous 7 jours</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <MessageCircle className="w-4 h-4 text-primary" />
                <span>Support client 24/7</span>
              </div>
            </div>

            <Separator />

            {/* Stock and Quantity */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-medium">Disponibilité:</span>
                <Badge variant={product.inStock ? "default" : "secondary"}>
                  {product.inStock ? `En stock (${product.stockCount})` : 'Rupture de stock'}
                </Badge>
              </div>
              
              {product.inStock && (
                <div className="flex items-center gap-3">
                  <span className="font-medium">Quantité:</span>
                  <div className="flex items-center border rounded">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    >
                      -
                    </Button>
                    <span className="px-3 py-1">{quantity}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => setQuantity(Math.min(product.stockCount, quantity + 1))}
                    >
                      +
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="space-y-2">
              <Button 
                className="w-full"
                disabled={!product.inStock}
                onClick={() => onAddToCart(product, quantity)}
              >
                <ShoppingCart className="w-4 h-4 mr-2" />
                Ajouter au panier
              </Button>
              
              <Button
                onClick={() => onContactSeller?.(product.id, product.seller)}
                variant="outline"
                className="w-full"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Contacter le vendeur
              </Button>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setIsFavorite(!isFavorite)}
                >
                  <Heart className={`w-4 h-4 mr-2 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
                  Favoris
                </Button>
                <Button variant="outline" className="flex-1">
                  <Share2 className="w-4 h-4 mr-2" />
                  Partager
                </Button>
              </div>
            </div>

            <Separator />

            {/* Description */}
            <div>
              <h3 className="font-semibold mb-2">Description</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {product.description}
              </p>
            </div>

            {/* Specifications */}
            {product.specifications && Object.keys(product.specifications).length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">Spécifications</h3>
                <div className="space-y-1">
                  {Object.entries(product.specifications).map(([key, value]) => (
                    <div key={key} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{key}:</span>
                      <span>{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};