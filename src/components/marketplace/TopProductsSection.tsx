import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, ChevronRight } from 'lucide-react';
import { ShopProductCard } from './ShopProductCard';
import { MarketplaceProduct } from '@/types/marketplace';
import { Button } from '@/components/ui/button';

interface TopProductsSectionProps {
  products: MarketplaceProduct[];
  onAddToCart: (product: MarketplaceProduct) => void;
  onViewDetails: (product: MarketplaceProduct) => void;
  onToggleFavorite?: (productId: string) => void;
  isFavorite?: (productId: string) => boolean;
  onViewAll?: () => void;
}

export const TopProductsSection: React.FC<TopProductsSectionProps> = ({
  products,
  onAddToCart,
  onViewDetails,
  onToggleFavorite,
  isFavorite,
  onViewAll
}) => {
  // Calculer un score dynamique pour chaque produit
  const topProducts = products
    .filter(p => p.inStock)
    .map(p => ({
      ...p,
      calculatedScore: (p.popularityScore || 0) + (p.salesCount || 0) * 10 + (p.viewCount || 0) * 2 + (p.rating || 0) * 5
    }))
    .sort((a, b) => b.calculatedScore - a.calculatedScore)
    .slice(0, 8);

  if (topProducts.length === 0) return null;

  return (
    <section className="py-6">
      <div className="relative">
        {/* Header - Soft modern style */}
        <motion.div 
          className="flex items-center justify-between gap-3 mb-5 px-4"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-muted/50">
              <TrendingUp className="h-5 w-5 text-foreground/70" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                Tendances
              </h2>
              <p className="text-xs text-muted-foreground">
                Les plus populaires
              </p>
            </div>
          </div>
          
          {onViewAll && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={onViewAll}
              className="text-primary hover:text-primary/80 hover:bg-primary/5 font-medium"
            >
              Voir tout
              <ChevronRight className="h-4 w-4 ml-0.5" />
            </Button>
          )}
        </motion.div>

        {/* Horizontal Scrollable Carousel */}
        <div 
          className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 px-4"
          style={{
            scrollSnapType: 'x mandatory',
            WebkitOverflowScrolling: 'touch'
          }}
        >
          {topProducts.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05, duration: 0.2 }}
              style={{ scrollSnapAlign: 'start' }}
            >
              <ShopProductCard
                product={product}
                topPosition={index < 3 ? index + 1 : undefined}
                isFavorite={isFavorite?.(product.id)}
                onToggleFavorite={onToggleFavorite ? () => onToggleFavorite(product.id) : undefined}
                onAddToCart={() => onAddToCart(product)}
                onViewDetails={() => onViewDetails(product)}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
