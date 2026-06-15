import React, { useState, useEffect } from 'react';
import { ModernProductCard } from './ModernProductCard';
import { Skeleton } from '../ui/skeleton';

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

interface ResponsiveGridProps {
  products: Product[];
  loading?: boolean;
  onAddToCart: (product: Product) => void;
  onViewDetails: (product: Product) => void;
}

const ProductSkeleton = () => (
  <div className="bg-card rounded-lg overflow-hidden shadow-sm">
    <Skeleton className="w-full h-48 md:h-52" />
    <div className="p-4 space-y-3">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
      <Skeleton className="h-3 w-1/3" />
      <div className="flex justify-between items-center">
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-4 w-16" />
      </div>
      <Skeleton className="h-12 w-full" />
    </div>
  </div>
);

export const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({
  products,
  loading = false,
  onAddToCart,
  onViewDetails
}) => {
  const [visibleProducts, setVisibleProducts] = useState(12);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Infinite scroll handler
  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop
        >= document.documentElement.offsetHeight - 1000
      ) {
        loadMoreProducts();
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [visibleProducts, products.length]);

  const loadMoreProducts = () => {
    if (visibleProducts >= products.length || isLoadingMore) return;
    
    setIsLoadingMore(true);
    setTimeout(() => {
      setVisibleProducts(prev => Math.min(prev + 8, products.length));
      setIsLoadingMore(false);
    }, 500);
  };

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 p-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <ProductSkeleton key={index} />
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
          <svg
            className="w-12 h-12 text-muted-foreground"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2 2v-5m16 0h-2M4 13h2m13-8V9a2 2 0 01-2 2H9a2 2 0 01-2-2V5"
            />
          </svg>
        </div>
        <h3 className="text-xl font-semibold mb-2">Aucun produit trouvé</h3>
        <p className="text-muted-foreground text-center max-w-sm">
          Essayez de modifier vos filtres ou votre recherche pour trouver des produits.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Products Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 p-4">
        {products.slice(0, visibleProducts).map((product) => (
          <ModernProductCard
            key={product.id}
            product={product}
            onAddToCart={onAddToCart}
            onViewDetails={onViewDetails}
          />
        ))}
      </div>

      {/* Load More Loading State */}
      {isLoadingMore && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 p-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <ProductSkeleton key={`loading-${index}`} />
          ))}
        </div>
      )}

      {/* End Message */}
      {visibleProducts >= products.length && products.length > 12 && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">
            Vous avez vu tous les {products.length} produits
          </p>
        </div>
      )}
    </div>
  );
};