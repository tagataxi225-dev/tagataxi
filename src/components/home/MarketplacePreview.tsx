import { ShoppingBag, ArrowRight, TrendingUp, Star, Clock, Flame, Eye, ShoppingCart } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useProductView } from '@/hooks/useProductView';

interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  rating: number;
  isPopular?: boolean;
  viewCount?: number;
  salesCount?: number;
  popularityScore?: number;
}

interface MarketplacePreviewProps {
  featuredProducts: Product[];
  onProductSelect: (product: Product) => void;
  onViewAll: () => void;
}

export const MarketplacePreview = ({ 
  featuredProducts, 
  onProductSelect, 
  onViewAll 
}: MarketplacePreviewProps) => {
  const { t } = useLanguage();
  const { trackView } = useProductView();

  const handleProductClick = async (product: Product) => {
    // Tracker la vue du produit
    await trackView(product.id);
    // Ouvrir les détails
    onProductSelect(product);
  };
  return (
    <div className="px-4">
      {/* Section header simplifiée */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <ShoppingBag className="h-5 w-5 text-primary" />
          <h3 className="text-base font-semibold text-foreground">Marketplace</h3>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-primary hover:bg-primary/5"
          onClick={onViewAll}
        >
          Explorer
          <ArrowRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
      
      <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
        {featuredProducts.slice(0, 4).map((product) => (
          <Card 
            key={product.id}
            className="min-w-[150px] cursor-pointer border-0 rounded-xl hover:shadow-md transition-all duration-200"
            onClick={() => handleProductClick(product)}
          >
            <div className="aspect-square rounded-t-xl relative overflow-hidden bg-grey-50">
              {product.image && (
                <img 
                  src={product.image} 
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              )}
              
              {product.popularityScore && product.popularityScore > 200 && (
                <div className="absolute top-2 left-2 bg-orange-500 text-white text-xs px-2 py-1 rounded-full font-medium flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  Tendance
                </div>
              )}

              {product.isPopular && !product.popularityScore && (
                <div className="absolute top-2 left-2 bg-primary text-white text-xs px-2 py-1 rounded-full font-medium">
                  {t('home.marketplace.popular')}
                </div>
              )}

              {product.originalPrice && (
                <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                  -{Math.round((1 - product.price / product.originalPrice) * 100)}%
                </div>
              )}
            </div>
            
            <div className="p-3">
              <h3 className="font-medium text-foreground text-sm truncate mb-1">
                {product.name}
              </h3>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-foreground">
                  {product.price.toLocaleString()} CDF
                </span>
                {product.rating && (
                  <div className="flex items-center gap-1">
                    <Star className="h-3 w-3 text-yellow-400 fill-current" />
                    <span className="text-xs text-muted-foreground">{product.rating}</span>
                  </div>
                )}
              </div>

              {/* Métriques de popularité */}
              {(product.viewCount || product.salesCount) && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                  {product.viewCount !== undefined && product.viewCount > 0 && (
                    <div className="flex items-center gap-0.5">
                      <Eye className="h-3 w-3" />
                      <span>{product.viewCount.toLocaleString()}</span>
                    </div>
                  )}
                  {product.salesCount !== undefined && product.salesCount > 0 && (
                    <div className="flex items-center gap-0.5">
                      <ShoppingCart className="h-3 w-3" />
                      <span>{product.salesCount}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};