import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles } from 'lucide-react';
import useEmblaCarousel from 'embla-carousel-react';
import { formatCurrency } from '@/utils/formatCurrency';

interface SimilarProduct {
  id: string;
  title: string;
  price: number;
  images: string[];
  rating_average?: number;
  stock_quantity?: number;
}

interface SimilarProductsCarouselProps {
  products: SimilarProduct[];
  onAddToCart?: (productId: string) => void;
}

export const SimilarProductsCarousel: React.FC<SimilarProductsCarouselProps> = ({
  products,
  onAddToCart
}) => {
  const navigate = useNavigate();
  const [emblaRef] = useEmblaCarousel({ 
    loop: false, 
    align: 'start',
    dragFree: true 
  });

  if (!products || products.length === 0) {
    return null;
  }

  const formatPrice = (amount: number) => formatCurrency(amount, 'CDF');

  const handleProductClick = (productId: string) => {
    navigate(`/marketplace/product/${productId}`);
  };

  const handleAddToCart = (e: React.MouseEvent, productId: string) => {
    e.stopPropagation();
    if (onAddToCart) {
      onAddToCart(productId);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-0 sm:px-0">
        <h3 className="font-bold text-lg flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Produits similaires
        </h3>
      </div>

      <div className="overflow-hidden -mx-4 sm:mx-0" ref={emblaRef}>
        <div className="flex gap-2 px-4 sm:px-0">
          {products.map(product => {
            const mainImage = Array.isArray(product.images) && product.images.length > 0 
              ? product.images[0] 
              : '/placeholder.svg';
            const inStock = (product.stock_quantity ?? 1) > 0;

            return (
              <div 
                key={product.id}
                className="flex-[0_0_85%] sm:flex-[0_0_45%] lg:flex-[0_0_30%] min-w-0 cursor-pointer"
                onClick={() => handleProductClick(product.id)}
              >
                <Card className="h-full hover:shadow-md transition-shadow">
                  <CardContent className="p-2 space-y-2">
                    {/* Image - Focus principal */}
                    <div className="relative aspect-square rounded-lg overflow-hidden bg-muted">
                      <img
                        src={mainImage}
                        alt={product.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      {!inStock && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                          <Badge variant="secondary" className="text-xs">Rupture</Badge>
                        </div>
                      )}
                    </div>

                    {/* Info minimale */}
                    <div className="space-y-1">
                      <h4 className="font-medium text-sm line-clamp-1">
                        {product.title}
                      </h4>

                      {/* Prix seul */}
                      <p className="text-base font-bold text-primary">
                        {formatPrice(product.price)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
